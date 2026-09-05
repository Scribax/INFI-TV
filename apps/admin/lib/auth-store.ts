/**
 * Store de sesión en memoria + sessionStorage (client-only).
 *
 * - El access token (15m) vive en memoria y se respalda en sessionStorage
 *   para sobrevivir recargas de pestaña sin rotar el refresh token.
 * - El refresh token NUNCA toca JS: vive en cookie httpOnly gestionada por
 *   los route handlers de /api/auth/*.
 */

import type { AdminIdentity } from "./types";

const ACCESS_KEY = "infitv.access";
const ADMIN_KEY = "infitv.admin";

export interface Session {
  accessToken: string;
  admin: AdminIdentity;
}

let memoryAccess: string | null = null;
let refreshPromise: Promise<Session | null> | null = null;

function readSS(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSS(key: string, value: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (value === null) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, value);
  } catch {
    /* quota / private mode: la memoria sigue siendo la fuente */
  }
}

export function setAccessToken(token: string | null): void {
  memoryAccess = token;
  writeSS(ACCESS_KEY, token);
}

export function getAccessToken(): string | null {
  if (memoryAccess !== null) return memoryAccess;
  const stored = readSS(ACCESS_KEY);
  if (stored !== null) memoryAccess = stored;
  return memoryAccess;
}

export function getCachedAdmin(): AdminIdentity | null {
  const raw = readSS(ADMIN_KEY);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as AdminIdentity;
  } catch {
    return null;
  }
}

export function setCachedAdmin(admin: AdminIdentity | null): void {
  writeSS(ADMIN_KEY, admin === null ? null : JSON.stringify(admin));
}

async function doRefresh(): Promise<Session | null> {
  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      clearSession();
      return null;
    }
    const body = (await res.json()) as {
      success?: boolean;
      data?: { accessToken?: string; admin?: AdminIdentity };
    };
    const accessToken = body.data?.accessToken;
    const admin = body.data?.admin;
    if (accessToken === undefined || admin === undefined) {
      clearSession();
      return null;
    }
    setAccessToken(accessToken);
    setCachedAdmin(admin);
    return { accessToken, admin };
  } catch {
    clearSession();
    return null;
  }
}

/** Fuerza la rotación del refresh token (p. ej. tras un 401). */
export function refreshAccessToken(): Promise<Session | null> {
  if (refreshPromise !== null) return refreshPromise;
  const p = doRefresh();
  refreshPromise = p.finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

/** Devuelve sesión desde cache si existe; si no, refresca con la cookie. */
export async function getValidAccess(): Promise<Session | null> {
  const accessToken = getAccessToken();
  const admin = getCachedAdmin();
  if (accessToken !== null && admin !== null) {
    return { accessToken, admin };
  }
  return refreshAccessToken();
}

export function clearSession(): void {
  memoryAccess = null;
  writeSS(ACCESS_KEY, null);
  writeSS(ADMIN_KEY, null);
}
