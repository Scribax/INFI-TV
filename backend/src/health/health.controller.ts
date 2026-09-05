import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { HealthService } from "./health.service";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @ApiOperation({ summary: "Estado de la API y la base de datos" })
  @ApiOkResponse({
    description: "API operativa (la DB puede estar down en dev)",
  })
  check(): Promise<unknown> {
    return this.health.check();
  }
}
