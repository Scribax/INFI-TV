"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAdminUsers } from "@/hooks/resources";
import { useSession } from "@/hooks/use-session";
import { toast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import type { AdminRole } from "@infitv/types";
import type { AdminUser } from "@/lib/types";

const PAGE_SIZE = 20;

const ROLE_TONE: Record<AdminRole, "violet" | "blue" | "slate"> = {
  SUPER_ADMIN: "violet",
  ADMIN: "blue",
  OPERATOR: "slate",
};

const ROLE_LABEL: Record<AdminRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  OPERATOR: "Operador",
};

function CreateUserModal({
  open,
  busy,
  onClose,
  onSubmit,
}: {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onSubmit: (values: { email: string; password: string; role: AdminRole }) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("OPERATOR");

  useEffect(() => {
    if (open) {
      setEmail("");
      setPassword("");
      setRole("OPERATOR");
    }
  }, [open]);

  const valid = email.includes("@") && password.length >= 12;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo administrador"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={busy || !valid}
            onClick={() => onSubmit({ email: email.trim(), password, role })}
          >
            {busy ? <Spinner /> : "Crear"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="admin-email">
            Email
          </label>
          <input
            id="admin-email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="admin-password">
            Contraseña (mín. 12 caracteres)
          </label>
          <input
            id="admin-password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="admin-role">
            Rol
          </label>
          <select
            id="admin-role"
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value as AdminRole)}
          >
            <option value="OPERATOR">Operador</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}

function EditUserModal({
  user,
  busy,
  onClose,
  onSubmit,
}: {
  user: AdminUser | null;
  busy: boolean;
  onClose: () => void;
  onSubmit: (values: { role: AdminRole; isActive: boolean }) => void;
}) {
  const [role, setRole] = useState<AdminRole>("OPERATOR");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (user !== null) {
      setRole(user.role);
      setIsActive(user.isActive);
    }
  }, [user]);

  return (
    <Modal
      open={user !== null}
      onClose={onClose}
      title={`Editar ${user?.email ?? ""}`}
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={busy}
            onClick={() => onSubmit({ role, isActive })}
          >
            {busy ? <Spinner /> : "Guardar"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="edit-role">
            Rol
          </label>
          <select
            id="edit-role"
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value as AdminRole)}
          >
            <option value="OPERATOR">Operador</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            className="h-4 w-4 accent-brand"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Activo
        </label>
      </div>
    </Modal>
  );
}

export default function UsuariosPage() {
  const { admin: me } = useSession();

  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useAdminUsers({ page, pageSize: PAGE_SIZE });

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);

  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-users"] });

  const createMut = useMutation({
    mutationFn: (body: { email: string; password: string; role: AdminRole }) =>
      api.post("/admin/users", body),
    onSuccess: () => {
      toast.success("Administrador creado.");
      refresh();
      setCreateOpen(false);
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Error inesperado."),
  });
  const updateMut = useMutation({
    mutationFn: (input: { id: string; body: { role: AdminRole; isActive: boolean } }) =>
      api.patch(`/admin/users/${input.id}`, input.body),
    onSuccess: () => {
      toast.success("Administrador actualizado.");
      refresh();
      setEditing(null);
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Error inesperado."),
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">Usuarios</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {data?.total ?? 0} administrador{data?.total === 1 ? "" : "es"}.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setCreateOpen(true)}>
          + Nuevo administrador
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-7 w-7" />
        </div>
      ) : isError ? (
        <p className="text-sm text-danger">No se pudieron cargar los usuarios.</p>
      ) : items.length === 0 ? (
        <EmptyState title="Sin administradores" />
      ) : (
        <div className="card overflow-hidden">
          <Table>
            <THead>
              <Tr>
                <Th>Email</Th>
                <Th>Rol</Th>
                <Th>Estado</Th>
                <Th>Último login</Th>
                <Th className="text-right">Acciones</Th>
              </Tr>
            </THead>
            <TBody>
              {items.map((u) => (
                <Tr key={u.id}>
                  <Td>
                    <span className="font-medium text-ink">{u.email}</span>
                    {me?.id === u.id && (
                      <span className="ml-2 text-xs text-ink-faint">(vos)</span>
                    )}
                  </Td>
                  <Td>
                    <Badge tone={ROLE_TONE[u.role]}>{ROLE_LABEL[u.role]}</Badge>
                  </Td>
                  <Td>
                    <Badge tone={u.isActive ? "green" : "slate"}>
                      {u.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </Td>
                  <Td className="text-ink-muted">{formatDateTime(u.lastLoginAt)}</Td>
                  <Td>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="btn-ghost px-2 py-1"
                        onClick={() => setEditing(u)}
                      >
                        Editar
                      </button>
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

      <CreateUserModal
        open={createOpen}
        busy={createMut.isPending}
        onClose={() => setCreateOpen(false)}
        onSubmit={(values) => createMut.mutate(values)}
      />

      <EditUserModal
        user={editing}
        busy={updateMut.isPending}
        onClose={() => setEditing(null)}
        onSubmit={(values) => editing !== null && updateMut.mutate({ id: editing.id, body: values })}
      />
    </div>
  );
}
