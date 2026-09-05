import { useCallback, useEffect, useRef, useState } from "react";
import type { Paginated } from "@infitv/types";
import { api } from "@/lib/api";
import { cache, CACHE_KEYS } from "@/lib/cache";
import type { ChannelItem } from "@/lib/types";

const PAGE_SIZE = 30;

export interface ChannelFilters {
  country?: string;
  category?: string;
  search?: string;
}

/**
 * Catálogo de canales con paginación infinita y caché offline de la página 1
 * (solo cuando no hay búsqueda). stale-while-revalidate: caché inmediato →
 * fetch en background. Sin conexión queda el caché y se marca `offline`.
 */
export function useChannels(filters: ChannelFilters) {
  const [items, setItems] = useState<ChannelItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const loadingMoreRef = useRef(false);

  const buildUrl = useCallback(
    (targetPage: number): string => {
      const q = new URLSearchParams();
      q.set("page", String(targetPage));
      q.set("pageSize", String(PAGE_SIZE));
      if (filters.country) q.set("country", filters.country);
      if (filters.category) q.set("category", filters.category);
      if (filters.search) q.set("search", filters.search);
      return `/channels?${q.toString()}`;
    },
    [filters.country, filters.category, filters.search],
  );

  const cacheKey = CACHE_KEYS.channels(filters.country, filters.category);
  const canCache = filters.search === undefined;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let cached: ChannelItem[] | null = null;
      if (canCache) {
        cached = await cache.get<ChannelItem[]>(cacheKey);
        if (!cancelled && cached !== null) {
          setItems(cached);
          setLoading(false);
        }
      }
      try {
        const data = await api.get<Paginated<ChannelItem>>(buildUrl(1));
        if (cancelled) return;
        setItems(data.items);
        setTotalPages(data.totalPages);
        setPage(1);
        setError(null);
        setOffline(false);
        if (canCache) {
          void cache.set(cacheKey, data.items);
        }
      } catch (e) {
        if (cancelled) return;
        setOffline(true);
        if (cached === null) {
          setError(
            e instanceof Error ? e.message : "Error al cargar los canales.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [buildUrl, cacheKey, canCache]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || page >= totalPages) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const data = await api.get<Paginated<ChannelItem>>(buildUrl(page + 1));
      setItems((prev) => [...prev, ...data.items]);
      setTotalPages(data.totalPages);
      setPage((p) => p + 1);
      setOffline(false);
    } catch {
      // en loadMore no pisamos la lista con un error
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [page, totalPages, buildUrl]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await api.get<Paginated<ChannelItem>>(buildUrl(1));
      setItems(data.items);
      setTotalPages(data.totalPages);
      setPage(1);
      setError(null);
      setOffline(false);
      if (canCache) {
        void cache.set(cacheKey, data.items);
      }
    } catch (e) {
      setOffline(true);
      setError(e instanceof Error ? e.message : "Error al cargar los canales.");
    } finally {
      setRefreshing(false);
    }
  }, [buildUrl, cacheKey, canCache]);

  return {
    items,
    loading,
    loadingMore,
    refreshing,
    error,
    offline,
    loadMore,
    refresh,
    totalPages,
  };
}
