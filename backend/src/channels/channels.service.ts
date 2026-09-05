import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { buildPagination } from "@infitv/utils";
import type { Paginated } from "@infitv/types";
import { PrismaService } from "../common/prisma/prisma.service";
import type { ChannelsQueryDto } from "./dto/channels-query.dto";

export interface ChannelCategory {
  slug: string;
  name: string;
}

export interface ChannelItem {
  id: string;
  name: string;
  logoUrl: string | null;
  streamUrl: string;
  countryCode: string | null;
  categories: ChannelCategory[];
  language: string | null;
  isActive: boolean;
  streamStatus: string;
}

export interface CountryItem {
  code: string;
  name: string;
  flag: string | null;
}

export interface CategoryItem {
  id: string;
  slug: string;
  name: string;
}

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

/**
 * Catálogo de canales (público con sesión de cliente). Solo expone canales
 * activos y no ocultos. El streamUrl viaja protegido por SessionGuard.
 */
@Injectable()
export class ChannelsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(q: ChannelsQueryDto): Prisma.ChannelWhereInput {
    const where: Prisma.ChannelWhereInput = { isActive: true, isHidden: false };
    if (q.country !== undefined && q.country.trim() !== "") {
      where.countryCode = q.country.trim().toUpperCase();
    }
    if (q.category !== undefined && q.category.trim() !== "") {
      where.categories = { some: { slug: q.category.trim() } };
    }
    if (q.search !== undefined && q.search.trim() !== "") {
      where.name = { contains: q.search.trim(), mode: "insensitive" };
    }
    return where;
  }

  async list(q: ChannelsQueryDto): Promise<Paginated<ChannelItem>> {
    const where = this.buildWhere(q);
    const total = await this.prisma.channel.count({ where });
    const p = buildPagination({
      page: q.page ?? 1,
      pageSize: q.pageSize ?? 20,
      total,
    });
    const items = await this.prisma.channel.findMany({
      where,
      select: CHANNEL_SELECT,
      orderBy: { name: "asc" },
      skip: p.offset,
      take: p.pageSize,
    });
    return {
      items: items as ChannelItem[],
      page: p.page,
      pageSize: p.pageSize,
      total: p.total,
      totalPages: p.totalPages,
    };
  }

  async get(id: string): Promise<ChannelItem> {
    const channel = await this.prisma.channel.findFirst({
      where: { id, isActive: true, isHidden: false },
      select: CHANNEL_SELECT,
    });
    if (channel === null) {
      throw new NotFoundException("Canal no encontrado.");
    }
    return channel as ChannelItem;
  }

  async listCountries(): Promise<CountryItem[]> {
    return this.prisma.country.findMany({
      select: { code: true, name: true, flag: true },
      orderBy: { name: "asc" },
    });
  }

  async listCategories(): Promise<CategoryItem[]> {
    return this.prisma.category.findMany({
      select: { id: true, slug: true, name: true },
      orderBy: { name: "asc" },
    });
  }
}
