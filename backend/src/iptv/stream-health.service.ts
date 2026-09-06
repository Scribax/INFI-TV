import { execFile } from "node:child_process";
import { promisify } from "node:util";
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
const AUDIO_CHECK_TIMEOUT_MS = 8000;
const execFileAsync = promisify(execFile);
let ffprobeChecked = false;
let ffprobeAvailable = false;
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

  /**
   * Verifica que el stream traiga al menos una pista de audio (ffprobe).
   * Devuelve true = tiene audio, false = confirmado sin audio,
   * undefined = no se pudo determinar (se conserva el estado ONLINE).
   * Si ffprobe no está instalado, se desactiva solo sin romper el check.
   */
  private async hasAudio(url: string): Promise<boolean | undefined> {
    if (!url.startsWith("http") || url.includes("youtube")) return undefined;
    if (!ffprobeChecked) {
      ffprobeChecked = true;
      try {
        await execFileAsync("ffprobe", ["-version"], { timeout: 5000 });
        ffprobeAvailable = true;
      } catch {
        this.logger.warn("ffprobe no disponible: chequeo de audio desactivado");
        ffprobeAvailable = false;
      }
    }
    if (!ffprobeAvailable) return undefined;
    try {
      const { stdout } = await execFileAsync(
        "ffprobe",
        [
          "-v",
          "error",
          "-rw_timeout",
          "8000000",
          "-analyzeduration",
          "3000000",
          "-probesize",
          "1000000",
          "-show_entries",
          "stream=codec_type",
          "-of",
          "csv=p=0",
          url,
        ],
        { timeout: AUDIO_CHECK_TIMEOUT_MS },
      );
      const types = stdout.split(/[\r\n]+/).map((l) => l.trim());
      if (types.length === 0) return undefined;
      return types.includes("audio") ? true : false;
    } catch {
      return undefined;
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
        let status = await this.probe(ch.streamUrl);
        if (status === "ONLINE") {
          const audio = await this.hasAudio(ch.streamUrl);
          if (audio === false) {
            this.logger.log(`Sin audio: ${ch.id} -> OFFLINE`);
            status = "OFFLINE";
          }
        }
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

    this.logger.log(
      `Health check COMPLETO: ${done} canales (online=${online}, offline=${offline}, timeout=${timeout}) en ${((Date.now() - started) / 1000).toFixed(0)}s`,
    );

    return {
      checked: done,
      online,
      offline,
      timeout,
      durationMs: Date.now() - started,
    };
  }
}
