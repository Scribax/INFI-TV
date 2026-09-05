import { ConflictException, NotFoundException } from "@nestjs/common";
import type { AuditService } from "../audit/audit.service";
import type { AdminIdentity } from "../auth/current-admin.decorator";
import type { PrismaService } from "../common/prisma/prisma.service";
import { DevicesService } from "./devices.service";

const ACTOR: AdminIdentity = {
  id: "actor-1",
  email: "root@infitv.local",
  role: "ADMIN",
};

function setup() {
  const prisma = {
    device: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn(),
      delete: jest.fn().mockResolvedValue({}),
    },
  };
  const audit = { log: jest.fn().mockResolvedValue(undefined) };
  const service = new DevicesService(
    prisma as unknown as PrismaService,
    audit as unknown as AuditService,
  );
  return { service, prisma, audit };
}

describe("DevicesService", () => {
  it("revoke es idempotente y audita el cambio", async () => {
    const { service, prisma, audit } = setup();
    prisma.device.findUnique.mockResolvedValue({
      id: "d1",
      customerId: "c1",
      status: "ACTIVE",
    });
    let newStatus: unknown = null;
    prisma.device.update.mockImplementation((args: { data: { status: unknown } }) => {
      newStatus = args.data.status;
      return Promise.resolve({ id: "d1", status: newStatus });
    });

    await service.revoke("d1", ACTOR);
    expect(newStatus).toBe("REVOKED");
    expect(audit.log).toHaveBeenCalledTimes(1);

    prisma.device.findUnique.mockResolvedValue({
      id: "d1",
      customerId: "c1",
      status: "REVOKED",
    });
    await service.revoke("d1", ACTOR);
    expect(prisma.device.update).toHaveBeenCalledTimes(1);
  });

  it("unblock solo desde BLOCKED", async () => {
    const { service, prisma } = setup();
    prisma.device.findUnique.mockResolvedValue({
      id: "d1",
      customerId: "c1",
      status: "REVOKED",
    });
    await expect(service.unblock("d1", ACTOR)).rejects.toThrow(
      ConflictException,
    );
  });

  it("remove inexistente → 404", async () => {
    const { service, prisma } = setup();
    prisma.device.findUnique.mockResolvedValue(null);
    await expect(service.remove("x", ACTOR)).rejects.toThrow(NotFoundException);
  });
});
