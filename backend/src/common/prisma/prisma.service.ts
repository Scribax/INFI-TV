import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

/**
 * Cliente Prisma como provider global.
 * Si la DB no está disponible, registra WARN y permite que la API
 * arranque igual (health reporta db: down). No oculta el error:
 * queda en logs y el health check lo expone.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private connected = false;

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.connected = true;
    } catch (err: unknown) {
      this.connected = false;
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`PostgreSQL no disponible en el arranque: ${msg}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  isConnected(): boolean {
    return this.connected;
  }

  /** Ping barato para el healthcheck. Nunca lanza. */
  async ping(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      this.connected = true;
      return true;
    } catch {
      this.connected = false;
      return false;
    }
  }
}
