"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME } from "@infitv/config";
import type { AdminRole } from "@infitv/types";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const BASE_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/clientes", label: "Clientes", icon: "👥" },
  { href: "/codigos", label: "Códigos", icon: "🎟️" },
  { href: "/planes", label: "Planes", icon: "📦" },
  { href: "/dispositivos", label: "Dispositivos", icon: "📱" },
  { href: "/sesiones", label: "Sesiones", icon: "🔐" },
];

const SUPER_NAV: NavItem[] = [
  { href: "/logs", label: "Auditoría", icon: "🧾" },
  { href: "/usuarios", label: "Usuarios", icon: "🛡️" },
];

export function Sidebar({ role }: { role: AdminRole }) {
  const pathname = usePathname();
  const items = role === "SUPER_ADMIN" ? [...BASE_NAV, ...SUPER_NAV] : BASE_NAV;

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-surface/60">
      <div className="flex h-16 items-center gap-2.5 border-b border-line px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
          IT
        </span>
        <span className="text-sm font-semibold tracking-wide text-ink">
          {APP_NAME} <span className="text-ink-faint">Admin</span>
        </span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-brand/15 font-medium text-ink"
                  : "text-ink-muted hover:bg-raised hover:text-ink"
              }`}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
