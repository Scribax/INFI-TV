/**
 * Cliente del Miruro-API (self-hosted) para anime moderno vía m3u8.
 * El API corre localmente en la máquina de Fran (IP residencial, que es la
 * que pasa el Cloudflare de Miruro). Para producción habría que montarlo en
 * un servidor con IP no-datacenter.
 */
const BASE = "http://192.168.1.36:8000";

export interface MiruroTitle {
  romaji?: string;
  english?: string;
}

export interface MiruroAnime {
  id: number; // anilist id
  title: MiruroTitle;
  coverImage?: { large?: string; extraLarge?: string };
  format?: string;
  status?: string;
  episodes?: number;
  genres?: string[];
  averageScore?: number;
}

export interface MiruroEpisode {
  id: string; // "watch/bonk/20/sub/animedao-1"
  number: number;
  title: string;
  audio?: string;
  image?: string;
}

export interface MiruroStream {
  url: string;
  type: string;
  referer?: string;
  server?: string;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`Miruro ${res.status}`);
  return res.json() as Promise<T>;
}

export function getTrending(): Promise<{ results: MiruroAnime[] }> {
  return get("/trending");
}

export function getPopular(): Promise<{ results: MiruroAnime[] }> {
  return get("/popular");
}

export function searchModernAnime(
  query: string,
): Promise<{ results: MiruroAnime[] }> {
  return get(`/search?query=${encodeURIComponent(query)}`);
}

export async function getEpisodes(anilistId: number): Promise<MiruroEpisode[]> {
  const data = await get<{ providers?: Record<string, unknown> }>(
    `/episodes/${anilistId}`,
  );
  const providers = data.providers ?? {};
  const pick = (cat: "sub" | "dub") => {
    for (const p of Object.values(providers)) {
      const eps = (p as { episodes?: Record<string, MiruroEpisode[]> })
        ?.episodes?.[cat];
      if (eps !== undefined && eps.length > 0) return eps;
    }
    return null;
  };
  return pick("sub") ?? pick("dub") ?? [];
}

export async function getStream(
  episodeId: string,
): Promise<{ streams: MiruroStream[] }> {
  // El id ya incluye el prefijo "watch/..." — se concatena al path.
  return get(`/${episodeId}`);
}

export function pickStream(streams: MiruroStream[]): MiruroStream | null {
  return streams.find((s) => s.type === "hls") ?? streams[0] ?? null;
}
