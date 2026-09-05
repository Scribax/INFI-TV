import { AuditService } from "./audit.service";

function mockPrisma(fail = false): {
  svc: AuditService;
  create: jest.Mock;
} {
  const create = jest.fn().mockImplementation(() => {
    if (fail) {
      return Promise.reject(new Error("db caída"));
    }
    return Promise.resolve({ id: "1" });
  });
  const prisma = { auditLog: { create } } as unknown as import("../common/prisma/prisma.service").PrismaService;
  return { svc: new AuditService(prisma), create };
}

describe("AuditService", () => {
  it("registra el evento", async () => {
    const { svc, create } = mockPrisma();
    await svc.log({ actorType: "ADMIN", actorId: "a1", action: "admin.login_success" });
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("nunca lanza aunque la DB falle", async () => {
    const { svc } = mockPrisma(true);
    await expect(
      svc.log({ actorType: "SYSTEM", action: "x" }),
    ).resolves.toBeUndefined();
  });
});
