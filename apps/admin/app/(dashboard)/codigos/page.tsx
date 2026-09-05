"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useCode, useCodes, usePlans } from "@/hooks/resources";
import { useSession } from "@/hooks/use-session";
import { canWrite } from "@/lib/permissions";
import { toast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  CODE_STATUS_LABEL,
  CODE_STATUS_TONE,
  DEVICE_STATUS_LABEL,
  DEVICE_STATUS_TONE,
} from "@/lib/status";
import type {
  AdminPlan,
  CodeListItem,
  CreateCodesResult,
} from "@/lib/types";

const PAGE_SIZE = 20;
const QUICK_QUANTITIES = [1, 10, 50, 100, 500];

function GenerateModal({
  open,
  plans,
  busy,
  onClose,
  onSubmit,
}: {
  open: boolean;
  plans: AdminPlan[];
  busy: boolean;
  onClose: () => void;
  onSubmit: (values: {
    planId: string;
    quantity: number;
    deviceLimit: number;
    expiresAt: string;
  }) => void;
}) {
  const [planId, setPlanId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [deviceLimit, setDeviceLimit] = useState(1);
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    if (open) {
      setPlanId("");
      setQuantity(1);
      setDeviceLimit(1);
      setExpiresAt("");
    }
  }, [open]);

  const valid =
    planId !== "" && quantity >= 1 && quantity <= 500 && deviceLimit >= 1 && deviceLimit <= 10;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generar códigos"
      wide
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={busy || !valid}
            onClick={() =>
              onSubmit({ planId, quantity, deviceLimit, expiresAt })
            }
          >
            {busy ? <Spinner /> : `Generar ${quantity}`}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="code-plan">
            Plan
          </label>
          <select
            id="code-plan"
            className="input"
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
          >
            <option value="" disabled>
              Seleccioná un plan
            </option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.durationDays} días
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Cantidad</label>
          <div className="flex flex-wrap items-center gap-2">
            {QUICK_QUANTITIES.map((n) => (
              <button
                key={n}
                type="button"
                className={`btn ${quantity === n ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setQuantity(n)}
              >
                {n}
              </button>
            ))}
            <input
              type="number"
              min={1}
              max={500}
              className="input w-24"
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, Math.min(500, Number(e.target.value) || 1)))
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="code-limit">
              Límite de dispositivos
            </label>
            <input
              id="code-limit"
              type="number"
              min={1}
              max={10}
              className="input"
              value={deviceLimit}
              onChange={(e) =>
                setDeviceLimit(Math.max(1, Math.min(10, Number(e.target.value) || 1)))
              }
            />
          </div>
          <div>
            <label className="label" htmlFor="code-expires">
              Vence sin activar (opcional)
            </label>
            <input
              id="code-expires"
              type="date"
              className="input"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
        </div>

        <p className="text-xs text-ink-faint">
          Los códigos se muestran una sola vez, al generarlos. Después solo
          queda el prefijo visible.
        </p>
      </div>
    </Modal>
  );
}

function ResultModal({
  result,
  onClose,
}: {
  result: CreateCodesResult | null;
  onClose: () => void;
}) {
  const copyOne = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Código copiado.");
    } catch {
      toast.error("No se pudo copiar.");
    }
  };
  const copyAll = async () => {
    if (result === null) return;
    try {
      await navigator.clipboard.writeText(result.items.map((i) => i.code).join("\n"));
      toast.success(`${result.count} códigos copiados.`);
    } catch {
      toast.error("No se pudo copiar.");
    }
  };

  return (
    <Modal
      open={result !== null}
      onClose={onClose}
      title={`${result?.count ?? 0} código(s) generado(s)`}
      wide
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={copyAll}>
            Copiar todos
          </button>
          <button type="button" className="btn-primary" onClick={onClose}>
            Listo
          </button>
        </>
      }
    >
      <p className="mb-3 text-sm text-ink-muted">
        Copiá estos códigos ahora: no se volverán a mostrar.
      </p>
      <div className="max-h-80 overflow-y-auto rounded-lg border border-line bg-raised">
        {result?.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between border-b border-line px-3 py-2 last:border-0"
          >
            <code className="font-mono text-sm text-ink">{item.code}</code>
            <button
              type="button"
              className="btn-ghost px-2 py-1 text-xs"
              onClick={() => copyOne(item.code)}
            >
              Copiar
            </button>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function DetailModal({
  codeId,
  onClose,
}: {
  codeId: string | null;
  onClose: () => void;
}) {
  const { data, isLoading } = useCode(codeId);
  return (
    <Modal open={codeId !== null} onClose={onClose} title="Detalle del código" wide>
      {isLoading || data === undefined ? (
        <div className="flex justify-center py-8">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <code className="rounded-lg border border-line bg-raised px-2 py-1 font-mono text-sm text-ink">
              {data.prefix}…
            </code>
            <Badge tone={CODE_STATUS_TONE[data.status]}>
              {CODE_STATUS_LABEL[data.status]}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Plan" value={data.plan.name} />
            <Info
              label="Cliente"
              value={data.customer?.displayName ?? "Sin asignar"}
            />
            <Info
              label="Dispositivos"
              value={`${data.devicesUsed} / ${data.deviceLimit}`}
            />
            <Info label="Activado" value={formatDateTime(data.activatedAt)} />
            <Info label="Vencimiento" value={formatDate(data.expiresAt)} />
            <Info label="Último uso" value={formatDateTime(data.lastUsedAt)} />
          </div>
          {data.devices.length > 0 && (
            <div>
              <p className="label">Dispositivos vinculados</p>
              <div className="space-y-1.5">
                {data.devices.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between rounded-lg border border-line bg-raised/50 px-3 py-2 text-sm"
                  >
                    <span className="text-ink">
                      {d.platform} · v{d.appVersion}
                    </span>
                    <Badge tone={DEVICE_STATUS_TONE[d.status]}>
                      {DEVICE_STATUS_LABEL[d.status]}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-ink-faint">{label}</p>
      <p className="text-ink">{value}</p>
    </div>
  );
}

function LimitModal({
  code,
  busy,
  onClose,
  onSubmit,
}: {
  code: CodeListItem | null;
  busy: boolean;
  onClose: () => void;
  onSubmit: (limit: number) => void;
}) {
  const [limit, setLimit] = useState(1);
  useEffect(() => {
    if (code !== null) setLimit(code.deviceLimit);
  }, [code]);

  return (
    <Modal
      open={code !== null}
      onClose={onClose}
      title="Cambiar límite de dispositivos"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={busy}
            onClick={() => onSubmit(limit)}
          >
            {busy ? <Spinner /> : "Guardar"}
          </button>
        </>
      }
    >
      <input
        type="number"
        min={1}
        max={10}
        className="input"
        value={limit}
        onChange={(e) =>
          setLimit(Math.max(1, Math.min(10, Number(e.target.value) || 1)))
        }
      />
    </Modal>
  );
}

export default function CodigosPage() {
  const { admin } = useSession();
  const write = canWrite(admin?.role);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [planId, setPlanId] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError } = useCodes({
    page,
    pageSize: PAGE_SIZE,
    search,
    status,
    planId,
  });
  const plansQuery = usePlans();
  const plans = plansQuery.data ?? [];

  const [generateOpen, setGenerateOpen] = useState(false);
  const [result, setResult] = useState<CreateCodesResult | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [suspending, setSuspending] = useState<CodeListItem | null>(null);
  const [revoking, setRevoking] = useState<CodeListItem | null>(null);
  const [limiting, setLimiting] = useState<CodeListItem | null>(null);

  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["codes"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
  };
  const onSuccess = (message: string) => {
    toast.success(message);
    refresh();
  };
  const onError = (err: unknown) =>
    toast.error(err instanceof Error ? err.message : "Error inesperado.");

  const createMut = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post<CreateCodesResult>("/admin/codes", body),
    onSuccess: (res) => {
      onSuccess(`${res.count} código(s) generado(s).`);
      setGenerateOpen(false);
      setResult(res);
    },
    onError,
  });
  const suspendMut = useMutation({
    mutationFn: (id: string) => api.post(`/admin/codes/${id}/suspend`, {}),
    onSuccess: () => {
      onSuccess("Código suspendido.");
      setSuspending(null);
    },
    onError,
  });
  const reactivateMut = useMutation({
    mutationFn: (id: string) => api.post(`/admin/codes/${id}/reactivate`, {}),
    onSuccess: () => {
      onSuccess("Código reactivado.");
    },
    onError,
  });
  const revokeMut = useMutation({
    mutationFn: (id: string) => api.post(`/admin/codes/${id}/revoke`, {}),
    onSuccess: () => {
      onSuccess("Código revocado.");
      setRevoking(null);
    },
    onError,
  });
  const limitMut = useMutation({
    mutationFn: (input: { id: string; deviceLimit: number }) =>
      api.patch(`/admin/codes/${input.id}`, { deviceLimit: input.deviceLimit }),
    onSuccess: () => {
      onSuccess("Límite actualizado.");
      setLimiting(null);
    },
    onError,
  });

  const items = data?.items ?? [];
  const hasFilters = search !== "" || status !== "" || planId !== "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">Códigos</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {data?.total ?? 0} código{data?.total === 1 ? "" : "s"}.
          </p>
        </div>
        {write && (
          <button type="button" className="btn-primary" onClick={() => setGenerateOpen(true)}>
            + Generar códigos
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          className="input max-w-xs"
          placeholder="Buscar por prefijo…"
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
          <option value="PENDING">Sin activar</option>
          <option value="ACTIVE">Activo</option>
          <option value="EXPIRED">Vencido</option>
          <option value="SUSPENDED">Suspendido</option>
          <option value="REVOKED">Revocado</option>
        </select>
        <select
          className="input w-44"
          value={planId}
          onChange={(e) => {
            setPlanId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Todos los planes</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {hasFilters && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              setSearchInput("");
              setSearch("");
              setStatus("");
              setPlanId("");
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
        <p className="text-sm text-danger">No se pudieron cargar los códigos.</p>
      ) : items.length === 0 ? (
        <EmptyState
          title="Sin códigos"
          hint={hasFilters ? "Probá con otros filtros." : "Generá tu primer código."}
        />
      ) : (
        <div className="card overflow-hidden">
          <Table>
            <THead>
              <Tr>
                <Th>Código</Th>
                <Th>Plan</Th>
                <Th>Cliente</Th>
                <Th>Estado</Th>
                <Th>Dispositivos</Th>
                <Th>Vence</Th>
                <Th className="text-right">Acciones</Th>
              </Tr>
            </THead>
            <TBody>
              {items.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <button
                      type="button"
                      className="font-mono text-ink hover:text-brand"
                      onClick={() => setDetailId(c.id)}
                    >
                      {c.prefix}…
                    </button>
                  </Td>
                  <Td className="text-ink-muted">{c.plan.name}</Td>
                  <Td className="text-ink-muted">{c.customer?.displayName ?? "—"}</Td>
                  <Td>
                    <Badge tone={CODE_STATUS_TONE[c.status]}>
                      {CODE_STATUS_LABEL[c.status]}
                    </Badge>
                  </Td>
                  <Td className="text-ink-muted">
                    {c.devicesTotal} / {c.deviceLimit}
                  </Td>
                  <Td className="text-ink-muted">{formatDate(c.expiresAt)}</Td>
                  <Td>
                    <div className="flex justify-end gap-1.5">
                      <button type="button" className="btn-ghost px-2 py-1" onClick={() => setDetailId(c.id)}>
                        Ver
                      </button>
                      {write && (
                        <>
                          <button type="button" className="btn-ghost px-2 py-1" onClick={() => setLimiting(c)}>
                            Límite
                          </button>
                          {c.status === "SUSPENDED" ? (
                            <button
                              type="button"
                              className="btn-ghost px-2 py-1"
                              onClick={() => reactivateMut.mutate(c.id)}
                              disabled={reactivateMut.isPending}
                            >
                              Reactivar
                            </button>
                          ) : c.status !== "REVOKED" ? (
                            <button
                              type="button"
                              className="btn-ghost px-2 py-1"
                              onClick={() => setSuspending(c)}
                            >
                              Suspender
                            </button>
                          ) : null}
                          {c.status !== "REVOKED" && (
                            <button
                              type="button"
                              className="btn-danger px-2 py-1"
                              onClick={() => setRevoking(c)}
                            >
                              Revocar
                            </button>
                          )}
                        </>
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

      <GenerateModal
        open={generateOpen}
        plans={plans}
        busy={createMut.isPending}
        onClose={() => setGenerateOpen(false)}
        onSubmit={(values) =>
          createMut.mutate({
            planId: values.planId,
            quantity: values.quantity,
            deviceLimit: values.deviceLimit,
            ...(values.expiresAt !== ""
              ? { expiresAt: new Date(values.expiresAt).toISOString() }
              : {}),
          })
        }
      />

      <ResultModal result={result} onClose={() => setResult(null)} />
      <DetailModal codeId={detailId} onClose={() => setDetailId(null)} />

      <LimitModal
        code={limiting}
        busy={limitMut.isPending}
        onClose={() => setLimiting(null)}
        onSubmit={(limit) =>
          limiting !== null && limitMut.mutate({ id: limiting.id, deviceLimit: limit })
        }
      />

      <ConfirmDialog
        open={suspending !== null}
        title="Suspender código"
        message={`¿Suspender el código "${suspending?.prefix}…"? Dejará de funcionar hasta reactivarlo.`}
        confirmLabel="Suspender"
        busy={suspendMut.isPending}
        onConfirm={() => suspending !== null && suspendMut.mutate(suspending.id)}
        onCancel={() => setSuspending(null)}
      />

      <ConfirmDialog
        open={revoking !== null}
        title="Revocar código"
        message={`Revocar "${revoking?.prefix}…" es definitivo. Si está vinculado a un cliente activo, el cliente también se suspenderá.`}
        confirmLabel="Revocar"
        busy={revokeMut.isPending}
        onConfirm={() => revoking !== null && revokeMut.mutate(revoking.id)}
        onCancel={() => setRevoking(null)}
      />
    </div>
  );
}
