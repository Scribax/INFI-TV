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
import type { DevicesQueryDto } from "./dto/devices-query.dto";

const DEVICE_SELECT = {
  id: true,
  customerId: true,
  appInstanceId: true,
  platform: true,
  appVersion: true,
  model: true,
  osVersion: true,
  lastSeenAt: true,
  ipLast: true,
  status: true,
  activationCodeId: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class DevicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(q: DevicesQueryDto): Promise<Paginated<unknown>> {
    const where: Prisma.DeviceWhereInput = {};
    if (q.customerId !== undefined) {
      where.customerId = q.customerId;
    }
    if (q.status !== undefined) {
      where.status = q.status;
    }
    if (q.search !== undefined && q.search.trim() !== "") {
      const s = q.search.trim();
      where.OR = [
        { platform: { contains: s, mode: "insensitive" } },
        { model: { contains: s, mode: "insensitive" } },
        { appVersion: { contains: s, mode: "insensitive" } },
      ];
    }
    const total = await this.prisma.device.count({ where });
    const p = buildPagination({
      page: q.page ?? 1,
      pageSize: q.pageSize ?? 20,
      total,
    });
    const items = await this.prisma.device.findMany({
      where,
      select: {
        ...DEVICE_SELECT,
        customer: { select: { id: true, displayName: true, status: true } },
      },
      orderBy: { lastSeenAt: "desc" },
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
    const device = await this.prisma.device.findUnique({
      where: { id },
      select: {
        ...DEVICE_SELECT,
        customer: { select: { id: true, displayName: true, status: true } },
        sessions: {
          select: { id: true, status: true, expiresAt: true, lastSeenAt: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
    if (device === null) {
      throw new NotFoundException("Dispositivo no encontrado.");
    }
    return device;
  }

  async revoke(
    id: string,
    actor: AdminIdentity,
    ip?: string,
  ): Promise<unknown> {
    return this.setStatus(id, "REVOKED", actor, "admin.revoked_device", ip);
  }

  async block(id: string, actor: AdminIdentity, ip?: string): Promise<unknown> {
    return this.setStatus(id, "BLOCKED", actor, "admin.blocked_device", ip);
  }

  async unblock(
    id: string,
    actor: AdminIdentity,
    ip?: string,
  ): Promise<unknown> {
    const device = await this.requireDevice(id);
    if (device.status === "ACTIVE") {
      return this.get(id);
    }
    if (device.status !== "BLOCKED") {
      throw new ConflictException(
        `Solo se puede desbloquear un dispositivo BLOCKED (actual: ${device.status}).`,
      );
    }
    return this.setStatus(id, "ACTIVE", actor, "admin.unblocked_device", ip);
  }

  /**
   * Desvincula: borra la fila y libera el slot (el cliente puede activar
   * otro dispositivo). Las sesiones en cascada se eliminan por FK.
   */
  async remove(
    id: string,
    actor: AdminIdentity,
    ip?: string,
  ): Promise<{ deleted: true }> {
    const device = await this.requireDevice(id);
    await this.prisma.device.delete({ where: { id } });
    await this.audit.log({
      actorType: "ADMIN",
      actorId: actor.id,
      action: "admin.unlinked_device",
      entity: "Device",
      entityId: id,
      metadata: { customerId: device.customerId, previousStatus: device.status },
      ip,
    });
    return { deleted: true as const };
  }

  private async setStatus(
    id: string,
    status: "ACTIVE" | "REVOKED" | "BLOCKED",
    actor: AdminIdentity,
    action: string,
    ip?: string,
  ): Promise<unknown> {
    const device = await this.requireDevice(id);
    if (device.status === status) {
      return this.get(id);
    }
    const updated = await this.prisma.device.update({
      where: { id },
      data: { status },
      select: DEVICE_SELECT,
    });
    await this.audit.log({
      actorType: "ADMIN",
      actorId: actor.id,
      action,
      entity: "Device",
      entityId: id,
      metadata: { previousStatus: device.status },
      ip,
    });
    return updated;
  }

  private async requireDevice(id: string): Promise<{
    id: string;
    customerId: string;
    status: "ACTIVE" | "REVOKED" | "BLOCKED";
  }> {
    const device = await this.prisma.device.findUnique({
      where: { id },
      select: { id: true, customerId: true, status: true },
    });
    if (device === null) {
      throw new NotFoundException("Dispositivo no encontrado.");
    }
    return device;
  }
}
