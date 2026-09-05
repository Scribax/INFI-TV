/**
 * Seed de DESARROLLO. Crea el primer SUPER_ADMIN y los planes base.
 * - Solo dev/test: se niega a correr en producción.
 * - Idempotente: se puede correr varias veces.
 * Uso: npm run prisma:seed --workspace=infitv-backend
 */
import { PrismaClient, AdminRole } from "@prisma/client";
import * as argon2 from "argon2";

function info(message: string): void {
  process.stdout.write(`${message}\n`);
}

const prisma = new PrismaClient();

async function main(): Promise<void> {
  if (process.env["NODE_ENV"] === "production") {
    throw new Error("El seed de desarrollo no puede correr en producción.");
  }
  const email = (process.env["SEED_ADMIN_EMAIL"] ?? "admin@infitv.local")
    .trim()
    .toLowerCase();
  const password = process.env["SEED_ADMIN_PASSWORD"] ?? "InfiTV-dev-admin-01";
  if (password.length < 12) {
    throw new Error("SEED_ADMIN_PASSWORD debe tener al menos 12 caracteres.");
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing === null) {
    await prisma.adminUser.create({
      data: {
        email,
        passwordHash: await argon2.hash(password),
        role: AdminRole.SUPER_ADMIN,
      },
    });
    await prisma.auditLog.create({
      data: {
        actorType: "SYSTEM",
        action: "system.seed_admin",
        entity: "AdminUser",
        metadata: { email },
      },
    });
    info(`Seed: SUPER_ADMIN ${email} creado.`);
  } else {
    info(`Seed: ya existe ${email}, sin cambios.`);
  }

  const plans = [
    { name: "PRUEBA", durationDays: 2, description: "Período de prueba" },
    { name: "7 DÍAS", durationDays: 7, description: "Plan semanal" },
    { name: "15 DÍAS", durationDays: 15, description: "Plan quincenal" },
    { name: "30 DÍAS", durationDays: 30, description: "Plan mensual" },
    { name: "90 DÍAS", durationDays: 90, description: "Plan trimestral" },
    { name: "365 DÍAS", durationDays: 365, description: "Plan anual" },
  ];
  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: {},
      create: { ...plan, deviceLimit: 1 },
    });
  }
  info(`Seed: ${plans.length.toString()} planes base verificados.`);
}

main()
  .catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Seed falló: ${msg}`);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
