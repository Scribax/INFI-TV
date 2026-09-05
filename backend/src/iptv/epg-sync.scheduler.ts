import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";
import { EpgSyncService } from "./epg-sync.service";

/**
 * Job periódico de sincronización EPG. Deshabilitado por defecto
 * (EPG_SYNC_ENABLED=false); el intervalo se toma de EPG_SYNC_CRON.
 */
@Injectable()
export class EpgSyncScheduler implements OnModuleInit {
  private readonly logger = new Logger(EpgSyncScheduler.name);

  constructor(
    private readonly config: ConfigService,
    private readonly sync: EpgSyncService,
    private readonly registry: SchedulerRegistry,
  ) {}

  onModuleInit(): void {
    const enabled = this.config.get<string>("EPG_SYNC_ENABLED") === "true";
    if (!enabled) {
      this.logger.log("Sync EPG programado deshabilitado (EPG_SYNC_ENABLED=false).");
      return;
    }
    const cron = this.config.get<string>("EPG_SYNC_CRON") ?? "0 */6 * * *";
    const job = new CronJob(
      cron,
      () => {
        void this.runScheduled();
      },
      null,
      false,
      "America/Argentina/Buenos_Aires",
    );
    this.registry.addCronJob("epg-sync", job);
    job.start();
    this.logger.log(`Sync EPG programado habilitado (cron: ${cron}).`);
  }

  private async runScheduled(): Promise<void> {
    try {
      const result = await this.sync.sync();
      this.logger.log(
        `Sync EPG programado: ${result.stored} programas en ${result.durationMs}ms`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Sync EPG programado falló: ${msg}`);
    }
  }
}
