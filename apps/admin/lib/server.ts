import { API_PREFIX } from "@infitv/config";
import { REFRESH_COOKIE, REFRESH_COOKIE_MAX_AGE } from "./cookies";

/** Solo para uso server-side (route handlers). Nunca importar en componentes client. */
const API_ORIGIN = process.env.API_URL ?? "http://localhost:3000";

export const SERVER_API_BASE = `${API_ORIGIN}${API_PREFIX}`;

export { REFRESH_COOKIE, REFRESH_COOKIE_MAX_AGE };

export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};
