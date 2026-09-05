/**
 * Verificación de FASE 6: dispositivos + sesiones + activación.
 * Uso: `npm run verify:phase6`. No requiere DB.
 */
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const requiredFiles = [
  "backend/src/activation/activation.service.ts",
  "backend/src/activation/activation.service.spec.ts",
  "backend/src/activation/activation.controller.ts",
  "backend/src/activation/activation.module.ts",
  "backend/src/activation/session.guard.ts",
  "backend/src/activation/current-session.decorator.ts",
  "backend/src/activation/dto/activate.dto.ts",
  "backend/src/devices/devices.service.ts",
  "backend/src/devices/devices.service.spec.ts",
  "backend/src/devices/devices.controller.ts",
  "backend/src/devices/devices.module.ts",
  "backend/src/sessions/sessions.service.ts",
  "backend/src/sessions/sessions.controller.ts",
  "backend/src/sessions/sessions.module.ts",
  "backend/src/common/errors/api-error.ts",
  "backend/src/common/filters/http-exception.filter.spec.ts",
  "backend/test/activation.e2e-spec.ts",
  "backend/test/activate-throttle.e2e-spec.ts",
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
  console.error(`\nFASE 6: FAIL (${failed} errores)`);
  process.exit(1);
} else {
  console.log("\nFASE 6: PASS — activación + dispositivos + sesiones");
}
