"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { usePlans } from "@/hooks/resources";
import { useSession } from "@/hooks/use-session";
import { canWrite } from "@/lib/permissions";
import { toast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { formatMoney } from "@/lib/format";
import type { AdminPlan } from "@/lib/types";

interface PlanFormValues {
  name: string;
  durationDays: number;
  pricePesos: number;
  deviceLimit: number;
  description: string;
  isActive: boolean;
}

function PlanFormModal({
  open,
  editing,
  busy,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editing: AdminPlan | null;
  busy: boolean;
  onClose: () => void;
  onSubmit: (values: PlanFormValues) => void;
}) {
  const [name, setName] = useState("");
  const [durationDays, setDurationDays] = useState(30);
  const [pricePesos, setPricePesos] = useState(0);
  const [deviceLimit, setDeviceLimit] = useState(1);
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setDurationDays(editing?.durationDays ?? 30);
      setPricePesos((editing?.priceInternalCents ?? 0) / 100);
      setDeviceLimit(editing?.deviceLimit ?? 1);
      setDescription(editing?.description ?? "");
      setIsActive(editing?.isActive ?? true);
    }
  }, [open, editing]);

  const valid = name.trim().length >= 2 && durationDays >= 1 && durationDays <= 1825;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing === null ? "Nuevo plan" : "Editar plan"}
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
              onSubmit({
                name: name.trim(),
                durationDays,
                pricePesos,
                deviceLimit,
                description,
                isActive,
              })
            }
          >
            {busy ? <Spinner /> : "Guardar"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="plan-name">
            Nombre
          </label>
          <input
            id="plan-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="30 DÍAS"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="plan-days">
              Duración (días)
            </label>
            <input
              id="plan-days"
              type="number"
              min={1}
              max={1825}
              className="input"
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value) || 1)}
            />
          </div>
          <div>
            <label className="label" htmlFor="plan-limit">
              Límite de dispositivos
            </label>
            <input
              id="plan-limit"
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
        </div>
        <div>
          <label className="label" htmlFor="plan-price">
            Precio interno (ARS)
          </label>
          <input
            id="plan-price"
            type="number"
            min={0}
            step="0.01"
            className="input"
            value={pricePesos}
            onChange={(e) => setPricePesos(Math.max(0, Number(e.target.value) || 0))}
          />
          <p className="mt-1 text-xs text-ink-faint">
            Solo visible para administradores, nunca en la APK.
          </p>
        </div>
        <div>
          <label className="label" htmlFor="plan-desc">
            Descripción
          </label>
          <textarea
            id="plan-desc"
            className="input min-h-20 resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            className="h-4 w-4 accent-brand"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Plan activo
        </label>
      </div>
    </Modal>
  );
}

export default function PlanesPage() {
  const { admin } = useSession();
  const write = canWrite(admin?.role);

  const plansQuery = usePlans();
  const plans = plansQuery.data ?? [];

  const [search, setSearch] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminPlan | null>(null);
  const [deleting, setDeleting] = useState<AdminPlan | null>(null);

  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["plans"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
  };
  const onSuccess = (message: string) => {
    toast.success(message);
    refresh();
  };
  const onError = (err: unknown) =>
    toast.error(err instanceof Error ? err.message : "Error inesperado.");

  const saveMut = useMutation({
    mutationFn: (input: { id: string | null; body: Record<string, unknown> }) =>
      input.id === null
        ? api.post("/admin/plans", input.body)
        : api.patch(`/admin/plans/${input.id}`, input.body),
    onSuccess: () => {
      onSuccess("Plan guardado.");
      setFormOpen(false);
      setEditing(null);
    },
    onError,
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.del(`/admin/plans/${id}`),
    onSuccess: () => {
      onSuccess("Plan eliminado.");
      setDeleting(null);
    },
    onError,
  });

  const filtered = plans.filter((p) => {
    if (onlyActive && !p.isActive) return false;
    if (search !== "" && !p.name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">Planes</h1>
          <p className="mt-1 text-sm text-ink-muted">{plans.length} planes.</p>
        </div>
        {write && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            + Nuevo plan
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          className="input max-w-xs"
          placeholder="Buscar plan…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            className="h-4 w-4 accent-brand"
            checked={onlyActive}
            onChange={(e) => setOnlyActive(e.target.checked)}
          />
          Solo activos
        </label>
      </div>

      {plansQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-7 w-7" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Sin planes" hint="Creá un plan para empezar." />
      ) : (
        <div className="card overflow-hidden">
          <Table>
            <THead>
              <Tr>
                <Th>Nombre</Th>
                <Th>Duración</Th>
                <Th>Precio interno</Th>
                <Th>Dispositivos</Th>
                <Th>Estado</Th>
                <Th className="text-right">Acciones</Th>
              </Tr>
            </THead>
            <TBody>
              {filtered.map((p) => (
                <Tr key={p.id}>
                  <Td>
                    <div>
                      <div className="font-medium text-ink">{p.name}</div>
                      {p.description !== null && p.description !== "" && (
                        <div className="text-xs text-ink-faint">{p.description}</div>
                      )}
                    </div>
                  </Td>
                  <Td className="text-ink-muted">{p.durationDays} días</Td>
                  <Td className="text-ink-muted">{formatMoney(p.priceInternalCents)}</Td>
                  <Td className="text-ink-muted">{p.deviceLimit}</Td>
                  <Td>
                    <Badge tone={p.isActive ? "green" : "slate"}>
                      {p.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-1.5">
                      {write && (
                        <>
                          <button
                            type="button"
                            className="btn-ghost px-2 py-1"
                            onClick={() => {
                              setEditing(p);
                              setFormOpen(true);
                            }}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="btn-danger px-2 py-1"
                            onClick={() => setDeleting(p)}
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </div>
      )}

      <PlanFormModal
        open={formOpen}
        editing={editing}
        busy={saveMut.isPending}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={(values) => {
          const body = {
            name: values.name,
            durationDays: values.durationDays,
            priceInternalCents: Math.round(values.pricePesos * 100),
            deviceLimit: values.deviceLimit,
            description: values.description || null,
            isActive: values.isActive,
          };
          saveMut.mutate({ id: editing?.id ?? null, body });
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Eliminar plan"
        message={`¿Eliminar "${deleting?.name}"? Si está en uso el backend lo rechazará; en ese caso, desactivalo en su lugar.`}
        confirmLabel="Eliminar"
        busy={deleteMut.isPending}
        onConfirm={() => deleting !== null && deleteMut.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
