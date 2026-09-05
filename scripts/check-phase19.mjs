/**
 * Verificación de FASE 19: Docker + Nginx.
 * Uso: `npm run verify:phase19`. No requiere Docker corriendo.
 */
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const requiredFiles = [
  "docker-compose.yml",
  ".dockerignore",
  "backend/Dockerfile",
  "apps/admin/Dockerfile",
  "deploy/nginx.conf",
  "docs/deployment.md",
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
  console.error(`\nFASE 19: FAIL (${failed} errores)`);
  process.exit(1);
} else {
  console.log("\nFASE 19: PASS — Docker + Nginx (compose + Dockerfiles + proxy)");
}
