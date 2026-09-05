import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { CurrentAdmin } from "../auth/current-admin.decorator";
import type { AdminIdentity } from "../auth/current-admin.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CreatePlanDto, UpdatePlanDto } from "./dto/plans.dto";
import { PlansQueryDto } from "./dto/plans-query.dto";
import { PlansService } from "./plans.service";

@ApiTags("admin-plans")
@Controller("admin/plans")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PlansController {
  constructor(private readonly plans: PlansService) {}

  @Post()
  @Roles("ADMIN")
  @ApiOperation({ summary: "Crea un plan" })
  create(
    @Body() dto: CreatePlanDto,
    @CurrentAdmin() actor: AdminIdentity,
    @Req() req: Request,
  ): Promise<unknown> {
    return this.plans.create(dto, actor, req.ip);
  }

  @Get()
  @ApiOperation({ summary: "Lista planes (cualquier admin)" })
  list(@Query() q: PlansQueryDto): Promise<unknown> {
    return this.plans.list(q);
  }

  @Get(":id")
  @ApiOperation({ summary: "Detalle de un plan" })
  get(@Param("id") id: string): Promise<unknown> {
    return this.plans.get(id);
  }

  @Patch(":id")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Actualiza un plan" })
  update(
    @Param("id") id: string,
    @Body() dto: UpdatePlanDto,
    @CurrentAdmin() actor: AdminIdentity,
    @Req() req: Request,
  ): Promise<unknown> {
    return this.plans.update(id, dto, actor, req.ip);
  }

  @Delete(":id")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Borra un plan sin uso (preferir desactivar)" })
  remove(
    @Param("id") id: string,
    @CurrentAdmin() actor: AdminIdentity,
    @Req() req: Request,
  ): Promise<unknown> {
    return this.plans.remove(id, actor, req.ip);
  }
}
