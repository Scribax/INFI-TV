import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../common/prisma/prisma.service";
import { parseXmltv } from "./xmltv-parser";

export interface EpgSyncResult {
  source: string;
  parsed: number;
  mapped: number;
  stored: number;
  durationMs: number;
}

const HORIZON_HOURS = 24;
const BATCH_SIZE = 5000;

/**
 * Sincroniza la guía EPG (XMLTV) y persiste solo lo relevante:
 * programas que terminan en el futuro y arrancan dentro del horizonte
 * (ahora → +24 h). Mapea `channel` (tvg-id) → `Channel.externalId`.
 * Si la fuente falla, NO toca los datos existentes.
 */
@Injectable()
export class EpgSyncService {
  private readonly logger = new Logger(EpgSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private sourceUrl(): string {
    return this.config.get<string>("EPG_SOURCE_URL") ?? "";
  }

  async sync(): Promise<EpgSyncResult> {
    const started = Date.now();
    const url = this.sourceUrl();
    if (url === "") {
      throw new Error("EPG_SOURCE_URL no configurada.");
    }

    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) {
      throw new Error(`Fuente EPG no disponible (HTTP ${res.status}).`);
    }
    const xml = await res.text();
    const entries = parseXmltv(xml);
    const parsed = entries.length;

    const now = Date.now();
    const horizon = now + HORIZON_HOURS * 3600 * 1000;
    const relevant = entries.filter((e) => {
      const start = Date.parse(e.startsAt);
      const end = Date.parse(e.endsAt);
      return end >= now && start <= horizon;
    });

    const tvgIds = [...new Set(relevant.map((e) => e.channelId))];
    const channels = await this.prisma.channel.findMany({
      where: { externalId: { in: tvgIds } },
      select: { id: true, externalId: true },
    });
    const idByExternal = new Map(
      channels.map((c) => [c.externalId, c.id] as const),
    );
    const mapped = channels.length;

    const channelIds = channels.map((c) => c.id);
    if (channelIds.length > 0) {
      await this.prisma.ePGProgram.deleteMany({
        where: { channelId: { in: channelIds } },
      });
    }

    const rows = relevant
      .filter((e) => idByExternal.has(e.channelId))
      .map((e) => ({
        channelId: idByExternal.get(e.channelId) as string,
        title: e.title,
        description: e.description,
        startsAt: new Date(e.startsAt),
        endsAt: new Date(e.endsAt),
      }));

    let stored = 0;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const chunk = rows.slice(i, i + BATCH_SIZE);
      const result = await this.prisma.ePGProgram.createMany({ data: chunk });
      stored += result.count;
    }

    this.logger.log(
      `EPG sync: ${parsed} programas parseados, ${mapped} canales, ${stored} almacenados.`,
    );

    return {
      source: url,
      parsed,
      mapped,
      stored,
      durationMs: Date.now() - started,
    };
  }
}
