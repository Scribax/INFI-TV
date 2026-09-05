/**
 * Verificación de FASE 22: EAS Build.
 * Uso: `npm run verify:phase22`. No requiere cuenta EAS.
 */
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const easPath = join(root, "apps/mobile/eas.json");
const appJsonPath = join(root, "apps/mobile/app.json");

let failed = 0;

if (!existsSync(easPath)) {
  console.error("MISSING: apps/mobile/eas.json");
  failed += 1;
} else {
  const eas = JSON.parse(readFileSync(easPath, "utf8"));
  const profiles = Object.keys(eas.build ?? {});
  for (const p of ["development", "preview", "production"]) {
    if (!profiles.includes(p)) {
      console.error(`MISSING profile eas.json: ${p}`);
      failed += 1;
    } else {
      console.log(`OK: eas.json build.${p}`);
    }
  }
}

const appJson = JSON.parse(readFileSync(appJsonPath, "utf8"));
if (appJson.expo?.android?.package === undefined) {
  console.error("MISSING: android.package en app.json");
  failed += 1;
} else {
  console.log(`OK: android.package = ${appJson.expo.android.package}`);
}

if (failed > 0) {
  console.error(`\nFASE 22: FAIL (${failed} errores)`);
  process.exit(1);
} else {
  console.log("\nFASE 22: PASS — EAS Build (development/preview/production)");
}
