/**
 * Verificación de FASE 23: deployment — cierre integral.
 * Uso: `npm run verify:phase23`. No requiere DB.
 */
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const required = [
  "README.md",
  ".env.example",
  ".gitignore",
  ".dockerignore",
  "docker-compose.yml",
  "deploy/nginx.conf",
  "backend/Dockerfile",
  "apps/admin/Dockerfile",
  ".github/workflows/ci.yml",
  "apps/mobile/eas.json",
  "docs/api.md",
  "docs/admin.md",
  "docs/iptv-sync.md",
  "docs/mobile.md",
  "docs/telemetry.md",
  "docs/security.md",
  "docs/deployment.md",
  "docs/troubleshooting.md",
];

let failed = 0;
for (const rel of required) {
  if (!existsSync(join(root, rel))) {
    console.error(`MISSING: ${rel}`);
    failed += 1;
  } else {
    console.log(`OK: ${rel}`);
  }
}

if (failed > 0) {
  console.error(`\nFASE 23: FAIL (${failed} artefactos faltantes)`);
  process.exit(1);
} else {
  console.log("\nFASE 23: PASS — deployment (stack completo listo para VPS)");
}
