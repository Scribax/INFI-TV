/**
 * E2E: flujo completo de autenticación administrativa contra DB de test.
 * No toca la DB de desarrollo. Son 11 llamadas a /login (límite 20/min).
 */
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/common/prisma/prisma.service";
import { PasswordService } from "../src/auth/password.service";
import {
  ApiFailure,
  ApiSuccess,
  E2EContext,
  setupE2EApp,
} from "./e2e-helpers";

const SUPER_EMAIL = "e2e-root@infitv.local";
const SUPER_PASS = "e2e-super-secreta-01";

interface LoginData {
  accessToken: string;
  accessExpiresAt: string;
  refreshToken: string;
  refreshExpiresAt: string;
  admin: { id: string; email: string; role: string };
}

interface ProfileData {
  id: string;
  email: string;
  role: string;
}

describe("Admin auth (e2e)", () => {
  let app: INestApplication | undefined;
  let api: request.Agent;
  let prisma: PrismaService;
  let passwords: PasswordService;

  beforeAll(async () => {
    const ctx: E2EContext = await setupE2EApp();
    app = ctx.app;
    api = ctx.api;
    prisma = ctx.prisma;
    passwords = ctx.passwords;
    await prisma.adminSession.deleteMany({});
    await prisma.adminUser.deleteMany({
      where: { email: { startsWith: "e2e-" } },
    });
    await prisma.adminUser.create({
      data: {
        email: SUPER_EMAIL,
        passwordHash: await passwords.hash(SUPER_PASS),
        role: "SUPER_ADMIN",
      },
    });
  });

  afterAll(async () => {
    await app?.close();
  });

  it("login emite tokens y audita el éxito", async () => {
    const res = await api
      .post("/api/v1/admin/auth/login")
      .send({ email: SUPER_EMAIL, password: SUPER_PASS })
      .expect(200);
    const body = res.body as ApiSuccess<LoginData>;
    expect(body.success).toBe(true);
    expect(typeof body.data.accessToken).toBe("string");
    expect(body.data.refreshToken).toHaveLength(96);
    expect(body.data.admin.role).toBe("SUPER_ADMIN");

    const audit = await prisma.auditLog.findFirst({
      where: { action: "admin.login_success" },
      orderBy: { createdAt: "desc" },
    });
    expect(audit?.actorId).toBe(body.data.admin.id);
  });

  it("/me exige Bearer y devuelve el perfil", async () => {
    const login = await api
      .post("/api/v1/admin/auth/login")
      .send({ email: SUPER_EMAIL, password: SUPER_PASS })
      .expect(200);
    const { accessToken } = (login.body as ApiSuccess<LoginData>).data;

    const me = await api
      .get("/api/v1/admin/auth/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
    expect((me.body as ApiSuccess<ProfileData>).data.email).toBe(SUPER_EMAIL);

    const anon = await api.get("/api/v1/admin/auth/me").expect(401);
    expect((anon.body as ApiFailure).error.code).toBe("UNAUTHORIZED");
  });

  it("password mal o email inexistente → mismo mensaje (sin enumeración)", async () => {
    const wrong = await api
      .post("/api/v1/admin/auth/login")
      .send({ email: SUPER_EMAIL, password: "incorrecta-01" })
      .expect(401);
    const unknown = await api
      .post("/api/v1/admin/auth/login")
      .send({ email: "nadie@infitv.local", password: "incorrecta-01" })
      .expect(401);
    expect((wrong.body as ApiFailure).error.message).toBe("Credenciales inválidas.");
    expect((unknown.body as ApiFailure).error.message).toBe(
      (wrong.body as ApiFailure).error.message,
    );
  });

  it("DTO inválido → 400 con envelope", async () => {
    const res = await api
      .post("/api/v1/admin/auth/login")
      .send({ email: "no-es-email", password: "incorrecta-01" })
      .expect(400);
    expect((res.body as ApiFailure).error.code).toBe("VALIDATION_ERROR");
  });

  it("refresh rota y el anterior queda inválido; logout revoca", async () => {
    const login = await api
      .post("/api/v1/admin/auth/login")
      .send({ email: SUPER_EMAIL, password: SUPER_PASS })
      .expect(200);
    const first = (login.body as ApiSuccess<LoginData>).data;

    const rotated = await api
      .post("/api/v1/admin/auth/refresh")
      .send({ refreshToken: first.refreshToken })
      .expect(200);
    const second = (rotated.body as ApiSuccess<LoginData>).data;
    expect(second.refreshToken).not.toBe(first.refreshToken);

    const reuse = await api
      .post("/api/v1/admin/auth/refresh")
      .send({ refreshToken: first.refreshToken })
      .expect(401);
    expect((reuse.body as ApiFailure).error.message).toBe(
      "Sesión inválida o expirada.",
    );

    await api
      .post("/api/v1/admin/auth/logout")
      .send({ refreshToken: second.refreshToken })
      .expect(200);
    await api
      .post("/api/v1/admin/auth/refresh")
      .send({ refreshToken: second.refreshToken })
      .expect(401);
  });

  it("RBAC: OPERATOR no gestiona admins pero sí ve su perfil", async () => {
    const login = await api
      .post("/api/v1/admin/auth/login")
      .send({ email: SUPER_EMAIL, password: SUPER_PASS })
      .expect(200);
    const rootToken = (login.body as ApiSuccess<LoginData>).data.accessToken;

    await api
      .post("/api/v1/admin/users")
      .set("Authorization", `Bearer ${rootToken}`)
      .send({ email: "e2e-op@infitv.local", password: "e2e-operador-02", role: "OPERATOR" })
      .expect(201);

    const opLogin = await api
      .post("/api/v1/admin/auth/login")
      .send({ email: "e2e-op@infitv.local", password: "e2e-operador-02" })
      .expect(200);
    const opToken = (opLogin.body as ApiSuccess<LoginData>).data.accessToken;

    await api
      .post("/api/v1/admin/users")
      .set("Authorization", `Bearer ${opToken}`)
      .send({ email: "e2e-otro@infitv.local", password: "e2e-operador-03", role: "OPERATOR" })
      .expect(403);
    await api
      .get("/api/v1/admin/users")
      .set("Authorization", `Bearer ${opToken}`)
      .expect(403);
    await api
      .get("/api/v1/admin/auth/me")
      .set("Authorization", `Bearer ${opToken}`)
      .expect(200);
    await api.post("/api/v1/admin/users").expect(401);
  });

  it("nadie puede degradarse a sí mismo ni al último SUPER_ADMIN", async () => {
    const login = await api
      .post("/api/v1/admin/auth/login")
      .send({ email: SUPER_EMAIL, password: SUPER_PASS })
      .expect(200);
    const { accessToken, admin } = (login.body as ApiSuccess<LoginData>).data;

    await api
      .patch(`/api/v1/admin/users/${admin.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ role: "ADMIN" })
      .expect(403);
  });

  it("cambio de contraseña propia exige la actual y revoca sesiones", async () => {
    const login = await api
      .post("/api/v1/admin/auth/login")
      .send({ email: SUPER_EMAIL, password: SUPER_PASS })
      .expect(200);
    const { accessToken, admin, refreshToken } =
      (login.body as ApiSuccess<LoginData>).data;

    await api
      .post(`/api/v1/admin/users/${admin.id}/password`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ newPassword: "e2e-super-nueva-04", currentPassword: "mal-12345678" })
      .expect(401);
    await api
      .post(`/api/v1/admin/users/${admin.id}/password`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ newPassword: "e2e-super-nueva-04", currentPassword: SUPER_PASS })
      .expect(201);

    await api
      .post("/api/v1/admin/auth/refresh")
      .send({ refreshToken })
      .expect(401);
    await api
      .post("/api/v1/admin/auth/login")
      .send({ email: SUPER_EMAIL, password: "e2e-super-nueva-04" })
      .expect(200);
  });
});
