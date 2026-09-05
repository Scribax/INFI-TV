import { Controller, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { CurrentAdmin } from "../auth/current-admin.decorator";
import type { AdminIdentity } from "../auth/current-admin.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { IptvSyncService } from "./iptv-sync.service";
import type { SyncResult } from "./iptv-sync.service";
import { StreamHealthService } from "./stream-health.service";

@ApiTags("admin-iptv")
@Controller("admin/iptv")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class IptvSyncController {
  constructor(
    private readonly sync: IptvSyncService,
    private readonly health: StreamHealthService,
  ) {}

  @Post("sync")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Sincroniza el catálogo con IPTV-org (manual)" })
  syncNow(
    @CurrentAdmin() actor: AdminIdentity,
    @Req() req: Request,
  ): Promise<SyncResult> {
    return this.sync.sync(actor, req.ip);
  }

  @Post("healthcheck")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Prueba los streams en background y marca ONLINE/OFFLINE/TIMEOUT" })
  healthCheck(@Query("limit") limit?: string): { started: true } {
    const n = limit !== undefined ? Number(limit) : undefined;
    void this.health.checkAll(Number.isFinite(n) && n !== undefined ? n : undefined);
    return { started: true };
  }
}
