import { Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { EpgSyncService } from "./epg-sync.service";
import type { EpgSyncResult } from "./epg-sync.service";

@ApiTags("admin-iptv")
@Controller("admin/epg")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EpgSyncController {
  constructor(private readonly sync: EpgSyncService) {}

  @Post("sync")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Sincroniza la guía EPG (manual)" })
  syncNow(): Promise<EpgSyncResult> {
    return this.sync.sync();
  }
}
