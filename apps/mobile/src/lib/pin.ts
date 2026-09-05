import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const PIN_KEY = "infitv.adult.pin.hash";

function hash(pin: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
}

/** Guarda el PIN de adultos (solo el hash, nunca el PIN en claro). */
export async function setAdultPin(pin: string): Promise<void> {
  const digest = await hash(pin);
  await SecureStore.setItemAsync(PIN_KEY, digest);
}

/** true si ya hay un PIN de adultos configurado. */
export async function hasAdultPin(): Promise<boolean> {
  return (await SecureStore.getItemAsync(PIN_KEY)) !== null;
}

/** Compara contra el hash guardado (tiempo constante no crítico para un PIN de 4). */
export async function verifyAdultPin(pin: string): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PIN_KEY);
  if (stored === null) return false;
  return (await hash(pin)) === stored;
}

export async function clearAdultPin(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY);
}
