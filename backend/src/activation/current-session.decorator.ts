import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

export interface SessionCustomer {
  id: string;
  displayName: string;
  status: string;
  plan: string;
  expiresAt: string | null;
}

export interface SessionIdentity {
  sessionId: string;
  sessionExpiresAt: string;
  customerId: string;
  deviceId: string;
  customer: SessionCustomer;
  deviceStatus: string;
}

export interface SessionRequest extends Request {
  session?: SessionIdentity;
}

export const CurrentSession = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionIdentity => {
    const req = ctx.switchToHttp().getRequest<SessionRequest>();
    if (req.session === undefined) {
      throw new Error("CurrentSession usado sin SessionGuard.");
    }
    return req.session;
  },
);
