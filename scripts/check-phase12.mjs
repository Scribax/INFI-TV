/**
 * Verificación de FASE 12: home + catálogo de canales en la app móvil.
 * Uso: `npm run verify:phase12`. No requiere DB ni emulador.
 */
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const requiredFiles = [
  "apps/mobile/src/app/(tabs)/_layout.tsx",
  "apps/mobile/src/app/(tabs)/index.tsx",
  "apps/mobile/src/app/(tabs)/canales.tsx",
  "apps/mobile/src/app/(tabs)/buscar.tsx",
  "apps/mobile/src/app/(tabs)/favoritos.tsx",
  "apps/mobile/src/app/(tabs)/mas.tsx",
  "apps/mobile/src/app/channel/[id].tsx",
  "apps/mobile/src/hooks/use-channels.ts",
  "apps/mobile/src/hooks/use-catalog.ts",
  "apps/mobile/src/components/channel-card.tsx",
  "apps/mobile/src/components/channel-skeleton.tsx",
  "apps/mobile/src/components/states.tsx",
  "apps/mobile/src/lib/types.ts",
  "apps/mobile/src/lib/flags.ts",
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
  console.error(`\nFASE 12: FAIL (${failed} errores)`);
  process.exit(1);
} else {
  console.log("\nFASE 12: PASS — home + catálogo (tabs, grilla, filtros, búsqueda)");
}
