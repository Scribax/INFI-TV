/**
 * Verificación de FASE 5: sistema de códigos de activación.
 * Uso: `npm run verify:phase5`. No requiere DB.
 */
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const requiredFiles = [
  "backend/src/codes/code-generator.ts",
  "backend/src/codes/code-generator.spec.ts",
  "backend/src/codes/activation-codes.service.ts",
  "backend/src/codes/activation-codes.service.spec.ts",
  "backend/src/codes/activation-codes.controller.ts",
  "backend/src/codes/codes.module.ts",
  "backend/src/codes/dto/codes.dto.ts",
  "backend/src/codes/dto/codes-query.dto.ts",
  "backend/test/codes.e2e-spec.ts",
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

try {
  const schema = readFileSync(
    join(root, "backend/prisma/schema.prisma"),
    "utf8",
  );
  if (!schema.includes("activationCodeId")) {
    console.error("FAIL schema.prisma sin activationCodeId");
    failed += 1;
  } else {
    console.log("OK: Device.activationCodeId");
  }
  const validation = readFileSync(
    join(root, "backend/src/config/env.validation.ts"),
    "utf8",
  );
  if (!validation.includes("CODE_PEPPER")) {
    console.error("FAIL env.validation sin CODE_PEPPER");
    failed += 1;
  } else {
    console.log("OK: CODE_PEPPER requerido");
  }
} catch (err) {
  console.error(`FAIL leyendo archivos: ${String(err)}`);
  failed += 1;
}

if (failed > 0) {
  console.error(`\nFASE 5: FAIL (${failed} errores)`);
  process.exit(1);
} else {
  console.log("\nFASE 5: PASS — códigos presentes y cableados");
}
