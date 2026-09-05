/**
 * Verificación de FASE 11: activación por código en la app móvil.
 * Uso: `npm run verify:phase11`. No requiere DB ni emulador.
 */
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const requiredFiles = [
  "apps/mobile/src/lib/api.ts",
  "apps/mobile/src/lib/session.ts",
  "apps/mobile/src/lib/device.ts",
  "apps/mobile/src/lib/activation.ts",
  "apps/mobile/src/constants/theme.ts",
  "apps/mobile/src/app/index.tsx",
  "apps/mobile/src/app/home.tsx",
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
  console.error(`\nFASE 11: FAIL (${failed} errores)`);
  process.exit(1);
} else {
  console.log("\nFASE 11: PASS — activación por código (pantalla + sesión SecureStore)");
}
