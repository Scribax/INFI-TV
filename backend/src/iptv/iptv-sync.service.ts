import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuditService } from "../audit/audit.service";
import type { AdminIdentity } from "../auth/current-admin.decorator";
import { PrismaService } from "../common/prisma/prisma.service";
import { countryName, flagEmoji, slugify } from "./countries";
import { dedupeChannels, parseM3u } from "./m3u-parser";

export interface SyncResult {
  source: string;
  parsed: number;
  channels: number;
  countries: number;
  categories: number;
  durationMs: number;
}

const DEFAULT_SOURCE = "https://iptv-org.github.io/iptv/index.m3u";
const BATCH_SIZE = 300;

/**
 * Sincroniza el catálogo desde IPTV-org de manera segura:
 * - Descarga + valida + parsea + deduplica en memoria.
 * - Si la descarga falla, NO toca los datos existentes.
 * - Upsert incremental: nunca borra canales por una actualización fallida.
 */
@Injectable()
export class IptvSyncService {
  private readonly logger = new Logger(IptvSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  private sourceUrl(): string {
    return this.config.get<string>("IPTV_SOURCE_URL") ?? DEFAULT_SOURCE;
  }

  private async fetchSource(url: string): Promise<string> {
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) {
      throw new Error(`Fuente IPTV no disponible (HTTP ${res.status}).`);
    }
    return res.text();
  }

  async sync(actor?: AdminIdentity, ip?: string): Promise<SyncResult> {
    const started = Date.now();
    const url = this.sourceUrl();
    const content = await this.fetchSource(url);
    const parsed = dedupeChannels(parseM3u(content));

    // 1) Países
    const countryCodes = new Set<string>();
    for (const channel of parsed) {
      if (channel.countryCode !== null) {
        countryCodes.add(channel.countryCode);
      }
    }
    for (const code of countryCodes) {
      await this.prisma.country.upsert({
        where: { code },
        create: { code, name: countryName(code), flag: flagEmoji(code) },
        update: { name: countryName(code), flag: flagEmoji(code) },
      });
    }

    // 2) Categorías
    const categoryNames = new Set<string>();
    for (const channel of parsed) {
      for (const category of channel.categories) {
        categoryNames.add(category);
      }
    }
    const categoryIdByName = new Map<string, string>();
    for (const name of categoryNames) {
      const slug = slugify(name);
      const category = await this.prisma.category.upsert({
        where: { slug },
        create: { slug, name },
        update: { name },
      });
      categoryIdByName.set(name, category.id);
    }

    // 3) Canales (upsert por lotes)
    let upserted = 0;
    for (let i = 0; i < parsed.length; i += BATCH_SIZE) {
      const chunk = parsed.slice(i, i + BATCH_SIZE);
      await this.prisma.$transaction(
        chunk.map((channel) => {
          const categoryIds = channel.categories
            .map((c) => categoryIdByName.get(c))
            .filter((id): id is string => id !== undefined);
          const data = {
            externalId: channel.externalId,
            name: channel.name,
            logoUrl: channel.logoUrl,
            streamUrl: channel.streamUrl,
            countryCode: channel.countryCode,
            sourceUpdatedAt: new Date(),
          };
          return this.prisma.channel.upsert({
            where: { externalId: channel.externalId },
            create: {
              ...data,
              ...(categoryIds.length > 0
                ? { categories: { connect: categoryIds.map((id) => ({ id })) } }
                : {}),
            },
            update: {
              ...data,
              categories: { set: categoryIds.map((id) => ({ id })) },
            },
          });
        }),
      );
      upserted += chunk.length;
      this.logger.log(`IPTV sync: ${upserted}/${parsed.length} canales procesados`);
    }

    if (actor !== undefined) {
      await this.audit.log({
        actorType: "ADMIN",
        actorId: actor.id,
        action: "admin.synced_iptv",
        entity: "Channel",
        metadata: {
          parsed: parsed.length,
          countries: countryCodes.size,
          categories: categoryNames.size,
        },
        ip,
      });
    }

    return {
      source: url,
      parsed: parsed.length,
      channels: upserted,
      countries: countryCodes.size,
      categories: categoryNames.size,
      durationMs: Date.now() - started,
    };
  }
}
