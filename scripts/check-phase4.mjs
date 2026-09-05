/**
 * Verificación de FASE 4: planes + clientes.
 * Uso: `npm run verify:phase4`. No requiere DB.
 */
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const requiredFiles = [
  "backend/src/plans/plans.service.ts",
  "backend/src/plans/plans.service.spec.ts",
  "backend/src/plans/plans.controller.ts",
  "backend/src/plans/plans.module.ts",
  "backend/src/plans/dto/plans.dto.ts",
  "backend/src/plans/dto/plans-query.dto.ts",
  "backend/src/customers/customers.service.ts",
  "backend/src/customers/customers.service.spec.ts",
  "backend/src/customers/customer-expiration.service.ts",
  "backend/src/customers/customer-expiration.service.spec.ts",
  "backend/src/customers/customers.controller.ts",
  "backend/src/customers/customers.module.ts",
  "backend/src/customers/dto/customers.dto.ts",
  "backend/src/customers/dto/customers-query.dto.ts",
  "backend/test/customers-plans.e2e-spec.ts",
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
  console.error(`\nFASE 4: FAIL (${failed} errores)`);
  process.exit(1);
} else {
  console.log("\nFASE 4: PASS — planes + clientes presentes");
}
