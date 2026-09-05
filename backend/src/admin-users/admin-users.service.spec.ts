import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import type { AdminUser } from "@prisma/client";
import type { AuditService } from "../audit/audit.service";
import type { AdminIdentity } from "../auth/current-admin.decorator";
import type { PrismaService } from "../common/prisma/prisma.service";
import { AdminUsersService } from "./admin-users.service";

function makeAdmin(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: "admin-1",
    email: "root@infitv.local",
    passwordHash: "hash",
    role: "SUPER_ADMIN",
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const ACTOR: AdminIdentity = {
  id: "actor-1",
  email: "root@infitv.local",
  role: "SUPER_ADMIN",
};

function setup() {
  const prisma = {
    adminUser: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    adminSession: { updateMany: jest.fn().mockResolvedValue({}) },
  };
  const password = {
    hash: jest.fn().mockImplementation((p: string) => Promise.resolve(`hashed:${p}`)),
    verify: jest.fn().mockResolvedValue(true),
  };
  const audit = { log: jest.fn().mockResolvedValue(undefined) };
  const service = new AdminUsersService(
    prisma as unknown as PrismaService,
    password,
    audit as unknown as AuditService,
  );
  return { service, prisma, password, audit };
}

describe("AdminUsersService", () => {
  it("create normaliza email y nunca expone el hash", async () => {
    const { service, prisma } = setup();
    prisma.adminUser.findUnique.mockResolvedValue(null);
    let capturedSelect: unknown = null;
    prisma.adminUser.create.mockImplementation((args: {
      data: { email: string };
      select: unknown;
    }) => {
      capturedSelect = args.select;
      return Promise.resolve({
        id: "nuevo",
        email: args.data.email,
        role: "OPERATOR",
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    const res = await service.create(
      { email: "  Nuevo@InfiTV.local ", password: "larguisima-01", role: "OPERATOR" },
      ACTOR,
    );
    expect(res.email).toBe("nuevo@infitv.local");
    expect(res).not.toHaveProperty("passwordHash");
    expect(capturedSelect).not.toHaveProperty("passwordHash");
  });

  it("create rechaza email duplicado", async () => {
    const { service, prisma } = setup();
    prisma.adminUser.findUnique.mockResolvedValue(makeAdmin());
    await expect(
      service.create(
        { email: "root@infitv.local", password: "larguisima-01", role: "ADMIN" },
        ACTOR,
      ),
    ).rejects.toThrow(ConflictException);
  });

  it("nadie puede cambiar su propio rol ni desactivarse", async () => {
    const { service, prisma } = setup();
    prisma.adminUser.findUnique.mockResolvedValue(makeAdmin());
    await expect(
      service.update("actor-1", { role: "OPERATOR" }, ACTOR),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      service.update("actor-1", { isActive: false }, ACTOR),
    ).rejects.toThrow(ForbiddenException);
  });

  it("protege al último SUPER_ADMIN activo", async () => {
    const { service, prisma } = setup();
    prisma.adminUser.findUnique.mockResolvedValue(makeAdmin());
    prisma.adminUser.count.mockResolvedValue(0);
    await expect(
      service.update("otro", { role: "ADMIN" }, ACTOR),
    ).rejects.toThrow(/último SUPER_ADMIN/);

    prisma.adminUser.count.mockResolvedValue(1);
    prisma.adminUser.update.mockResolvedValue(makeAdmin({ role: "ADMIN" }));
    await expect(
      service.update("otro", { role: "ADMIN" }, ACTOR),
    ).resolves.toMatchObject({ role: "ADMIN" });
  });

  it("changePassword propio exige la actual y revoca sesiones", async () => {
    const { service, prisma, password } = setup();
    prisma.adminUser.findUnique.mockResolvedValue(makeAdmin());
    prisma.adminUser.update.mockResolvedValue(makeAdmin());
    let revokedAt: unknown = null;
    prisma.adminSession.updateMany.mockImplementation((args: {
      data: { revokedAt: unknown };
    }) => {
      revokedAt = args.data.revokedAt;
      return Promise.resolve({ count: 1 });
    });

    await expect(
      service.changePassword("actor-1", { newPassword: "nueva-larga-02" }, ACTOR),
    ).rejects.toThrow(BadRequestException);

    password.verify.mockResolvedValue(false);
    await expect(
      service.changePassword(
        "actor-1",
        { newPassword: "nueva-larga-02", currentPassword: "mal" },
        ACTOR,
      ),
    ).rejects.toThrow(UnauthorizedException);

    password.verify.mockResolvedValue(true);
    await expect(
      service.changePassword(
        "actor-1",
        { newPassword: "nueva-larga-02", currentPassword: "bien-12345678" },
        ACTOR,
      ),
    ).resolves.toEqual({ changed: true });
    expect(prisma.adminSession.updateMany).toHaveBeenCalledTimes(1);
    expect(revokedAt).toBeInstanceOf(Date);
  });

  it("SUPER_ADMIN puede rotar la clave de otro sin la actual", async () => {
    const { service, prisma } = setup();
    prisma.adminUser.findUnique.mockResolvedValue(makeAdmin({ id: "otro" }));
    prisma.adminUser.update.mockResolvedValue(makeAdmin({ id: "otro" }));
    await expect(
      service.changePassword("otro", { newPassword: "nueva-larga-02" }, ACTOR),
    ).resolves.toEqual({ changed: true });
  });
});
