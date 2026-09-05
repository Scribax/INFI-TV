import type { AuditService } from "../audit/audit.service";
import type { PrismaService } from "../common/prisma/prisma.service";
import { CustomerExpirationService } from "./customer-expiration.service";

function setup() {
  const prisma = {
    customer: { updateMany: jest.fn() },
  };
  const audit = { log: jest.fn().mockResolvedValue(undefined) };
  const service = new CustomerExpirationService(
    prisma as unknown as PrismaService,
    audit as unknown as AuditService,
  );
  return { service, prisma, audit };
}

describe("CustomerExpirationService", () => {
  it("marca vencidos y audita resumen del sistema", async () => {
    const { service, prisma, audit } = setup();
    let whereClause: unknown = null;
    prisma.customer.updateMany.mockImplementation((args: { where: unknown }) => {
      whereClause = args.where;
      return Promise.resolve({ count: 2 });
    });
    let auditEntry: unknown = null;
    audit.log.mockImplementation((entry: unknown) => {
      auditEntry = entry;
      return Promise.resolve(undefined);
    });

    await expect(service.expireOverdue(new Date())).resolves.toEqual({
      expired: 2,
    });
    const where = whereClause as {
      status: unknown;
      expiresAt: { lt: unknown };
    };
    expect(where.status).toBe("ACTIVE");
    expect(where.expiresAt.lt).toBeInstanceOf(Date);
    const logged = auditEntry as {
      actorType: unknown;
      action: unknown;
      metadata: unknown;
    };
    expect(logged.actorType).toBe("SYSTEM");
    expect(logged.action).toBe("system.expired_customers");
    expect(logged.metadata).toEqual({ count: 2 });
  });

  it("sin vencidos no audita", async () => {
    const { service, prisma, audit } = setup();
    prisma.customer.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.expireOverdue(new Date())).resolves.toEqual({
      expired: 0,
    });
    expect(audit.log).not.toHaveBeenCalled();
  });
});
