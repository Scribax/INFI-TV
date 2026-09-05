import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";

const PROGRAM_SELECT = {
  id: true,
  title: true,
  description: true,
  startsAt: true,
  endsAt: true,
} as const;

/**
 * Lectura de la guía de programación (EPG). Siempre degrada con gracia:
 * si un canal no tiene EPG, devuelve una lista vacía.
 */
@Injectable()
export class EpgService {
  constructor(private readonly prisma: PrismaService) {}

  async forChannel(channelId: string, from: Date, limit: number) {
    const programs = await this.prisma.ePGProgram.findMany({
      where: { channelId, endsAt: { gt: from } },
      orderBy: { startsAt: "asc" },
      take: limit,
      select: PROGRAM_SELECT,
    });
    const now = Date.now();
    return programs.map((p) => ({
      ...p,
      isLive: p.startsAt.getTime() <= now && now < p.endsAt.getTime(),
    }));
  }

  async now(limit: number) {
    const now = new Date();
    return this.prisma.ePGProgram.findMany({
      where: { startsAt: { lte: now }, endsAt: { gt: now } },
      orderBy: { startsAt: "asc" },
      take: limit,
      select: {
        ...PROGRAM_SELECT,
        channelId: true,
        channel: {
          select: { id: true, name: true, logoUrl: true, countryCode: true },
        },
      },
    });
  }
}
