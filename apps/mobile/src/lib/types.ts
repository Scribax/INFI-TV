/** Tipos de la API de canales (FASE 9), tal como los devuelve el backend. */

export interface ChannelCategory {
  slug: string;
  name: string;
}

export interface ChannelItem {
  id: string;
  name: string;
  logoUrl: string | null;
  streamUrl: string;
  countryCode: string | null;
  categories: ChannelCategory[];
  language: string | null;
  isActive: boolean;
  streamStatus: string;
}

export interface CountryItem {
  code: string;
  name: string;
  flag: string | null;
}

export interface CategoryItem {
  id: string;
  slug: string;
  name: string;
}

export interface HistoryEntry {
  channel: ChannelItem;
  watchedAt: string;
}

export interface EpgProgramItem {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  isLive: boolean;
}
