import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { REFRESH_COOKIE, SERVER_API_BASE } from "@/lib/server";

export async function POST() {
  const refreshToken = cookies().get(REFRESH_COOKIE)?.value;

  const out = NextResponse.json({ success: true, data: { revoked: true } });
  out.cookies.delete(REFRESH_COOKIE);

  if (refreshToken !== undefined) {
    // Mejor esfuerzo: revoca la sesión en el backend; no bloquea el logout local.
    try {
      await fetch(`${SERVER_API_BASE}/admin/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      /* el logout local ya está hecho */
    }
  }

  return out;
}
