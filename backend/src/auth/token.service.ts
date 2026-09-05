import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { createHash, randomBytes } from "node:crypto";
import type { AdminRole } from "@prisma/client";

export interface AdminAccessPayload {
  sub: string;
  email: string;
  role: AdminRole;
  type: "admin-access";
}

export interface RefreshTokenPair {
  token: string;
  tokenHash: string;
}

const MS_PER_UNIT: Record<"s" | "m" | "h" | "d", number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

/**
 * Convierte "15m" / "7d" / "30s" / "12h" a milisegundos.
 * Lanza si el formato no es válido (fail-fast en arranque/tests).
 */
export function parseExpiryToMs(value: string): number {
  const match = /^(\d+)\s*([smhd])$/.exec(value.trim());
  if (match === null) {
    throw new Error(`Expiración inválida: "${value}" (esperado N[s|m|h|d])`);
  }
  const amount = Number.parseInt(match[1], 10);
  const unit = match[2] as "s" | "m" | "h" | "d";
  return amount * MS_PER_UNIT[unit];
}

/**
 * Emisión de tokens administrativos.
 * - Access: JWT corto firmado con ADMIN_JWT_SECRET.
 * - Refresh: token opaco aleatorio; en DB solo se guarda su SHA-256.
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  accessExpiresIn(): string {
    return this.config.get<string>("JWT_EXPIRES_IN") ?? "15m";
  }

  refreshExpiresIn(): string {
    return this.config.get<string>("REFRESH_TOKEN_EXPIRES_IN") ?? "7d";
  }

  signAccess(admin: { id: string; email: string; role: AdminRole }): Promise<string> {
    const payload: AdminAccessPayload = {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      type: "admin-access",
    };
    const expiresInSec = Math.floor(parseExpiryToMs(this.accessExpiresIn()) / 1000);
    return this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>("ADMIN_JWT_SECRET"),
      expiresIn: expiresInSec,
    });
  }

  generateRefresh(): RefreshTokenPair {
    const token = randomBytes(48).toString("hex");
    return { token, tokenHash: TokenService.hashToken(token) };
  }

  static hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
