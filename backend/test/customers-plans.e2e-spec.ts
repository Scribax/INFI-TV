/**
 * E2E: ciclo de vida de planes y clientes contra DB de test.
 */
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/common/prisma/prisma.service";
import {
  ApiFailure,
  ApiSuccess,
  E2EContext,
  setupE2EApp,
} from "./e2e-helpers";

const SUPER_EMAIL = "e2e4-root@infitv.local";
const SUPER_PASS = "e2e4-super-secreta-01";
const OP_EMAIL = "e2e4-op@infitv.local";
const OP_PASS = "e2e4-operador-secreto-02";

interface TokenData {
  accessToken: string;
  admin: { id: string; email: string; role: string };
}

interface PlanData {
  id: string;
  name: string;
  durationDays: number;
}

interface CustomerData {
  id: string;
  displayName: string;
  status: string;
  planId: string | null;
  expiresAt: string | null;
}

async function login(
  api: request.Agent,
  email: string,
  password: string,
): Promise<string> {
  const res = await api
    .post("/api/v1/admin/auth/login")
    .send({ email, password })
    .expect(200);
  return (res.body as ApiSuccess<TokenData>).data.accessToken;
}

describe("Plans + Customers (e2e)", () => {
  let app: INestApplication | undefined;
  let api: request.Agent;
  let prisma: PrismaService;
  let rootToken: string;
  let opToken: string;
  let plan30: PlanData;
  let plan7: PlanData;
  let customerId: string;

  beforeAll(async () => {
    const ctx: E2EContext = await setupE2EApp();
    app = ctx.app;
    api = ctx.api;
    prisma = ctx.prisma;
    await prisma.customer.deleteMany({
      where: { displayName: { startsWith: "E2E4 " } },
    });
    await prisma.plan.deleteMany({ where: { name: { startsWith: "E2E4-" } } });
    await prisma.adminUser.deleteMany({
      where: { email: { startsWith: "e2e4-" } },
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
    rootToken = await login(api, SUPER_EMAIL, SUPER_PASS);
    opToken = await login(api, OP_EMAIL, OP_PASS);
  });

  afterAll(async () => {
    await app?.close();
  });

  it("OPERATOR no crea planes; SUPER_ADMIN sí; duplicado → 409", async () => {
    await api
      .post("/api/v1/admin/plans")
      .set("Authorization", `Bearer ${opToken}`)
      .send({ name: "E2E4-X", durationDays: 10 })
      .expect(403);

    const created = await api
      .post("/api/v1/admin/plans")
      .set("Authorization", `Bearer ${rootToken}`)
      .send({ name: "E2E4-30", durationDays: 30, deviceLimit: 2 })
      .expect(201);
    plan30 = (created.body as ApiSuccess<PlanData>).data;
    expect(plan30.durationDays).toBe(30);

    const other = await api
      .post("/api/v1/admin/plans")
      .set("Authorization", `Bearer ${rootToken}`)
      .send({ name: "E2E4-7", durationDays: 7 })
      .expect(201);
    plan7 = (other.body as ApiSuccess<PlanData>).data;

    await api
      .post("/api/v1/admin/plans")
      .set("Authorization", `Bearer ${rootToken}`)
      .send({ name: "E2E4-30", durationDays: 30 })
      .expect(409);
  });

  it("cualquier admin lista planes; OPERATOR no edita", async () => {
    const list = await api
      .get("/api/v1/admin/plans")
      .set("Authorization", `Bearer ${opToken}`)
      .expect(200);
    const names = (
      list.body as ApiSuccess<{ items: PlanData[] }>
    ).data.items.map((p) => p.name);
    expect(names).toContain("E2E4-30");

    await api
      .patch(`/api/v1/admin/plans/${plan30.id}`)
      .set("Authorization", `Bearer ${opToken}`)
      .send({ description: "x" })
      .expect(403);
    await api
      .patch(`/api/v1/admin/plans/${plan30.id}`)
      .set("Authorization", `Bearer ${rootToken}`)
      .send({ description: "Mensual de prueba" })
      .expect(200);
  });

  it("crear cliente con plan calcula vencimiento; sin plan queda manual", async () => {
    const res = await api
      .post("/api/v1/admin/customers")
      .set("Authorization", `Bearer ${rootToken}`)
      .send({ displayName: "E2E4 Kiosco", planId: plan30.id })
      .expect(201);
    const customer = (res.body as ApiSuccess<CustomerData>).data;
    customerId = customer.id;
    expect(customer.status).toBe("ACTIVE");
    const diffDays = Math.round(
      (new Date(customer.expiresAt ?? "").getTime() - Date.now()) / 86_400_000,
    );
    expect(diffDays).toBeGreaterThanOrEqual(29);
    expect(diffDays).toBeLessThanOrEqual(30);

    const manual = await api
      .post("/api/v1/admin/customers")
      .set("Authorization", `Bearer ${rootToken}`)
      .send({ displayName: "E2E4 Manual" })
      .expect(201);
    expect((manual.body as ApiSuccess<CustomerData>).data.expiresAt).toBeNull();
  });

  it("lista con búsqueda y filtro por estado", async () => {
    const search = await api
      .get("/api/v1/admin/customers?search=kiosco")
      .set("Authorization", `Bearer ${opToken}`)
      .expect(200);
    expect(
      (search.body as ApiSuccess<{ items: CustomerData[]; total: number }>).data
        .total,
    ).toBe(1);

    const active = await api
      .get("/api/v1/admin/customers?status=ACTIVE")
      .set("Authorization", `Bearer ${opToken}`)
      .expect(200);
    expect(
      (active.body as ApiSuccess<{ total: number }>).data.total,
    ).toBeGreaterThanOrEqual(2);
  });

  it("suspender y reactivar con auditoría; OPERATOR no puede", async () => {
    await api
      .post(`/api/v1/admin/customers/${customerId}/suspend`)
      .set("Authorization", `Bearer ${opToken}`)
      .send({ reason: "x" })
      .expect(403);

    const suspended = await api
      .post(`/api/v1/admin/customers/${customerId}/suspend`)
      .set("Authorization", `Bearer ${rootToken}`)
      .send({ reason: "Falta de pago" })
      .expect(201);
    expect((suspended.body as ApiSuccess<CustomerData>).data.status).toBe(
      "SUSPENDED",
    );

    const audit = await prisma.auditLog.findFirst({
      where: { action: "admin.suspended_customer" },
      orderBy: { createdAt: "desc" },
    });
    expect(audit?.entityId).toBe(customerId);

    const reactivated = await api
      .post(`/api/v1/admin/customers/${customerId}/reactivate`)
      .set("Authorization", `Bearer ${rootToken}`)
      .expect(201);
    expect((reactivated.body as ApiSuccess<CustomerData>).data.status).toBe(
      "ACTIVE",
    );
  });

  it("renovar cambia de plan y extiende el vencimiento", async () => {
    const before = await api
      .get(`/api/v1/admin/customers/${customerId}`)
      .set("Authorization", `Bearer ${rootToken}`)
      .expect(200);
    const oldExpiry = (before.body as ApiSuccess<CustomerData>).data.expiresAt ?? "";

    const renewed = await api
      .post(`/api/v1/admin/customers/${customerId}/renew`)
      .set("Authorization", `Bearer ${rootToken}`)
      .send({ planId: plan7.id })
      .expect(201);
    const data = (renewed.body as ApiSuccess<CustomerData>).data;
    expect(data.planId).toBe(plan7.id);
    expect(new Date(data.expiresAt ?? "").getTime()).toBeGreaterThan(
      new Date(oldExpiry).getTime(),
    );
  });

  it("plan en uso no se borra; cliente lo borra SUPER_ADMIN", async () => {
    await api
      .delete(`/api/v1/admin/plans/${plan7.id}`)
      .set("Authorization", `Bearer ${rootToken}`)
      .expect(409);

    await api
      .delete(`/api/v1/admin/customers/${customerId}`)
      .set("Authorization", `Bearer ${opToken}`)
      .expect(403);
    await api
      .delete(`/api/v1/admin/customers/${customerId}`)
      .set("Authorization", `Bearer ${rootToken}`)
      .expect(200);
    await api
      .get(`/api/v1/admin/customers/${customerId}`)
      .set("Authorization", `Bearer ${rootToken}`)
      .expect(404);

    await api
      .delete(`/api/v1/admin/plans/${plan7.id}`)
      .set("Authorization", `Bearer ${rootToken}`)
      .expect(200);
  });

  it("renovar sin plan → 400 con envelope", async () => {
    const created = await api
      .post("/api/v1/admin/customers")
      .set("Authorization", `Bearer ${rootToken}`)
      .send({ displayName: "E2E4 SinPlan" })
      .expect(201);
    const id = (created.body as ApiSuccess<CustomerData>).data.id;
    const res = await api
      .post(`/api/v1/admin/customers/${id}/renew`)
      .set("Authorization", `Bearer ${rootToken}`)
      .send({})
      .expect(400);
    expect((res.body as ApiFailure).error.code).toBe("VALIDATION_ERROR");
  });
});
