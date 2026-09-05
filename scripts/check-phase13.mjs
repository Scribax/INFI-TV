/**
 * Verificación de FASE 13: favoritos + historial (backend /me + app).
 * Uso: `npm run verify:phase13`. No requiere DB.
 */
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const requiredFiles = [
  "backend/src/me/me.service.ts",
  "backend/src/me/me.service.spec.ts",
  "backend/src/me/me.controller.ts",
  "backend/src/me/me.module.ts",
  "apps/mobile/src/lib/me.ts",
  "apps/mobile/src/hooks/use-me.ts",
  "apps/mobile/src/app/(tabs)/favoritos.tsx",
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
  console.error(`\nFASE 13: FAIL (${failed} errores)`);
  process.exit(1);
} else {
  console.log("\nFASE 13: PASS — favoritos + historial (endpoints /me + UI)");
}
