import AsyncStorage from "@react-native-async-storage/async-storage";

/** Progreso de reproducción de una película (para "Continuar viendo"). */
export interface ProgressItem {
  id: string;
  name: string;
  poster: string | null;
  position: number; // segundos
  duration: number;
  updatedAt: number;
}

const KEY = "infitv.vod.progress";

export async function getProgress(): Promise<ProgressItem[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw === null) return [];
    const parsed = JSON.parse(raw) as ProgressItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getProgressById(id: string): Promise<ProgressItem | null> {
  const list = await getProgress();
  return list.find((i) => i.id === id) ?? null;
}

/** Guarda/actualiza el progreso (más reciente primero, máx 30 items). */
export async function saveProgress(item: ProgressItem): Promise<void> {
  try {
    const list = await getProgress();
    const rest = list.filter((i) => i.id !== item.id);
    const next = [item, ...rest].slice(0, 30);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // best-effort
  }
}

export async function removeProgress(id: string): Promise<void> {
  try {
    const list = await getProgress();
    await AsyncStorage.setItem(
      KEY,
      JSON.stringify(list.filter((i) => i.id !== id)),
    );
  } catch {
    // best-effort
  }
}
