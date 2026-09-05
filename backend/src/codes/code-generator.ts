import { createHmac, randomInt } from "node:crypto";
import type { ActivationCodeStatus } from "@prisma/client";

export const CODE_PREFIX_WORD = "INFITV" as const;

/**
 * Alfabeto sin caracteres ambiguos (sin O/0, I/1, L).
 * 31 símbolos ^ 8 posiciones ≈ 8.5e11 combinaciones.
 */
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789" as const;

const CODE_PATTERN = /^INFITV-[A-Z2-9]{4}-[A-Z2-9]{4}$/;

/**
 * Normaliza para hash/búsqueda: mayúsculas, solo [A-Z0-9].
 * Acepta minúsculas, espacios y guiones ("infitv 7k4p x92m" vale).
 */
export function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * Genera INFITV-XXXX-XXXX con crypto.randomInt (CSPRNG).
 * NUNCA Math.random para credenciales.
 */
export function generatePlainCode(): string {
  const pick = (): string => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  const group = (): string => `${pick()}${pick()}${pick()}${pick()}`;
  return `${CODE_PREFIX_WORD}-${group()}-${group()}`;
}

/**
 * HMAC-SHA256 con pepper del servidor (CODE_PEPPER, nunca sale del backend).
 * Sin el pepper, la DB filtrada no sirve para fuerza bruta offline.
 */
export function hashCode(plain: string, pepper: string): string {
  return createHmac("sha256", pepper).update(normalizeCode(plain)).digest("hex");
}

/**
 * Pista visible para el admin ("INFITV-7K"). Filtra solo 2 de 8 símbolos,
 * la búsqueda por prefijo no debilita materialmente la fuerza bruta online
 * (que además está rate-limited en /auth/activate).
 */
export function buildPrefix(plain: string): string {
  const flat = normalizeCode(plain).replace(/^INFITV/, "");
  return `${CODE_PREFIX_WORD}-${flat.slice(0, 2)}`;
}

export function isValidCodeFormat(plain: string): boolean {
  return CODE_PATTERN.test(plain.trim().toUpperCase());
}

/**
 * ¿El código puede usarse para activar? Estados terminales (REVOKED,
 * SUSPENDED, EXPIRED) y vencimiento lo impiden. La respuesta pública
 * ante un "no" es siempre genérica (sin enumeración).
 */
export function isCodeEffectivelyUsable(
  code: { status: ActivationCodeStatus; expiresAt: Date | null },
  now: Date = new Date(),
): boolean {
  if (code.status !== "PENDING" && code.status !== "ACTIVE") {
    return false;
  }
  if (code.expiresAt !== null && code.expiresAt.getTime() <= now.getTime()) {
    return false;
  }
  return true;
}
