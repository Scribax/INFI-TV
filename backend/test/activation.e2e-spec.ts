/**
 * E2E: activación, sesiones, límites y estados (Casos 2–5 de la spec).
 */
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/common/prisma/prisma.service";
import {
  ApiSuccess,
  E2EContext,
  setupE2EApp,
} from "./e2e-helpers";

const SUPER_EMAIL = "e2e6-root@infitv.local";
const SUPER_PASS = "e2e6-super-secreta-01";

const D1 = "11111111-1111-4111-8111-111111111111";
const D2 = "22222222-2222-4222-8222-222222222222";
const D3 = "33333333-3333-4333-8333-333333333333";

interface ActivateData {
  token: string;
  expiresAt: string;
  customer: { id: string; plan: string; expiresAt: string | null };
}

interface SessionData {
  customerId: string;
  customer: { plan: string; status: string };
}

async function makeCode(
  api: request.Agent,
  rootToken: string,
  body: Record<string, unknown>,
): Promise<{ id: string; code: string }> {
  const res = await api
    .post("/api/v1/admin/codes")
    .set("Authorization", `Bearer ${rootToken}`)
    .send(body)
    .expect(201);
  return (res.body as ApiSuccess<{ items: Array<{ id: string; code: string }> }>)
    .data.items[0];
}

function activateBody(code: string, instanceId: string): Record<string, string> {
  return {
    code,
    appInstanceId: instanceId,
    platform: "android",
    appVersion: "1.0.0",
  };
}

describe("Activation (e2e)", () => {
  let app: INestApplication | undefined;
  let api: request.Agent;
  let prisma: PrismaService;
  let rootToken: string;
  let planL1 = "";
  let planL2 = "";
  let codeL1 = "";
  let codeL1Plain = "";
  let customerL1 = "";
  let tokenD1 = "";
  let tokenL2D1 = "";
  let customerL2 = "";

  beforeAll(async () => {
    const ctx: E2EContext = await setupE2EApp();
    app = ctx.app;
    api = ctx.api;
    prisma = ctx.prisma;
    await prisma.session.deleteMany({});
    await prisma.device.deleteMany({});
    await prisma.activationCode.deleteMany({
      where: { plan: { name: { startsWith: "E2E6-" } } },
    });
    await prisma.customer.deleteMany({
      where: { plan: { name: { startsWith: "E2E6-" } } },
    });
    await prisma.plan.deleteMany({ where: { name: { startsWith: "E2E6-" } } });
    await prisma.adminUser.deleteMany({
      where: { email: { startsWith: "e2e6-" } },
    });
    await prisma.adminUser.create({
      data: {
        email: SUPER_EMAIL,
        passwordHash: await ctx.passwords.hash(SUPER_PASS),
        role: "SUPER_ADMIN",
      },
    });
    const login = await api
      .post("/api/v1/admin/auth/login")
      .send({ email: SUPER_EMAIL, password: SUPER_PASS })
      .expect(200);
    rootToken = (login.body as ApiSuccess<{ accessToken: string }>).data
      .accessToken;

    const auth = (r: request.Test): request.Test =>
      r.set("Authorization", `Bearer ${rootToken}`);
    const p1 = await auth(
      api.post("/api/v1/admin/plans").send({ name: "E2E6-L1", durationDays: 30, deviceLimit: 1 }),
    ).expect(201);
    planL1 = (p1.body as ApiSuccess<{ id: string }>).data.id;
    const p2 = await auth(
      api.post("/api/v1/admin/plans").send({ name: "E2E6-L2", durationDays: 30, deviceLimit: 2 }),
    ).expect(201);
    planL2 = (p2.body as ApiSuccess<{ id: string }>).data.id;
  });

  afterAll(async () => {
    await app?.close();
  });

  it("Caso 1: código nuevo activa y devuelve token + cliente", async () => {
    const created = await makeCode(api, rootToken, { planId: planL1 });
    codeL1 = created.id;
    codeL1Plain = created.code;

    const res = await api
      .post("/api/v1/auth/activate")
      .send(activateBody(codeL1Plain, D1))
      .expect(200);
    const data = (res.body as ApiSuccess<ActivateData>).data;
    expect(data.token).toMatch(/^[0-9a-f]{64}$/);
    expect(data.customer.plan).toBe("E2E6-L1");
    expect(data.customer.expiresAt).not.toBeNull();
    customerL1 = data.customer.id;
    tokenD1 = data.token;
  });

  it("mismo dispositivo reactiva con el mismo cliente", async () => {
    const res = await api
      .post("/api/v1/auth/activate")
      .send(activateBody(codeL1Plain, D1))
      .expect(200);
    const data = (res.body as ApiSuccess<ActivateData>).data;
    expect(data.customer.id).toBe(customerL1);
    expect(data.token).not.toBe(tokenD1);
  });

  it("Caso 4: segundo dispositivo con límite 1 → 403 exacto", async () => {
    const res = await api
      .post("/api/v1/auth/activate")
      .send(activateBody(codeL1Plain, D2))
      .expect(403);
    const body = res.body as {
      success: boolean;
      error: { code: string; message: string };
    };
    expect(body.error.code).toBe("DEVICE_LIMIT_REACHED");
    expect(body.error.message).toBe(
      "Este código ya alcanzó el límite de dispositivos.",
    );
  });

  it("límite 2 permite dos dispositivos y frena al tercero", async () => {
    const created = await makeCode(api, rootToken, { planId: planL2 });
    const r1 = await api
      .post("/api/v1/auth/activate")
      .send(activateBody(created.code, D1))
      .expect(200);
    tokenL2D1 = (r1.body as ApiSuccess<ActivateData>).data.token;
    customerL2 = (r1.body as ApiSuccess<ActivateData>).data.customer.id;
    await api
      .post("/api/v1/auth/activate")
      .send(activateBody(created.code, D2))
      .expect(200);
    await api
      .post("/api/v1/auth/activate")
      .send(activateBody(created.code, D3))
      .expect(403);
  });

  it("subir el límite habilita al segundo dispositivo", async () => {
    await api
      .patch(`/api/v1/admin/codes/${codeL1}`)
      .set("Authorization", `Bearer ${rootToken}`)
      .send({ deviceLimit: 2 })
      .expect(200);
    await api
      .post("/api/v1/auth/activate")
      .send(activateBody(codeL1Plain, D2))
      .expect(200);
  });

  it("sesión válida expone cliente y plan", async () => {
    const res = await api
      .get("/api/v1/auth/session")
      .set("Authorization", `Bearer ${tokenD1}`)
      .expect(200);
    const data = (res.body as ApiSuccess<SessionData>).data;
    expect(data.customerId).toBe(customerL1);
    expect(data.customer.plan).toBe("E2E6-L1");

    await api.get("/api/v1/auth/session").expect(401);
    await api
      .get("/api/v1/auth/session")
      .set("Authorization", "Bearer inexistente")
      .expect(401);
  });

  it("logout revoca; la sesión muere", async () => {
    await api
      .post("/api/v1/auth/logout")
      .send({ token: tokenD1 })
      .expect(200);
    const res = await api
      .get("/api/v1/auth/session")
      .set("Authorization", `Bearer ${tokenD1}`)
      .expect(401);
    expect(
      (res.body as { error: { code: string } }).error.code,
    ).toBe("SESSION_EXPIRED");
  });

  it("desconocido/suspendido/vencido/revocado → idéntico genérico", async () => {
    const suspended = await makeCode(api, rootToken, { planId: planL1 });
    await api
      .post(`/api/v1/admin/codes/${suspended.id}/suspend`)
      .set("Authorization", `Bearer ${rootToken}`)
      .send({})
      .expect(201);

    const expired = await makeCode(api, rootToken, {
      planId: planL1,
      expiresAt: new Date(Date.now() - 86_400_000).toISOString(),
    });

    const revoked = await makeCode(api, rootToken, { planId: planL1 });
    await api
      .post(`/api/v1/admin/codes/${revoked.id}/revoke`)
      .set("Authorization", `Bearer ${rootToken}`)
      .expect(201);

    const attempts = [
      "INFITV-ZZZZ-ZZZZ",
      suspended.code,
      expired.code,
      revoked.code,
    ];
    const errors: unknown[] = [];
    for (const code of attempts) {
      const res = await api
        .post("/api/v1/auth/activate")
        .send(activateBody(code, D3))
        .expect(401);
      errors.push((res.body as { error: unknown }).error);
    }
    for (const error of errors.slice(1)) {
      expect(error).toEqual(errors[0]);
    }
    expect(errors[0]).toEqual({
      code: "INVALID_ACTIVATION_CODE",
      message: "Código inválido o no disponible.",
    });
  });

  it("Caso 3 y 2: suspendido y vencido con mensajes específicos en sesión", async () => {
    await api
      .post(`/api/v1/admin/customers/${customerL2}/suspend`)
      .set("Authorization", `Bearer ${rootToken}`)
      .send({})
      .expect(201);
    const susp = await api
      .get("/api/v1/auth/session")
      .set("Authorization", `Bearer ${tokenL2D1}`)
      .expect(403);
    expect((susp.body as { error: { code: string; message: string } }).error).toEqual({
      code: "CODE_SUSPENDED",
      message: "Tu acceso fue suspendido. Contactá al administrador.",
    });

    await api
      .post(`/api/v1/admin/customers/${customerL2}/reactivate`)
      .set("Authorization", `Bearer ${rootToken}`)
      .expect(201);
    await prisma.customer.update({
      where: { id: customerL2 },
      data: { status: "EXPIRED", expiresAt: new Date(Date.now() - 1000) },
    });
    const exp = await api
      .get("/api/v1/auth/session")
      .set("Authorization", `Bearer ${tokenL2D1}`)
      .expect(401);
    expect((exp.body as { error: { code: string; message: string } }).error).toEqual({
      code: "CODE_EXPIRED",
      message: "Tu acceso ha vencido. Contactá al administrador para renovarlo.",
    });

    await api
      .post(`/api/v1/admin/customers/${customerL2}/renew`)
      .set("Authorization", `Bearer ${rootToken}`)
      .send({})
      .expect(201);
    await api
      .get("/api/v1/auth/session")
      .set("Authorization", `Bearer ${tokenL2D1}`)
      .expect(200);
  });

  it("Caso 5: revocar corta sesión; desvincular libera y reactiva", async () => {
    const fresh = await api
      .post("/api/v1/auth/activate")
      .send(activateBody(codeL1Plain, D1))
      .expect(200);
    const freshToken = (fresh.body as ApiSuccess<ActivateData>).data.token;

    const devices = await api
      .get(`/api/v1/admin/devices?customerId=${customerL1}`)
      .set("Authorization", `Bearer ${rootToken}`)
      .expect(200);
    const items = (
      devices.body as ApiSuccess<
        { items: Array<{ id: string; appInstanceId: string }> }
      >
    ).data.items;
    const d1 = items.find((d) => d.appInstanceId === D1);
    expect(d1).toBeDefined();
    if (d1 === undefined) {
      throw new Error("dispositivo D1 no encontrado");
    }

    await api
      .post(`/api/v1/admin/devices/${d1.id}/revoke`)
      .set("Authorization", `Bearer ${rootToken}`)
      .expect(201);
    const blocked = await api
      .get("/api/v1/auth/session")
      .set("Authorization", `Bearer ${freshToken}`)
      .expect(403);
    expect(
      (blocked.body as { error: { code: string } }).error.code,
    ).toBe("DEVICE_REVOKED");

    // Revocado ≠ desvinculado: reactivar sigue denegado (genérico).
    await api
      .post("/api/v1/auth/activate")
      .send(activateBody(codeL1Plain, D1))
      .expect(401);

    await api
      .delete(`/api/v1/admin/devices/${d1.id}`)
      .set("Authorization", `Bearer ${rootToken}`)
      .expect(200);
    const retry = await api
      .post("/api/v1/auth/activate")
      .send(activateBody(codeL1Plain, D1))
      .expect(200);
    expect(
      (retry.body as ApiSuccess<ActivateData>).data.customer.id,
    ).toBe(customerL1);
  });

  it("admin ve sesiones y puede revocarlas", async () => {
    const list = await api
      .get(`/api/v1/admin/sessions?customerId=${customerL1}`)
      .set("Authorization", `Bearer ${rootToken}`)
      .expect(200);
    const items = (
      list.body as ApiSuccess<{ items: Array<{ id: string; status: string }> }>
    ).data.items;
    const active = items.find((s) => s.status === "ACTIVE");
    expect(active).toBeDefined();
    if (active !== undefined) {
      await api
        .post(`/api/v1/admin/sessions/${active.id}/revoke`)
        .set("Authorization", `Bearer ${rootToken}`)
        .expect(201);
    }
  });
});
