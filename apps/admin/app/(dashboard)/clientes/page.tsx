"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useCustomer, useCustomers, usePlans } from "@/hooks/resources";
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
import { CUSTOMER_STATUS_LABEL, CUSTOMER_STATUS_TONE } from "@/lib/status";
import type { AdminPlan, CustomerListItem } from "@/lib/types";

const PAGE_SIZE = 20;

interface CustomerFormValues {
  displayName: string;
  planId: string;
  notes: string;
}

function CustomerFormModal({
  open,
  editing,
  plans,
  busy,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editing: CustomerListItem | null;
  plans: AdminPlan[];
  busy: boolean;
  onClose: () => void;
  onSubmit: (values: CustomerFormValues) => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [planId, setPlanId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setDisplayName(editing?.displayName ?? "");
      setPlanId(editing?.planId ?? "");
      setNotes(editing?.notes ?? "");
    }
  }, [open, editing]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing === null ? "Nuevo cliente" : "Editar cliente"}
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={busy || displayName.trim().length < 2}
            onClick={() =>
              onSubmit({ displayName: displayName.trim(), planId, notes })
            }
          >
            {busy ? <Spinner /> : "Guardar"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="customer-name">
            Nombre del cliente
          </label>
          <input
            id="customer-name"
            className="input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Kiosco Don Pepe"
          />
        </div>
        <div>
          <label className="label" htmlFor="customer-plan">
            Plan (opcional)
          </label>
          <select
            id="customer-plan"
            className="input"
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
          >
            <option value="">Sin plan</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.durationDays} días
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-ink-faint">
            Con plan, el vencimiento se calcula desde hoy.
          </p>
        </div>
        <div>
          <label className="label" htmlFor="customer-notes">
            Notas
          </label>
          <textarea
            id="customer-notes"
            className="input min-h-20 resize-y"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas internas (opcional)"
          />
        </div>
      </div>
    </Modal>
  );
}

function RenewModal({
  open,
  customer,
  plans,
  busy,
  onClose,
  onSubmit,
}: {
  open: boolean;
  customer: CustomerListItem | null;
  plans: AdminPlan[];
  busy: boolean;
  onClose: () => void;
  onSubmit: (planId: string) => void;
}) {
  const [planId, setPlanId] = useState("");
  useEffect(() => {
    if (open && customer !== null) {
      setPlanId(customer.planId ?? "");
    }
  }, [open, customer]);

  const selected = plans.find((p) => p.id === planId);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Renovar ${customer?.displayName ?? ""}`}
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={busy || planId === ""}
            onClick={() => onSubmit(planId)}
          >
            {busy ? <Spinner /> : "Renovar"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="renew-plan">
            Plan
          </label>
          <select
            id="renew-plan"
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
        {selected !== undefined && (
          <p className="text-sm text-ink-muted">
            Se extiende{" "}
            <span className="font-medium text-ink">{selected.durationDays} días</span>{" "}
            desde el vencimiento actual (o desde hoy si ya venció) y reactiva el
            acceso.
          </p>
        )}
      </div>
    </Modal>
  );
}

function DetailModal({
  customerId,
  onClose,
}: {
  customerId: string | null;
  onClose: () => void;
}) {
  const { data, isLoading } = useCustomer(customerId);
  return (
    <Modal open={customerId !== null} onClose={onClose} title="Detalle del cliente">
      {isLoading || data === undefined ? (
        <div className="flex justify-center py-8">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (
        <dl className="space-y-3 text-sm">
          <Row label="Nombre" value={data.displayName} />
          <Row
            label="Estado"
            value={
              <Badge tone={CUSTOMER_STATUS_TONE[data.status]}>
                {CUSTOMER_STATUS_LABEL[data.status]}
              </Badge>
            }
          />
          <Row label="Plan" value={data.plan?.name ?? "—"} />
          <Row label="Vencimiento" value={formatDate(data.expiresAt)} />
          <Row label="Última conexión" value={formatDateTime(data.lastSeenAt)} />
          <Row label="Dispositivos" value={String(data._count.devices)} />
          <Row label="Sesiones" value={String(data._count.sessions)} />
          <Row label="Favoritos" value={String(data._count.favorites)} />
          <Row label="Creado" value={formatDateTime(data.createdAt)} />
          {data.notes !== null && data.notes !== "" && (
            <Row label="Notas" value={data.notes} />
          )}
        </dl>
      )}
    </Modal>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
}

export default function ClientesPage() {
  const { admin } = useSession();
  const write = canWrite(admin?.role);
  const superAdmin = admin?.role === "SUPER_ADMIN";

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

  const { data, isLoading, isError } = useCustomers({
    page,
    pageSize: PAGE_SIZE,
    search,
    status,
    planId,
  });
  const plansQuery = usePlans();
  const plans = plansQuery.data ?? [];

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerListItem | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [renewing, setRenewing] = useState<CustomerListItem | null>(null);
  const [suspending, setSuspending] = useState<CustomerListItem | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [deleting, setDeleting] = useState<CustomerListItem | null>(null);

  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["customers"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
  };
  const onSuccess = (message: string) => {
    toast.success(message);
    refresh();
  };
  const onError = (err: unknown) =>
    toast.error(err instanceof Error ? err.message : "Error inesperado.");

  const createMut = useMutation({
    mutationFn: (body: CustomerFormValues) => api.post("/admin/customers", body),
    onSuccess: () => {
      onSuccess("Cliente creado.");
      setFormOpen(false);
      setEditing(null);
    },
    onError,
  });
  const updateMut = useMutation({
    mutationFn: (input: { id: string; body: CustomerFormValues }) =>
      api.patch(`/admin/customers/${input.id}`, input.body),
    onSuccess: () => {
      onSuccess("Cliente actualizado.");
      setFormOpen(false);
      setEditing(null);
    },
    onError,
  });
  const renewMut = useMutation({
    mutationFn: (input: { id: string; planId: string }) =>
      api.post(`/admin/customers/${input.id}/renew`, { planId: input.planId }),
    onSuccess: () => {
      onSuccess("Cliente renovado.");
      setRenewing(null);
    },
    onError,
  });
  const suspendMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/admin/customers/${id}/suspend`, { reason: reason.trim() || undefined }),
    onSuccess: () => {
      onSuccess("Cliente suspendido.");
      setSuspending(null);
      setSuspendReason("");
    },
    onError,
  });
  const reactivateMut = useMutation({
    mutationFn: (id: string) => api.post(`/admin/customers/${id}/reactivate`, {}),
    onSuccess: () => {
      onSuccess("Cliente reactivado.");
    },
    onError,
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.del(`/admin/customers/${id}`),
    onSuccess: () => {
      onSuccess("Cliente eliminado.");
      setDeleting(null);
    },
    onError,
  });

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (c: CustomerListItem) => {
    setEditing(c);
    setFormOpen(true);
  };

  const items = data?.items ?? [];
  const hasFilters = search !== "" || status !== "" || planId !== "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">Clientes</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {data?.total ?? 0} cliente{data?.total === 1 ? "" : "s"} en total.
          </p>
        </div>
        {write && (
          <button type="button" className="btn-primary" onClick={openCreate}>
            + Nuevo cliente
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          className="input max-w-xs"
          placeholder="Buscar por nombre…"
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
          <option value="EXPIRED">Vencido</option>
          <option value="SUSPENDED">Suspendido</option>
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
        <p className="text-sm text-danger">No se pudieron cargar los clientes.</p>
      ) : items.length === 0 ? (
        <EmptyState
          title="Sin clientes"
          hint={
            hasFilters
              ? "Probá con otros filtros."
              : "Creá el primer cliente para empezar."
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <Table>
            <THead>
              <Tr>
                <Th>Cliente</Th>
                <Th>Plan</Th>
                <Th>Estado</Th>
                <Th>Vencimiento</Th>
                <Th>Última conexión</Th>
                <Th className="text-right">Acciones</Th>
              </Tr>
            </THead>
            <TBody>
              {items.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <button
                      type="button"
                      className="font-medium text-ink hover:text-brand"
                      onClick={() => setDetailId(c.id)}
                    >
                      {c.displayName}
                    </button>
                  </Td>
                  <Td className="text-ink-muted">{c.plan?.name ?? "—"}</Td>
                  <Td>
                    <Badge tone={CUSTOMER_STATUS_TONE[c.status]}>
                      {CUSTOMER_STATUS_LABEL[c.status]}
                    </Badge>
                  </Td>
                  <Td className="text-ink-muted">{formatDate(c.expiresAt)}</Td>
                  <Td className="text-ink-muted">{formatDateTime(c.lastSeenAt)}</Td>
                  <Td>
                    <div className="flex justify-end gap-1.5">
                      <button type="button" className="btn-ghost px-2 py-1" onClick={() => setDetailId(c.id)}>
                        Ver
                      </button>
                      {write && (
                        <>
                          <button type="button" className="btn-ghost px-2 py-1" onClick={() => openEdit(c)}>
                            Editar
                          </button>
                          <button type="button" className="btn-ghost px-2 py-1" onClick={() => setRenewing(c)}>
                            Renovar
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
                          ) : (
                            <button
                              type="button"
                              className="btn-ghost px-2 py-1"
                              onClick={() => setSuspending(c)}
                            >
                              Suspender
                            </button>
                          )}
                        </>
                      )}
                      {superAdmin && (
                        <button
                          type="button"
                          className="btn-danger px-2 py-1"
                          onClick={() => setDeleting(c)}
                        >
                          Eliminar
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

      <CustomerFormModal
        open={formOpen}
        editing={editing}
        plans={plans}
        busy={createMut.isPending || updateMut.isPending}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={(values) => {
          if (editing === null) createMut.mutate(values);
          else updateMut.mutate({ id: editing.id, body: values });
        }}
      />

      <RenewModal
        open={renewing !== null}
        customer={renewing}
        plans={plans}
        busy={renewMut.isPending}
        onClose={() => setRenewing(null)}
        onSubmit={(pid) => renewMut.mutate({ id: renewing!.id, planId: pid })}
      />

      <DetailModal customerId={detailId} onClose={() => setDetailId(null)} />

      <ConfirmDialog
        open={suspending !== null}
        title="Suspender cliente"
        message={`¿Suspender el acceso de "${suspending?.displayName}"? Podrás reactivarlo cuando quieras.`}
        confirmLabel="Suspender"
        busy={suspendMut.isPending}
        onConfirm={() =>
          suspending !== null && suspendMut.mutate({ id: suspending.id, reason: suspendReason })
        }
        onCancel={() => {
          setSuspending(null);
          setSuspendReason("");
        }}
      >
        <input
          type="text"
          value={suspendReason}
          onChange={(e) => setSuspendReason(e.target.value)}
          placeholder="Motivo (ej: Falta de pago) — se lo mostramos al cliente"
          className="input mt-3 w-full"
        />
      </ConfirmDialog>

      <ConfirmDialog
        open={deleting !== null}
        title="Eliminar cliente"
        message={`Se eliminará "${deleting?.displayName}" y todos sus dispositivos, sesiones y favoritos. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        busy={deleteMut.isPending}
        onConfirm={() => deleting !== null && deleteMut.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
