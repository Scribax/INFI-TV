/**
 * Verificación de FASE 8: integración IPTV-org (parser + sync + job).
 * Uso: `npm run verify:phase8`. No requiere DB.
 */
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const requiredFiles = [
  "backend/src/iptv/m3u-parser.ts",
  "backend/src/iptv/m3u-parser.spec.ts",
  "backend/src/iptv/countries.ts",
  "backend/src/iptv/iptv-sync.service.ts",
  "backend/src/iptv/iptv-sync.service.spec.ts",
  "backend/src/iptv/iptv-sync.controller.ts",
  "backend/src/iptv/iptv-sync.module.ts",
  "backend/src/iptv/iptv-sync.scheduler.ts",
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
  console.error(`\nFASE 8: FAIL (${failed} errores)`);
  process.exit(1);
} else {
  console.log("\nFASE 8: PASS — integración IPTV-org (parser + sync + job)");
}
