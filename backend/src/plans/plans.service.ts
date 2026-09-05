import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { buildPagination } from "@infitv/utils";
import type { Paginated } from "@infitv/types";
import { AuditService } from "../audit/audit.service";
import type { AdminIdentity } from "../auth/current-admin.decorator";
import { PrismaService } from "../common/prisma/prisma.service";
import type { CreatePlanDto, UpdatePlanDto } from "./dto/plans.dto";
import type { PlansQueryDto } from "./dto/plans-query.dto";

@Injectable()
export class PlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(
    dto: CreatePlanDto,
    actor: AdminIdentity,
    ip?: string,
  ): Promise<unknown> {
    const name = dto.name.trim();
    const existing = await this.prisma.plan.findUnique({ where: { name } });
    if (existing !== null) {
      throw new ConflictException("Ya existe un plan con ese nombre.");
    }
    const created = await this.prisma.plan.create({
      data: {
        name,
        durationDays: dto.durationDays,
        priceInternalCents: dto.priceInternalCents ?? 0,
        deviceLimit: dto.deviceLimit ?? 1,
        description: dto.description,
        isActive: dto.isActive ?? true,
      },
    });
    await this.audit.log({
      actorType: "ADMIN",
      actorId: actor.id,
      action: "admin.created_plan",
      entity: "Plan",
      entityId: created.id,
      metadata: { name, durationDays: created.durationDays },
      ip,
    });
    return created;
  }

  async list(q: PlansQueryDto): Promise<Paginated<unknown>> {
    const where: Prisma.PlanWhereInput = {};
    if (q.isActive !== undefined) {
      where.isActive = q.isActive;
    }
    if (q.search !== undefined && q.search.trim() !== "") {
      where.name = { contains: q.search.trim(), mode: "insensitive" };
    }
    const total = await this.prisma.plan.count({ where });
    const p = buildPagination({
      page: q.page ?? 1,
      pageSize: q.pageSize ?? 20,
      total,
    });
    const items = await this.prisma.plan.findMany({
      where,
      orderBy: { durationDays: "asc" },
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
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (plan === null) {
      throw new NotFoundException("Plan no encontrado.");
    }
    return plan;
  }

  async update(
    id: string,
    dto: UpdatePlanDto,
    actor: AdminIdentity,
    ip?: string,
  ): Promise<unknown> {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (plan === null) {
      throw new NotFoundException("Plan no encontrado.");
    }
    if (dto.name !== undefined) {
      const name = dto.name.trim();
      const clash = await this.prisma.plan.findUnique({ where: { name } });
      if (clash !== null && clash.id !== id) {
        throw new ConflictException("Ya existe un plan con ese nombre.");
      }
    }
    const updated = await this.prisma.plan.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        durationDays: dto.durationDays,
        priceInternalCents: dto.priceInternalCents,
        deviceLimit: dto.deviceLimit,
        description: dto.description,
        isActive: dto.isActive,
      },
    });
    await this.audit.log({
      actorType: "ADMIN",
      actorId: actor.id,
      action: "admin.updated_plan",
      entity: "Plan",
      entityId: id,
      ip,
    });
    return updated;
  }

  /**
   * Solo si nadie lo usa (clientes o códigos lo referencian con Restrict).
   * Desactivar es preferible a borrar; borrar es irreversible.
   */
  async remove(
    id: string,
    actor: AdminIdentity,
    ip?: string,
  ): Promise<{ deleted: true }> {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (plan === null) {
      throw new NotFoundException("Plan no encontrado.");
    }
    try {
      await this.prisma.plan.delete({ where: { id } });
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        err.code === "P2003"
      ) {
        throw new ConflictException(
          "El plan está en uso y no se puede borrar. Desactivalo en su lugar.",
        );
      }
      throw err;
    }
    await this.audit.log({
      actorType: "ADMIN",
      actorId: actor.id,
      action: "admin.deleted_plan",
      entity: "Plan",
      entityId: id,
      metadata: { name: plan.name },
      ip,
    });
    return { deleted: true as const };
  }
}
