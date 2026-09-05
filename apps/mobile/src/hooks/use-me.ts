import { useCallback, useEffect, useState } from "react";
import {
  addFavorite,
  getFavorites,
  getHistory,
  removeFavorite,
} from "@/lib/me";
import type { ChannelItem, HistoryEntry } from "@/lib/types";

export function useFavorites() {
  const [favorites, setFavorites] = useState<ChannelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const data = await getFavorites();
      setFavorites(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar favoritos.");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getFavorites();
        if (cancelled) return;
        setFavorites(data);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Error al cargar favoritos.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.some((c) => c.id === id),
    [favorites],
  );

  const toggle = useCallback(
    async (channel: ChannelItem) => {
      const currently = favorites.some((c) => c.id === channel.id);
      setFavorites((prev) =>
        currently
          ? prev.filter((c) => c.id !== channel.id)
          : [channel, ...prev],
      );
      try {
        if (currently) await removeFavorite(channel.id);
        else await addFavorite(channel.id);
      } catch {
        void reload();
      }
    },
    [favorites, reload],
  );

  return { favorites, loading, error, isFavorite, toggle, reload };
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getHistory();
        if (!cancelled) setHistory(data);
      } catch {
        // silencioso: el historial no es crítico
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { history };
}
