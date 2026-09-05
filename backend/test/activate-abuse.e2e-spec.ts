/**
 * E2E: protección anti-abuso de /auth/activate (§37).
 * ABUSE_MAX_FAILURES=10 (default): tras 10 fallos de código inválido por IP
 * y por dispositivo, el siguiente intento recibe 429 RATE_LIMITED.
 * App propia → contadores limpios y resultado determinista.
 */
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { E2EContext, setupE2EApp } from "./e2e-helpers";

describe("Activate abuse protection (e2e)", () => {
  let app: INestApplication | undefined;
  let api: request.Agent;

  beforeAll(async () => {
    const ctx: E2EContext = await setupE2EApp();
    app = ctx.app;
    api = ctx.api;
  });

  afterAll(async () => {
    await app?.close();
  });

  it("bloquea tras 10 fallos de código inválido → 429", async () => {
    for (let i = 1; i <= 10; i += 1) {
      await api
        .post("/api/v1/auth/activate")
        .send({
          code: "INFITV-ZZZZ-ZZZZ",
          appInstanceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          platform: "android",
          appVersion: "1.0.0",
        })
        .expect(401);
    }
    const blocked = await api
      .post("/api/v1/auth/activate")
      .send({
        code: "INFITV-ZZZZ-ZZZZ",
        appInstanceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        platform: "android",
        appVersion: "1.0.0",
      })
      .expect(429);
    expect(
      (blocked.body as { error: { code: string } }).error.code,
    ).toBe("RATE_LIMITED");
  });
});
