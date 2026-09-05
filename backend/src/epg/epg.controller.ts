import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../activation/session.guard";
import { EpgService } from "./epg.service";

function parseLimit(raw: string | undefined, fallback: number, max: number): number {
  if (raw === undefined) {
    return fallback;
  }
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) {
    return fallback;
  }
  return Math.min(Math.max(n, 1), max);
}

@ApiTags("epg")
@Controller()
@UseGuards(SessionGuard)
@ApiBearerAuth()
export class EpgController {
  constructor(private readonly epg: EpgService) {}

  @Get("channels/:id/epg")
  @ApiOperation({ summary: "Programación de un canal (desde ahora)" })
  forChannel(
    @Param("id") id: string,
    @Query("limit") limit?: string,
  ) {
    return this.epg.forChannel(id, new Date(), parseLimit(limit, 12, 50));
  }

  @Get("epg/now")
  @ApiOperation({ summary: "Programas al aire ahora (máx 100)" })
  now(@Query("limit") limit?: string) {
    return this.epg.now(parseLimit(limit, 50, 100));
  }
}
