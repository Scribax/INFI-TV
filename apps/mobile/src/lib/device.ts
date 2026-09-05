import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const INSTANCE_KEY = "infitv.device.instanceId";

/**
 * UUID de instalación, generado una sola vez (crypto seguro) y persistido.
 * No es el único factor de seguridad: el backend controla por sesión/estado.
 */
export async function getAppInstanceId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(INSTANCE_KEY);
  if (existing !== null) {
    return existing;
  }
  const id = Crypto.randomUUID();
  await SecureStore.setItemAsync(INSTANCE_KEY, id);
  return id;
}
