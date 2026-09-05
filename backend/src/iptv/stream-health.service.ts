import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";

export interface HealthCheckResult {
  checked: number;
  online: number;
  offline: number;
  timeout: number;
  durationMs: number;
}

const CONCURRENCY = 25;
const TIMEOUT_MS = 6000;
const UA =
  "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36";

/**
 * Prueba cada stream de canal (GET con Range, como un reproductor) y marca
 * streamStatus ONLINE/OFFLINE/TIMEOUT. Concurrencia limitada para no saturar.
 */
@Injectable()
export class StreamHealthService {
  private readonly logger = new Logger(StreamHealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async probe(url: string): Promise<"ONLINE" | "OFFLINE" | "TIMEOUT"> {
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { Range: "bytes=0-1023", "User-Agent": UA },
        redirect: "follow",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      return res.status === 200 || res.status === 206 ? "ONLINE" : "OFFLINE";
    } catch (e) {
      const name = (e as Error).name;
      return name === "TimeoutError" || name === "AbortError" ? "TIMEOUT" : "OFFLINE";
    }
  }

  async checkAll(limit?: number): Promise<HealthCheckResult> {
    const started = Date.now();
    const channels = await this.prisma.channel.findMany({
      where: {
        isActive: true,
        isHidden: false,
        OR: [
          { streamStatus: { not: "ONLINE" } },
          { lastCheckedAt: { lt: new Date(Date.now() - 12 * 3600 * 1000) } },
        ],
      },
      select: { id: true, streamUrl: true },
      orderBy: { countryCode: "asc" },
      take: limit ?? 100000,
    });

    let online = 0;
    let offline = 0;
    let timeout = 0;
    let done = 0;
    const queue = [...channels];

    const worker = async (): Promise<void> => {
      while (queue.length > 0) {
        const ch = queue.shift();
        if (ch === undefined) return;
        const status = await this.probe(ch.streamUrl);
        if (status === "ONLINE") online++;
        else if (status === "TIMEOUT") timeout++;
        else offline++;
        await this.prisma.channel.update({
          where: { id: ch.id },
          data: {
            streamStatus: status,
            lastCheckedAt: new Date(),
            ...(status === "ONLINE"
              ? { lastSuccessfulAt: new Date(), failureCount: 0 }
              : { failureCount: { increment: 1 } }),
          },
        });
        done++;
        if (done % 500 === 0) {
          this.logger.log(`Health check: ${done}/${channels.length} (online=${online})`);
        }
      }
    };

    const workerCount = Math.min(CONCURRENCY, channels.length);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));

    return {
      checked: done,
      online,
      offline,
      timeout,
      durationMs: Date.now() - started,
    };
  }
}
