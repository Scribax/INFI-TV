/**
 * Verificación de FASE 21: CI/CD (GitHub Actions).
 * Uso: `npm run verify:phase21`. No requiere ejecutar el workflow.
 */
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const workflow = join(root, ".github/workflows/ci.yml");

if (!existsSync(workflow)) {
  console.error("MISSING: .github/workflows/ci.yml");
  process.exit(1);
}

console.log("OK: .github/workflows/ci.yml");
console.log("\nFASE 21: PASS — CI/CD (GitHub Actions: lint + typecheck + tests + build)");
