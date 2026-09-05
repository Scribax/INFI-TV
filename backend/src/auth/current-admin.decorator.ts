import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import type { AdminRole } from "@prisma/client";

export interface AdminIdentity {
  id: string;
  email: string;
  role: AdminRole;
}

export interface AuthenticatedRequest extends Request {
  admin?: AdminIdentity;
}

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AdminIdentity => {
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    if (req.admin === undefined) {
      throw new Error("CurrentAdmin usado sin JwtAuthGuard.");
    }
    return req.admin;
  },
);
