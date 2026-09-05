/**
 * Verificación de FASE 2: backend NestJS + Prisma + migración inicial.
 * Uso: `npm run verify:phase2`. No requiere dependencias externas ni DB.
 */
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const requiredFiles = [
  "backend/package.json",
  "backend/nest-cli.json",
  "backend/tsconfig.json",
  "backend/tsconfig.build.json",
  "backend/eslint.config.mjs",
  "backend/prisma/schema.prisma",
  "backend/prisma/migrations/migration_lock.toml",
  "backend/prisma/migrations/0001_init/migration.sql",
  "backend/src/main.ts",
  "backend/src/app.module.ts",
  "backend/src/config/configuration.ts",
  "backend/src/config/env.validation.ts",
  "backend/src/common/prisma/prisma.service.ts",
  "backend/src/common/prisma/prisma.module.ts",
  "backend/src/common/filters/http-exception.filter.ts",
  "backend/src/common/interceptors/response.interceptor.ts",
  "backend/src/health/health.controller.ts",
  "backend/src/health/health.service.ts",
  "backend/src/health/health.module.ts",
  "docs/backend.md",
  "docs/database.md",
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

// La migración inicial debe crear las 14 entidades (+ tabla M2M + enums)
try {
  const sql = readFileSync(
    join(root, "backend/prisma/migrations/0001_init/migration.sql"),
    "utf8",
  );
  const tables = (sql.match(/CREATE TABLE/g) ?? []).length;
  const expectedTables = [
    "admin_users",
    "customers",
    "activation_codes",
    "devices",
    "sessions",
    "plans",
    "channels",
    "countries",
    "categories",
    "favorites",
    "watch_history",
    "epg_programs",
    "system_settings",
    "audit_logs",
  ];
  const missing = expectedTables.filter((t) => !sql.includes(`"${t}"`));
  console.log(`OK: migration.sql con ${tables} CREATE TABLE`);
  if (missing.length > 0) {
    console.error(`FAIL migración sin tablas: ${missing.join(", ")}`);
    failed += 1;
  }
} catch (err) {
  console.error(`FAIL leyendo migration.sql: ${String(err)}`);
  failed += 1;
}

if (failed > 0) {
  console.error(`\nFASE 2: FAIL (${failed} errores)`);
  process.exit(1);
} else {
  console.log("\nFASE 2: PASS — backend base + schema + migración correctos");
}
