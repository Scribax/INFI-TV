"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { APP_NAME } from "@infitv/config";
import { setAccessToken, setCachedAdmin } from "@/lib/auth-store";
import { Spinner } from "@/components/ui/spinner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = (await res.json()) as {
        success?: boolean;
        data?: { accessToken?: string; admin?: unknown };
        error?: { message?: string };
      };
      if (!res.ok || body.success === false) {
        setError(body.error?.message ?? "No se pudo iniciar sesión.");
        return;
      }
      if (body.data?.accessToken === undefined || body.data?.admin === undefined) {
        setError("Respuesta inesperada del servidor.");
        return;
      }
      setAccessToken(body.data.accessToken);
      setCachedAdmin(body.data.admin as { id: string; email: string; role: "SUPER_ADMIN" | "ADMIN" | "OPERATOR" });
      router.replace("/dashboard");
    } catch {
      setError("Error de red. Reintentá.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas bg-brand-glow p-4">
      <div className="w-full max-w-sm animate-fade-in rounded-2xl border border-line bg-surface p-8 shadow-pop">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-lg font-bold text-white">
            IT
          </span>
          <div>
            <h1 className="text-xl font-semibold text-ink">{APP_NAME} Admin</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Ingresá con tus credenciales de administrador.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="label">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              className="input"
              placeholder="admin@infitv.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="label">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              className="input"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error !== null && (
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? <Spinner /> : "Ingresar"}
          </button>
        </form>
      </div>
    </main>
  );
}
