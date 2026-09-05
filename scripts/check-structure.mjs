/**
 * Verificación de FASE 1: comprueba que la estructura del monorepo existe
 * y que los archivos base son válidos. Uso: `npm run verify:phase1`.
 * No requiere dependencias externas.
 */
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const requiredFiles = [
  "package.json",
  "tsconfig.base.json",
  ".gitignore",
  ".env.example",
  "docker-compose.yml",
  "README.md",
  "docs/architecture.md",
  "packages/types/package.json",
  "packages/types/tsconfig.json",
  "packages/types/src/index.ts",
  "packages/utils/package.json",
  "packages/utils/tsconfig.json",
  "packages/utils/src/index.ts",
  "packages/config/package.json",
  "packages/config/tsconfig.json",
  "packages/config/src/index.ts",
  "backend/package.json",
  "apps/admin/package.json",
  "apps/mobile/package.json",
];

let failed = 0;
for (const rel of requiredFiles) {
  const full = join(root, rel);
  if (!existsSync(full)) {
    console.error(`MISSING: ${rel}`);
    failed += 1;
  } else {
    console.log(`OK: ${rel}`);
  }
}

// Validar package.json raíz: workspaces + scripts
try {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const ws = pkg.workspaces ?? [];
  const expected = ["backend", "apps/*", "packages/*"];
  const missing = expected.filter((e) => !ws.includes(e));
  if (missing.length > 0) {
    console.error(`FAIL workspaces, faltan: ${missing.join(", ")}`);
    failed += 1;
  } else {
    console.log("OK: workspaces");
  }
} catch (err) {
  console.error(`FAIL package.json inválido: ${String(err)}`);
  failed += 1;
}

// Validar tsconfig.base.json: strict true
try {
  const ts = JSON.parse(
    readFileSync(join(root, "tsconfig.base.json"), "utf8"),
  );
  if (ts.compilerOptions?.strict !== true) {
    console.error("FAIL tsconfig.base.json: strict debe ser true");
    failed += 1;
  } else {
    console.log("OK: tsconfig strict");
  }
} catch (err) {
  console.error(`FAIL tsconfig.base.json inválido: ${String(err)}`);
  failed += 1;
}

if (failed > 0) {
  console.error(`\nFASE 1: FAIL (${failed} errores)`);
  process.exit(1);
} else {
  console.log("\nFASE 1: PASS — estructura del monorepo correcta");
}
