import {
  createHash,
  randomBytes,
} from "node:crypto";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { addDays, isEffectivelyActive } from "../customers/customers.service";
import { isCodeEffectivelyUsable } from "../codes/code-generator";
import { ActivationCodesService } from "../codes/activation-codes.service";
import { ActivationAbuseService } from "../common/security/activation-abuse.service";
import { AuditService } from "../audit/audit.service";
import { apiError, DEVICE_LIMIT, INVALID_CODE } from "../common/errors/api-error";
import { PrismaService } from "../common/prisma/prisma.service";
import type { ActivateDto, SessionTokenDto } from "./dto/activate.dto";
import type { SessionIdentity } from "./current-session.decorator";

/** Duración de sesión (tope; se recorta al vencimiento del cliente). */
export const SESSION_TTL_DAYS = 30;
/** Las marcas de última actividad se escriben como máximo cada 5 minutos. */
export const SEEN_TOUCH_MS = 5 * 60 * 1000;

export interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

export function hashSessionToken(token: string): string {
  // Token de 256 bits: la entropía hace inviable el brute force offline
  // incluso sin pepper (distinto caso que los códigos de 8 símbolos).
  return createHash("sha256").update(token).digest("hex");
}

@Injectable()
export class ActivationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codes: ActivationCodesService,
    private readonly audit: AuditService,
    private readonly abuse: ActivationAbuseService,
  ) {}

  /**
   * Flujo de activación con protección anti-abuso (§37): bloquea por IP o
   * dispositivo tras N fallos y registra los intentos inválidos.
   */
  async activate(dto: ActivateDto, meta: RequestMeta): Promise<unknown> {
    const ipKey = `ip:${meta.ip ?? "unknown"}`;
    const deviceKey = `device:${dto.appInstanceId}`;
    if (this.abuse.isBlocked(ipKey) || this.abuse.isBlocked(deviceKey)) {
      throw apiError(
        "RATE_LIMITED",
        "Demasiados intentos. Intentalo más tarde.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    try {
      return await this.performActivation(dto, meta);
    } catch (err: unknown) {
      if (this.isInvalidCodeError(err)) {
        this.abuse.recordFailure(ipKey);
        this.abuse.recordFailure(deviceKey);
      }
      throw err;
    }
  }

  /**
   * Errores genéricos salvo límite de dispositivos (que exige conocer un
   * código válido, sin riesgo de enumeración). Transacción + lock consultivo
   * por código: dos dispositivos activando a la vez no pueden superar el
   * límite por condición de carrera.
   */
  private async performActivation(
    dto: ActivateDto,
    meta: RequestMeta,
  ): Promise<unknown> {
    const code = await this.codes.resolveForActivation(dto.code);
    if (
      !isCodeEffectivelyUsable({ status: code.status, expiresAt: code.expiresAt })
    ) {
      throw INVALID_CODE();
    }
    const plan = await this.prisma.plan.findUnique({
      where: { id: code.planId },
      select: { id: true, name: true, durationDays: true, isActive: true },
    });
    if (plan === null || !plan.isActive) {
      throw INVALID_CODE();
    }

    return this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`activation:${code.id}`}))`;
        const now = new Date();

        let customer = code.customerId === null
          ? null
          : await tx.customer.findUnique({ where: { id: code.customerId } });
        if (customer !== null && !isEffectivelyActive(customer, now)) {
          throw INVALID_CODE();
        }

        const firstActivation = code.activatedAt === null;
        const customerExpiresAt = addDays(now, plan.durationDays);
        if (customer === null) {
          customer = await tx.customer.create({
            data: {
              displayName: `Cliente ${code.prefix}`,
              status: "ACTIVE",
              planId: plan.id,
              expiresAt: customerExpiresAt,
            },
          });
          await this.audit.log({
            actorType: "SYSTEM",
            action: "system.customer_auto_created",
            entity: "Customer",
            entityId: customer.id,
            metadata: { codeId: code.id },
            ip: meta.ip,
          });
        } else if (firstActivation) {
          // La activación inicia la suscripción del cliente pre-vinculado.
          customer = await tx.customer.update({
            where: { id: customer.id },
            data: {
              planId: plan.id,
              expiresAt: customerExpiresAt,
              status: "ACTIVE",
            },
          });
        }

        let device = await tx.device.findUnique({
          where: {
            customerId_appInstanceId: {
              customerId: customer.id,
              appInstanceId: dto.appInstanceId,
            },
          },
        });
        if (device !== null && device.status !== "ACTIVE") {
          throw INVALID_CODE();
        }
        if (device === null) {
          const activeCount = await tx.device.count({
            where: { customerId: customer.id, status: "ACTIVE" },
          });
          if (activeCount >= code.deviceLimit) {
            throw DEVICE_LIMIT();
          }
          device = await tx.device.create({
            data: {
              customerId: customer.id,
              appInstanceId: dto.appInstanceId,
              platform: dto.platform,
              appVersion: dto.appVersion,
              model: dto.model,
              osVersion: dto.osVersion,
              lastSeenAt: now,
              ipLast: meta.ip,
              status: "ACTIVE",
              activationCodeId: code.id,
            },
          });
        } else {
          device = await tx.device.update({
            where: { id: device.id },
            data: {
              platform: dto.platform,
              appVersion: dto.appVersion,
              model: dto.model,
              osVersion: dto.osVersion,
              lastSeenAt: now,
              ipLast: meta.ip,
            },
          });
        }

        if (firstActivation) {
          await tx.activationCode.update({
            where: { id: code.id },
            data: {
              activatedAt: now,
              expiresAt: customerExpiresAt,
              status: "ACTIVE",
              customerId: customer.id,
              lastUsedAt: now,
            },
          });
        } else {
          await tx.activationCode.update({
            where: { id: code.id },
            data: { lastUsedAt: now },
          });
        }

        const token = randomBytes(32).toString("hex");
        const defaultExpiry = addDays(now, SESSION_TTL_DAYS);
        const sessionExpiresAt =
          customer.expiresAt !== null && customer.expiresAt.getTime() < defaultExpiry.getTime()
            ? customer.expiresAt
            : defaultExpiry;
        const session = await tx.session.create({
          data: {
            customerId: customer.id,
            deviceId: device.id,
            tokenHash: hashSessionToken(token),
            status: "ACTIVE",
            expiresAt: sessionExpiresAt,
            ipCreated: meta.ip,
          },
        });
        await tx.customer.update({
          where: { id: customer.id },
          data: { lastSeenAt: now },
        });

        await this.audit.log({
          actorType: "SYSTEM",
          action: "system.code_activated",
          entity: "ActivationCode",
          entityId: code.id,
          metadata: {
            customerId: customer.id,
            deviceId: device.id,
            firstActivation,
          },
          ip: meta.ip,
        });

        return {
          token,
          expiresAt: session.expiresAt.toISOString(),
          customer: {
            id: customer.id,
            plan: plan.name,
            expiresAt: customer.expiresAt?.toISOString() ?? null,
          },
        };
      },
      { timeout: 10_000 },
    );
  }

  /**
   * Validación de sesión (autoridad del backend). Aquí SÍ hay mensajes
   * específicos: el presentante ya posee un token válido, no hay enumeración.
   */
  async validateSession(bearer: string): Promise<SessionIdentity> {
    const now = new Date();
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hashSessionToken(bearer) },
      include: {
        customer: { include: { plan: true } },
        device: true,
      },
    });
    if (
      session === null ||
      session.status !== "ACTIVE" ||
      session.expiresAt.getTime() <= now.getTime()
    ) {
      throw apiError(
        "SESSION_EXPIRED",
        "Sesión inválida o expirada.",
        HttpStatus.UNAUTHORIZED,
      );
    }
    const { customer, device } = session;
    if (customer.status === "SUSPENDED") {
      const reason = customer.suspensionReason ?? null;
      throw apiError(
        "CODE_SUSPENDED",
        reason === null
          ? "Tu acceso fue suspendido. Contactá al administrador."
          : `Tu acceso fue suspendido. Motivo: ${reason}`,
        HttpStatus.FORBIDDEN,
      );
    }
    if (!isEffectivelyActive(customer, now)) {
      throw apiError(
        "CODE_EXPIRED",
        "Tu acceso ha vencido. Contactá al administrador para renovarlo.",
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (device.status !== "ACTIVE") {
      throw apiError(
        "DEVICE_REVOKED",
        "Este dispositivo fue desvinculado. Volvé a activar tu código.",
        HttpStatus.FORBIDDEN,
      );
    }

    await this.touchSeen(session, customer, device, now);

    return {
      sessionId: session.id,
      sessionExpiresAt: session.expiresAt.toISOString(),
      customerId: customer.id,
      deviceId: device.id,
      customer: {
        id: customer.id,
        displayName: customer.displayName,
        status: customer.status,
        plan: customer.plan?.name ?? "—",
        expiresAt: customer.expiresAt?.toISOString() ?? null,
      },
      deviceStatus: device.status,
    };
  }

  /**
   * Estado de la cuenta para polling en vivo. A diferencia de validateSession,
   * NO corta con 403: devuelve el estado (ACTIVE/SUSPENDED/EXPIRED/DEVICE_REVOKED)
   * para que la app pueda mostrar el motivo de suspensión en plena reproducción.
   */
  async getAccountStatus(bearer: string): Promise<unknown> {
    const now = new Date();
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hashSessionToken(bearer) },
      include: { customer: { include: { plan: true } }, device: true },
    });
    if (
      session === null ||
      session.status !== "ACTIVE" ||
      session.expiresAt.getTime() <= now.getTime()
    ) {
      throw apiError(
        "SESSION_EXPIRED",
        "Sesión inválida o expirada.",
        HttpStatus.UNAUTHORIZED,
      );
    }
    const { customer, device } = session;
    const base = {
      suspensionReason: customer.suspensionReason ?? null,
      expiresAt: customer.expiresAt?.toISOString() ?? null,
      plan: customer.plan?.name ?? "—",
      displayName: customer.displayName,
    };
    if (customer.status === "SUSPENDED") {
      return { ...base, status: "SUSPENDED" as const };
    }
    if (!isEffectivelyActive(customer, now)) {
      return { ...base, status: "EXPIRED" as const };
    }
    if (device.status !== "ACTIVE") {
      return { ...base, status: "DEVICE_REVOKED" as const };
    }
    return { ...base, status: "ACTIVE" as const };
  }

  /** Idempotente: revoca si existe y está activa, siempre responde igual. */
  async logout(dto: SessionTokenDto): Promise<{ revoked: true }> {
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hashSessionToken(dto.token) },
      select: { id: true, status: true },
    });
    if (session !== null && session.status === "ACTIVE") {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { status: "REVOKED" },
      });
    }
    return { revoked: true as const };
  }

  private async touchSeen(
    session: { id: string; lastSeenAt: Date | null },
    customer: { id: string; lastSeenAt: Date | null },
    device: { id: string; lastSeenAt: Date | null },
    now: Date,
  ): Promise<void> {
    const stale = (d: Date | null): boolean =>
      d === null || now.getTime() - d.getTime() > SEEN_TOUCH_MS;
    if (stale(session.lastSeenAt)) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { lastSeenAt: now },
      });
    }
    if (stale(customer.lastSeenAt)) {
      await this.prisma.customer.update({
        where: { id: customer.id },
        data: { lastSeenAt: now },
      });
    }
    if (stale(device.lastSeenAt)) {
      await this.prisma.device.update({
        where: { id: device.id },
        data: { lastSeenAt: now },
      });
    }
  }

  private isInvalidCodeError(err: unknown): boolean {
    if (err instanceof HttpException) {
      const resp = err.getResponse();
      if (typeof resp === "object" && resp !== null) {
        const code = (resp as { error?: { code?: string } }).error?.code;
        return code === "INVALID_ACTIVATION_CODE";
      }
    }
    return false;
  }
}
