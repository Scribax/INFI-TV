import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";
import { StreamHealthService } from "./stream-health.service";

/**
 * Job periódico del health check de streams. Deshabilitado por defecto
 * (HEALTH_CHECK_ENABLED=false); el intervalo se toma de HEALTH_CHECK_CRON.
 * Para producción: HEALTH_CHECK_ENABLED=true y HEALTH_CHECK_CRON="0 *\/5 * * *"
 * (cada 5 horas). En dev conviene dejarlo apagado porque el watch de
 * `start:dev` reinicia el proceso y corta los checks largos en vuelo.
 */
@Injectable()
export class StreamHealthScheduler implements OnModuleInit {
  private readonly logger = new Logger(StreamHealthScheduler.name);

  constructor(
    private readonly config: ConfigService,
    private readonly health: StreamHealthService,
    private readonly registry: SchedulerRegistry,
  ) {}

  onModuleInit(): void {
    const enabled = this.config.get<string>("HEALTH_CHECK_ENABLED") === "true";
    if (!enabled) {
      this.logger.log(
        "Health check programado deshabilitado (HEALTH_CHECK_ENABLED=false).",
      );
      return;
    }
    const cron = this.config.get<string>("HEALTH_CHECK_CRON") ?? "0 */5 * * *";
    const job = new CronJob(
      cron,
      () => {
        void this.runScheduled();
      },
      null,
      false,
      "America/Argentina/Buenos_Aires",
    );
    this.registry.addCronJob("stream-health", job);
    job.start();
    this.logger.log(`Health check programado habilitado (cron: ${cron}).`);
  }

  private async runScheduled(): Promise<void> {
    try {
      const result = await this.health.checkAll();
      this.logger.log(
        `Health check programado: ${result.checked} canales (online=${result.online}, offline=${result.offline}, timeout=${result.timeout}) en ${result.durationMs}ms`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Health check programado falló: ${msg}`);
    }
  }
}
