import { Injectable } from "@nestjs/common";

/** Película del catálogo VOD (ya mapeada a un shape limpio para la app). */
export interface VodItem {
  id: string;
  name: string;
  poster: string | null;
  categoryId: string;
  categoryName: string;
  rating: string | null;
  added: string | null;
}

export interface SeriesItem {
  id: string;
  name: string;
  cover: string | null;
  categoryId: string;
  rating: string | null;
}

export interface SeriesEpisode {
  id: string;
  title: string;
  episodeNum: number;
  seasonNumber: number;
  containerExtension: string;
}

export interface SeriesDetail {
  id: string;
  name: string;
  cover: string | null;
  plot: string | null;
  seasons: { seasonNumber: number; episodes: SeriesEpisode[] }[];
}

export interface VodDetail {
  id: string;
  name: string;
  poster: string | null;
  plot: string | null;
  rating: string | null;
  year: string | null;
}

interface CacheEntry<T> {
  at: number;
  data: T;
}

/**
 * Cliente de la API Xtream Codes (player_api.php) del proveedor mayorista.
 * Cachea en memoria las respuestas pesadas (catálogo VOD/series) con TTL corto.
 */
@Injectable()
export class VodService {
  private readonly base = (process.env["XTREAM_BASE_URL"] ?? "").replace(/\/+$/, "");
  private readonly user = process.env["XTREAM_USERNAME"] ?? "";
  private readonly pass = process.env["XTREAM_PASSWORD"] ?? "";
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly TTL_MS = 5 * 60 * 1000;

  get configured(): boolean {
    return this.base !== "" && this.user !== "" && this.pass !== "";
  }

  private assertConfigured(): void {
    if (!this.configured) {
      throw new Error(
        "Proveedor Xtream no configurado (XTREAM_BASE_URL / XTREAM_USERNAME / XTREAM_PASSWORD).",
      );
    }
  }

  private async api<T>(action: string, extra = ""): Promise<T> {
    const key = `${action}${extra}`;
    const hit = this.cache.get(key);
    if (hit !== undefined && Date.now() - hit.at < this.TTL_MS) {
      return hit.data as T;
    }
    const url = `${this.base}/player_api.php?username=${this.user}&password=${this.pass}&action=${action}${extra}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
    if (!res.ok) {
      throw new Error(`Xtream ${action} -> HTTP ${res.status}`);
    }
    const data = (await res.json()) as T;
    this.cache.set(key, { at: Date.now(), data });
    return data;
  }

  async vodCategories(): Promise<{ category_id: string; category_name: string }[]> {
    this.assertConfigured();
    return this.api("get_vod_categories");
  }

  async seriesCategories(): Promise<{ category_id: string; category_name: string }[]> {
    this.assertConfigured();
    return this.api("get_series_categories");
  }

  async movies(category?: string, search?: string, limit = 40): Promise<VodItem[]> {
    this.assertConfigured();
    const raw = await this.api<Record<string, unknown>[]>("get_vod_streams");
    let items: VodItem[] = raw.map((m) => ({
      id: String(m["stream_id"]),
      name: String(m["name"] ?? ""),
      poster: (m["stream_icon"] as string | null) ?? null,
      categoryId: String(m["category_id"] ?? ""),
      categoryName: String(m["category_name"] ?? ""),
      rating: (m["rating"] as string | null) ?? null,
      added: (m["added"] as string | null) ?? null,
    }));
    if (category !== undefined && category.trim() !== "") {
      items = items.filter((i) => i.categoryId === category.trim());
    }
    if (search !== undefined && search.trim() !== "") {
      const s = search.trim().toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(s));
    }
    return items.slice(0, limit);
  }

  async series(category?: string, search?: string, limit = 40): Promise<SeriesItem[]> {
    this.assertConfigured();
    const raw = await this.api<Record<string, unknown>[]>("get_series");
    let items: SeriesItem[] = raw.map((s) => ({
      id: String(s["series_id"]),
      name: String(s["name"] ?? ""),
      cover: (s["cover"] as string | null) ?? null,
      categoryId: String(s["category_id"] ?? ""),
      rating: (s["rating"] as string | null) ?? null,
    }));
    if (category !== undefined && category.trim() !== "") {
      items = items.filter((i) => i.categoryId === category.trim());
    }
    if (search !== undefined && search.trim() !== "") {
      const s = search.trim().toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(s));
    }
    return items.slice(0, limit);
  }

  async movieDetail(id: string): Promise<VodDetail> {
    this.assertConfigured();
    const res = await this.api<{
      info?: Record<string, unknown>;
      movie_data?: Record<string, unknown>;
    }>("get_vod_info", `&vod_id=${encodeURIComponent(id)}`);
    const info = res.info ?? {};
    const data = res.movie_data ?? {};
    return {
      id: String(data["stream_id"] ?? id),
      name: String(data["name"] ?? info["name"] ?? ""),
      poster: (data["stream_icon"] as string | null) ?? (info["cover_big"] as string | null) ?? null,
      plot: (info["plot"] as string | null) ?? null,
      rating: (info["rating"] as string | null) ?? null,
      year: (info["releasedate"] as string | null) ?? null,
    };
  }

  async seriesDetail(id: string): Promise<SeriesDetail> {
    this.assertConfigured();
    const res = await this.api<{
      info?: Record<string, unknown>;
      seasons?: { season_number?: number; name?: string; cover?: string }[];
      episodes?: Record<string, Record<string, unknown>[]>;
    }>("get_series_info", `&series_id=${encodeURIComponent(id)}`);
    const info = res.info ?? {};
    const epMap = res.episodes ?? {};
    const seasons = (res.seasons ?? [])
      .map((s) => {
        const seasonNumber = Number(s.season_number ?? 0);
        const episodes = (epMap[String(seasonNumber)] ?? []).map((e) => ({
          id: String(e["id"] ?? ""),
          title: String(e["title"] ?? `Episodio ${e["episode_num"] ?? ""}`),
          episodeNum: Number(e["episode_num"] ?? 0),
          seasonNumber,
          containerExtension: String(e["container_extension"] ?? "mkv"),
        }));
        return { seasonNumber, episodes };
      })
      .filter((s) => s.episodes.length > 0);
    return {
      id: String(id),
      name: String(info["name"] ?? ""),
      cover: (info["cover"] as string | null) ?? null,
      plot: (info["plot"] as string | null) ?? null,
      seasons,
    };
  }

  async movieStreamUrl(id: string): Promise<{ url: string }> {
    this.assertConfigured();
    const res = await this.api<{ movie_data?: Record<string, unknown> }>(
      "get_vod_info",
      `&vod_id=${encodeURIComponent(id)}`,
    );
    const ext = String(res.movie_data?.["container_extension"] ?? "mp4");
    return { url: `${this.base}/movie/${this.user}/${this.pass}/${id}.${ext}` };
  }

  async episodeStreamUrl(seriesId: string, episodeId: string): Promise<{ url: string }> {
    this.assertConfigured();
    const res = await this.api<{
      episodes?: Record<string, Record<string, unknown>[]>;
    }>("get_series_info", `&series_id=${encodeURIComponent(seriesId)}`);
    let ext = "mkv";
    for (const key of Object.keys(res.episodes ?? {})) {
      const ep = (res.episodes?.[key] ?? []).find((e) => String(e["id"]) === episodeId);
      if (ep !== undefined) {
        ext = String(ep["container_extension"] ?? "mkv");
        break;
      }
    }
    return { url: `${this.base}/series/${this.user}/${this.pass}/${episodeId}.${ext}` };
  }
}
