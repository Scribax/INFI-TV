import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type {
  SessionIdentity,
  SessionRequest,
} from "./current-session.decorator";
import { ActivationService } from "./activation.service";

/**
 * Valida el Bearer de sesión contra la DB en cada request.
 * Sin caché: el backend es la autoridad (vencimiento/revocación
 * tienen efecto inmediato).
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly activation: ActivationService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<SessionRequest>();
    const header = req.headers.authorization;
    if (header === undefined || !header.startsWith("Bearer ")) {
      throw new UnauthorizedException("No autenticado.");
    }
    const token = header.slice("Bearer ".length).trim();
    if (token === "") {
      throw new UnauthorizedException("No autenticado.");
    }
    const identity: SessionIdentity =
      await this.activation.validateSession(token);
    req.session = identity;
    return true;
  }
}
