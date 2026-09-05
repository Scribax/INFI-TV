/**
 * Verificación de FASE 10: proyecto React Native + Expo (scaffold).
 * Uso: `npm run verify:phase10`. No requiere DB ni emulador.
 */
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const requiredFiles = [
  "apps/mobile/package.json",
  "apps/mobile/app.json",
  "apps/mobile/tsconfig.json",
  "apps/mobile/metro.config.js",
  "apps/mobile/expo-env.d.ts",
  "apps/mobile/src/app/_layout.tsx",
  "apps/mobile/src/app/index.tsx",
  "apps/mobile/assets/images/icon.png",
  "apps/mobile/assets/images/splash-icon.png",
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
  console.error(`\nFASE 10: FAIL (${failed} errores)`);
  process.exit(1);
} else {
  console.log("\nFASE 10: PASS — proyecto React Native + Expo (scaffold)");
}
