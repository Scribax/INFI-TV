import {
  Controller,
  Delete,
  Get,
  Param,
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
import { DevicesService } from "./devices.service";
import { DevicesQueryDto } from "./dto/devices-query.dto";

@ApiTags("admin-devices")
@Controller("admin/devices")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DevicesController {
  constructor(private readonly devices: DevicesService) {}

  @Get()
  @ApiOperation({ summary: "Lista dispositivos (cualquier admin)" })
  list(@Query() q: DevicesQueryDto): Promise<unknown> {
    return this.devices.list(q);
  }

  @Get(":id")
  @ApiOperation({ summary: "Detalle + sesiones recientes" })
  get(@Param("id") id: string): Promise<unknown> {
    return this.devices.get(id);
  }

  @Post(":id/revoke")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Revoca (el slot sigue ocupado)" })
  revoke(
    @Param("id") id: string,
    @CurrentAdmin() actor: AdminIdentity,
    @Req() req: Request,
  ): Promise<unknown> {
    return this.devices.revoke(id, actor, req.ip);
  }

  @Post(":id/block")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Bloquea por abuso" })
  block(
    @Param("id") id: string,
    @CurrentAdmin() actor: AdminIdentity,
    @Req() req: Request,
  ): Promise<unknown> {
    return this.devices.block(id, actor, req.ip);
  }

  @Post(":id/unblock")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Desbloquea a ACTIVE" })
  unblock(
    @Param("id") id: string,
    @CurrentAdmin() actor: AdminIdentity,
    @Req() req: Request,
  ): Promise<unknown> {
    return this.devices.unblock(id, actor, req.ip);
  }

  @Delete(":id")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Desvincula y libera el slot" })
  remove(
    @Param("id") id: string,
    @CurrentAdmin() actor: AdminIdentity,
    @Req() req: Request,
  ): Promise<unknown> {
    return this.devices.remove(id, actor, req.ip);
  }
}
