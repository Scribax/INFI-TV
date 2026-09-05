/**
 * Verificación de FASE 20: tests.
 * Uso: `npm run verify:phase20`. No requiere DB.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function collect(dir, ext, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) collect(full, ext, out);
    else if (entry.endsWith(ext)) out.push(full);
  }
  return out;
}

const backendSpecs = collect(join(root, "backend/src"), ".spec.ts");
const e2eSpecs = collect(join(root, "backend/test"), ".e2e-spec.ts");
const adminTests = collect(join(root, "apps/admin"), ".test.ts");
const mobileTests = collect(join(root, "apps/mobile/src"), ".test.ts");

let failed = 0;
const report = (label, list) => {
  if (list.length === 0) {
    console.error(`MISSING: ${label}`);
    failed += 1;
  } else {
    console.log(`OK: ${label} (${list.length})`);
  }
};
report("backend unit specs", backendSpecs);
report("backend e2e specs", e2eSpecs);
report("admin tests", adminTests);
report("mobile tests", mobileTests);

if (failed > 0) {
  console.error(`\nFASE 20: FAIL (${failed} grupos sin tests)`);
  process.exit(1);
} else {
  console.log("\nFASE 20: PASS — tests (unit + e2e en las 3 apps)");
}
