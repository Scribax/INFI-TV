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
      const url = lines[i + 1] ?? "";
      if (url.startsWith("http")) {
        episodes.push({ name: name || url, url });
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
