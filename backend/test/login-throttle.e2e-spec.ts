/**
 * E2E: rate limiting del login (20 req/min por IP).
 * App propia → contadores limpios y resultado determinista.
 */
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/common/prisma/prisma.service";
import { PasswordService } from "../src/auth/password.service";
import { ApiFailure, E2EContext, setupE2EApp } from "./e2e-helpers";

const EMAIL = "e2e-throttle@infitv.local";

describe("Login throttle (e2e)", () => {
  let app: INestApplication | undefined;
  let api: request.Agent;

  beforeAll(async () => {
    const ctx: E2EContext = await setupE2EApp();
    app = ctx.app;
    api = ctx.api;
    const prisma: PrismaService = ctx.prisma;
    const passwords: PasswordService = ctx.passwords;
    await prisma.adminUser.deleteMany({ where: { email: EMAIL } });
    await prisma.adminUser.create({
      data: {
        email: EMAIL,
        passwordHash: await passwords.hash("e2e-throttle-ok-01"),
        role: "OPERATOR",
      },
    });
  });

  afterAll(async () => {
    await app?.close();
  });

  it("el intento 21 dentro del minuto → 429 RATE_LIMITED", async () => {
    for (let i = 1; i <= 20; i += 1) {
      await api
        .post("/api/v1/admin/auth/login")
        .send({ email: EMAIL, password: "incorrecta-01" })
        .expect(401);
    }
    const blocked = await api
      .post("/api/v1/admin/auth/login")
      .send({ email: EMAIL, password: "incorrecta-01" })
      .expect(429);
    expect((blocked.body as ApiFailure).error.code).toBe("RATE_LIMITED");
  });
});
