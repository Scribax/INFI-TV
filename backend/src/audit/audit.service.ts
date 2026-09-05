import { Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../common/prisma/prisma.service";

export interface AuditInput {
  actorType: "ADMIN" | "SYSTEM";
  actorId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
  ip?: string;
}

/**
 * Registro de auditoría. Nunca lanza: si la auditoría falla,
 * la operación principal no debe romperse (el error queda en logs).
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuditInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorType: input.actorType,
          actorId: input.actorId,
          action: input.action,
          entity: input.entity,
          entityId: input.entityId,
          metadata: input.metadata ?? undefined,
          ip: input.ip,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`No se pudo registrar auditoría ${input.action}: ${msg}`);
    }
  }
}
