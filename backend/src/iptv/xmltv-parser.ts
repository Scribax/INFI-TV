/**
 * Parser puro de guías XMLTV (sin I/O, sin dependencias).
 *
 * Formato esperado (iptv-org/epg y derivados):
 *   <programme start="20260905120000 -0300" stop="20260905130000 -0300"
 *              channel="Telefe.ar">
 *     <title lang="es">Programa</title>
 *     <desc lang="es">Descripción</desc>
 *   </programme>
 *
 * El `channel` de cada `<programme>` coincide con el `tvg-id` de IPTV-org,
 * que en nuestra DB vive en `Channel.externalId`.
 */

export interface EpgProgramEntry {
  /** id del canal en la guía (coincide con el tvg-id / externalId). */
  channelId: string;
  title: string;
  description: string | null;
  startsAt: string; // ISO 8601 (UTC)
  endsAt: string; // ISO 8601 (UTC)
}

const XML_ENTITIES: Array<[RegExp, string]> = [
  [/&amp;/g, "&"],
  [/&lt;/g, "<"],
  [/&gt;/g, ">"],
  [/&quot;/g, '"'],
  [/&apos;/g, "'"],
  [/&#39;/g, "'"],
  [/&#\d+;/g, ""],
  [/&#x[0-9a-f]+;/gi, ""],
];

export function unescapeXml(value: string): string {
  let out = value;
  for (const [re, replacement] of XML_ENTITIES) {
    out = out.replace(re, replacement);
  }
  return out;
}

/**
 * Parsea "YYYYMMDDHHMMSS [+-]HHMM" a epoch ms (UTC).
 * Devuelve null si el formato no es válido.
 */
export function parseXmltvTime(raw: string): number | null {
  const m = raw.match(
    /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s*([+-]\d{4})?$/,
  );
  if (m === null) {
    return null;
  }
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const h = Number(m[4]);
  const mi = Number(m[5]);
  const s = Number(m[6]);
  const utc = Date.UTC(y, mo - 1, d, h, mi, s);
  if (m[7] === undefined) {
    return utc;
  }
  const sign = m[7][0] === "-" ? -1 : 1;
  const oh = Number(m[7].slice(1, 3));
  const om = Number(m[7].slice(3, 5));
  return utc - sign * (oh * 3600 + om * 60) * 1000;
}

export function parseXmltv(content: string): EpgProgramEntry[] {
  const entries: EpgProgramEntry[] = [];
  const openTagRe = /<programme\b[^>]*>/g;
  let openTag: RegExpExecArray | null;

  while ((openTag = openTagRe.exec(content)) !== null) {
    const tag = openTag[0];
    const channelId = tag.match(/channel="([^"]+)"/)?.[1];
    const start = tag.match(/start="([^"]+)"/)?.[1];
    const stop = tag.match(/stop="([^"]+)"/)?.[1];
    if (channelId === undefined || start === undefined || stop === undefined) {
      continue;
    }
    const startsAtMs = parseXmltvTime(start);
    const endsAtMs = parseXmltvTime(stop);
    if (startsAtMs === null || endsAtMs === null || endsAtMs <= startsAtMs) {
      continue;
    }

    const innerStart = openTagRe.lastIndex;
    const innerEnd = content.indexOf("</programme>", innerStart);
    const inner =
      innerEnd === -1 ? "" : content.slice(innerStart, innerEnd);
    const title = inner.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1];
    if (title === undefined) {
      continue;
    }
    const desc = inner.match(/<desc[^>]*>([\s\S]*?)<\/desc>/)?.[1];

    entries.push({
      channelId,
      title: unescapeXml(title.trim()),
      description: desc === undefined ? null : unescapeXml(desc.trim()),
      startsAt: new Date(startsAtMs).toISOString(),
      endsAt: new Date(endsAtMs).toISOString(),
    });
  }

  return entries;
}
