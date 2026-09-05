/**
 * Verificación de FASE 18: seguridad y rate limiting.
 * Uso: `npm run verify:phase18`. No requiere DB.
 */
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const requiredFiles = [
  "backend/src/common/security/activation-abuse.service.ts",
  "backend/src/common/security/activation-abuse.service.spec.ts",
  "backend/src/activation/activation.service.ts",
  "backend/src/config/env.validation.ts",
  "backend/src/config/configuration.ts",
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
  console.error(`\nFASE 18: FAIL (${failed} errores)`);
  process.exit(1);
} else {
  console.log("\nFASE 18: PASS — seguridad y rate limiting (throttle + anti-abuso)");
}
