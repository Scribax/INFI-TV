import { NextResponse } from "next/server";
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

export async function POST(req: Request) {
  let input: { email?: unknown; password?: unknown };
  try {
    input = (await req.json()) as typeof input;
  } catch {
    input = {};
  }

  if (
    typeof input.email !== "string" ||
    typeof input.password !== "string" ||
    input.email.trim() === "" ||
    input.password === ""
  ) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Email y contraseña son obligatorios.",
        },
      },
      { status: 400 },
    );
  }

  const res = await fetch(`${SERVER_API_BASE}/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: input.email, password: input.password }),
  });

  const body = (await res.json().catch(() => null)) as Envelope<AuthPair> | null;

  if (!res.ok || body?.success === false) {
    return NextResponse.json(
      {
        success: false,
        error: body?.error ?? {
          code: "INTERNAL_ERROR",
          message: "Error inesperado.",
        },
      },
      { status: res.ok ? 400 : res.status },
    );
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

  // El refresh token va a cookie httpOnly; al cliente solo llega access + admin.
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
