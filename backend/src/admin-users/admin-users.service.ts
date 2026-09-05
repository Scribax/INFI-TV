import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import type { AdminRole, AdminUser } from "@prisma/client";
import { buildPagination } from "@infitv/utils";
import type { Paginated } from "@infitv/types";
import { AuditService } from "../audit/audit.service";
import type { AdminIdentity } from "../auth/current-admin.decorator";
import { PasswordService } from "../auth/password.service";
import { PrismaService } from "../common/prisma/prisma.service";
import type {
  ChangePasswordDto,
  CreateAdminDto,
  UpdateAdminDto,
} from "./dto/admin-users.dto";
import type { AdminUsersQueryDto } from "./dto/admin-users-query.dto";

export type SafeAdmin = Pick<
  AdminUser,
  "id" | "email" | "role" | "isActive" | "lastLoginAt" | "createdAt" | "updatedAt"
>;

const SAFE_SELECT = {
  id: true,
  email: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly audit: AuditService,
  ) {}

  async create(
    dto: CreateAdminDto,
    actor: AdminIdentity,
    ip?: string,
  ): Promise<SafeAdmin> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.adminUser.findUnique({ where: { email } });
    if (existing !== null) {
      throw new ConflictException("Ya existe un administrador con ese email.");
    }
    const created = await this.prisma.adminUser.create({
      data: {
        email,
        passwordHash: await this.password.hash(dto.password),
        role: dto.role,
      },
      select: SAFE_SELECT,
    });
    await this.audit.log({
      actorType: "ADMIN",
      actorId: actor.id,
      action: "admin.created_user",
      entity: "AdminUser",
      entityId: created.id,
      metadata: { email, role: dto.role },
      ip,
    });
    return created;
  }

  async list(q: AdminUsersQueryDto): Promise<Paginated<SafeAdmin>> {
    const total = await this.prisma.adminUser.count();
    const p = buildPagination({
      page: q.page ?? 1,
      pageSize: q.pageSize ?? 20,
      total,
    });
    const items = await this.prisma.adminUser.findMany({
      select: SAFE_SELECT,
      orderBy: { createdAt: "desc" },
      skip: p.offset,
      take: p.pageSize,
    });
    return {
      items,
      page: p.page,
      pageSize: p.pageSize,
      total: p.total,
      totalPages: p.totalPages,
    };
  }

  async get(id: string): Promise<SafeAdmin> {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id },
      select: SAFE_SELECT,
    });
    if (admin === null) {
      throw new NotFoundException("Administrador no encontrado.");
    }
    return admin;
  }

  async update(
    id: string,
    dto: UpdateAdminDto,
    actor: AdminIdentity,
    ip?: string,
  ): Promise<SafeAdmin> {
    const target = await this.prisma.adminUser.findUnique({ where: { id } });
    if (target === null) {
      throw new NotFoundException("Administrador no encontrado.");
    }
    if (actor.id === id && (dto.role !== undefined || dto.isActive === false)) {
      throw new ForbiddenException("No podés cambiar tu propio rol o desactivarte.");
    }
    const demotesSuper =
      target.role === "SUPER_ADMIN" &&
      ((dto.role !== undefined && dto.role !== "SUPER_ADMIN") || dto.isActive === false);
    if (demotesSuper) {
      await this.assertAnotherActiveSuperAdmin(id);
    }
    const updated = await this.prisma.adminUser.update({
      where: { id },
      data: { role: dto.role, isActive: dto.isActive },
      select: SAFE_SELECT,
    });
    await this.audit.log({
      actorType: "ADMIN",
      actorId: actor.id,
      action: "admin.updated_user",
      entity: "AdminUser",
      entityId: id,
      metadata: { role: dto.role ?? null, isActive: dto.isActive ?? null },
      ip,
    });
    return updated;
  }

  async changePassword(
    id: string,
    dto: ChangePasswordDto,
    actor: AdminIdentity,
    ip?: string,
  ): Promise<{ changed: true }> {
    const target = await this.prisma.adminUser.findUnique({ where: { id } });
    if (target === null) {
      throw new NotFoundException("Administrador no encontrado.");
    }
    if (actor.id === id) {
      if (dto.currentPassword === undefined) {
        throw new BadRequestException("Debés indicar tu contraseña actual.");
      }
      const ok = await this.password.verify(target.passwordHash, dto.currentPassword);
      if (!ok) {
        throw new UnauthorizedException("La contraseña actual es incorrecta.");
      }
    }
    await this.prisma.adminUser.update({
      where: { id },
      data: { passwordHash: await this.password.hash(dto.newPassword) },
    });
    await this.prisma.adminSession.updateMany({
      where: { adminId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.audit.log({
      actorType: "ADMIN",
      actorId: actor.id,
      action: "admin.changed_password",
      entity: "AdminUser",
      entityId: id,
      ip,
    });
    return { changed: true as const };
  }

  private async assertAnotherActiveSuperAdmin(excludingId: string): Promise<void> {
    const remaining = await this.prisma.adminUser.count({
      where: {
        role: "SUPER_ADMIN" satisfies AdminRole,
        isActive: true,
        id: { not: excludingId },
      },
    });
    if (remaining === 0) {
      throw new ForbiddenException(
        "No se puede degradar o desactivar al último SUPER_ADMIN activo.",
      );
    }
  }
}
