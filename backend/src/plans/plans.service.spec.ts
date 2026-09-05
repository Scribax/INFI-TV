import { ConflictException, NotFoundException } from "@nestjs/common";
import type { AuditService } from "../audit/audit.service";
import type { AdminIdentity } from "../auth/current-admin.decorator";
import type { PrismaService } from "../common/prisma/prisma.service";
import { PlansService } from "./plans.service";

const ACTOR: AdminIdentity = {
  id: "actor-1",
  email: "root@infitv.local",
  role: "ADMIN",
};

function setup() {
  const prisma = {
    plan: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
  };
  const audit = { log: jest.fn().mockResolvedValue(undefined) };
  const service = new PlansService(
    prisma as unknown as PrismaService,
    audit as unknown as AuditService,
  );
  return { service, prisma };
}

describe("PlansService", () => {
  it("create aplica defaults y audita", async () => {
    const { service, prisma } = setup();
    prisma.plan.findUnique.mockResolvedValue(null);
    prisma.plan.create.mockImplementation((args: {
      data: Record<string, unknown>;
    }) => Promise.resolve({ id: "p1", ...args.data }));

    const res = (await service.create(
      { name: " 30 DÍAS ", durationDays: 30 },
      ACTOR,
    )) as { name: string; priceInternalCents: number; deviceLimit: number };
    expect(res.name).toBe("30 DÍAS");
    expect(res.priceInternalCents).toBe(0);
    expect(res.deviceLimit).toBe(1);
  });

  it("create rechaza nombre duplicado", async () => {
    const { service, prisma } = setup();
    prisma.plan.findUnique.mockResolvedValue({ id: "p0" });
    await expect(
      service.create({ name: "30 DÍAS", durationDays: 30 }, ACTOR),
    ).rejects.toThrow(ConflictException);
  });

  it("update detecta choque de nombre con otro plan", async () => {
    const { service, prisma } = setup();
    prisma.plan.findUnique
      .mockResolvedValueOnce({ id: "p1", name: "A" })
      .mockResolvedValueOnce({ id: "p2", name: "B" });
    await expect(
      service.update("p1", { name: "B" }, ACTOR),
    ).rejects.toThrow(ConflictException);
  });

  it("remove: 404 si no existe, 409 si está en uso", async () => {
    const { service, prisma } = setup();
    prisma.plan.findUnique.mockResolvedValue(null);
    await expect(service.remove("x", ACTOR)).rejects.toThrow(NotFoundException);

    prisma.plan.findUnique.mockResolvedValue({ id: "p1", name: "A" });
    const fkError = Object.assign(new Error("FK"), { code: "P2003" });
    prisma.plan.delete.mockRejectedValue(fkError);
    await expect(service.remove("p1", ACTOR)).rejects.toThrow(
      /está en uso/,
    );

    prisma.plan.delete.mockResolvedValue({ id: "p1" });
    await expect(service.remove("p1", ACTOR)).resolves.toEqual({
      deleted: true,
    });
  });
});
