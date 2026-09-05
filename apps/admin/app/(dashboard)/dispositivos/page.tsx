"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useDevices } from "@/hooks/resources";
import { useSession } from "@/hooks/use-session";
import { canWrite } from "@/lib/permissions";
import { toast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { DEVICE_STATUS_LABEL, DEVICE_STATUS_TONE } from "@/lib/status";
import type { DeviceListItem } from "@/lib/types";

const PAGE_SIZE = 20;

export default function DispositivosPage() {
  const { admin } = useSession();
  const write = canWrite(admin?.role);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError } = useDevices({
    page,
    pageSize: PAGE_SIZE,
    search,
    status,
  });

  const [blocking, setBlocking] = useState<DeviceListItem | null>(null);
  const [unblocking, setUnblocking] = useState<DeviceListItem | null>(null);
  const [revoking, setRevoking] = useState<DeviceListItem | null>(null);
  const [unlinking, setUnlinking] = useState<DeviceListItem | null>(null);

  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["devices"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
  };
  const onSuccess = (message: string) => {
    toast.success(message);
    refresh();
  };
  const onError = (err: unknown) =>
    toast.error(err instanceof Error ? err.message : "Error inesperado.");

  const blockMut = useMutation({
    mutationFn: (id: string) => api.post(`/admin/devices/${id}/block`, {}),
    onSuccess: () => {
      onSuccess("Dispositivo bloqueado.");
      setBlocking(null);
    },
    onError,
  });
  const unblockMut = useMutation({
    mutationFn: (id: string) => api.post(`/admin/devices/${id}/unblock`, {}),
    onSuccess: () => {
      onSuccess("Dispositivo desbloqueado.");
      setUnblocking(null);
    },
    onError,
  });
  const revokeMut = useMutation({
    mutationFn: (id: string) => api.post(`/admin/devices/${id}/revoke`, {}),
    onSuccess: () => {
      onSuccess("Dispositivo revocado.");
      setRevoking(null);
    },
    onError,
  });
  const unlinkMut = useMutation({
    mutationFn: (id: string) => api.del(`/admin/devices/${id}`),
    onSuccess: () => {
      onSuccess("Dispositivo desvinculado.");
      setUnlinking(null);
    },
    onError,
  });

  const items = data?.items ?? [];
  const hasFilters = search !== "" || status !== "";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">Dispositivos</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {data?.total ?? 0} dispositivo{data?.total === 1 ? "" : "s"}.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          className="input max-w-xs"
          placeholder="Buscar por plataforma, modelo o versión…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select
          className="input w-44"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVE">Activo</option>
          <option value="BLOCKED">Bloqueado</option>
          <option value="REVOKED">Revocado</option>
        </select>
        {hasFilters && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              setSearchInput("");
              setSearch("");
              setStatus("");
              setPage(1);
            }}
          >
            Limpiar
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-7 w-7" />
        </div>
      ) : isError ? (
        <p className="text-sm text-danger">No se pudieron cargar los dispositivos.</p>
      ) : items.length === 0 ? (
        <EmptyState
          title="Sin dispositivos"
          hint={hasFilters ? "Probá con otros filtros." : "Todavía no se vinculó ninguno."}
        />
      ) : (
        <div className="card overflow-hidden">
          <Table>
            <THead>
              <Tr>
                <Th>Cliente</Th>
                <Th>Dispositivo</Th>
                <Th>Versión</Th>
                <Th>Última conexión</Th>
                <Th>Estado</Th>
                <Th className="text-right">Acciones</Th>
              </Tr>
            </THead>
            <TBody>
              {items.map((d) => (
                <Tr key={d.id}>
                  <Td>
                    <div>
                      <div className="font-medium text-ink">
                        {d.customer.displayName}
                      </div>
                      <div className="text-xs text-ink-faint">{d.model ?? d.platform}</div>
                    </div>
                  </Td>
                  <Td className="text-ink-muted">{d.platform}</Td>
                  <Td className="text-ink-muted">v{d.appVersion}</Td>
                  <Td className="text-ink-muted">{formatDateTime(d.lastSeenAt)}</Td>
                  <Td>
                    <Badge tone={DEVICE_STATUS_TONE[d.status]}>
                      {DEVICE_STATUS_LABEL[d.status]}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-1.5">
                      {write && d.status === "BLOCKED" ? (
                        <button
                          type="button"
                          className="btn-ghost px-2 py-1"
                          onClick={() => setUnblocking(d)}
                        >
                          Desbloquear
                        </button>
                      ) : write && d.status === "ACTIVE" ? (
                        <button
                          type="button"
                          className="btn-ghost px-2 py-1"
                          onClick={() => setBlocking(d)}
                        >
                          Bloquear
                        </button>
                      ) : null}
                      {write && d.status !== "REVOKED" && (
                        <button
                          type="button"
                          className="btn-ghost px-2 py-1"
                          onClick={() => setRevoking(d)}
                        >
                          Revocar
                        </button>
                      )}
                      {write && (
                        <button
                          type="button"
                          className="btn-danger px-2 py-1"
                          onClick={() => setUnlinking(d)}
                        >
                          Desvincular
                        </button>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
          <Pagination
            page={data?.page ?? 1}
            totalPages={data?.totalPages ?? 1}
            total={data?.total ?? 0}
            onPageChange={setPage}
          />
        </div>
      )}

      <ConfirmDialog
        open={blocking !== null}
        title="Bloquear dispositivo"
        message={`Bloquear el dispositivo de "${blocking?.customer.displayName}"? Dejará de poder usar el servicio.`}
        confirmLabel="Bloquear"
        busy={blockMut.isPending}
        onConfirm={() => blocking !== null && blockMut.mutate(blocking.id)}
        onCancel={() => setBlocking(null)}
      />
      <ConfirmDialog
        open={unblocking !== null}
        title="Desbloquear dispositivo"
        message={`¿Desbloquear el dispositivo de "${unblocking?.customer.displayName}"?`}
        confirmLabel="Desbloquear"
        busy={unblockMut.isPending}
        onConfirm={() => unblocking !== null && unblockMut.mutate(unblocking.id)}
        onCancel={() => setUnblocking(null)}
      />
      <ConfirmDialog
        open={revoking !== null}
        title="Revocar dispositivo"
        message={`Revocar el dispositivo de "${revoking?.customer.displayName}" ocupará su slot de forma permanente.`}
        confirmLabel="Revocar"
        busy={revokeMut.isPending}
        onConfirm={() => revoking !== null && revokeMut.mutate(revoking.id)}
        onCancel={() => setRevoking(null)}
      />
      <ConfirmDialog
        open={unlinking !== null}
        title="Desvincular dispositivo"
        message={`Desvincular el dispositivo de "${unlinking?.customer.displayName}" libera el slot para que pueda activar otro.`}
        confirmLabel="Desvincular"
        busy={unlinkMut.isPending}
        onConfirm={() => unlinking !== null && unlinkMut.mutate(unlinking.id)}
        onCancel={() => setUnlinking(null)}
      />
    </div>
  );
}
