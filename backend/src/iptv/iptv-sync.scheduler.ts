import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";
import { IptvSyncService } from "./iptv-sync.service";

/**
 * Job periódico de sincronización IPTV. Deshabilitado por defecto
 * (IPTV_SYNC_ENABLED=false); el intervalo se toma de IPTV_SYNC_CRON.
 */
@Injectable()
export class IptvSyncScheduler implements OnModuleInit {
  private readonly logger = new Logger(IptvSyncScheduler.name);

  constructor(
    private readonly config: ConfigService,
    private readonly sync: IptvSyncService,
    private readonly registry: SchedulerRegistry,
  ) {}

  onModuleInit(): void {
    const enabled = this.config.get<string>("IPTV_SYNC_ENABLED") === "true";
    if (!enabled) {
      this.logger.log("Sync IPTV programado deshabilitado (IPTV_SYNC_ENABLED=false).");
      return;
    }
    const cron = this.config.get<string>("IPTV_SYNC_CRON") ?? "0 */6 * * *";
    const job = new CronJob(
      cron,
      () => {
        void this.runScheduled();
      },
      null,
      false,
      "America/Argentina/Buenos_Aires",
    );
    this.registry.addCronJob("iptv-sync", job);
    job.start();
    this.logger.log(`Sync IPTV programado habilitado (cron: ${cron}).`);
  }

  private async runScheduled(): Promise<void> {
    try {
      const result = await this.sync.sync();
      this.logger.log(
        `Sync IPTV programado: ${result.channels} canales en ${result.durationMs}ms`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Sync IPTV programado falló: ${msg}`);
    }
  }
}
