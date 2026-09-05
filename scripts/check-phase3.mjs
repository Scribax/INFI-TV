/**
 * Verificación de FASE 3: admin auth + RBAC + auditoría.
 * Uso: `npm run verify:phase3`. No requiere DB.
 */
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const requiredFiles = [
  "backend/src/auth/auth.service.ts",
  "backend/src/auth/auth.controller.ts",
  "backend/src/auth/auth.module.ts",
  "backend/src/auth/password.service.ts",
  "backend/src/auth/token.service.ts",
  "backend/src/auth/jwt-auth.guard.ts",
  "backend/src/auth/roles.decorator.ts",
  "backend/src/auth/roles.guard.ts",
  "backend/src/auth/current-admin.decorator.ts",
  "backend/src/auth/dto/login.dto.ts",
  "backend/src/auth/dto/refresh.dto.ts",
  "backend/src/admin-users/admin-users.service.ts",
  "backend/src/admin-users/admin-users.controller.ts",
  "backend/src/admin-users/admin-users.module.ts",
  "backend/src/audit/audit.service.ts",
  "backend/src/audit/audit.controller.ts",
  "backend/src/audit/audit.module.ts",
  "backend/prisma/seed.ts",
  "backend/test/e2e-helpers.ts",
  "backend/test/admin-auth.e2e-spec.ts",
  "backend/test/login-throttle.e2e-spec.ts",
  "docs/api.md",
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

// La migración 0002 debe existir y crear admin_sessions
try {
  const schema = readFileSync(
    join(root, "backend/prisma/schema.prisma"),
    "utf8",
  );
  for (const needle of ["model AdminSession", "model AdminUser"]) {
    if (!schema.includes(needle)) {
      console.error(`FAIL schema.prisma sin: ${needle}`);
      failed += 1;
    }
  }
  console.log("OK: schema con AdminSession");
} catch (err) {
  console.error(`FAIL leyendo schema.prisma: ${String(err)}`);
  failed += 1;
}

if (failed > 0) {
  console.error(`\nFASE 3: FAIL (${failed} errores)`);
  process.exit(1);
} else {
  console.log("\nFASE 3: PASS — auth + RBAC + auditoría presentes");
}
