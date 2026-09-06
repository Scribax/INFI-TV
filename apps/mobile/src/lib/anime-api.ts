import { api } from "./api";

export interface CatalogAnime {
  id: string; // "anilist-21"
  title: string;
  cover: string | null;
  format: string | null;
  status: string | null;
  episodes: number | null;
  score: number | null;
  genres: string[];
}

export interface CatalogAnimeDetail extends CatalogAnime {
  description: string | null;
  banner: string | null;
  native: string | null;
}

// El id de la API es "anilist-21"; el endpoint de detalle usa solo el número.
const num = (id: string) => id.replace(/^anilist-/, "");

export function catalogTrending(): Promise<CatalogAnime[]> {
  return api.get<CatalogAnime[]>("/anime/trending");
}

export function catalogPopular(): Promise<CatalogAnime[]> {
  return api.get<CatalogAnime[]>("/anime/popular");
}

export function catalogSearch(q: string): Promise<CatalogAnime[]> {
  return api.get<CatalogAnime[]>(`/anime/search?query=${encodeURIComponent(q)}`);
}

export function catalogInfo(id: string): Promise<CatalogAnimeDetail> {
  return api.get<CatalogAnimeDetail>(`/anime/${num(id)}`);
}

export function catalogEpisodes(
  id: string,
): Promise<{ count: number | null; numbers: number[] }> {
  return api.get<{ count: number | null; numbers: number[] }>(
    `/anime/${num(id)}/episodes`,
  );
}
