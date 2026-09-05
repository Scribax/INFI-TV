/**
 * Verificación de FASE 9: API de canales (endpoints con sesión de cliente).
 * Uso: `npm run verify:phase9`. No requiere DB.
 */
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const requiredFiles = [
  "backend/src/channels/channels.service.ts",
  "backend/src/channels/channels.service.spec.ts",
  "backend/src/channels/channels.controller.ts",
  "backend/src/channels/channels.module.ts",
  "backend/src/channels/dto/channels-query.dto.ts",
  "backend/src/channels/dto/search-query.dto.ts",
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
  console.error(`\nFASE 9: FAIL (${failed} errores)`);
  process.exit(1);
} else {
  console.log("\nFASE 9: PASS — API de canales (channels/countries/categories/search)");
}
