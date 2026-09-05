import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { EpgSyncController } from "./epg-sync.controller";
import { EpgSyncScheduler } from "./epg-sync.scheduler";
import { EpgSyncService } from "./epg-sync.service";
import { IptvSyncController } from "./iptv-sync.controller";
import { IptvSyncScheduler } from "./iptv-sync.scheduler";
import { IptvSyncService } from "./iptv-sync.service";
import { StreamHealthService } from "./stream-health.service";
import { StreamHealthScheduler } from "./stream-health.scheduler";

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [IptvSyncController, EpgSyncController],
  providers: [
    IptvSyncService,
    IptvSyncScheduler,
    StreamHealthService,
    StreamHealthScheduler,
    EpgSyncService,
    EpgSyncScheduler,
  ],
  exports: [IptvSyncService],
})
export class IptvSyncModule {}
