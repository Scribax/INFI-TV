import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../activation/session.guard";
import { VodService, type SeriesDetail, type SeriesItem, type VodDetail, type VodItem } from "./vod.service";
import { VodQueryDto } from "./dto/vod-query.dto";

@ApiTags("vod")
@Controller()
@UseGuards(SessionGuard)
@ApiBearerAuth()
export class VodController {
  constructor(private readonly vod: VodService) {}

  @Get("vod/movies")
  @ApiOperation({ summary: "Catálogo VOD de películas (filtro por categoría y búsqueda)" })
  movies(@Query() q: VodQueryDto): Promise<VodItem[]> {
    return this.vod.movies(q.category, q.search, q.language, q.limit ?? 40);
  }

  @Get("vod/movies/categories")
  @ApiOperation({ summary: "Categorías de películas" })
  vodCategories(): Promise<{ category_id: string; category_name: string }[]> {
    return this.vod.vodCategories();
  }

  @Get("vod/movies/:id")
  @ApiOperation({ summary: "Detalle de una película" })
  movie(@Param("id") id: string): Promise<VodDetail> {
    return this.vod.movieDetail(id);
  }

  @Get("vod/series")
  @ApiOperation({ summary: "Catálogo de series (filtro por categoría y búsqueda)" })
  series(@Query() q: VodQueryDto): Promise<SeriesItem[]> {
    return this.vod.series(q.category, q.search, q.language, q.limit ?? 40);
  }

  @Get("vod/series/categories")
  @ApiOperation({ summary: "Categorías de series" })
  seriesCategories(): Promise<{ category_id: string; category_name: string }[]> {
    return this.vod.seriesCategories();
  }

  @Get("vod/series/:id")
  @ApiOperation({ summary: "Detalle de una serie (temporadas y episodios)" })
  seriesDetail(@Param("id") id: string): Promise<SeriesDetail> {
    return this.vod.seriesDetail(id);
  }

  @Get("vod/stream/movie/:id")
  @ApiOperation({ summary: "URL de stream directa de una película" })
  movieStream(@Param("id") id: string): Promise<{ url: string }> {
    return this.vod.movieStreamUrl(id);
  }

  @Get("vod/stream/series/:seriesId/:episodeId")
  @ApiOperation({ summary: "URL de stream directa de un episodio" })
  episodeStream(
    @Param("seriesId") seriesId: string,
    @Param("episodeId") episodeId: string,
  ): Promise<{ url: string }> {
    return this.vod.episodeStreamUrl(seriesId, episodeId);
  }
}
