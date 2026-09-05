/**
 * Verificación de FASE 17: estadísticas + logs (telemetría + auditoría).
 * Uso: `npm run verify:phase17`. No requiere DB.
 */
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const requiredFiles = [
  "backend/src/stats/stats.service.ts",
  "backend/src/stats/stats.service.spec.ts",
  "backend/src/audit/audit.service.ts",
  "backend/src/audit/audit.controller.ts",
  "apps/admin/app/(dashboard)/dashboard/page.tsx",
  "apps/admin/app/(dashboard)/logs/page.tsx",
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
  console.error(`\nFASE 17: FAIL (${failed} errores)`);
  process.exit(1);
} else {
  console.log("\nFASE 17: PASS — estadísticas + logs (telemetría + auditoría)");
}
