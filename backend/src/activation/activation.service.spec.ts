import { HttpException } from "@nestjs/common";
import type { AuditService } from "../audit/audit.service";
import type { ActivationCodesService } from "../codes/activation-codes.service";
import { INVALID_CODE } from "../common/errors/api-error";
import type { PrismaService } from "../common/prisma/prisma.service";
import type { ActivationAbuseService } from "../common/security/activation-abuse.service";
import { ActivationService } from "./activation.service";

const PLAN = { id: "plan-30", name: "30 DÍAS", durationDays: 30, isActive: true };

const PENDING_CODE = {
  id: "code-1",
  status: "PENDING",
  prefix: "INFITV-7K",
  planId: "plan-30",
  customerId: null,
  deviceLimit: 1,
  expiresAt: null,
  activatedAt: null,
};

const ACTIVE_CUSTOMER = {
  id: "cust-1",
  status: "ACTIVE",
  expiresAt: new Date(Date.now() + 86_400_000),
};

const DTO = {
  code: "INFITV-7K4P-X92M",
  appInstanceId: "11111111-2222-4333-8444-555555555555",
  platform: "android",
  appVersion: "1.0.0",
};

function setup() {
  const tx = {
    $executeRaw: jest.fn().mockResolvedValue(1),
    customer: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
    },
    device: {
      findUnique: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
      update: jest.fn(),
    },
    activationCode: { update: jest.fn().mockResolvedValue({}) },
    session: { create: jest.fn() },
  };
  const prisma = {
    plan: { findUnique: jest.fn().mockResolvedValue(PLAN) },
    session: { findUnique: jest.fn(), update: jest.fn() },
    customer: { update: jest.fn() },
    device: { update: jest.fn() },
    $transaction: jest.fn((cb: (t: typeof tx) => Promise<unknown>) => cb(tx)),
  };
  const codes = {
    resolveForActivation: jest.fn().mockResolvedValue({ ...PENDING_CODE }),
  };
  const audit = { log: jest.fn().mockResolvedValue(undefined) };
  const abuse = {
    isBlocked: jest.fn().mockReturnValue(false),
    recordFailure: jest.fn(),
  };
  const service = new ActivationService(
    prisma as unknown as PrismaService,
    codes as unknown as ActivationCodesService,
    audit as unknown as AuditService,
    abuse as unknown as ActivationAbuseService,
  );
  return { service, prisma, tx, codes, abuse };
}

function echoCreate(id: string) {
  return (args: { data: Record<string, unknown> }): Promise<unknown> =>
    Promise.resolve({ id, ...args.data });
}

interface ApiErrorBody {
  code: string;
  message: string;
  status: number;
}

/** Los errores de dominio viajan en getResponse (el filtro los formatea). */
async function catchApiError(p: Promise<unknown>): Promise<ApiErrorBody> {
  let caught: unknown = null;
  try {
    await p;
  } catch (err: unknown) {
    caught = err;
  }
  expect(caught).toBeInstanceOf(HttpException);
  const http = caught as HttpException;
  const body = http.getResponse() as { error: { code: string; message: string } };
  return { code: body.error.code, message: body.error.message, status: http.getStatus() };
}

describe("ActivationService.activate", () => {
  it("primera activación crea cliente, dispositivo y sesión", async () => {
    const { service, tx } = setup();
    tx.customer.create.mockImplementation(echoCreate("cust-1"));
    tx.device.create.mockImplementation(echoCreate("dev-1"));
    tx.session.create.mockImplementation((args: {
      data: { expiresAt: Date };
    }) => Promise.resolve({ expiresAt: args.data.expiresAt }));
    let codeUpdate: unknown = null;
    tx.activationCode.update.mockImplementation((args: { data: unknown }) => {
      codeUpdate = args.data;
      return Promise.resolve({});
    });

    const res = (await service.activate({ ...DTO }, {})) as {
      token: string;
      expiresAt: string;
      customer: { id: string; plan: string; expiresAt: string | null };
    };
    expect(res.token).toMatch(/^[0-9a-f]{64}$/);
    expect(res.customer.plan).toBe("30 DÍAS");
    expect(res.customer.expiresAt).not.toBeNull();
    const update = codeUpdate as { status: unknown; customerId: unknown };
    expect(update.status).toBe("ACTIVE");
    expect(update.customerId).toBe("cust-1");
  });

  it("mismo dispositivo reactiva sin consumir slot", async () => {
    const { service, tx, codes } = setup();
    codes.resolveForActivation.mockResolvedValue({
      ...PENDING_CODE,
      activatedAt: new Date(),
      customerId: "cust-1",
    });
    tx.customer.findUnique.mockResolvedValue({ ...ACTIVE_CUSTOMER });
    tx.device.findUnique.mockResolvedValue({
      id: "dev-1",
      status: "ACTIVE",
      customerId: "cust-1",
    });
    tx.device.update.mockImplementation(echoCreate("dev-1"));
    tx.session.create.mockImplementation((args: {
      data: { expiresAt: Date };
    }) => Promise.resolve({ expiresAt: args.data.expiresAt }));

    const res = (await service.activate({ ...DTO }, {})) as {
      customer: { id: string };
    };
    expect(res.customer.id).toBe("cust-1");
    expect(tx.device.count).not.toHaveBeenCalled();
  });

  it("segundo dispositivo sobre el límite → 403 con mensaje exacto", async () => {
    const { service, tx, codes } = setup();
    codes.resolveForActivation.mockResolvedValue({
      ...PENDING_CODE,
      activatedAt: new Date(),
      customerId: "cust-1",
    });
    tx.customer.findUnique.mockResolvedValue({ ...ACTIVE_CUSTOMER });
    tx.device.findUnique.mockResolvedValue(null);
    tx.device.count.mockResolvedValue(1);

    const err = await catchApiError(service.activate({ ...DTO }, {}));
    expect(err.status).toBe(403);
    expect(err.code).toBe("DEVICE_LIMIT_REACHED");
    expect(err.message).toBe(
      "Este código ya alcanzó el límite de dispositivos.",
    );
  });

  it("código desconocido, suspendido o cliente vencido → genérico", async () => {
    const unknown = setup();
    unknown.codes.resolveForActivation.mockRejectedValue(INVALID_CODE());
    await expect(
      catchApiError(unknown.service.activate({ ...DTO }, {})),
    ).resolves.toMatchObject({
      code: "INVALID_ACTIVATION_CODE",
      message: "Código inválido o no disponible.",
      status: 401,
    });

    const suspended = setup();
    suspended.codes.resolveForActivation.mockResolvedValue({
      ...PENDING_CODE,
      status: "SUSPENDED",
    });
    await expect(
      catchApiError(suspended.service.activate({ ...DTO }, {})),
    ).resolves.toMatchObject({
      code: "INVALID_ACTIVATION_CODE",
      message: "Código inválido o no disponible.",
    });

    const expiredCustomer = setup();
    expiredCustomer.codes.resolveForActivation.mockResolvedValue({
      ...PENDING_CODE,
      activatedAt: new Date(),
      customerId: "cust-1",
    });
    expiredCustomer.tx.customer.findUnique.mockResolvedValue({
      id: "cust-1",
      status: "EXPIRED",
      expiresAt: new Date(Date.now() - 1000),
    });
    await expect(
      catchApiError(expiredCustomer.service.activate({ ...DTO }, {})),
    ).resolves.toMatchObject({
      code: "INVALID_ACTIVATION_CODE",
      message: "Código inválido o no disponible.",
    });
  });

  it("dispositivo revocado no reactiva", async () => {
    const { service, tx, codes } = setup();
    codes.resolveForActivation.mockResolvedValue({
      ...PENDING_CODE,
      activatedAt: new Date(),
      customerId: "cust-1",
    });
    tx.customer.findUnique.mockResolvedValue({ ...ACTIVE_CUSTOMER });
    tx.device.findUnique.mockResolvedValue({
      id: "dev-1",
      status: "REVOKED",
      customerId: "cust-1",
    });
    await expect(
      catchApiError(service.activate({ ...DTO }, {})),
    ).resolves.toMatchObject({
      code: "INVALID_ACTIVATION_CODE",
      message: "Código inválido o no disponible.",
    });
  });
});

describe("ActivationService.validateSession", () => {
  function sessionFixture(overrides: Record<string, unknown> = {}) {
    return {
      id: "sess-1",
      status: "ACTIVE",
      expiresAt: new Date(Date.now() + 86_400_000),
      lastSeenAt: null,
      customer: {
        id: "cust-1",
        displayName: "C",
        status: "ACTIVE",
        plan: { name: "30 DÍAS" },
        expiresAt: new Date(Date.now() + 86_400_000),
        lastSeenAt: null,
      },
      device: { id: "dev-1", status: "ACTIVE", lastSeenAt: null },
      ...overrides,
    };
  }

  it("sesión válida devuelve identidad", async () => {
    const { service, prisma } = setup();
    prisma.session.findUnique.mockResolvedValue(sessionFixture());
    const identity = await service.validateSession("t".repeat(64));
    expect(identity.customerId).toBe("cust-1");
    expect(identity.customer.plan).toBe("30 DÍAS");
  });

  it("estados específicos con mensajes exactos", async () => {
    const cases: Array<{
      name: string;
      session: unknown;
      code: string;
      message: string;
    }> = [
      {
        name: "sesión inexistente",
        session: null,
        code: "SESSION_EXPIRED",
        message: "Sesión inválida o expirada.",
      },
      {
        name: "cliente suspendido",
        session: sessionFixture({
          customer: {
            id: "c",
            displayName: "C",
            status: "SUSPENDED",
            plan: null,
            expiresAt: null,
            lastSeenAt: null,
          },
        }),
        code: "CODE_SUSPENDED",
        message: "Tu acceso fue suspendido. Contactá al administrador.",
      },
      {
        name: "cliente vencido",
        session: sessionFixture({
          customer: {
            id: "c",
            displayName: "C",
            status: "EXPIRED",
            plan: null,
            expiresAt: new Date(Date.now() - 1000),
            lastSeenAt: null,
          },
        }),
        code: "CODE_EXPIRED",
        message:
          "Tu acceso ha vencido. Contactá al administrador para renovarlo.",
      },
      {
        name: "dispositivo revocado",
        session: sessionFixture({ device: { id: "d", status: "REVOKED" } }),
        code: "DEVICE_REVOKED",
        message: "Este dispositivo fue desvinculado. Volvé a activar tu código.",
      },
    ];
    for (const c of cases) {
      const { service, prisma } = setup();
      prisma.session.findUnique.mockResolvedValue(c.session);
      await expect(
        catchApiError(service.validateSession("t".repeat(64))),
      ).resolves.toMatchObject({ code: c.code, message: c.message });
    }
  });

  it("logout es idempotente", async () => {
    const { service, prisma } = setup();
    prisma.session.findUnique.mockResolvedValue({ id: "s", status: "ACTIVE" });
    await expect(service.logout({ token: "t".repeat(64) })).resolves.toEqual({
      revoked: true,
    });
    prisma.session.findUnique.mockResolvedValue(null);
    await expect(service.logout({ token: "t".repeat(64) })).resolves.toEqual({
      revoked: true,
    });
  });
});
