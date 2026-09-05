import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { AdminRole } from "@prisma/client";
import { ROLES_KEY, roleSatisfies } from "./roles.decorator";
import type { AuthenticatedRequest } from "./current-admin.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<
      AdminRole[] | undefined
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (required === undefined || required.length === 0) {
      return true;
    }
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (req.admin === undefined) {
      throw new ForbiddenException("Acceso denegado.");
    }
    if (!roleSatisfies(req.admin.role, required)) {
      throw new ForbiddenException("Acceso denegado.");
    }
    return true;
  }
}
