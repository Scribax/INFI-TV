import { Injectable } from "@nestjs/common";

const ANILIST = "https://graphql.anilist.co";
const MIN = 60_000;

export interface AnimeItem {
  id: string;
  title: string;
  cover: string | null;
  format: string | null;
  status: string | null;
  episodes: number | null;
  score: number | null;
  genres: string[];
}

export interface AnimeDetail extends AnimeItem {
  description: string | null;
  banner: string | null;
  native: string | null;
}

interface Media {
  id: number;
  title?: { romaji?: string; english?: string; native?: string };
  coverImage?: { large?: string; extraLarge?: string };
  bannerImage?: string;
  description?: string;
  format?: string;
  status?: string;
  episodes?: number;
  duration?: number;
  averageScore?: number;
  genres?: string[];
  studios?: { nodes?: { name?: string }[] };
}

interface CacheEntry<T> {
  value: T;
  at: number;
}

/**
 * Catálogo de anime con AniList (GraphQL). Solo metadatos (legal y estable);
 * el video se conecta aparte con un sistema de providers intercambiables.
 * Cache en memoria para no pegarle a AniList en cada request.
 */
@Injectable()
export class AnimeService {
  private readonly cache = new Map<string, CacheEntry<unknown>>();

  private async graphql<T>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    const res = await fetch(ANILIST, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) throw new Error(`AniList ${res.status}`);
    const json = (await res.json()) as {
      data: T;
      errors?: { message: string }[];
    };
    if (json.errors !== undefined && json.errors.length > 0) {
      throw new Error(json.errors[0].message);
    }
    return json.data;
  }

  private async cached<T>(
    key: string,
    ttl: number,
    fn: () => Promise<T>,
  ): Promise<T> {
    const hit = this.cache.get(key);
    if (hit !== undefined && Date.now() - hit.at < ttl) {
      return hit.value as T;
    }
    const value = await fn();
    this.cache.set(key, { value, at: Date.now() });
    return value;
  }

  private mapMedia(m: Media): AnimeItem {
    return {
      id: `anilist-${m.id}`,
      title: m.title?.english ?? m.title?.romaji ?? "Anime",
      cover: m.coverImage?.extraLarge ?? m.coverImage?.large ?? null,
      format: m.format ?? null,
      status: m.status ?? null,
      episodes: m.episodes ?? null,
      score: m.averageScore ?? null,
      genres: m.genres ?? [],
    };
  }

  private MEDIA_FIELDS = `
    id
    title { romaji english }
    coverImage { large extraLarge }
    format
    status
    episodes
    averageScore
    genres
  `;

  async search(query: string): Promise<AnimeItem[]> {
    return this.cached(`search:${query.toLowerCase()}`, 10 * MIN, async () => {
      const data = await this.graphql<{
        Page: { media: Media[] };
      }>(
        `query ($q: String) {
          Page(page: 1, perPage: 30) {
            media(search: $q, type: ANIME) { ${this.MEDIA_FIELDS} }
          }
        }`,
        { q: query },
      );
      return data.Page.media.map((m) => this.mapMedia(m));
    });
  }

  private async list(sort: string, key: string): Promise<AnimeItem[]> {
    return this.cached(key, 30 * MIN, async () => {
      const data = await this.graphql<{ Page: { media: Media[] } }>(
        `query {
          Page(page: 1, perPage: 30) {
            media(type: ANIME, sort: ${sort}) { ${this.MEDIA_FIELDS} }
          }
        }`,
      );
      return data.Page.media.map((m) => this.mapMedia(m));
    });
  }

  trending(): Promise<AnimeItem[]> {
    return this.list("TRENDING_DESC", "trending");
  }

  popular(): Promise<AnimeItem[]> {
    return this.list("POPULARITY_DESC", "popular");
  }

  recent(): Promise<AnimeItem[]> {
    // Anime en emisión de la temporada actual (sort por popularidad).
    return this.list("POPULARITY_DESC", "recent");
  }

  async info(id: number): Promise<AnimeDetail> {
    return this.cached(`info:${id}`, 60 * MIN, async () => {
      const data = await this.graphql<{ Media: Media }>(
        `query ($id: Int) {
          Media(id: $id, type: ANIME) {
            id
            title { romaji english native }
            coverImage { large extraLarge }
            bannerImage
            description
            format
            status
            episodes
            averageScore
            genres
            studios { nodes { name } }
          }
        }`,
        { id },
      );
      const m = data.Media;
      return {
        ...this.mapMedia(m),
        description: m.description ?? null,
        banner: m.bannerImage ?? null,
        native: m.title?.native ?? null,
      };
    });
  }

  async episodes(id: number): Promise<{ count: number | null; numbers: number[] }> {
    const detail = await this.info(id);
    const count = detail.episodes ?? 0;
    // AniList no expone títulos por episodio; se devuelve la numeración.
    const numbers = Array.from({ length: Math.min(count, 1500) }, (_, i) => i + 1);
    return { count: detail.episodes, numbers };
  }
}
