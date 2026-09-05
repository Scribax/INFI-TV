import {
  Controller,
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
import { SessionsQueryDto } from "./dto/sessions-query.dto";
import { SessionsService } from "./sessions.service";

@ApiTags("admin-sessions")
@Controller("admin/sessions")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  @Get()
  @ApiOperation({ summary: "Lista sesiones (cualquier admin, sin tokens)" })
  list(@Query() q: SessionsQueryDto): Promise<unknown> {
    return this.sessions.list(q);
  }

  @Post(":id/revoke")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Revoca una sesión" })
  revoke(
    @Param("id") id: string,
    @CurrentAdmin() actor: AdminIdentity,
    @Req() req: Request,
  ): Promise<unknown> {
    return this.sessions.revoke(id, actor, req.ip);
  }
}
