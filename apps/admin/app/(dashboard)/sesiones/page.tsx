"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSessions } from "@/hooks/resources";
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
import { SESSION_STATUS_LABEL, SESSION_STATUS_TONE } from "@/lib/status";
import type { SessionListItem } from "@/lib/types";

const PAGE_SIZE = 20;

export default function SesionesPage() {
  const { admin } = useSession();
  const write = canWrite(admin?.role);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");

  const { data, isLoading, isError } = useSessions({
    page,
    pageSize: PAGE_SIZE,
    status,
  });

  const [revoking, setRevoking] = useState<SessionListItem | null>(null);

  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["sessions"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
  };

  const revokeMut = useMutation({
    mutationFn: (id: string) => api.post(`/admin/sessions/${id}/revoke`, {}),
    onSuccess: () => {
      toast.success("Sesión revocada.");
      refresh();
      setRevoking(null);
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Error inesperado."),
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">Sesiones</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {data?.total ?? 0} sesión{data?.total === 1 ? "" : "es"}.
          </p>
        </div>
        <select
          className="input w-44"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVE">Activas</option>
          <option value="EXPIRED">Expiradas</option>
          <option value="REVOKED">Revocadas</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-7 w-7" />
        </div>
      ) : isError ? (
        <p className="text-sm text-danger">No se pudieron cargar las sesiones.</p>
      ) : items.length === 0 ? (
        <EmptyState title="Sin sesiones" />
      ) : (
        <div className="card overflow-hidden">
          <Table>
            <THead>
              <Tr>
                <Th>Cliente</Th>
                <Th>Dispositivo</Th>
                <Th>Estado</Th>
                <Th>Expira</Th>
                <Th>Última actividad</Th>
                <Th className="text-right">Acciones</Th>
              </Tr>
            </THead>
            <TBody>
              {items.map((s) => (
                <Tr key={s.id}>
                  <Td className="font-medium text-ink">{s.customer.displayName}</Td>
                  <Td className="text-ink-muted">
                    {s.device.platform} · v{s.device.appVersion}
                  </Td>
                  <Td>
                    <Badge tone={SESSION_STATUS_TONE[s.status]}>
                      {SESSION_STATUS_LABEL[s.status]}
                    </Badge>
                  </Td>
                  <Td className="text-ink-muted">{formatDateTime(s.expiresAt)}</Td>
                  <Td className="text-ink-muted">{formatDateTime(s.lastSeenAt)}</Td>
                  <Td>
                    {write && s.status === "ACTIVE" ? (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="btn-danger px-2 py-1"
                          onClick={() => setRevoking(s)}
                        >
                          Revocar
                        </button>
                      </div>
                    ) : null}
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
        open={revoking !== null}
        title="Revocar sesión"
        message={`¿Revocar la sesión de "${revoking?.customer.displayName}"? El dispositivo deberá volver a autenticarse.`}
        confirmLabel="Revocar"
        busy={revokeMut.isPending}
        onConfirm={() => revoking !== null && revokeMut.mutate(revoking.id)}
        onCancel={() => setRevoking(null)}
      />
    </div>
  );
}
