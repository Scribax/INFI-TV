import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { cache, CACHE_KEYS } from "@/lib/cache";
import type { CategoryItem, CountryItem } from "@/lib/types";

/**
 * Países y categorías con stale-while-revalidate: se muestra el caché al
 * instante y se refresca en background. Sin conexión queda el caché.
 */
export function useCountries(): CountryItem[] {
  const [countries, setCountries] = useState<CountryItem[]>([]);
  useEffect(() => {
    let alive = true;
    (async () => {
      const cached = await cache.get<CountryItem[]>(CACHE_KEYS.countries);
      if (alive && cached !== null) {
        setCountries(cached);
      }
      try {
        const data = await api.get<CountryItem[]>("/countries");
        if (alive) setCountries(data);
        void cache.set(CACHE_KEYS.countries, data);
      } catch {
        // sin conexión: queda el caché (si lo hay)
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  return countries;
}

export function useCategories(): CategoryItem[] {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  useEffect(() => {
    let alive = true;
    (async () => {
      const cached = await cache.get<CategoryItem[]>(CACHE_KEYS.categories);
      if (alive && cached !== null) {
        setCategories(cached);
      }
      try {
        const data = await api.get<CategoryItem[]>("/categories");
        if (alive) setCategories(data);
        void cache.set(CACHE_KEYS.categories, data);
      } catch {
        // sin conexión: queda el caché
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  return categories;
}
