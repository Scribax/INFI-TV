/**
 * Metadatos de países derivados del código ISO-2 (sin depender de una
 * fuente externa). Diccionario de nombres en español para los países comunes;
 * el resto cae al propio código.
 */

const COUNTRY_NAMES: Record<string, string> = {
  AR: "Argentina",
  CL: "Chile",
  UY: "Uruguay",
  PY: "Paraguay",
  BO: "Bolivia",
  PE: "Perú",
  CO: "Colombia",
  EC: "Ecuador",
  VE: "Venezuela",
  BR: "Brasil",
  MX: "México",
  US: "Estados Unidos",
  CA: "Canadá",
  ES: "España",
  PT: "Portugal",
  IT: "Italia",
  FR: "Francia",
  DE: "Alemania",
  GB: "Reino Unido",
  UK: "Reino Unido",
  IE: "Irlanda",
  NL: "Países Bajos",
  BE: "Bélgica",
  CH: "Suiza",
  AT: "Austria",
  SE: "Suecia",
  NO: "Noruega",
  DK: "Dinamarca",
  FI: "Finlandia",
  PL: "Polonia",
  CZ: "Chequia",
  RU: "Rusia",
  UA: "Ucrania",
  TR: "Turquía",
  GR: "Grecia",
  IL: "Israel",
  AE: "Emiratos Árabes",
  SA: "Arabia Saudita",
  IN: "India",
  JP: "Japón",
  KR: "Corea del Sur",
  CN: "China",
  AU: "Australia",
  NZ: "Nueva Zelanda",
  ZA: "Sudáfrica",
  MA: "Marruecos",
  EG: "Egipto",
  NI: "Nicaragua",
  GT: "Guatemala",
  SV: "El Salvador",
  HN: "Honduras",
  CR: "Costa Rica",
  PA: "Panamá",
  DO: "República Dominicana",
  CU: "Cuba",
  PR: "Puerto Rico",
};

export function countryName(code: string): string {
  return COUNTRY_NAMES[code] ?? code;
}

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

/** Slug estable para categorías (sin acentos, solo [a-z0-9-]). */
export function slugify(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base === "" ? `cat-${Buffer.from(name).toString("hex").slice(0, 12)}` : base;
}
