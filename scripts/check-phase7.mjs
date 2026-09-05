/**
 * Verificación de FASE 7: panel administrativo (Next.js) + endpoint stats.
 * Uso: `npm run verify:phase7`. No requiere DB.
 */
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const requiredFiles = [
  // Scaffold
  "apps/admin/package.json",
  "apps/admin/next.config.mjs",
  "apps/admin/tailwind.config.ts",
  "apps/admin/tsconfig.json",
  // Auth (route handlers + middleware + store)
  "apps/admin/middleware.ts",
  "apps/admin/app/api/auth/login/route.ts",
  "apps/admin/app/api/auth/refresh/route.ts",
  "apps/admin/app/api/auth/logout/route.ts",
  "apps/admin/lib/cookies.ts",
  "apps/admin/lib/server.ts",
  "apps/admin/lib/auth-store.ts",
  "apps/admin/lib/api.ts",
  // App shell
  "apps/admin/app/layout.tsx",
  "apps/admin/app/providers.tsx",
  "apps/admin/app/login/page.tsx",
  "apps/admin/app/(dashboard)/layout.tsx",
  // Páginas
  "apps/admin/app/(dashboard)/dashboard/page.tsx",
  "apps/admin/app/(dashboard)/clientes/page.tsx",
  "apps/admin/app/(dashboard)/codigos/page.tsx",
  "apps/admin/app/(dashboard)/planes/page.tsx",
  "apps/admin/app/(dashboard)/dispositivos/page.tsx",
  "apps/admin/app/(dashboard)/sesiones/page.tsx",
  "apps/admin/app/(dashboard)/logs/page.tsx",
  "apps/admin/app/(dashboard)/usuarios/page.tsx",
  // Soporte
  "apps/admin/lib/types.ts",
  "apps/admin/lib/status.ts",
  "apps/admin/lib/format.ts",
  "apps/admin/lib/permissions.ts",
  "apps/admin/lib/query.ts",
  "apps/admin/hooks/resources.ts",
  "apps/admin/hooks/use-session.ts",
  "apps/admin/components/ui/modal.tsx",
  "apps/admin/components/ui/table.tsx",
  "apps/admin/components/layout/sidebar.tsx",
  // Tests
  "apps/admin/lib/format.test.ts",
  "apps/admin/lib/permissions.test.ts",
  // Backend: endpoint de métricas
  "backend/src/stats/stats.service.ts",
  "backend/src/stats/stats.controller.ts",
  "backend/src/stats/stats.module.ts",
  "backend/src/stats/stats.service.spec.ts",
];

let failed = 0;
for (const rel of requiredFiles) {
  if (!existsSync(join(root, rel))) {
    console.error(`MISSING: ${rel}`);
    failed += 1;
  } else {
    console.log(`OK: ${rel}`);
  }
}

if (failed > 0) {
  console.error(`\nFASE 7: FAIL (${failed} errores)`);
  process.exit(1);
} else {
  console.log("\nFASE 7: PASS — panel administrativo Next.js + stats");
}
