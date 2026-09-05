import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { StatsService } from "./stats.service";
import type { StatsData } from "./stats.service";

@ApiTags("admin-stats")
@Controller("admin/stats")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get()
  @ApiOperation({ summary: "Métricas agregadas para el dashboard (cualquier admin)" })
  getStats(): Promise<StatsData> {
    return this.stats.getStats();
  }
}
