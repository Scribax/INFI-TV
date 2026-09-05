/**
 * Verificación de FASE 14: reproductor HLS con expo-video.
 * Uso: `npm run verify:phase14`. No requiere DB ni emulador.
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

if (deps["expo-video"] === undefined) {
  console.error("MISSING dep: expo-video");
  failed += 1;
} else {
  console.log(`OK: expo-video ${deps["expo-video"]}`);
}

const playerPath = join(root, "apps/mobile/src/app/channel/[id].tsx");
if (!existsSync(playerPath)) {
  console.error("MISSING: apps/mobile/src/app/channel/[id].tsx");
  failed += 1;
} else {
  const src = readFileSync(playerPath, "utf8");
  if (src.includes("useVideoPlayer") && src.includes("nativeControls")) {
    console.log("OK: channel/[id].tsx usa useVideoPlayer + nativeControls");
  } else {
    console.error("FAIL: channel/[id].tsx sin reproductor (useVideoPlayer)");
    failed += 1;
  }
}

if (failed > 0) {
  console.error(`\nFASE 14: FAIL (${failed} errores)`);
  process.exit(1);
} else {
  console.log("\nFASE 14: PASS — reproductor HLS (expo-video)");
}
