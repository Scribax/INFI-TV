import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "@prisma/client";
import type { ActivationCodeStatus } from "@prisma/client";
import { buildPagination } from "@infitv/utils";
import type { Paginated } from "@infitv/types";
import { AuditService } from "../audit/audit.service";
import { INVALID_CODE } from "../common/errors/api-error";
import type { AdminIdentity } from "../auth/current-admin.decorator";
import { PrismaService } from "../common/prisma/prisma.service";
import { CustomersService } from "../customers/customers.service";
import {
  buildPrefix,
  generatePlainCode,
  hashCode,
} from "./code-generator";
import type { CreateCodesDto, SuspendCodeDto, UpdateCodeDto } from "./dto/codes.dto";
import type { CodesQueryDto } from "./dto/codes-query.dto";

/** Mensaje público único: jamás distingue inexistente de revocado/vencido. */
export const GENERIC_CODE_ERROR = "Código inválido o no disponible.";

/**
 * El texto plano existe solo en memoria durante la creación y en la
 * respuesta de creación. Jamás se persiste ni se loguea. Tampoco el
 * codeHash se expone por API (equivale a persistir un secreto verificable).
 */
const CODE_SELECT = {
  id: true,
  prefix: true,
  status: true,
  planId: true,
  customerId: true,
  deviceLimit: true,
  activatedAt: true,
  expiresAt: true,
  lastUsedAt: true,
  createdByAdminId: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class ActivationCodesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly customers: CustomersService,
    private readonly config: ConfigService,
  ) {}

  private pepper(): string {
    return this.config.getOrThrow<string>("CODE_PEPPER");
  }

  async create(
    dto: CreateCodesDto,
    actor: AdminIdentity,
    ip?: string,
  ): Promise<{ count: number; items: Array<Record<string, unknown>> }> {
    const plan = await this.prisma.plan.findUnique({
      where: { id: dto.planId },
      select: { id: true, isActive: true, deviceLimit: true },
    });
    if (plan === null) {
      throw new NotFoundException("Plan no encontrado.");
    }
    if (!plan.isActive) {
      throw new BadRequestException("El plan está inactivo.");
    }
    if (dto.customerId !== undefined) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: dto.customerId },
        select: { id: true },
      });
      if (customer === null) {
        throw new NotFoundException("Cliente no encontrado.");
      }
    }

    const quantity = dto.quantity ?? 1;
    const deviceLimit = dto.deviceLimit ?? plan.deviceLimit;
    const pepper = this.pepper();
    const generated: Array<{ code: string; codeHash: string; prefix: string }> = [];
    const seen = new Set<string>();
    let attempts = 0;
    while (generated.length < quantity) {
      attempts += 1;
      if (attempts > quantity * 10 + 50) {
        throw new InternalServerErrorException(
          "No se pudieron generar códigos únicos, reintentá.",
        );
      }
      const code = generatePlainCode();
      const codeHash = hashCode(code, pepper);
      if (seen.has(codeHash)) {
        continue;
      }
      const clash = await this.prisma.activationCode.findUnique({
        where: { codeHash },
        select: { id: true },
      });
      if (clash !== null) {
        continue;
      }
      seen.add(codeHash);
      generated.push({ code, codeHash, prefix: buildPrefix(code) });
    }

    const created = await this.prisma.$transaction(
      generated.map((g) =>
        this.prisma.activationCode.create({
          data: {
            codeHash: g.codeHash,
            prefix: g.prefix,
            planId: plan.id,
            customerId: dto.customerId,
            deviceLimit,
            expiresAt: dto.expiresAt,
            metadata: dto.metadata as Prisma.InputJsonValue | undefined,
            createdByAdminId: actor.id,
          },
          select: CODE_SELECT,
        }),
      ),
    );

    await this.audit.log({
      actorType: "ADMIN",
      actorId: actor.id,
      action: "admin.created_codes",
      entity: "ActivationCode",
      metadata: { count: created.length, planId: plan.id },
      ip,
    });

    return {
      count: created.length,
      items: created.map((row, i) => ({
        ...row,
        code: generated[i].code,
      })),
    };
  }

  async list(q: CodesQueryDto): Promise<Paginated<unknown>> {
    const where: Prisma.ActivationCodeWhereInput = {};
    if (q.status !== undefined) {
      where.status = q.status;
    }
    if (q.planId !== undefined) {
      where.planId = q.planId;
    }
    if (q.customerId !== undefined) {
      where.customerId = q.customerId;
    }
    if (q.search !== undefined && q.search.trim() !== "") {
      where.prefix = { contains: q.search.trim(), mode: "insensitive" };
    }
    const total = await this.prisma.activationCode.count({ where });
    const p = buildPagination({
      page: q.page ?? 1,
      pageSize: q.pageSize ?? 20,
      total,
    });
    const rows = await this.prisma.activationCode.findMany({
      where,
      select: {
        ...CODE_SELECT,
        plan: { select: { id: true, name: true } },
        customer: { select: { id: true, displayName: true } },
        _count: { select: { devices: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: p.offset,
      take: p.pageSize,
    });
    const items = rows.map((r) => ({
      ...r,
      devicesTotal: r._count.devices,
      _count: undefined,
    }));
    return {
      items,
      page: p.page,
      pageSize: p.pageSize,
      total: p.total,
      totalPages: p.totalPages,
    };
  }

  async get(id: string): Promise<unknown> {
    const code = await this.prisma.activationCode.findUnique({
      where: { id },
      select: {
        ...CODE_SELECT,
        plan: true,
        customer: { select: { id: true, displayName: true, status: true } },
        devices: {
          select: {
            id: true,
            platform: true,
            appVersion: true,
            status: true,
            lastSeenAt: true,
          },
          orderBy: { lastSeenAt: "desc" },
          take: 20,
        },
      },
    });
    if (code === null) {
      throw new NotFoundException("Código no encontrado.");
    }
    const devicesUsed = code.devices.filter((d) => d.status === "ACTIVE").length;
    return { ...code, devicesUsed, devicesTotal: code.devices.length };
  }

  async suspend(
    id: string,
    dto: SuspendCodeDto,
    actor: AdminIdentity,
    ip?: string,
  ): Promise<unknown> {
    const code = await this.requireCode(id);
    if (code.status === "SUSPENDED") {
      return this.get(id);
    }
    if (code.status !== "PENDING" && code.status !== "ACTIVE") {
      throw new ConflictException(
        `No se puede suspender un código en estado ${code.status}.`,
      );
    }
    const updated = await this.prisma.activationCode.update({
      where: { id },
      data: { status: "SUSPENDED" },
      select: CODE_SELECT,
    });
    await this.audit.log({
      actorType: "ADMIN",
      actorId: actor.id,
      action: "admin.suspended_code",
      entity: "ActivationCode",
      entityId: id,
      metadata: { reason: dto.reason ?? null, previousStatus: code.status },
      ip,
    });
    return updated;
  }

  async reactivate(
    id: string,
    actor: AdminIdentity,
    ip?: string,
  ): Promise<unknown> {
    const code = await this.requireCode(id);
    if (code.status !== "SUSPENDED") {
      throw new ConflictException(
        `Solo se puede reactivar un código SUSPENDED (actual: ${code.status}).`,
      );
    }
    const now = new Date();
    const next =
      code.activatedAt === null
        ? "PENDING"
        : code.expiresAt !== null && code.expiresAt.getTime() <= now.getTime()
          ? "EXPIRED"
          : "ACTIVE";
    const updated = await this.prisma.activationCode.update({
      where: { id },
      data: { status: next },
      select: CODE_SELECT,
    });
    await this.audit.log({
      actorType: "ADMIN",
      actorId: actor.id,
      action: "admin.reactivated_code",
      entity: "ActivationCode",
      entityId: id,
      metadata: { restoredStatus: next },
      ip,
    });
    return updated;
  }

  /**
   * Revocación terminal: el código muere y, si tenía cliente con acceso,
   * el cliente se suspende (Fase 6 corta el acceso por estado del cliente).
   */
  async revoke(
    id: string,
    actor: AdminIdentity,
    ip?: string,
  ): Promise<unknown> {
    const code = await this.requireCode(id);
    if (code.status === "REVOKED") {
      return this.get(id);
    }
    const updated = await this.prisma.activationCode.update({
      where: { id },
      data: { status: "REVOKED" },
      select: CODE_SELECT,
    });
    await this.audit.log({
      actorType: "ADMIN",
      actorId: actor.id,
      action: "admin.revoked_code",
      entity: "ActivationCode",
      entityId: id,
      metadata: { previousStatus: code.status },
      ip,
    });
    if (code.customerId !== null) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: code.customerId },
        select: { id: true, status: true },
      });
      if (customer !== null && customer.status === "ACTIVE") {
        await this.customers.suspend(
          customer.id,
          {},
          actor,
          ip,
        );
      }
    }
    return updated;
  }

  /**
   * Cambia el límite de dispositivos (p. ej. de 1 a 2 para habilitar
   * un segundo equipo). No afecta a los ya vinculados.
   */
  async update(
    dto: UpdateCodeDto,
    id: string,
    actor: AdminIdentity,
    ip?: string,
  ): Promise<unknown> {
    const code = await this.requireCode(id);
    if (code.deviceLimit === dto.deviceLimit) {
      return this.get(id);
    }
    const updated = await this.prisma.activationCode.update({
      where: { id },
      data: { deviceLimit: dto.deviceLimit },
      select: CODE_SELECT,
    });
    await this.audit.log({
      actorType: "ADMIN",
      actorId: actor.id,
      action: "admin.updated_code_limit",
      entity: "ActivationCode",
      entityId: id,
      metadata: { previousLimit: code.deviceLimit, newLimit: dto.deviceLimit },
      ip,
    });
    return updated;
  }

  /**
   * Resolución para el flujo de activación (Fase 6 usa este método).
   * Error siempre genérico: no distingue inexistente/revocado/vencido.
   */
  async resolveForActivation(plainCode: string): Promise<{
    id: string;
    status: ActivationCodeStatus;
    prefix: string;
    planId: string;
    customerId: string | null;
    deviceLimit: number;
    expiresAt: Date | null;
    activatedAt: Date | null;
  }> {
    const found = await this.prisma.activationCode.findUnique({
      where: { codeHash: hashCode(plainCode, this.pepper()) },
      select: {
        id: true,
        status: true,
        prefix: true,
        planId: true,
        customerId: true,
        deviceLimit: true,
        expiresAt: true,
        activatedAt: true,
      },
    });
    if (found === null) {
      throw INVALID_CODE();
    }
    return found;
  }

  private async requireCode(id: string): Promise<{
    id: string;
    status: "PENDING" | "ACTIVE" | "EXPIRED" | "SUSPENDED" | "REVOKED";
    customerId: string | null;
    deviceLimit: number;
    activatedAt: Date | null;
    expiresAt: Date | null;
  }> {
    const code = await this.prisma.activationCode.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        customerId: true,
        deviceLimit: true,
        activatedAt: true,
        expiresAt: true,
      },
    });
    if (code === null) {
      throw new NotFoundException("Código no encontrado.");
    }
    return code;
  }
}
