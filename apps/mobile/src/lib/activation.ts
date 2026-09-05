import type { ActivationSuccessData } from "@infitv/types";
import { apiFetch } from "./api";
import { getAppInstanceId } from "./device";
import { clearSessionToken, getSessionToken, saveSessionToken } from "./session";

/**
 * Activa un código en este dispositivo y persiste el token de sesión.
 * `appInstanceId` es el UUID de instalación (crypto seguro).
 */
export async function activate(code: string): Promise<ActivationSuccessData> {
  const appInstanceId = await getAppInstanceId();
  const data = await apiFetch<ActivationSuccessData>("/auth/activate", {
    method: "POST",
    auth: false,
    body: {
      code: code.trim().toUpperCase(),
      appInstanceId,
      platform: "android",
      appVersion: "0.1.0",
    },
  });
  await saveSessionToken(data.token);
  return data;
}

/** Valida la sesión guardada contra el backend (autoridad). */
export async function validateSession(): Promise<boolean> {
  const token = await getSessionToken();
  if (token === null) {
    return false;
  }
  try {
    await apiFetch("/auth/session", { auth: true });
    return true;
  } catch {
    return false;
  }
}

export async function logout(): Promise<void> {
  const token = await getSessionToken();
  if (token !== null) {
    try {
      await apiFetch("/auth/logout", {
        method: "POST",
        auth: false,
        body: { token },
      });
    } catch {
      // el logout local sigue
    }
  }
  await clearSessionToken();
}
