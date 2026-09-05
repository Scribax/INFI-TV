import { UnauthorizedException } from "@nestjs/common";
import type { AdminUser } from "@prisma/client";
import { AuthService } from "./auth.service";
import type { PasswordService } from "./password.service";
import { TokenService } from "./token.service";
import type { AuditService } from "../audit/audit.service";
import type { PrismaService } from "../common/prisma/prisma.service";

function makeAdmin(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: "admin-1",
    email: "admin@infitv.local",
    passwordHash: "hash-real",
    role: "SUPER_ADMIN",
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

interface Mocks {
  service: AuthService;
  prisma: {
    adminUser: { findUnique: jest.Mock; update: jest.Mock };
    adminSession: { findUnique: jest.Mock; update: jest.Mock; create: jest.Mock };
  };
  passwordVerify: jest.Mock;
}

function setup(verifyImpl: (hash: string, plain: string) => Promise<boolean>): Mocks {
  const prisma = {
    adminUser: { findUnique: jest.fn(), update: jest.fn().mockResolvedValue({}) },
    adminSession: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue({}),
    },
  };
  const passwordVerify = jest.fn(verifyImpl);
  const password = {
    hash: jest.fn().mockResolvedValue("dummy-hash"),
    verify: passwordVerify,
  } as unknown as PasswordService;
  const tokens = {
    signAccess: jest.fn().mockResolvedValue("access-jwt"),
    generateRefresh: jest
      .fn()
      .mockReturnValue({ token: "r".repeat(96), tokenHash: TokenService.hashToken("r".repeat(96)) }),
    refreshExpiresIn: jest.fn().mockReturnValue("7d"),
    accessExpiresIn: jest.fn().mockReturnValue("15m"),
  } as unknown as TokenService;
  const audit = { log: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService;
  const service = new AuthService(
    prisma as unknown as PrismaService,
    password,
    tokens,
    audit,
  );
  return { service, prisma, passwordVerify };
}

describe("AuthService", () => {
  it("login exitoso emite sesión y audita", async () => {
    const { service, prisma } = setup(() => Promise.resolve(true));
    await service.onModuleInit();
    prisma.adminUser.findUnique.mockResolvedValue(makeAdmin());

    const res = await service.login(
      { email: "ADMIN@infitv.local ", password: "secreta-12345" },
      { ip: "127.0.0.1" },
    );

    expect(res.accessToken).toBe("access-jwt");
    expect(res.admin.email).toBe("admin@infitv.local");
    expect(prisma.adminUser.findUnique).toHaveBeenCalledWith({
      where: { email: "admin@infitv.local" },
    });
    expect(prisma.adminSession.create).toHaveBeenCalledTimes(1);
    expect(prisma.adminUser.update).toHaveBeenCalledTimes(1);
  });

  it("email inexistente, password mal o inactivo → mismo mensaje genérico", async () => {
    for (const admin of [
      null,
      makeAdmin({ passwordHash: "otro" }),
      makeAdmin({ isActive: false }),
    ]) {
      const { service, prisma } = setup((hash) =>
        Promise.resolve(hash === "hash-real"),
      );
      await service.onModuleInit();
      prisma.adminUser.findUnique.mockResolvedValue(admin);
      await expect(
        service.login({ email: "x@y.zz", password: "secreta-12345" }, {}),
      ).rejects.toThrow(
        new UnauthorizedException("Credenciales inválidas."),
      );
    }
  });

  it("refresh rota la sesión (revoca la anterior)", async () => {
    const { service, prisma } = setup(() => Promise.resolve(true));
    const oldHash = TokenService.hashToken("o".repeat(96));
    prisma.adminSession.findUnique.mockResolvedValue({
      id: "s-old",
      adminId: "admin-1",
      tokenHash: oldHash,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 3600_000),
      admin: makeAdmin(),
    });
    let revokedAt: unknown = null;
    prisma.adminSession.update.mockImplementation((args: {
      data: { revokedAt: unknown };
    }) => {
      revokedAt = args.data.revokedAt;
      return Promise.resolve({});
    });

    const res = await service.refresh({ refreshToken: "o".repeat(96) }, {});
    expect(res.refreshToken).toBe("r".repeat(96));
    expect(prisma.adminSession.update).toHaveBeenCalledWith({
      where: { id: "s-old" },
      data: { revokedAt },
    });
    expect(revokedAt).toBeInstanceOf(Date);
    expect(prisma.adminSession.create).toHaveBeenCalledTimes(1);
  });

  it("refresh revocada o expirada → error genérico sin rotar", async () => {
    for (const session of [
      null,
      {
        id: "s",
        adminId: "a",
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600_000),
        admin: makeAdmin(),
      },
      {
        id: "s",
        adminId: "a",
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1000),
        admin: makeAdmin(),
      },
      {
        id: "s",
        adminId: "a",
        revokedAt: null,
        expiresAt: new Date(Date.now() + 3600_000),
        admin: makeAdmin({ isActive: false }),
      },
    ]) {
      const { service, prisma } = setup(() => Promise.resolve(true));
      prisma.adminSession.findUnique.mockResolvedValue(session);
      await expect(
        service.refresh({ refreshToken: "o".repeat(96) }, {}),
      ).rejects.toThrow(
        new UnauthorizedException("Sesión inválida o expirada."),
      );
      expect(prisma.adminSession.create).not.toHaveBeenCalled();
    }
  });

  it("logout es idempotente", async () => {
    const { service, prisma } = setup(() => Promise.resolve(true));
    prisma.adminSession.findUnique.mockResolvedValue({
      id: "s1",
      adminId: "admin-1",
      revokedAt: null,
    });
    await expect(
      service.logout({ refreshToken: "o".repeat(96) }, {}),
    ).resolves.toEqual({ revoked: true });
    expect(prisma.adminSession.update).toHaveBeenCalledTimes(1);

    prisma.adminSession.findUnique.mockResolvedValue(null);
    await expect(
      service.logout({ refreshToken: "o".repeat(96) }, {}),
    ).resolves.toEqual({ revoked: true });
    expect(prisma.adminSession.update).toHaveBeenCalledTimes(1);
  });

  it("validateAccess rechaza rol cambiado o admin inactivo", async () => {
    const { service, prisma } = setup(() => Promise.resolve(true));
    prisma.adminUser.findUnique.mockResolvedValue(makeAdmin({ role: "ADMIN" }));
    await expect(service.validateAccess("admin-1", "SUPER_ADMIN")).resolves.toBeNull();

    prisma.adminUser.findUnique.mockResolvedValue(
      makeAdmin({ isActive: false }),
    );
    await expect(service.validateAccess("admin-1", "SUPER_ADMIN")).resolves.toBeNull();

    prisma.adminUser.findUnique.mockResolvedValue(makeAdmin());
    await expect(service.validateAccess("admin-1", "SUPER_ADMIN")).resolves.toEqual({
      id: "admin-1",
      email: "admin@infitv.local",
      role: "SUPER_ADMIN",
    });
  });
});
