import { SetMetadata } from "@nestjs/common";
import type { AdminRole } from "@prisma/client";

export const ROLES_KEY = "infitv:roles";

/**
 * Roles mínimos para acceder al handler. Hay jerarquía:
 * SUPER_ADMIN (3) > ADMIN (2) > OPERATOR (1).
 * @Roles("ADMIN") permite ADMIN y SUPER_ADMIN.
 */
export const Roles = (...roles: AdminRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);

const ROLE_RANK: Record<AdminRole, number> = {
  OPERATOR: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

/** Función pura, testeada: ¿alcanza el rol del admin? */
export function roleSatisfies(actual: AdminRole, required: AdminRole[]): boolean {
  if (required.length === 0) {
    return true;
  }
  const actualRank = ROLE_RANK[actual];
  return required.some((r) => actualRank >= ROLE_RANK[r]);
}
