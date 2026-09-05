const KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY ?? "";

export interface TmdbMovie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date?: string;
  vote_average?: number;
}

export const posterUrl = (path: string | null, size = "w342"): string | null =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null;

export function hasTmdbKey(): boolean {
  return KEY.length > 0;
}

/** Títulos de muestra para probar el reproductor SIN key de TMDB todavía. */
const FALLBACK: TmdbMovie[] = [
  { id: 550, title: "El club de la lucha", poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", release_date: "1999", vote_average: 8.4 },
  { id: 27205, title: "El origen", poster_path: "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg", release_date: "2010", vote_average: 8.4 },
  { id: 603, title: "The Matrix", poster_path: "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg", release_date: "1999", vote_average: 8.2 },
  { id: 157336, title: "Interstellar", poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", release_date: "2014", vote_average: 8.4 },
  { id: 808, title: "Shrek", poster_path: "/iB64vpL3dIObOtMZgX3RqdVdQDc.jpg", release_date: "2001", vote_average: 7.7 },
  { id: 76341, title: "Mad Max: Fury Road", poster_path: "/8tZYtuWezp8JbcsvHYO0O46tFbo.jpg", release_date: "2015", vote_average: 7.6 },
];

export async function trendingMovies(): Promise<TmdbMovie[]> {
  if (!KEY) return FALLBACK;
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/trending/movie/week?language=es-AR&api_key=${KEY}`,
    );
    const data = await res.json();
    return data.results ?? [];
  } catch {
    return FALLBACK;
  }
}

export async function searchMovies(q: string): Promise<TmdbMovie[]> {
  const term = q.trim();
  if (term.length === 0) return trendingMovies();
  if (!KEY) {
    const t = term.toLowerCase();
    return FALLBACK.filter((m) => m.title.toLowerCase().includes(t));
  }
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(
        term,
      )}&language=es-AR&include_adult=false&api_key=${KEY}`,
    );
    const data = await res.json();
    return data.results ?? [];
  } catch {
    return [];
  }
}
