"use client";

import type { AdminRole } from "@infitv/types";

const ROLE_LABEL: Record<AdminRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  OPERATOR: "Operador",
};

export function Topbar({
  email,
  role,
  onLogout,
}: {
  email: string;
  role: AdminRole;
  onLogout: () => void;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-line px-6">
      <span className="text-sm text-ink-muted">Panel de administración</span>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-medium leading-tight text-ink">
            {email}
          </div>
          <div className="text-xs text-ink-faint">{ROLE_LABEL[role]}</div>
        </div>
        <button type="button" className="btn-ghost" onClick={onLogout}>
          Salir
        </button>
      </div>
    </header>
  );
}
