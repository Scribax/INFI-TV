import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  REFRESH_COOKIE,
  REFRESH_COOKIE_MAX_AGE,
  REFRESH_COOKIE_OPTIONS,
  SERVER_API_BASE,
} from "@/lib/server";

interface AuthPair {
  accessToken: string;
  refreshToken: string;
  admin: { id: string; email: string; role: string };
}

type Envelope<T> = {
  success?: boolean;
  data?: T;
  error?: { code?: string; message?: string };
};

export async function POST() {
  const refreshToken = cookies().get(REFRESH_COOKIE)?.value;
  if (refreshToken === undefined) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "No autenticado." },
      },
      { status: 401 },
    );
  }

  const res = await fetch(`${SERVER_API_BASE}/admin/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const body = (await res.json().catch(() => null)) as Envelope<AuthPair> | null;

  if (!res.ok || body?.success === false) {
    // Refresh inválido/expirado → limpiar la cookie.
    const out = NextResponse.json(
      {
        success: false,
        error: body?.error ?? {
          code: "UNAUTHORIZED",
          message: "Sesión inválida o expirada.",
        },
      },
      { status: res.ok ? 401 : res.status },
    );
    out.cookies.delete(REFRESH_COOKIE);
    return out;
  }

  const data = body?.data;
  if (data === undefined) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Respuesta inválida del backend." },
      },
      { status: 502 },
    );
  }

  const out = NextResponse.json({
    success: true,
    data: { accessToken: data.accessToken, admin: data.admin },
  });
  out.cookies.set(REFRESH_COOKIE, data.refreshToken, {
    ...REFRESH_COOKIE_OPTIONS,
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
  return out;
}
