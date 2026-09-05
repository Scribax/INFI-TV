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
import { CustomersService } from "./customers.service";
import {
  CreateCustomerDto,
  RenewCustomerDto,
  SuspendCustomerDto,
  UpdateCustomerDto,
} from "./dto/customers.dto";
import { CustomersQueryDto } from "./dto/customers-query.dto";

@ApiTags("admin-customers")
@Controller("admin/customers")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Post()
  @Roles("ADMIN")
  @ApiOperation({ summary: "Crea un cliente (con plan calcula el vencimiento)" })
  create(
    @Body() dto: CreateCustomerDto,
    @CurrentAdmin() actor: AdminIdentity,
    @Req() req: Request,
  ): Promise<unknown> {
    return this.customers.create(dto, actor, req.ip);
  }

  @Get()
  @ApiOperation({ summary: "Lista clientes con filtros (cualquier admin)" })
  list(@Query() q: CustomersQueryDto): Promise<unknown> {
    return this.customers.list(q);
  }

  @Get(":id")
  @ApiOperation({ summary: "Detalle con contadores" })
  get(@Param("id") id: string): Promise<unknown> {
    return this.customers.get(id);
  }

  @Patch(":id")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Edita cliente (cambiar plan no toca vencimiento)" })
  update(
    @Param("id") id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentAdmin() actor: AdminIdentity,
    @Req() req: Request,
  ): Promise<unknown> {
    return this.customers.update(id, dto, actor, req.ip);
  }

  @Post(":id/suspend")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Suspende el acceso" })
  suspend(
    @Param("id") id: string,
    @Body() dto: SuspendCustomerDto,
    @CurrentAdmin() actor: AdminIdentity,
    @Req() req: Request,
  ): Promise<unknown> {
    return this.customers.suspend(id, dto, actor, req.ip);
  }

  @Post(":id/reactivate")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Reactiva (no extiende vencimiento, usar renovar)" })
  reactivate(
    @Param("id") id: string,
    @CurrentAdmin() actor: AdminIdentity,
    @Req() req: Request,
  ): Promise<unknown> {
    return this.customers.reactivate(id, actor, req.ip);
  }

  @Post(":id/renew")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Renueva desde max(ahora, vencimiento) + duración" })
  renew(
    @Param("id") id: string,
    @Body() dto: RenewCustomerDto,
    @CurrentAdmin() actor: AdminIdentity,
    @Req() req: Request,
  ): Promise<unknown> {
    return this.customers.renew(id, dto, actor, req.ip);
  }

  @Delete(":id")
  @Roles("SUPER_ADMIN")
  @ApiOperation({ summary: "Elimina (solo SUPER_ADMIN, en cascada)" })
  remove(
    @Param("id") id: string,
    @CurrentAdmin() actor: AdminIdentity,
    @Req() req: Request,
  ): Promise<unknown> {
    return this.customers.remove(id, actor, req.ip);
  }
}
