import { getSessionToken } from "./session";

const BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

type Envelope<T> = {
  success?: boolean;
  data?: T;
  error?: { code?: string; message?: string };
};

/** Error de dominio/HTTP tipado a partir del envelope del backend. */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export interface ApiFetchOptions {
  method?: string;
  body?: object;
  /** false para rutas públicas (p. ej. /auth/activate). Default: con sesión. */
  auth?: boolean;
}

/**
 * Cliente tipado contra la API de INFI TV.
 * Desenvuelve el envelope `{ success, data }` / `{ success: false, error }`.
 */
export async function apiFetch<T>(
  path: string,
  init: ApiFetchOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (init.auth !== false) {
    const token = await getSessionToken();
    if (token !== null) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${BASE}${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

  let payload: Envelope<T> | null = null;
  try {
    payload = (await res.json()) as Envelope<T>;
  } catch {
    payload = null;
  }

  if (!res.ok || payload?.success === false) {
    const code = payload?.error?.code ?? "INTERNAL_ERROR";
    const message = payload?.error?.message ?? "Error inesperado.";
    throw new ApiError(code, message, res.status);
  }

  return (payload?.data ?? undefined) as T;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: object, auth = true) =>
    apiFetch<T>(path, { method: "POST", body, auth }),
  del: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
