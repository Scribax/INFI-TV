/**
 * Verificación de FASE 15: EPG (guía XMLTV).
 * Uso: `npm run verify:phase15`. No requiere DB.
 */
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const requiredFiles = [
  "backend/src/iptv/xmltv-parser.ts",
  "backend/src/iptv/xmltv-parser.spec.ts",
  "backend/src/iptv/epg-sync.service.ts",
  "backend/src/iptv/epg-sync.controller.ts",
  "backend/src/iptv/epg-sync.scheduler.ts",
  "backend/src/epg/epg.service.ts",
  "backend/src/epg/epg.controller.ts",
  "backend/src/epg/epg.module.ts",
  "apps/mobile/src/lib/epg.ts",
  "apps/mobile/src/hooks/use-epg.ts",
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
  console.error(`\nFASE 15: FAIL (${failed} errores)`);
  process.exit(1);
} else {
  console.log("\nFASE 15: PASS — EPG (guía XMLTV: sync + endpoint + UI)");
}
