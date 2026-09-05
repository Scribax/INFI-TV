import { BadRequestException, NotFoundException } from "@nestjs/common";
import type { Customer } from "@prisma/client";
import type { AuditService } from "../audit/audit.service";
import type { AdminIdentity } from "../auth/current-admin.decorator";
import type { PrismaService } from "../common/prisma/prisma.service";
import {
  CustomersService,
  addDays,
  isEffectivelyActive,
} from "./customers.service";

const ACTOR: AdminIdentity = {
  id: "actor-1",
  email: "root@infitv.local",
  role: "ADMIN",
};

function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: "cust-1",
    displayName: "Cliente",
    status: "ACTIVE",
    planId: "plan-30",
    expiresAt: new Date("2026-10-01T00:00:00.000Z"),
    lastSeenAt: null,
    notes: null,
    suspensionReason: null,
    createdAt: new Date("2026-09-01T00:00:00.000Z"),
    updatedAt: new Date("2026-09-01T00:00:00.000Z"),
    ...overrides,
  };
}

function setup() {
  const prisma = {
    customer: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn().mockResolvedValue({}),
      count: jest.fn().mockResolvedValue(0),
      updateMany: jest.fn(),
    },
    plan: { findUnique: jest.fn() },
  };
  const audit = { log: jest.fn().mockResolvedValue(undefined) };
  const service = new CustomersService(
    prisma as unknown as PrismaService,
    audit as unknown as AuditService,
  );
  return { service, prisma, audit };
}

describe("isEffectivelyActive", () => {
  const now = new Date("2026-09-05T12:00:00.000Z");
  it("matriz de estados", () => {
    expect(
      isEffectivelyActive(
        { status: "ACTIVE", expiresAt: new Date("2026-09-06T00:00:00.000Z") },
        now,
      ),
    ).toBe(true);
    expect(isEffectivelyActive({ status: "ACTIVE", expiresAt: null }, now)).toBe(true);
    expect(
      isEffectivelyActive(
        { status: "ACTIVE", expiresAt: new Date("2026-09-04T00:00:00.000Z") },
        now,
      ),
    ).toBe(false);
    expect(
      isEffectivelyActive(
        { status: "SUSPENDED", expiresAt: new Date("2026-09-06T00:00:00.000Z") },
        now,
      ),
    ).toBe(false);
    expect(isEffectivelyActive({ status: "EXPIRED", expiresAt: null }, now)).toBe(false);
  });

  it("addDays suma días exactos", () => {
    expect(addDays(new Date("2026-09-05T00:00:00.000Z"), 30).toISOString()).toBe(
      "2026-10-05T00:00:00.000Z",
    );
  });
});

describe("CustomersService", () => {
  it("create calcula vencimiento desde el plan", async () => {
    const { service, prisma } = setup();
    prisma.plan.findUnique.mockResolvedValue({
      id: "plan-30",
      durationDays: 30,
      isActive: true,
    });
    let captured: unknown = null;
    prisma.customer.create.mockImplementation((args: { data: { expiresAt: unknown } }) => {
      captured = args.data.expiresAt;
      return Promise.resolve(makeCustomer());
    });

    await service.create({ displayName: " Nuevo ", planId: "plan-30" }, ACTOR);
    const expiresAt = captured as Date;
    const diffDays = Math.round(
      (expiresAt.getTime() - Date.now()) / (24 * 3600 * 1000),
    );
    expect(diffDays).toBe(30);
  });

  it("create sin plan deja vencimiento nulo; con plan inactivo falla", async () => {
    const { service, prisma } = setup();
    prisma.customer.create.mockImplementation((args: {
      data: { expiresAt: unknown };
    }) => Promise.resolve(makeCustomer({ expiresAt: args.data.expiresAt as Date })));

    await service.create({ displayName: "Manual" }, ACTOR);
    expect(prisma.plan.findUnique).not.toHaveBeenCalled();

    prisma.plan.findUnique.mockResolvedValue({
      id: "p",
      durationDays: 7,
      isActive: false,
    });
    await expect(
      service.create({ displayName: "X", planId: "p" }, ACTOR),
    ).rejects.toThrow(BadRequestException);

    prisma.plan.findUnique.mockResolvedValue(null);
    await expect(
      service.create({ displayName: "X", planId: "nope" }, ACTOR),
    ).rejects.toThrow(NotFoundException);
  });

  it("renew extiende desde el vencimiento si es futuro, desde ahora si venció", async () => {
    const { service, prisma } = setup();
    const now = new Date("2026-09-05T12:00:00.000Z");
    prisma.plan.findUnique.mockResolvedValue({
      id: "plan-30",
      durationDays: 30,
      isActive: true,
    });
    prisma.customer.update.mockImplementation((args: {
      data: { expiresAt: Date };
    }) => Promise.resolve(makeCustomer({ expiresAt: args.data.expiresAt })));

    prisma.customer.findUnique.mockResolvedValue(
      makeCustomer({ expiresAt: new Date("2026-10-01T00:00:00.000Z") }),
    );
    const fromFuture = (await service.renew("cust-1", {}, ACTOR, undefined, now)) as {
      expiresAt: Date;
      status: string;
    };
    expect(fromFuture.expiresAt.toISOString()).toBe("2026-10-31T00:00:00.000Z");
    expect(fromFuture.status).toBe("ACTIVE");

    prisma.customer.findUnique.mockResolvedValue(
      makeCustomer({
        status: "EXPIRED",
        expiresAt: new Date("2026-08-01T00:00:00.000Z"),
      }),
    );
    const fromPast = (await service.renew("cust-1", {}, ACTOR, undefined, now)) as {
      expiresAt: Date;
      status: string;
    };
    expect(fromPast.expiresAt.toISOString()).toBe("2026-10-05T12:00:00.000Z");
    expect(fromPast.status).toBe("ACTIVE");
  });

  it("renew sin plan → BadRequest", async () => {
    const { service, prisma } = setup();
    prisma.customer.findUnique.mockResolvedValue(makeCustomer({ planId: null }));
    await expect(service.renew("cust-1", {}, ACTOR)).rejects.toThrow(
      BadRequestException,
    );
  });

  it("suspend es idempotente y reactivate vuelve a ACTIVE", async () => {
    const { service, prisma, audit } = setup();
    prisma.customer.findUnique.mockResolvedValue(
      makeCustomer({ status: "SUSPENDED" }),
    );
    await service.suspend("cust-1", {}, ACTOR);
    expect(prisma.customer.update).not.toHaveBeenCalled();

    prisma.customer.findUnique.mockResolvedValue(
      makeCustomer({ status: "SUSPENDED" }),
    );
    let updateArgs: unknown = null;
    prisma.customer.update.mockImplementation((args: unknown) => {
      updateArgs = args;
      return Promise.resolve(makeCustomer({ status: "ACTIVE" }));
    });
    let auditEntry: unknown = null;
    audit.log.mockImplementation((entry: unknown) => {
      auditEntry = entry;
      return Promise.resolve(undefined);
    });
    await service.reactivate("cust-1", ACTOR);
    const parsed = updateArgs as { where: { id: unknown }; data: { status: unknown } };
    expect(parsed.where.id).toBe("cust-1");
    expect(parsed.data.status).toBe("ACTIVE");
    const logged = auditEntry as { action: unknown };
    expect(logged.action).toBe("admin.reactivated_customer");
  });

  it("remove inexistente → 404", async () => {
    const { service, prisma } = setup();
    prisma.customer.findUnique.mockResolvedValue(null);
    await expect(service.remove("x", ACTOR)).rejects.toThrow(NotFoundException);
  });
});
