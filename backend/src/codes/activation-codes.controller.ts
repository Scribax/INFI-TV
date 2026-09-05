import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { CurrentAdmin } from "../auth/current-admin.decorator";
import type { AdminIdentity } from "../auth/current-admin.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { ActivationCodesService } from "./activation-codes.service";
import { CreateCodesDto, SuspendCodeDto, UpdateCodeDto } from "./dto/codes.dto";
import { CodesQueryDto } from "./dto/codes-query.dto";

@ApiTags("admin-codes")
@Controller("admin/codes")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ActivationCodesController {
  constructor(private readonly codes: ActivationCodesService) {}

  @Post()
  @Roles("ADMIN")
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({
    summary: "Genera 1–500 códigos. El texto plano sale SOLO en esta respuesta.",
  })
  create(
    @Body() dto: CreateCodesDto,
    @CurrentAdmin() actor: AdminIdentity,
    @Req() req: Request,
  ): Promise<unknown> {
    return this.codes.create(dto, actor, req.ip);
  }

  @Get()
  @ApiOperation({ summary: "Lista códigos (sin texto plano, cualquier admin)" })
  list(@Query() q: CodesQueryDto): Promise<unknown> {
    return this.codes.list(q);
  }

  @Get(":id")
  @ApiOperation({ summary: "Detalle + dispositivos vinculados" })
  get(@Param("id") id: string): Promise<unknown> {
    return this.codes.get(id);
  }

  @Patch(":id")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Cambia el límite de dispositivos" })
  update(
    @Param("id") id: string,
    @Body() dto: UpdateCodeDto,
    @CurrentAdmin() actor: AdminIdentity,
    @Req() req: Request,
  ): Promise<unknown> {
    return this.codes.update(dto, id, actor, req.ip);
  }

  @Post(":id/suspend")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Suspende un código PENDING/ACTIVE" })
  suspend(
    @Param("id") id: string,
    @Body() dto: SuspendCodeDto,
    @CurrentAdmin() actor: AdminIdentity,
    @Req() req: Request,
  ): Promise<unknown> {
    return this.codes.suspend(id, dto, actor, req.ip);
  }

  @Post(":id/reactivate")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Reactiva un SUSPENDED a su estado lógico" })
  reactivate(
    @Param("id") id: string,
    @CurrentAdmin() actor: AdminIdentity,
    @Req() req: Request,
  ): Promise<unknown> {
    return this.codes.reactivate(id, actor, req.ip);
  }

  @Post(":id/revoke")
  @Roles("ADMIN")
  @ApiOperation({
    summary: "Revoca (terminal). Suspende también al cliente vinculado.",
  })
  revoke(
    @Param("id") id: string,
    @CurrentAdmin() actor: AdminIdentity,
    @Req() req: Request,
  ): Promise<unknown> {
    return this.codes.revoke(id, actor, req.ip);
  }
}
