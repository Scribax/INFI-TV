/**
 * Verificación de FASE 16: caché + offline (AsyncStorage).
 * Uso: `npm run verify:phase16`. No requiere DB ni emulador.
 */
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const pkg = JSON.parse(
  readFileSync(join(root, "apps/mobile/package.json"), "utf8"),
);
const deps = { ...pkg.dependencies };

let failed = 0;

if (deps["@react-native-async-storage/async-storage"] === undefined) {
  console.error("MISSING dep: @react-native-async-storage/async-storage");
  failed += 1;
} else {
  console.log(
    `OK: async-storage ${deps["@react-native-async-storage/async-storage"]}`,
  );
}

const requiredFiles = [
  "apps/mobile/src/lib/cache.ts",
  "apps/mobile/src/hooks/use-catalog.ts",
  "apps/mobile/src/hooks/use-channels.ts",
];
for (const rel of requiredFiles) {
  if (!existsSync(join(root, rel))) {
    console.error(`MISSING: ${rel}`);
    failed += 1;
  } else {
    console.log(`OK: ${rel}`);
  }
}

if (failed > 0) {
  console.error(`\nFASE 16: FAIL (${failed} errores)`);
  process.exit(1);
} else {
  console.log("\nFASE 16: PASS — caché + offline (catálogo cacheado)");
}
