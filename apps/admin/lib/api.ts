import {
  getAccessToken,
  getValidAccess,
  refreshAccessToken,
} from "./auth-store";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

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

type Body = object | undefined;

function request(
  path: string,
  method: string,
  token: string | null,
  body: Body,
): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token !== null ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

type Envelope<T> = {
  success?: boolean;
  data?: T;
  error?: { code?: string; message?: string };
};

/**
 * Cliente tipado contra la API de INFI TV.
 * - Desenvuelve el envelope `{ success, data }` / `{ success: false, error }`.
 * - Si el access token expiró (401), fuerza UN refresh y reintenta.
 */
export async function apiFetch<T>(
  path: string,
  init: { method?: string; body?: Body } = {},
): Promise<T> {
  const method = init.method ?? "GET";
  let token = getAccessToken();
  if (token === null) {
    const valid = await getValidAccess();
    if (valid !== null) token = valid.accessToken;
  }

  let res = await request(path, method, token, init.body);

  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed !== null) {
      token = refreshed.accessToken;
      res = await request(path, method, token, init.body);
    }
  }

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
  post: <T>(path: string, body?: Body) => apiFetch<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: Body) => apiFetch<T>(path, { method: "PATCH", body }),
  del: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
