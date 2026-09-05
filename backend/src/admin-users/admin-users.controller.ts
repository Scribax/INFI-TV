import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";
import { CurrentAdmin } from "../auth/current-admin.decorator";
import type { AdminIdentity } from "../auth/current-admin.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { AdminUsersService } from "./admin-users.service";
import {
  ChangePasswordDto,
  CreateAdminDto,
  UpdateAdminDto,
} from "./dto/admin-users.dto";
import { AdminUsersQueryDto } from "./dto/admin-users-query.dto";

@ApiTags("admin-users")
@Controller("admin/users")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}

  @Post()
  @Roles("SUPER_ADMIN")
  @ApiOperation({ summary: "Crea un administrador (solo SUPER_ADMIN)" })
  create(
    @Body() dto: CreateAdminDto,
    @CurrentAdmin() actor: AdminIdentity,
    @Req() req: Request,
  ): Promise<unknown> {
    return this.users.create(dto, actor, req.ip);
  }

  @Get()
  @Roles("ADMIN")
  @ApiOperation({ summary: "Lista administradores" })
  list(@Query() q: AdminUsersQueryDto): Promise<unknown> {
    return this.users.list(q);
  }

  @Get(":id")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Detalle de un administrador" })
  get(@Param("id") id: string): Promise<unknown> {
    return this.users.get(id);
  }

  @Patch(":id")
  @Roles("SUPER_ADMIN")
  @ApiOperation({ summary: "Cambia rol/estado (solo SUPER_ADMIN)" })
  update(
    @Param("id") id: string,
    @Body() dto: UpdateAdminDto,
    @CurrentAdmin() actor: AdminIdentity,
    @Req() req: Request,
  ): Promise<unknown> {
    return this.users.update(id, dto, actor, req.ip);
  }

  @Post(":id/password")
  @ApiOperation({ summary: "Rota contraseña (propia o SUPER_ADMIN)" })
  changePassword(
    @Param("id") id: string,
    @Body() dto: ChangePasswordDto,
    @CurrentAdmin() actor: AdminIdentity,
    @Req() req: Request,
  ): Promise<unknown> {
    if (actor.id !== id && actor.role !== "SUPER_ADMIN") {
      throw new ForbiddenException("Acceso denegado.");
    }
    return this.users.changePassword(id, dto, actor, req.ip);
  }
}
