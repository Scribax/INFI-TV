/**
 * Parser puro de playlists M3U de IPTV-org (sin I/O, sin dependencias).
 * Cada entrada luce así:
 *
 *   #EXTINF:-1 tvg-id="Telefe.ar@HD" tvg-logo="https://…" group-title="General",Telefe
 *   https://stream.example/telefe.m3u8
 *
 * - `tvg-id` es el id externo (sufijo `.xx` = país, `@XX` = calidad).
 * - `group-title` es la categoría (múltiples separadas por `;`).
 * - El display name va tras la primera coma FUERA de comillas (los atributos
 *   como `http-user-agent` pueden contener comas internas).
 */

export interface ParsedChannel {
  /** tvg-id sin el sufijo de calidad (ej. "Telefe.ar"). */
  externalId: string;
  name: string;
  logoUrl: string | null;
  streamUrl: string;
  /** Código ISO-2 en mayúsculas, o null si no se pudo derivar. */
  countryCode: string | null;
  /** Categorías (group-title separado por `;`). */
  categories: string[];
  /** Rank de calidad para deduplicar (mayor = mejor). */
  qualityRank: number;
}

function parseAttribute(line: string, name: string): string | null {
  const match = line.match(new RegExp(`${name}="([^"]*)"`));
  return match === null ? null : match[1];
}

/** Nombre del canal: texto tras la primera coma que está fuera de comillas. */
export function parseDisplayName(line: string): string {
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      return line.slice(i + 1).trim();
    }
  }
  return "";
}

/** Quita el sufijo de calidad (`@SD`, `@HD`, `@FHD`…). */
export function baseId(tvgId: string): string {
  return tvgId.replace(/@[A-Za-z0-9]+$/, "");
}

/** Deriva el país del sufijo `.xx` del tvg-id (best-effort). */
export function countryCodeFromId(tvgId: string): string | null {
  const match = baseId(tvgId).match(/\.([a-z]{2})$/i);
  return match === null ? null : match[1].toUpperCase();
}

/** Rank de calidad: FHD/4K > HD/1080p > SD/720p > resto. */
export function qualityRank(tvgId: string, name: string): number {
  const quality = (tvgId.match(/@([A-Za-z0-9]+)$/)?.[1] ?? "").toUpperCase();
  if (quality.includes("FHD") || quality.includes("4K") || quality.includes("2160")) {
    return 5;
  }
  if (quality.includes("HD") || quality.includes("1080")) {
    return 4;
  }
  if (quality.includes("SD") || quality.includes("720")) {
    return 3;
  }
  if (quality.includes("576") || quality.includes("480") || quality.includes("404")) {
    return 2;
  }
  if (name.includes("1080p") || name.includes("Full HD")) {
    return 4;
  }
  if (name.includes("720p")) {
    return 3;
  }
  return 1;
}

export function parseM3u(content: string): ParsedChannel[] {
  const lines = content.split(/\r?\n/);
  const channels: ParsedChannel[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line.startsWith("#EXTINF")) {
      continue;
    }
    const tvgId = parseAttribute(line, "tvg-id");
    if (tvgId === null || tvgId === "") {
      continue;
    }

    // La URL del stream es la siguiente línea que no sea comentario.
    let streamUrl = "";
    for (let j = i + 1; j < lines.length; j += 1) {
      const next = lines[j].trim();
      if (next === "") {
        continue;
      }
      if (next.startsWith("#")) {
        if (next.startsWith("#EXTINF")) {
          break; // entrada sin URL, descartar
        }
        continue; // #EXTVLCOPT y similares
      }
      streamUrl = next;
      break;
    }
    if (streamUrl === "") {
      continue;
    }

    const name = parseDisplayName(line);
    if (name === "") {
      continue;
    }

    const logoUrl = parseAttribute(line, "tvg-logo");
    const groupTitle = parseAttribute(line, "group-title") ?? "";
    const categories = groupTitle
      .split(";")
      .map((c) => c.trim())
      .filter((c) => c !== "" && c.toLowerCase() !== "undefined");

    channels.push({
      externalId: baseId(tvgId),
      name,
      logoUrl: logoUrl === null || logoUrl === "" ? null : logoUrl,
      streamUrl,
      countryCode: countryCodeFromId(tvgId),
      categories,
      qualityRank: qualityRank(tvgId, name),
    });
  }

  return channels;
}

/** Deduplica por externalId conservando la entrada de mejor calidad. */
export function dedupeChannels(channels: ParsedChannel[]): ParsedChannel[] {
  const byId = new Map<string, ParsedChannel>();
  for (const channel of channels) {
    const existing = byId.get(channel.externalId);
    if (existing === undefined || channel.qualityRank > existing.qualityRank) {
      byId.set(channel.externalId, channel);
    }
  }
  return [...byId.values()];
}
