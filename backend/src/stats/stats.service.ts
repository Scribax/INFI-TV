import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";

export interface StatsData {
  customers: {
    total: number;
    active: number;
    expired: number;
    suspended: number;
  };
  codes: {
    total: number;
    pending: number;
    active: number;
    revoked: number;
  };
  devices: {
    total: number;
    active: number;
    blocked: number;
  };
  sessions: {
    active: number;
  };
  activations: {
    total: number;
  };
  playback: {
    plays: number;
    errors: number;
  };
  channels: {
    total: number;
    online: number;
    offline: number;
  };
  lastSeenAt: string | null;
}

/**
 * Métricas agregadas para el dashboard (FASE 7 + telemetría FASE 17).
 * Una sola consulta en paralelo; evita que el panel haga N requests.
 */
@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<StatsData> {
    const [
      customersTotal,
      customersActive,
      customersExpired,
      customersSuspended,
      codesTotal,
      codesPending,
      codesActive,
      codesRevoked,
      devicesTotal,
      devicesActive,
      devicesBlocked,
      sessionsActive,
      playbackPlays,
      playbackErrors,
      channelsTotal,
      channelsOnline,
      channelsOffline,
      lastSeen,
    ] = await Promise.all([
      this.prisma.customer.count(),
      this.prisma.customer.count({ where: { status: "ACTIVE" } }),
      this.prisma.customer.count({ where: { status: "EXPIRED" } }),
      this.prisma.customer.count({ where: { status: "SUSPENDED" } }),
      this.prisma.activationCode.count(),
      this.prisma.activationCode.count({ where: { status: "PENDING" } }),
      this.prisma.activationCode.count({ where: { status: "ACTIVE" } }),
      this.prisma.activationCode.count({ where: { status: "REVOKED" } }),
      this.prisma.device.count(),
      this.prisma.device.count({ where: { status: "ACTIVE" } }),
      this.prisma.device.count({ where: { status: "BLOCKED" } }),
      this.prisma.session.count({ where: { status: "ACTIVE" } }),
      this.prisma.watchHistory.count(),
      this.prisma.channel.count({
        where: { streamStatus: { in: ["OFFLINE", "TIMEOUT"] } },
      }),
      this.prisma.channel.count(),
      this.prisma.channel.count({ where: { streamStatus: "ONLINE" } }),
      this.prisma.channel.count({ where: { streamStatus: "OFFLINE" } }),
      this.prisma.customer.findFirst({
        where: { lastSeenAt: { not: null } },
        orderBy: { lastSeenAt: "desc" },
        select: { lastSeenAt: true },
      }),
    ]);

    return {
      customers: {
        total: customersTotal,
        active: customersActive,
        expired: customersExpired,
        suspended: customersSuspended,
      },
      codes: {
        total: codesTotal,
        pending: codesPending,
        active: codesActive,
        revoked: codesRevoked,
      },
      devices: {
        total: devicesTotal,
        active: devicesActive,
        blocked: devicesBlocked,
      },
      sessions: { active: sessionsActive },
      activations: { total: codesActive },
      playback: { plays: playbackPlays, errors: playbackErrors },
      channels: {
        total: channelsTotal,
        online: channelsOnline,
        offline: channelsOffline,
      },
      lastSeenAt:
        lastSeen === null || lastSeen.lastSeenAt === null
          ? null
          : lastSeen.lastSeenAt.toISOString(),
    };
  }
}
