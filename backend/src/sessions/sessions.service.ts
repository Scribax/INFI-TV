import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { buildPagination } from "@infitv/utils";
import type { Paginated } from "@infitv/types";
import { AuditService } from "../audit/audit.service";
import type { AdminIdentity } from "../auth/current-admin.decorator";
import { PrismaService } from "../common/prisma/prisma.service";
import type { SessionsQueryDto } from "./dto/sessions-query.dto";

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(q: SessionsQueryDto): Promise<Paginated<unknown>> {
    const where: Prisma.SessionWhereInput = {};
    if (q.customerId !== undefined) {
      where.customerId = q.customerId;
    }
    if (q.deviceId !== undefined) {
      where.deviceId = q.deviceId;
    }
    if (q.status !== undefined) {
      where.status = q.status;
    }
    const total = await this.prisma.session.count({ where });
    const p = buildPagination({
      page: q.page ?? 1,
      pageSize: q.pageSize ?? 20,
      total,
    });
    const items = await this.prisma.session.findMany({
      where,
      select: {
        id: true,
        customerId: true,
        deviceId: true,
        status: true,
        expiresAt: true,
        lastSeenAt: true,
        ipCreated: true,
        createdAt: true,
        customer: { select: { id: true, displayName: true } },
        device: { select: { id: true, platform: true, appVersion: true } },
      },
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

  async revoke(
    id: string,
    actor: AdminIdentity,
    ip?: string,
  ): Promise<unknown> {
    const session = await this.prisma.session.findUnique({
      where: { id },
      select: { id: true, status: true, customerId: true },
    });
    if (session === null) {
      throw new NotFoundException("Sesión no encontrada.");
    }
    if (session.status !== "ACTIVE") {
      return session;
    }
    const updated = await this.prisma.session.update({
      where: { id },
      data: { status: "REVOKED" },
      select: { id: true, status: true, customerId: true },
    });
    await this.audit.log({
      actorType: "ADMIN",
      actorId: actor.id,
      action: "admin.revoked_session",
      entity: "Session",
      entityId: id,
      metadata: { customerId: session.customerId },
      ip,
    });
    return updated;
  }
}
