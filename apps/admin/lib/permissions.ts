import type { AdminRole } from "@infitv/types";

/** Puede escribir (mutar) datos: solo SUPER_ADMIN y ADMIN. */
export function canWrite(role: AdminRole | undefined): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function isSuper(role: AdminRole | undefined): boolean {
  return role === "SUPER_ADMIN";
}
