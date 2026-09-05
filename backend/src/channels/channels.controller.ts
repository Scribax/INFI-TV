import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Paginated } from "@infitv/types";
import { SessionGuard } from "../activation/session.guard";
import { ChannelsService } from "./channels.service";
import type {
  CategoryItem,
  ChannelItem,
  CountryItem,
} from "./channels.service";
import { ChannelsQueryDto } from "./dto/channels-query.dto";
import { SearchQueryDto } from "./dto/search-query.dto";

@ApiTags("channels")
@Controller()
@UseGuards(SessionGuard)
@ApiBearerAuth()
export class ChannelsController {
  constructor(private readonly channels: ChannelsService) {}

  @Get("channels")
  @ApiOperation({ summary: "Catálogo paginado (filtros por país, categoría y búsqueda)" })
  list(@Query() q: ChannelsQueryDto): Promise<Paginated<ChannelItem>> {
    return this.channels.list(q);
  }

  @Get("channels/:id")
  @ApiOperation({ summary: "Detalle de un canal" })
  get(@Param("id") id: string): Promise<ChannelItem> {
    return this.channels.get(id);
  }

  @Get("countries")
  @ApiOperation({ summary: "Países disponibles" })
  countries(): Promise<CountryItem[]> {
    return this.channels.listCountries();
  }

  @Get("categories")
  @ApiOperation({ summary: "Categorías disponibles" })
  categories(): Promise<CategoryItem[]> {
    return this.channels.listCategories();
  }

  @Get("search")
  @ApiOperation({ summary: "Búsqueda server-side por nombre" })
  search(@Query() q: SearchQueryDto): Promise<Paginated<ChannelItem>> {
    return this.channels.list({ search: q.q, page: q.page, pageSize: q.pageSize });
  }
}
