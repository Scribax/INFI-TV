import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";

export interface HealthData {
  status: "ok";
  version: string;
  uptimeSec: number;
  database: "up" | "down";
}

/**
 * Healthcheck real: comprueba proceso + conectividad DB.
 * Nunca lanza: si la DB falla, reporta database: down.
 */
@Injectable()
export class HealthService {
  private readonly startedAt = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthData> {
    const dbUp = await this.prisma.ping();
    return {
      status: "ok",
      version: "0.2.0",
      uptimeSec: Math.floor((Date.now() - this.startedAt) / 1000),
      database: dbUp ? "up" : "down",
    };
  }
}
