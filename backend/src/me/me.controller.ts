import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentSession } from "../activation/current-session.decorator";
import type { SessionIdentity } from "../activation/current-session.decorator";
import { SessionGuard } from "../activation/session.guard";
import { MeService } from "./me.service";
import type { HistoryItem } from "./me.service";

@ApiTags("me")
@Controller("me")
@UseGuards(SessionGuard)
@ApiBearerAuth()
export class MeController {
  constructor(private readonly me: MeService) {}

  @Get("favorites")
  @ApiOperation({ summary: "Canales favoritos del cliente" })
  listFavorites(@CurrentSession() s: SessionIdentity): Promise<unknown[]> {
    return this.me.listFavorites(s.customerId);
  }

  @Post("favorites/:channelId")
  @ApiOperation({ summary: "Agrega un favorito" })
  addFavorite(
    @CurrentSession() s: SessionIdentity,
    @Param("channelId") channelId: string,
  ): Promise<{ favorited: true }> {
    return this.me.addFavorite(s.customerId, channelId);
  }

  @Delete("favorites/:channelId")
  @ApiOperation({ summary: "Quita un favorito" })
  removeFavorite(
    @CurrentSession() s: SessionIdentity,
    @Param("channelId") channelId: string,
  ): Promise<{ favorited: false }> {
    return this.me.removeFavorite(s.customerId, channelId);
  }

  @Get("history")
  @ApiOperation({ summary: "Últimos canales vistos (máx 20)" })
  listHistory(@CurrentSession() s: SessionIdentity): Promise<HistoryItem[]> {
    return this.me.listHistory(s.customerId);
  }

  @Post("history/:channelId")
  @ApiOperation({ summary: "Registra una visualización" })
  recordWatch(
    @CurrentSession() s: SessionIdentity,
    @Param("channelId") channelId: string,
  ): Promise<{ recorded: true }> {
    return this.me.recordWatch(s.customerId, channelId);
  }
}
