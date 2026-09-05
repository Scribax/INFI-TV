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
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { ActivationService } from "./activation.service";
import { CurrentSession } from "./current-session.decorator";
import type { SessionIdentity } from "./current-session.decorator";
import { ActivateDto, SessionTokenDto } from "./dto/activate.dto";
import { SessionGuard } from "./session.guard";

function requestMeta(req: Request): { ip?: string; userAgent?: string } {
  const ua = req.headers["user-agent"];
  return {
    ip: req.ip,
    userAgent: typeof ua === "string" ? ua : undefined,
  };
}

@ApiTags("activation")
@Controller("auth")
export class ActivationController {
  constructor(private readonly activation: ActivationService) {}

  @Post("activate")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: "Activa un código en este dispositivo" })
  @ApiOkResponse({ description: "{ token, expiresAt, customer }" })
  activate(@Body() dto: ActivateDto, @Req() req: Request): Promise<unknown> {
    return this.activation.activate(dto, requestMeta(req));
  }

  @Get("session")
  @UseGuards(SessionGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Valida la sesión (autoridad del backend)" })
  session(@CurrentSession() identity: SessionIdentity): SessionIdentity {
    return identity;
  }

  @Get("status")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Estado de la cuenta para polling en vivo (no corta con 403)" })
  status(@Req() req: Request): Promise<unknown> {
    const auth = req.headers.authorization ?? "";
    const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    return this.activation.getAccountStatus(bearer);
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Revoca la sesión (idempotente)" })
  logout(@Body() dto: SessionTokenDto): Promise<unknown> {
    return this.activation.logout(dto);
  }
}
