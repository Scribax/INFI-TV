import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../activation/session.guard";
import { AnimeService, type AnimeDetail, type AnimeItem } from "./anime.service";

@ApiTags("anime")
@Controller()
@UseGuards(SessionGuard)
@ApiBearerAuth()
export class AnimeController {
  constructor(private readonly anime: AnimeService) {}

  @Get("anime/search")
  @ApiOperation({ summary: "Buscar anime en AniList" })
  search(@Query("query") query = ""): Promise<AnimeItem[]> {
    return this.anime.search(query);
  }

  @Get("anime/trending")
  @ApiOperation({ summary: "Anime en tendencia" })
  trending(): Promise<AnimeItem[]> {
    return this.anime.trending();
  }

  @Get("anime/popular")
  @ApiOperation({ summary: "Anime más popular" })
  popular(): Promise<AnimeItem[]> {
    return this.anime.popular();
  }

  @Get("anime/recent")
  @ApiOperation({ summary: "Anime reciente / en emisión" })
  recent(): Promise<AnimeItem[]> {
    return this.anime.recent();
  }

  @Get("anime/:id")
  @ApiOperation({ summary: "Detalle de un anime" })
  info(@Param("id") id: string): Promise<AnimeDetail> {
    return this.anime.info(Number(id));
  }

  @Get("anime/:id/episodes")
  @ApiOperation({ summary: "Numeración de episodios de un anime" })
  episodes(
    @Param("id") id: string,
  ): Promise<{ count: number | null; numbers: number[] }> {
    return this.anime.episodes(Number(id));
  }
}
