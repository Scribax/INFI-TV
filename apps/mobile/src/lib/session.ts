import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "infitv.session.token";

/**
 * El token de sesión vive en SecureStore (nunca en AsyncStorage),
 * según la spec: secretos/sesiones van cifrados.
 */
export async function saveSessionToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getSessionToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearSessionToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
