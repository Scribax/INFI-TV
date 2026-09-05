import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Caché local best-effort (AsyncStorage). Nunca lanza: si no hay espacio o
 * falla la lectura, devuelve null y la app sigue online.
 */
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw === null ? null : (JSON.parse(raw) as T);
    } catch {
      return null;
    }
  },
  async set<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
      // best-effort: ignorar
    }
  },
};

export const CACHE_KEYS = {
  countries: "infitv.catalog.countries",
  categories: "infitv.catalog.categories",
  channels: (country: string | undefined, category: string | undefined) =>
    `infitv.catalog.channels.${country ?? "all"}.${category ?? "all"}`,
};
