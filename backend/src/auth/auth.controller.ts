import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { AuthService } from "./auth.service";
import { CurrentAdmin } from "./current-admin.decorator";
import type { AdminIdentity } from "./current-admin.decorator";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";

function requestMeta(req: Request): { ip?: string; userAgent?: string } {
  const ua = req.headers["user-agent"];
  return {
    ip: req.ip,
    userAgent: typeof ua === "string" ? ua : undefined,
  };
}

@ApiTags("admin-auth")
@Controller("admin/auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: "Login administrativo (email + password)" })
  @ApiOkResponse({ description: "Par de tokens emitido" })
  @ApiUnauthorizedResponse({ description: "Credenciales inválidas." })
  login(@Body() dto: LoginDto, @Req() req: Request): Promise<unknown> {
    return this.auth.login(dto, requestMeta(req));
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: "Rota el refresh token" })
  refresh(@Body() dto: RefreshDto, @Req() req: Request): Promise<unknown> {
    return this.auth.refresh(dto, requestMeta(req));
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Revoca el refresh token" })
  logout(@Body() dto: RefreshDto, @Req() req: Request): Promise<unknown> {
    return this.auth.logout(dto, requestMeta(req));
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Perfil del admin autenticado" })
  me(@CurrentAdmin() admin: AdminIdentity): AdminIdentity {
    return admin;
  }
}
