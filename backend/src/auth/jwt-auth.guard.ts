import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { AdminRole } from "@prisma/client";
import type { AuthenticatedRequest } from "./current-admin.decorator";
import { AuthService } from "./auth.service";

interface RawAccessPayload {
  sub?: unknown;
  role?: unknown;
  type?: unknown;
}

/**
 * Valida el JWT de acceso administrativo y adjunta req.admin.
 * Verifica forma del payload en runtime (un token firmado con otro
 * type, o con rol alterado respecto a la DB, se rechaza).
 * Mensaje genérico siempre.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = req.headers.authorization;
    if (header === undefined || !header.startsWith("Bearer ")) {
      throw new UnauthorizedException("No autenticado.");
    }
    const token = header.slice("Bearer ".length).trim();
    let raw: RawAccessPayload;
    try {
      raw = await this.jwt.verifyAsync<RawAccessPayload>(token, {
        secret: this.config.getOrThrow<string>("ADMIN_JWT_SECRET"),
      });
    } catch {
      throw new UnauthorizedException("No autenticado.");
    }
    if (raw.type !== "admin-access" || typeof raw.sub !== "string") {
      throw new UnauthorizedException("No autenticado.");
    }
    const admin = await this.auth.validateAccess(
      raw.sub,
      raw.role as AdminRole,
    );
    if (admin === null) {
      throw new UnauthorizedException("No autenticado.");
    }
    req.admin = admin;
    return true;
  }
}
