import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";

const CHANNEL_SELECT = {
  id: true,
  name: true,
  logoUrl: true,
  streamUrl: true,
  countryCode: true,
  language: true,
  isActive: true,
  streamStatus: true,
  categories: { select: { slug: true, name: true } },
} as const;

export interface HistoryItem {
  channel: unknown;
  watchedAt: string;
}

/**
 * Favoritos e historial del cliente autenticado (SessionGuard inyecta el
 * customerId desde la sesión validada contra la DB).
 */
@Injectable()
export class MeService {
  constructor(private readonly prisma: PrismaService) {}

  async listFavorites(customerId: string): Promise<unknown[]> {
    const favorites = await this.prisma.favorite.findMany({
      where: { customerId },
      select: { channel: { select: CHANNEL_SELECT } },
      orderBy: { createdAt: "desc" },
    });
    return favorites.map((f) => f.channel);
  }

  async addFavorite(
    customerId: string,
    channelId: string,
  ): Promise<{ favorited: true }> {
    await this.requireChannel(channelId);
    await this.prisma.favorite.upsert({
      where: { customerId_channelId: { customerId, channelId } },
      create: { customerId, channelId },
      update: {},
    });
    return { favorited: true as const };
  }

  async removeFavorite(
    customerId: string,
    channelId: string,
  ): Promise<{ favorited: false }> {
    await this.prisma.favorite.deleteMany({ where: { customerId, channelId } });
    return { favorited: false as const };
  }

  async listHistory(customerId: string): Promise<HistoryItem[]> {
    const history = await this.prisma.watchHistory.findMany({
      where: { customerId },
      select: {
        channel: { select: CHANNEL_SELECT },
        watchedAt: true,
      },
      orderBy: { watchedAt: "desc" },
      take: 20,
    });
    return history.map((h) => ({
      channel: h.channel,
      watchedAt: h.watchedAt.toISOString(),
    }));
  }

  async recordWatch(
    customerId: string,
    channelId: string,
  ): Promise<{ recorded: true }> {
    await this.requireChannel(channelId);
    await this.prisma.watchHistory.upsert({
      where: { customerId_channelId: { customerId, channelId } },
      create: { customerId, channelId },
      update: { watchedAt: new Date() },
    });
    return { recorded: true as const };
  }

  private async requireChannel(channelId: string): Promise<void> {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: { id: true },
    });
    if (channel === null) {
      throw new NotFoundException("Canal no encontrado.");
    }
  }
}
