/**
 * Anime on-demand desde GitHub (VegettoSan/MovieStreamList, lista Latino/Anime).
 * Streams HLS (.m3u8) directos, sin Xtream. Los 19 títulos se verificaron vivos
 * el 2026-09-05 (19/19 responden 200 con #EXTM3U).
 */
export interface AnimeTitle {
  id: string;
  name: string;
  cover: string | null;
  playlist: string;
}

export const ANIME_TITLES: AnimeTitle[] = [
  {
    id: "0",
    name: "5 Centimetros por Segundo (Sub)",
    cover: "https://github.com/VegettoSan/MovieStreamList/blob/main/Anime/5%20Centimetros%20por%20Segundo%20(Sub)/5CentimetrosporSegundoCOVER.jpg?raw=true",
    playlist: "https://github.com/VegettoSan/MovieStreamList/raw/main/Anime/5%20Centimetros%20por%20Segundo%20(Sub)/5CentimetrosporSegundo(Sub).m3u8",
  },
  {
    id: "1",
    name: "11 Eyes (Sub)",
    cover: "https://raw.githubusercontent.com/VegettoSan/MovieStreamList/main/Anime/11%20Eyes%20(Sub)/11EyesCover.jpg",
    playlist: "https://github.com/VegettoSan/MovieStreamList/raw/main/Anime/11%20Eyes%20(Sub)/11%20Eyes%20(Sub).m3u8",
  },
  {
    id: "2",
    name: "Afro Samurai (Sub)",
    cover: "https://github.com/VegettoSan/MovieStreamList/blob/main/Anime/Afro%20Samurai%20(Sub)/AfroSamuraiCover.jpg?raw=true",
    playlist: "https://github.com/VegettoSan/MovieStreamList/raw/main/Anime/Afro%20Samurai%20(Sub)/Afro%20Samurai%20(Sub).m3u8",
  },
  {
    id: "3",
    name: "Aggretsuko (Sub)",
    cover: "https://github.com/VegettoSan/MovieStreamList/blob/main/Anime/Aggretsuko%20(Sub)/AggretsukoCover.jpg?raw=true",
    playlist: "https://github.com/VegettoSan/MovieStreamList/raw/main/Anime/Aggretsuko%20(Sub)/Aggretsuko%20(Sub).m3u8",
  },
  {
    id: "4",
    name: "Angel Beats (Sub)",
    cover: "https://github.com/VegettoSan/MovieStreamList/blob/main/Anime/Angel%20Beats%20(Sub)/AngelBeatsCover.jpg?raw=true",
    playlist: "https://github.com/VegettoSan/MovieStreamList/raw/main/Anime/Angel%20Beats%20(Sub)/Angel%20Beats%20(Sub).m3u8",
  },
  {
    id: "5",
    name: "Cowboy Bebop La Pelicula (Latino)",
    cover: "https://github.com/VegettoSan/MovieStreamList/blob/main/Anime/CowboyBebopPelicula(Latino)/CowboyBebopPeliculaCOVER.jpg?raw=true",
    playlist: "https://github.com/VegettoSan/MovieStreamList/raw/main/Anime/CowboyBebopPelicula(Latino)/CowboyBebopPelicula(Latino).m3u8",
  },
  {
    id: "6",
    name: "Cyberpunk Edgerunners (Sub)",
    cover: "https://github.com/VegettoSan/MovieStreamList/blob/main/Anime/Cyberpunk%20Edgerunners%20(Sub)/CYB3RPUNCK3DG3RUNN3R2COVER.jpg?raw=true",
    playlist: "https://github.com/VegettoSan/MovieStreamList/raw/main/Anime/Cyberpunk%20Edgerunners%20(Sub)/CyberpunkEdgerunners(Sub).m3u8",
  },
  {
    id: "7",
    name: "Dino Rey (Latino)",
    cover: "https://github.com/VegettoSan/MovieStreamList/blob/main/Anime/DinoRey(Latino)/DinoReyCOVER.jpg?raw=true",
    playlist: "https://github.com/VegettoSan/MovieStreamList/raw/main/Anime/DinoRey(Latino)/DinoRey(Latino).m3u8",
  },
  {
    id: "8",
    name: "Halo Legends (Sub)",
    cover: "https://github.com/VegettoSan/MovieStreamList/blob/main/Anime/Halo%20Legends%20(Sub)/H4L0L3G3NDS_COVER.jpg?raw=true",
    playlist: "https://github.com/VegettoSan/MovieStreamList/raw/main/Anime/Halo%20Legends%20(Sub)/HaloLegends(Japones%20Sub).m3u8",
  },
  {
    id: "9",
    name: "Inuyasha (Latino)",
    cover: "https://github.com/VegettoSan/MovieStreamList/blob/main/Anime/Inuyasha(Latino)/InuyashaCOVER.jpg?raw=true",
    playlist: "https://github.com/VegettoSan/MovieStreamList/raw/main/Anime/Inuyasha(Latino)/Inuyasha(Latino).m3u8",
  },
  {
    id: "10",
    name: "Little Witch Academia (Latino)",
    cover: "https://github.com/VegettoSan/MovieStreamList/blob/main/Anime/LittleWicthAcademia(Latino)/LittleWicthAcademiaCOVER.jpg?raw=true",
    playlist: "https://github.com/VegettoSan/MovieStreamList/raw/main/Anime/LittleWicthAcademia(Latino)/LittleWicthAcademia(Latino).m3u8",
  },
  {
    id: "11",
    name: "Mirai Nikki (Sub)",
    cover: "https://github.com/VegettoSan/MovieStreamList/blob/main/Anime/MiraiNikki(sub)/MiraiNikkiCOVER.jpg?raw=true",
    playlist: "https://github.com/VegettoSan/MovieStreamList/raw/main/Anime/MiraiNikki(sub)/MiraiNikki(sub).m3u8",
  },
  {
    id: "12",
    name: "Neon Genesis Evangelion (Latino)",
    cover: "https://github.com/VegettoSan/MovieStreamList/blob/main/Anime/NeonGenesisEvangelion(Latino)/NeonGenesisEvangelionCOVER.jpg?raw=true",
    playlist: "https://github.com/VegettoSan/MovieStreamList/raw/main/Anime/NeonGenesisEvangelion(Latino)/NeonGenesisEvangelion(Latino).m3u8",
  },
  {
    id: "13",
    name: "Psycho Pass (Sub)",
    cover: "https://github.com/VegettoSan/MovieStreamList/blob/main/Anime/PsychoPass(Sub)/PsychoPassCOVER.jpg?raw=true",
    playlist: "https://github.com/VegettoSan/MovieStreamList/raw/main/Anime/PsychoPass(Sub)/PsychoPass(Sub).m3u8",
  },
  {
    id: "14",
    name: "Ranma y Medio (Latino)",
    cover: "https://github.com/VegettoSan/MovieStreamList/blob/main/Anime/RanmayMedio(Latino)/RanmayMedioCOVER.jpg?raw=true",
    playlist: "https://github.com/VegettoSan/MovieStreamList/raw/main/Anime/RanmayMedio(Latino)/RanmayMedio(Latino).m3u8",
  },
  {
    id: "15",
    name: "STEINS GATE (Sub)",
    cover: "https://github.com/VegettoSan/MovieStreamList/blob/main/Anime/STEINSGATE(Sub)/STEINSGATECOVER.jpg?raw=true",
    playlist: "https://github.com/VegettoSan/MovieStreamList/raw/main/Anime/STEINSGATE(Sub)/STEINSGATE(Sub).m3u8",
  },
  {
    id: "16",
    name: "Studio Ghibli (Latino)",
    cover: "https://github.com/VegettoSan/MovieStreamList/blob/main/Anime/Studio%20Ghibli%20(Latino)/CoverGhibli.jpg?raw=true",
    playlist: "https://github.com/VegettoSan/MovieStreamList/raw/main/Anime/Studio%20Ghibli%20(Latino)/Studio%20Ghibli%20Latino.m3u8",
  },
  {
    id: "17",
    name: "Toradora (Sub)",
    cover: "https://github.com/VegettoSan/MovieStreamList/blob/main/Anime/Toradora(Sub)/ToradoraCOVER.jpg?raw=true",
    playlist: "https://github.com/VegettoSan/MovieStreamList/raw/main/Anime/Toradora(Sub)/Toradora(Sub).m3u8",
  },
  {
    id: "18",
    name: "Tsurezure Children (Sub)",
    cover: "https://github.com/VegettoSan/MovieStreamList/blob/main/Anime/TsurezureChildren(Sub)/TsurezureChildrenCOVER.jpg?raw=true",
    playlist: "https://github.com/VegettoSan/MovieStreamList/raw/main/Anime/TsurezureChildren(Sub)/TsurezureChildren(Sub).m3u8",
  },
];

export function getAnimeTitle(id: string): AnimeTitle | undefined {
  return ANIME_TITLES.find((t) => t.id === id);
}

export interface AnimeEpisode {
  name: string;
  url: string;
  cover?: string | null;
}

/** Parsea una lista M3U (no HLS): líneas #EXTINF + URL de .mp4. */
export function parseM3U(text: string): AnimeEpisode[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "");
  const episodes: AnimeEpisode[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("#EXTINF")) {
      const name = lines[i].split(",").slice(1).join(",").trim();
      const logo = lines[i].match(/tvg-logo="([^"]+)"/);
      const url = lines[i + 1] ?? "";
      if (url.startsWith("http")) {
        episodes.push({
          name: name || url,
          url,
          cover: logo !== null ? logo[1] : null,
        });
      }
      i++;
    }
  }
  return episodes;
}

/** Descarga y parsea la lista de episodios de un título. */
export async function fetchAnimeEpisodes(id: string): Promise<AnimeEpisode[]> {
  const title = getAnimeTitle(id);
  if (title === undefined) return [];
  // Los paréntesis de las rutas ("(Latino)") no van crudos en la URL.
  const url = title.playlist.replace(/\(/g, "%28").replace(/\)/g, "%29");
  const res = await fetch(url);
  const text = await res.text();
  return parseM3U(text);
}

export interface AnimeSeries {
  identifier: string;
  name: string;
  cover: string;
}

/**
 * Busca TODAS las colecciones de anime latino/español en archive.org
 * (la fuente más grande de series completas con mp4 directos). Ordenadas
 * por descargas. No usa Xtream ni scrapea sitios frágiles.
 */
/**
 * Animes reconocidos en archive.org (curado a mano: solo series legítimas en
 * español latino). Reemplaza la búsqueda abierta, que traía bootlegs/ruido.
 */
export const ARCHIVE_ANIME_SERIES: AnimeSeries[] = [
  { identifier: "naruto-completo", name: "Naruto" },
  { identifier: "bleach-latino", name: "Bleach" },
  { identifier: "Dragon-Ball-GT-Latino-JP", name: "Dragon Ball GT" },
  { identifier: "dragon-ball-z-kai-episodios-1-al-17-latino-ingles-cut-ost-yamamoto-oficial", name: "Dragon Ball Z Kai" },
  { identifier: "ranma-nibunnoichi-espanol-latino-y-japones", name: "Ranma ½" },
  { identifier: "inuyasha-tv-rip-latino-cartoon-network", name: "Inuyasha" },
  { identifier: "sakura-card-captor-en-espanol-latino", name: "Sakura Card Captor" },
  { identifier: "samurai-champloo-espanol", name: "Samurai Champloo" },
  { identifier: "digimon-adventure-espanol-latino-etc-tv-rip-2017", name: "Digimon Adventure" },
  { identifier: "digimon-adventure-02-espanol-latino-etc-tv-rip-2017", name: "Digimon Adventure 02" },
  { identifier: "pokemon-viajes-capitulo-100-sub-espanol", name: "Pokémon Viajes" },
  { identifier: "yu-yu-hakusho-latin", name: "Yu Yu Hakusho" },
  { identifier: "tpo-neon-genesis-evangelion-05-trapo-2019-universo-anime", name: "Neon Genesis Evangelion" },
  { identifier: "attack-on-titan-season-3-latino_202206", name: "Attack on Titan" },
  { identifier: "fma-latino-esp-full", name: "Fullmetal Alchemist" },
  { identifier: "dr.-stone-en-latino", name: "Dr. Stone" },
  { identifier: "black-clover-3", name: "Black Clover" },
  { identifier: "boku-no-hero-academia-s-6-latino", name: "My Hero Academia" },
  { identifier: "bblatino-completo-coleccion", name: "Beyblade" },
  { identifier: "Metabots-Latino", name: "Medabots" },
  { identifier: "elfen-lied-latino", name: "Elfen Lied" },
  { identifier: "ttgl-000010", name: "Gurren Lagann" },
  { identifier: "magical-doremi-en-espanol-latino", name: "Magical Doremi" },
  { identifier: "magical-doremi-sharp-en-espanol-latino", name: "Magical Doremi Sharp" },
  { identifier: "utena-espanol-latino", name: "Utena" },
  { identifier: "mew-mew-power-espanol-latino-hq", name: "Mew Mew Power" },
  { identifier: "futari-wa-precure-2626-espanol-latino-472p", name: "Pretty Cure" },
  { identifier: "dgc-nyo-latino", name: "Di Gi Charat Nyo" },
  { identifier: "kirbydelasestrellasdoblaje", name: "Kirby" },
  { identifier: "heidi-1974-audio-latino-1080p", name: "Heidi" },
].map((s) => ({ ...s, cover: `https://archive.org/services/img/${s.identifier}` }));

/** Episodios .mp4 de una colección de archive.org. */
export async function fetchArchiveEpisodes(
  identifier: string,
): Promise<AnimeEpisode[]> {
  const res = await fetch(`https://archive.org/metadata/${identifier}`);
  const md = await res.json();
  const files: { name?: string }[] = md.files ?? [];
  return files
    .filter((f) => f.name?.toLowerCase().endsWith(".mp4"))
    .filter((f) => !f.name?.toLowerCase().endsWith(".ia.mp4"))
    .map((f) => ({
      name: (f.name as string).replace(/\.mp4$/i, ""),
      url: `https://archive.org/download/${identifier}/${encodeURIComponent(f.name as string)}`,
    }));
}
