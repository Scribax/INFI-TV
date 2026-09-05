import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../common/prisma/prisma.service";

/**
 * Marca EXPIRED a los ACTIVE vencidos, cada hora.
 * Escribe UNA fila de auditoría resumen (no una por cliente).
 */
@Injectable()
export class CustomerExpirationService {
  private readonly logger = new Logger(CustomerExpirationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Cron("0 * * * *")
  async handleCron(): Promise<void> {
    const { expired } = await this.expireOverdue();
    if (expired > 0) {
      this.logger.log(`Clientes expirados automáticamente: ${expired}`);
    }
  }

  async expireOverdue(now: Date = new Date()): Promise<{ expired: number }> {
    const res = await this.prisma.customer.updateMany({
      where: { status: "ACTIVE", expiresAt: { lt: now } },
      data: { status: "EXPIRED" },
    });
    if (res.count > 0) {
      await this.audit.log({
        actorType: "SYSTEM",
        action: "system.expired_customers",
        entity: "Customer",
        metadata: { count: res.count },
      });
    }
    return { expired: res.count };
  }
}
