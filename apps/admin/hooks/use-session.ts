"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearSession,
  getCachedAdmin,
  getValidAccess,
} from "@/lib/auth-store";
import type { AdminIdentity } from "@/lib/types";

/**
 * Sesión del panel. Hace silent refresh al montar si no hay access token
 * en memoria/cache. El middleware ya gatea por cookie; acá se recupera el
 * access token y la identidad, y se redirige si la sesión ya no es válida.
 *
 * El estado inicial es SIEMPRE null/true (determinista) para que el server
 * y el cliente rendericen lo mismo en el primer render (hydratación). La
 * sesión (sessionStorage, client-only) se resuelve en el effect.
 */
export function useSession() {
  const [admin, setAdmin] = useState<AdminIdentity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    // 1) cache inmediato (ya estamos en el cliente)
    const cached = getCachedAdmin();
    if (cached !== null) {
      setAdmin(cached);
      setLoading(false);
    }

    // 2) validar/refrescar con la cookie httpOnly
    getValidAccess().then((session) => {
      if (!alive) return;
      if (session === null) {
        clearSession();
        window.location.replace("/login");
        return;
      }
      setAdmin(session.admin);
      setLoading(false);
    });

    return () => {
      alive = false;
    };
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    clearSession();
    window.location.replace("/login");
  }, []);

  return { admin, loading, logout };
}
