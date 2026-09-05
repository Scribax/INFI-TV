import { api } from "./api";

/** Cliente del módulo VOD del backend (proveedor Xtream). */

export interface VodMovie {
  id: string;
  name: string;
  poster: string | null;
  categoryId: string;
  categoryName: string;
  rating: string | null;
  added: string | null;
}

export interface VodMovieDetail {
  id: string;
  name: string;
  poster: string | null;
  plot: string | null;
  rating: string | null;
  year: string | null;
}

export interface VodCategory {
  category_id: string;
  category_name: string;
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

function qs(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** Las 4K/HEVC no se decodifican en el teléfono (solo en TV boxes) → se ocultan. */
const is4k = (name: string) => /\b(4K|2160P|UHD)\b/i.test(name);

export const fetchMovies = (p: { category?: string; search?: string; limit?: number } = {}) =>
  api.get<VodMovie[]>(`/vod/movies${qs(p)}`).then((list) => list.filter((m) => !is4k(m.name)));

export const fetchMovieDetail = (id: string) =>
  api.get<VodMovieDetail>(`/vod/movies/${id}`);

export const fetchMovieStream = (id: string) =>
  api.get<{ url: string }>(`/vod/stream/movie/${id}`);

export const fetchVodCategories = () =>
  api.get<VodCategory[]>("/vod/movies/categories");

export const fetchSeries = (p: { category?: string; search?: string; limit?: number } = {}) =>
  api.get<SeriesItem[]>(`/vod/series${qs(p)}`).then((list) => list.filter((s) => !is4k(s.name)));

export const fetchSeriesDetail = (id: string) =>
  api.get<SeriesDetail>(`/vod/series/${id}`);

export const fetchEpisodeStream = (seriesId: string, episodeId: string) =>
  api.get<{ url: string }>(`/vod/stream/series/${seriesId}/${episodeId}`);
