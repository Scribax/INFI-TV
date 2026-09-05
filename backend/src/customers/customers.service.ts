import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { CustomerStatus } from "@prisma/client";
import { buildPagination } from "@infitv/utils";
import type { Paginated } from "@infitv/types";
import { AuditService } from "../audit/audit.service";
import type { AdminIdentity } from "../auth/current-admin.decorator";
import { PrismaService } from "../common/prisma/prisma.service";
import type {
  CreateCustomerDto,
  RenewCustomerDto,
  SuspendCustomerDto,
  UpdateCustomerDto,
} from "./dto/customers.dto";
import type { CustomersQueryDto } from "./dto/customers-query.dto";

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * MS_PER_DAY);
}

/**
 * Fuente de verdad efectiva: el backend es la autoridad.
 * Un cliente accede solo si está ACTIVE y (sin vencimiento o no vencido).
 * El `status` materializado lo mantienen las operaciones de ciclo de vida
 * más el job horario; esta función cubre cualquier desfasaje.
 */
export function isEffectivelyActive(
  customer: { status: CustomerStatus; expiresAt: Date | null },
  now: Date = new Date(),
): boolean {
  if (customer.status !== "ACTIVE") {
    return false;
  }
  if (customer.expiresAt !== null && customer.expiresAt.getTime() <= now.getTime()) {
    return false;
  }
  return true;
}

const PLAN_SELECT = {
  id: true,
  name: true,
  durationDays: true,
  deviceLimit: true,
  isActive: true,
} as const;

const LIST_SELECT = {
  id: true,
  displayName: true,
  status: true,
  planId: true,
  expiresAt: true,
  lastSeenAt: true,
  notes: true,
  suspensionReason: true,
  createdAt: true,
  updatedAt: true,
  plan: { select: PLAN_SELECT },
} as const;

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(
    dto: CreateCustomerDto,
    actor: AdminIdentity,
    ip?: string,
  ): Promise<unknown> {
    const plan =
      dto.planId === undefined ? null : await this.requireActivePlan(dto.planId);
    const now = new Date();
    const created = await this.prisma.customer.create({
      data: {
        displayName: dto.displayName.trim(),
        status: "ACTIVE",
        planId: plan?.id,
        expiresAt: plan === null ? null : addDays(now, plan.durationDays),
        notes: dto.notes,
      },
      select: LIST_SELECT,
    });
    await this.audit.log({
      actorType: "ADMIN",
      actorId: actor.id,
      action: "admin.created_customer",
      entity: "Customer",
      entityId: created.id,
      metadata: {
        displayName: created.displayName,
        planId: created.planId,
        expiresAt: created.expiresAt?.toISOString() ?? null,
      },
      ip,
    });
    return created;
  }

  async list(q: CustomersQueryDto): Promise<Paginated<unknown>> {
    const where: Prisma.CustomerWhereInput = {};
    if (q.status !== undefined) {
      where.status = q.status;
    }
    if (q.planId !== undefined) {
      where.planId = q.planId;
    }
    if (q.search !== undefined && q.search.trim() !== "") {
      where.displayName = { contains: q.search.trim(), mode: "insensitive" };
    }
    const total = await this.prisma.customer.count({ where });
    const p = buildPagination({
      page: q.page ?? 1,
      pageSize: q.pageSize ?? 20,
      total,
    });
    const items = await this.prisma.customer.findMany({
      where,
      select: LIST_SELECT,
      orderBy: { updatedAt: "desc" },
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

  async get(id: string): Promise<unknown> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      select: {
        ...LIST_SELECT,
        _count: {
          select: { devices: true, sessions: true, favorites: true },
        },
      },
    });
    if (customer === null) {
      throw new NotFoundException("Cliente no encontrado.");
    }
    return customer;
  }

  async update(
    id: string,
    dto: UpdateCustomerDto,
    actor: AdminIdentity,
    ip?: string,
  ): Promise<unknown> {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (customer === null) {
      throw new NotFoundException("Cliente no encontrado.");
    }
    if (dto.planId !== undefined) {
      await this.requireActivePlan(dto.planId);
    }
    const updated = await this.prisma.customer.update({
      where: { id },
      data: {
        displayName: dto.displayName?.trim(),
        notes: dto.notes,
        planId: dto.planId,
      },
      select: LIST_SELECT,
    });
    await this.audit.log({
      actorType: "ADMIN",
      actorId: actor.id,
      action: "admin.updated_customer",
      entity: "Customer",
      entityId: id,
      ip,
    });
    return updated;
  }

  async suspend(
    id: string,
    dto: SuspendCustomerDto,
    actor: AdminIdentity,
    ip?: string,
  ): Promise<unknown> {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (customer === null) {
      throw new NotFoundException("Cliente no encontrado.");
    }
    if (customer.status === "SUSPENDED") {
      return this.get(id);
    }
    const updated = await this.prisma.customer.update({
      where: { id },
      data: { status: "SUSPENDED", suspensionReason: dto.reason ?? null },
      select: LIST_SELECT,
    });
    await this.audit.log({
      actorType: "ADMIN",
      actorId: actor.id,
      action: "admin.suspended_customer",
      entity: "Customer",
      entityId: id,
      metadata: { reason: dto.reason ?? null, previousStatus: customer.status },
      ip,
    });
    return updated;
  }

  async reactivate(
    id: string,
    actor: AdminIdentity,
    ip?: string,
  ): Promise<unknown> {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (customer === null) {
      throw new NotFoundException("Cliente no encontrado.");
    }
    if (customer.status === "ACTIVE") {
      return this.get(id);
    }
    const updated = await this.prisma.customer.update({
      where: { id },
      data: { status: "ACTIVE", suspensionReason: null },
      select: LIST_SELECT,
    });
    await this.audit.log({
      actorType: "ADMIN",
      actorId: actor.id,
      action: "admin.reactivated_customer",
      entity: "Customer",
      entityId: id,
      metadata: { previousStatus: customer.status },
      ip,
    });
    return updated;
  }

  /**
   * Renueva desde lo más favorable: max(ahora, vencimiento actual) + duración.
   * Reactiva en el acto (un vencido renovado vuelve a ACTIVE).
   */
  async renew(
    id: string,
    dto: RenewCustomerDto,
    actor: AdminIdentity,
    ip?: string,
    now: Date = new Date(),
  ): Promise<unknown> {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (customer === null) {
      throw new NotFoundException("Cliente no encontrado.");
    }
    const planId = dto.planId ?? customer.planId;
    if (planId === null) {
      throw new BadRequestException(
        "El cliente no tiene plan: indicá planId para renovar.",
      );
    }
    const plan = await this.requireActivePlan(planId);
    const base =
      customer.expiresAt !== null && customer.expiresAt.getTime() > now.getTime()
        ? customer.expiresAt
        : now;
    const expiresAt = addDays(base, plan.durationDays);
    const updated = await this.prisma.customer.update({
      where: { id },
      data: { planId: plan.id, expiresAt, status: "ACTIVE" },
      select: LIST_SELECT,
    });
    await this.audit.log({
      actorType: "ADMIN",
      actorId: actor.id,
      action: "admin.renewed_customer",
      entity: "Customer",
      entityId: id,
      metadata: {
        planId: plan.id,
        previousExpiresAt: customer.expiresAt?.toISOString() ?? null,
        newExpiresAt: expiresAt.toISOString(),
      },
      ip,
    });
    return updated;
  }

  async remove(
    id: string,
    actor: AdminIdentity,
    ip?: string,
  ): Promise<{ deleted: true }> {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (customer === null) {
      throw new NotFoundException("Cliente no encontrado.");
    }
    await this.prisma.customer.delete({ where: { id } });
    await this.audit.log({
      actorType: "ADMIN",
      actorId: actor.id,
      action: "admin.deleted_customer",
      entity: "Customer",
      entityId: id,
      metadata: { displayName: customer.displayName },
      ip,
    });
    return { deleted: true as const };
  }

  private async requireActivePlan(
    planId: string,
  ): Promise<{ id: string; durationDays: number }> {
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
      select: { id: true, durationDays: true, isActive: true },
    });
    if (plan === null) {
      throw new NotFoundException("Plan no encontrado.");
    }
    if (!plan.isActive) {
      throw new BadRequestException("El plan está inactivo.");
    }
    return plan;
  }
}
