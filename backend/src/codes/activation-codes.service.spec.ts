import {
  BadRequestException,
  ConflictException,
  HttpException,
  NotFoundException,
} from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import type { AuditService } from "../audit/audit.service";
import type { AdminIdentity } from "../auth/current-admin.decorator";
import type { PrismaService } from "../common/prisma/prisma.service";
import type { CustomersService } from "../customers/customers.service";
import { ActivationCodesService, GENERIC_CODE_ERROR } from "./activation-codes.service";
import { hashCode } from "./code-generator";

const PEPPER = "test-pepper-min-16-chars";
const ACTOR: AdminIdentity = {
  id: "actor-1",
  email: "root@infitv.local",
  role: "ADMIN",
};

function setup() {
  const prisma = {
    activationCode: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
    },
    plan: { findUnique: jest.fn() },
    customer: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  };
  const audit = { log: jest.fn().mockResolvedValue(undefined) };
  const customers = { suspend: jest.fn().mockResolvedValue({}) };
  const config = { getOrThrow: jest.fn().mockReturnValue(PEPPER) };
  const service = new ActivationCodesService(
    prisma as unknown as PrismaService,
    audit as unknown as AuditService,
    customers as unknown as CustomersService,
    config as unknown as ConfigService,
  );
  return { service, prisma, audit, customers };
}

const ACTIVE_PLAN = { id: "plan-30", isActive: true, deviceLimit: 2 };

describe("ActivationCodesService", () => {
  it("create devuelve el texto plano una vez y guarda HMAC", async () => {
    const { service, prisma } = setup();
    prisma.plan.findUnique.mockResolvedValue(ACTIVE_PLAN);
    prisma.activationCode.findUnique.mockResolvedValue(null);
    let storedHash: unknown = null;
    prisma.activationCode.create.mockImplementation((args: {
      data: { codeHash: unknown; prefix: string };
    }) => {
      storedHash = args.data.codeHash;
      return Promise.resolve({
        id: "c1",
        prefix: args.data.prefix,
        status: "PENDING",
      });
    });
    prisma.$transaction.mockImplementation((ops: Array<Promise<unknown>>) =>
      Promise.all(ops),
    );

    const res = (await service.create({ planId: "plan-30" }, ACTOR)) as {
      count: number;
      items: Array<{ code: string; prefix: string }>;
    };
    expect(res.count).toBe(1);
    expect(res.items[0].code).toMatch(/^INFITV-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(res.items[0].prefix).toMatch(/^INFITV-[A-Z2-9]{2}$/);
    expect(storedHash).toBe(hashCode(res.items[0].code, PEPPER));
  });

  it("create masivo genera cantidad pedida sin colisiones", async () => {
    const { service, prisma } = setup();
    prisma.plan.findUnique.mockResolvedValue(ACTIVE_PLAN);
    prisma.activationCode.findUnique.mockResolvedValue(null);
    prisma.activationCode.create.mockImplementation((args: {
      data: { codeHash: string };
    }) => Promise.resolve({ id: args.data.codeHash.slice(0, 8) }));
    prisma.$transaction.mockImplementation((ops: Array<Promise<unknown>>) =>
      Promise.all(ops),
    );

    const res = (await service.create(
      { planId: "plan-30", quantity: 10 },
      ACTOR,
    )) as { count: number; items: Array<{ code: string }> };
    expect(res.count).toBe(10);
    expect(new Set(res.items.map((i) => i.code)).size).toBe(10);
  });

  it("reintenta ante colisión de hash", async () => {
    const { service, prisma } = setup();
    prisma.plan.findUnique.mockResolvedValue(ACTIVE_PLAN);
    prisma.activationCode.findUnique
      .mockResolvedValueOnce({ id: "otro" })
      .mockResolvedValue(null);
    prisma.activationCode.create.mockResolvedValue({ id: "c1" });
    prisma.$transaction.mockImplementation((ops: Array<Promise<unknown>>) =>
      Promise.all(ops),
    );

    const res = (await service.create({ planId: "plan-30" }, ACTOR)) as {
      count: number;
    };
    expect(res.count).toBe(1);
    expect(prisma.activationCode.findUnique.mock.calls.length).toBeGreaterThan(1);
  });

  it("valida plan y cliente", async () => {
    const { service, prisma } = setup();
    prisma.plan.findUnique.mockResolvedValue(null);
    await expect(service.create({ planId: "x" }, ACTOR)).rejects.toThrow(
      NotFoundException,
    );

    prisma.plan.findUnique.mockResolvedValue({ ...ACTIVE_PLAN, isActive: false });
    await expect(service.create({ planId: "x" }, ACTOR)).rejects.toThrow(
      BadRequestException,
    );

    prisma.plan.findUnique.mockResolvedValue(ACTIVE_PLAN);
    prisma.customer.findUnique.mockResolvedValue(null);
    await expect(
      service.create({ planId: "plan-30", customerId: "y" }, ACTOR),
    ).rejects.toThrow(NotFoundException);
  });

  it("suspend/reactivate con transiciones correctas", async () => {
    const { service, prisma } = setup();
    prisma.activationCode.findUnique.mockResolvedValue({
      id: "c1",
      status: "PENDING",
      customerId: null,
      activatedAt: null,
      expiresAt: null,
    });
    prisma.activationCode.update.mockImplementation((args: {
      data: { status: string };
    }) => Promise.resolve({ id: "c1", status: args.data.status }));

    const suspended = (await service.suspend("c1", {}, ACTOR)) as {
      status: string;
    };
    expect(suspended.status).toBe("SUSPENDED");

    prisma.activationCode.findUnique.mockResolvedValue({
      id: "c1",
      status: "SUSPENDED",
      customerId: null,
      activatedAt: null,
      expiresAt: null,
    });
    const reactivated = (await service.reactivate("c1", ACTOR)) as {
      status: string;
    };
    expect(reactivated.status).toBe("PENDING");

    prisma.activationCode.findUnique.mockResolvedValue({
      id: "c1",
      status: "ACTIVE",
      customerId: null,
      activatedAt: new Date(),
      expiresAt: null,
    });
    await expect(service.reactivate("c1", ACTOR)).rejects.toThrow(
      ConflictException,
    );

    prisma.activationCode.findUnique.mockResolvedValue({
      id: "c1",
      status: "REVOKED",
      customerId: null,
      activatedAt: null,
      expiresAt: null,
    });
    await expect(service.suspend("c1", {}, ACTOR)).rejects.toThrow(
      ConflictException,
    );
  });

  it("revoke suspende al cliente vinculado y es idempotente", async () => {
    const { service, prisma, customers } = setup();
    prisma.activationCode.findUnique.mockResolvedValue({
      id: "c1",
      status: "ACTIVE",
      customerId: "cust-1",
      activatedAt: new Date(),
      expiresAt: null,
    });
    prisma.activationCode.update.mockResolvedValue({ id: "c1", status: "REVOKED" });
    prisma.customer.findUnique.mockResolvedValue({ id: "cust-1", status: "ACTIVE" });

    await service.revoke("c1", ACTOR);
    expect(customers.suspend).toHaveBeenCalledTimes(1);

    prisma.activationCode.findUnique.mockResolvedValue({
      id: "c1",
      status: "REVOKED",
      customerId: "cust-1",
      activatedAt: null,
      expiresAt: null,
      plan: { id: "plan-30", name: "30 DÍAS" },
      customer: null,
      devices: [],
    });
    await service.revoke("c1", ACTOR);
    expect(prisma.activationCode.update).toHaveBeenCalledTimes(1);
  });

  it("resolveForActivation: genérico ante código desconocido, tolera formato", async () => {
    const { service, prisma } = setup();
    prisma.activationCode.findUnique.mockImplementation((args: {
      where: { codeHash: string };
    }) => {
      if (args.where.codeHash === hashCode("INFITV-AAAA-BBBB", PEPPER)) {
        return Promise.resolve({ id: "c1", status: "PENDING" });
      }
      return Promise.resolve(null);
    });

    await expect(service.resolveForActivation("INFITV-AAAA-BBBB")).resolves
      .toMatchObject({ id: "c1" });
    await expect(
      service.resolveForActivation("infitv-aaaa-bbbb"),
    ).resolves.toMatchObject({ id: "c1" });

    let caught: unknown = null;
    try {
      await service.resolveForActivation("INFITV-ZZZZ-ZZZZ");
    } catch (err: unknown) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(HttpException);
    const http = caught as HttpException;
    expect(http.getStatus()).toBe(401);
    expect(http.getResponse()).toEqual({
      error: {
        code: "INVALID_ACTIVATION_CODE",
        message: GENERIC_CODE_ERROR,
      },
    });
  });
});
