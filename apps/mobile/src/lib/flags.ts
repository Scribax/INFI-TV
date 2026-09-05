/** Deriva la bandera emoji del código ISO-2 (regional indicators). */
export function flagEmoji(code: string): string {
  const upper = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) {
    return "";
  }
  const a = 0x1f1e6 + upper.charCodeAt(0) - 65;
  const b = 0x1f1e6 + upper.charCodeAt(1) - 65;
  return String.fromCodePoint(a, b);
}

/** Etiquetas en español para las categorías comunes de IPTV-org. */
const CATEGORY_LABELS: Record<string, string> = {
  general: "General",
  news: "Noticias",
  sports: "Deportes",
  entertainment: "Entretenimiento",
  movies: "Películas",
  music: "Música",
  kids: "Infantiles",
  documentary: "Documentales",
  education: "Educación",
  culture: "Cultura",
  religious: "Religioso",
  business: "Negocios",
  weather: "Clima",
  series: "Series",
  lifestyle: "Estilo de vida",
  travel: "Viajes",
  cooking: "Cocina",
  science: "Ciencia",
  comedy: "Comedia",
  family: "Familia",
  legislative: "Legislativo",
};

export function categoryLabel(slug: string): string {
  return CATEGORY_LABELS[slug] ?? slug;
}
