/**
 * E2E: gestión administrativa de códigos de activación.
 * El endpoint público /auth/activate llega en FASE 6.
 */
import type { HttpException, INestApplication } from "@nestjs/common";
import request from "supertest";
import { ActivationCodesService } from "../src/codes/activation-codes.service";
import { PrismaService } from "../src/common/prisma/prisma.service";
import {
  ApiSuccess,
  E2EContext,
  setupE2EApp,
} from "./e2e-helpers";

const SUPER_EMAIL = "e2e5-root@infitv.local";
const SUPER_PASS = "e2e5-super-secreta-01";
const OP_EMAIL = "e2e5-op@infitv.local";
const OP_PASS = "e2e5-operador-secreto-02";

interface CreatedItem {
  id: string;
  code: string;
  prefix: string;
  status: string;
}

interface CreatedResponse {
  count: number;
  items: CreatedItem[];
}

interface CodeDetail {
  id: string;
  prefix: string;
  status: string;
  devicesUsed: number;
  devicesTotal: number;
}

describe("Activation codes (e2e)", () => {
  let app: INestApplication | undefined;
  let api: request.Agent;
  let prisma: PrismaService;
  let codes: ActivationCodesService;
  let rootToken: string;
  let opToken: string;
  let planId: string;
  let firstCode: CreatedItem;

  beforeAll(async () => {
    const ctx: E2EContext = await setupE2EApp();
    app = ctx.app;
    api = ctx.api;
    prisma = ctx.prisma;
    codes = ctx.app.get(ActivationCodesService);
    await prisma.activationCode.deleteMany({
      where: { plan: { name: { startsWith: "E2E5-" } } },
    });
    await prisma.customer.deleteMany({
      where: { displayName: { startsWith: "E2E5 " } },
    });
    await prisma.plan.deleteMany({ where: { name: { startsWith: "E2E5-" } } });
    await prisma.adminUser.deleteMany({
      where: { email: { startsWith: "e2e5-" } },
    });
    const hash = (p: string): Promise<string> => ctx.passwords.hash(p);
    await prisma.adminUser.create({
      data: {
        email: SUPER_EMAIL,
        passwordHash: await hash(SUPER_PASS),
        role: "SUPER_ADMIN",
      },
    });
    await prisma.adminUser.create({
      data: {
        email: OP_EMAIL,
        passwordHash: await hash(OP_PASS),
        role: "OPERATOR",
      },
    });
    const login = async (email: string, password: string): Promise<string> => {
      const res = await api
        .post("/api/v1/admin/auth/login")
        .send({ email, password })
        .expect(200);
      return (res.body as ApiSuccess<{ accessToken: string }>).data.accessToken;
    };
    rootToken = await login(SUPER_EMAIL, SUPER_PASS);
    opToken = await login(OP_EMAIL, OP_PASS);

    const plan = await api
      .post("/api/v1/admin/plans")
      .set("Authorization", `Bearer ${rootToken}`)
      .send({ name: "E2E5-30", durationDays: 30 })
      .expect(201);
    planId = (plan.body as ApiSuccess<{ id: string }>).data.id;
  });

  afterAll(async () => {
    await app?.close();
  });

  it("OPERATOR no genera; el texto plano sale solo al crear", async () => {
    await api
      .post("/api/v1/admin/codes")
      .set("Authorization", `Bearer ${opToken}`)
      .send({ planId })
      .expect(403);

    const res = await api
      .post("/api/v1/admin/codes")
      .set("Authorization", `Bearer ${rootToken}`)
      .send({ planId })
      .expect(201);
    const body = (res.body as ApiSuccess<CreatedResponse>).data;
    expect(body.count).toBe(1);
    expect(body.items[0].code).toMatch(/^INFITV-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    firstCode = body.items[0];
  });

  it("generación masiva: 5 códigos únicos", async () => {
    const res = await api
      .post("/api/v1/admin/codes")
      .set("Authorization", `Bearer ${rootToken}`)
      .send({ planId, quantity: 5 })
      .expect(201);
    const body = (res.body as ApiSuccess<CreatedResponse>).data;
    expect(body.count).toBe(5);
    expect(new Set(body.items.map((i) => i.code)).size).toBe(5);
  });

  it("en DB solo hay hash; el detalle no expone ni plano ni hash", async () => {
    const stored = await prisma.activationCode.findUnique({
      where: { id: firstCode.id },
    });
    expect(stored?.codeHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(stored)).not.toContain(firstCode.code);

    const detail = await api
      .get(`/api/v1/admin/codes/${firstCode.id}`)
      .set("Authorization", `Bearer ${rootToken}`)
      .expect(200);
    const data = (detail.body as ApiSuccess<CodeDetail>).data;
    expect(data.devicesUsed).toBe(0);
    expect(data.devicesTotal).toBe(0);
    const raw = JSON.stringify(detail.body);
    expect(raw).not.toContain(firstCode.code);
    expect(raw).not.toContain("codeHash");
  });

  it("resolveForActivation encuentra el código creado", async () => {
    await expect(codes.resolveForActivation(firstCode.code)).resolves
      .toMatchObject({ id: firstCode.id });
    let caught: unknown = null;
    try {
      await codes.resolveForActivation("INFITV-ZZZZ-ZZZZ");
    } catch (err: unknown) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(Error);
    const http = caught as HttpException;
    expect(http.getStatus()).toBe(401);
    expect(http.getResponse()).toEqual({
      error: {
        code: "INVALID_ACTIVATION_CODE",
        message: "Código inválido o no disponible.",
      },
    });
  });

  it("suspender/reactivar con idempotencia", async () => {
    const suspended = await api
      .post(`/api/v1/admin/codes/${firstCode.id}/suspend`)
      .set("Authorization", `Bearer ${rootToken}`)
      .send({ reason: "Prueba e2e" })
      .expect(201);
    expect((suspended.body as ApiSuccess<{ status: string }>).data.status).toBe(
      "SUSPENDED",
    );
    await api
      .post(`/api/v1/admin/codes/${firstCode.id}/suspend`)
      .set("Authorization", `Bearer ${rootToken}`)
      .send({})
      .expect(201);

    const reactivated = await api
      .post(`/api/v1/admin/codes/${firstCode.id}/reactivate`)
      .set("Authorization", `Bearer ${rootToken}`)
      .expect(201);
    expect((reactivated.body as ApiSuccess<{ status: string }>).data.status).toBe(
      "PENDING",
    );
  });

  it("revocar suspende al cliente vinculado", async () => {
    const customer = await api
      .post("/api/v1/admin/customers")
      .set("Authorization", `Bearer ${rootToken}`)
      .send({ displayName: "E2E5 Revocado" })
      .expect(201);
    const customerId = (customer.body as ApiSuccess<{ id: string }>).data.id;

    const created = await api
      .post("/api/v1/admin/codes")
      .set("Authorization", `Bearer ${rootToken}`)
      .send({ planId, customerId })
      .expect(201);
    const codeId = (created.body as ApiSuccess<CreatedResponse>).data.items[0].id;

    // El cliente se activa para probar que la revocación lo suspende.
    await prisma.customer.update({
      where: { id: customerId },
      data: { status: "ACTIVE", planId },
    });

    const revoked = await api
      .post(`/api/v1/admin/codes/${codeId}/revoke`)
      .set("Authorization", `Bearer ${rootToken}`)
      .expect(201);
    expect((revoked.body as ApiSuccess<{ status: string }>).data.status).toBe(
      "REVOKED",
    );

    const check = await api
      .get(`/api/v1/admin/customers/${customerId}`)
      .set("Authorization", `Bearer ${rootToken}`)
      .expect(200);
    expect((check.body as ApiSuccess<{ status: string }>).data.status).toBe(
      "SUSPENDED",
    );
  });

  it("límites y validaciones", async () => {
    await api
      .post("/api/v1/admin/codes")
      .set("Authorization", `Bearer ${rootToken}`)
      .send({ planId, quantity: 501 })
      .expect(400);

    await api
      .post("/api/v1/admin/codes")
      .set("Authorization", `Bearer ${rootToken}`)
      .send({ planId: "plan-inexistente" })
      .expect(404);

    const list = await api
      .get(`/api/v1/admin/codes?planId=${planId}`)
      .set("Authorization", `Bearer ${opToken}`)
      .expect(200);
    const listed = list.body as ApiSuccess<{ total: number }>;
    expect(listed.success).toBe(true);
    expect(listed.data.total).toBeGreaterThanOrEqual(7);
  });
});
