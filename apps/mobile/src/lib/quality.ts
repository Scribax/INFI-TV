import { qualityTones } from "@/constants/theme";

export type QualityBadge = (typeof qualityTones)[keyof typeof qualityTones];

/**
 * Deriva la calidad de un canal a partir de su nombre. iptv-org la trae como
 * sufijo "(1080p)", "HD", "4K", etc. Devuelve null si no se puede inferir.
 */
export function channelQuality(name: string): QualityBadge | null {
  const n = name.toUpperCase();
  if (/\b4K\b|2160P/.test(n)) return qualityTones["4k"];
  if (/1080P|FHD/.test(n)) return qualityTones.fhd;
  if (/720P|\bHD\b/.test(n)) return qualityTones.hd;
  if (/576P|480P|360P|\bSD\b/.test(n)) return qualityTones.sd;
  return null;
}
