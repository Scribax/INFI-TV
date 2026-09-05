import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { AdminRole, AdminUser } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../common/prisma/prisma.service";
import type { AdminIdentity } from "./current-admin.decorator";
import type { LoginDto } from "./dto/login.dto";
import type { RefreshDto } from "./dto/refresh.dto";
import { PasswordService } from "./password.service";
import { TokenService, parseExpiryToMs } from "./token.service";

export interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

export interface AuthTokens {
  accessToken: string;
  accessExpiresAt: string;
  refreshToken: string;
  refreshExpiresAt: string;
  admin: AdminIdentity;
}

const INVALID_CREDENTIALS = "Credenciales inválidas.";
const INVALID_SESSION = "Sesión inválida o expirada.";

@Injectable()
export class AuthService implements OnModuleInit {
  private dummyHash = "";

  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
  ) {}

  /** Hash de un secreto aleatorio para igualar tiempos ante email inexistente. */
  async onModuleInit(): Promise<void> {
    this.dummyHash = await this.password.hash(randomUUID());
  }

  async login(dto: LoginDto, meta: RequestMeta): Promise<AuthTokens> {
    const email = dto.email.trim().toLowerCase();
    const admin = await this.prisma.adminUser.findUnique({ where: { email } });
    if (admin === null || !admin.isActive) {
      await this.password.verify(this.dummyHash, dto.password);
      await this.audit.log({
        actorType: "ADMIN",
        action: "admin.login_failed",
        entity: "AdminUser",
        metadata: { reason: "invalid_credentials", email },
        ip: meta.ip,
      });
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    const ok = await this.password.verify(admin.passwordHash, dto.password);
    if (!ok) {
      await this.audit.log({
        actorType: "ADMIN",
        actorId: admin.id,
        action: "admin.login_failed",
        entity: "AdminUser",
        entityId: admin.id,
        metadata: { reason: "invalid_credentials" },
        ip: meta.ip,
      });
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    const pair = await this.issueSession(admin, meta);
    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });
    await this.audit.log({
      actorType: "ADMIN",
      actorId: admin.id,
      action: "admin.login_success",
      entity: "AdminUser",
      entityId: admin.id,
      ip: meta.ip,
    });
    return pair;
  }

  async refresh(dto: RefreshDto, meta: RequestMeta): Promise<AuthTokens> {
    const session = await this.prisma.adminSession.findUnique({
      where: { tokenHash: TokenService.hashToken(dto.refreshToken) },
      include: { admin: true },
    });
    if (
      session === null ||
      session.revokedAt !== null ||
      session.expiresAt <= new Date() ||
      !session.admin.isActive
    ) {
      throw new UnauthorizedException(INVALID_SESSION);
    }
    await this.prisma.adminSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    const pair = await this.issueSession(session.admin, meta);
    await this.audit.log({
      actorType: "ADMIN",
      actorId: session.adminId,
      action: "admin.session_refresh",
      entity: "AdminSession",
      entityId: pair.admin.id,
      ip: meta.ip,
    });
    return pair;
  }

  /** Idempotente: siempre responde igual, exista o no la sesión. */
  async logout(dto: RefreshDto, meta: RequestMeta): Promise<{ revoked: true }> {
    const session = await this.prisma.adminSession.findUnique({
      where: { tokenHash: TokenService.hashToken(dto.refreshToken) },
    });
    if (session !== null && session.revokedAt === null) {
      await this.prisma.adminSession.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
      await this.audit.log({
        actorType: "ADMIN",
        actorId: session.adminId,
        action: "admin.logout",
        entity: "AdminSession",
        entityId: session.id,
        ip: meta.ip,
      });
    }
    return { revoked: true as const };
  }

  async me(adminId: string): Promise<AdminIdentity> {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
      select: { id: true, email: true, role: true, isActive: true },
    });
    if (admin === null || !admin.isActive) {
      throw new UnauthorizedException("No autenticado.");
    }
    return { id: admin.id, email: admin.email, role: admin.role };
  }

  /** Usado por el guard en cada request autenticada. */
  async validateAccess(adminId: string, role: AdminRole): Promise<AdminIdentity | null> {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
      select: { id: true, email: true, role: true, isActive: true },
    });
    if (admin === null || !admin.isActive || admin.role !== role) {
      return null;
    }
    return { id: admin.id, email: admin.email, role: admin.role };
  }

  private async issueSession(
    admin: Pick<AdminUser, "id" | "email" | "role">,
    meta: RequestMeta,
  ): Promise<AuthTokens> {
    const accessToken = await this.tokens.signAccess(admin);
    const refresh = this.tokens.generateRefresh();
    const refreshMs = parseExpiryToMs(this.tokens.refreshExpiresIn());
    const accessMs = parseExpiryToMs(this.tokens.accessExpiresIn());
    const now = Date.now();
    await this.prisma.adminSession.create({
      data: {
        adminId: admin.id,
        tokenHash: refresh.tokenHash,
        expiresAt: new Date(now + refreshMs),
        ipCreated: meta.ip,
        userAgent: meta.userAgent,
      },
    });
    return {
      accessToken,
      accessExpiresAt: new Date(now + accessMs).toISOString(),
      refreshToken: refresh.token,
      refreshExpiresAt: new Date(now + refreshMs).toISOString(),
      admin: { id: admin.id, email: admin.email, role: admin.role },
    };
  }
}
