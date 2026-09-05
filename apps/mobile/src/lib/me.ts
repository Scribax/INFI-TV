import { api } from "./api";
import type { AccountStatus, ChannelItem, HistoryEntry } from "./types";

export function getFavorites(): Promise<ChannelItem[]> {
  return api.get<ChannelItem[]>("/me/favorites");
}

export function addFavorite(channelId: string): Promise<unknown> {
  return api.post(`/me/favorites/${channelId}`, undefined);
}

export function removeFavorite(channelId: string): Promise<unknown> {
  return api.del(`/me/favorites/${channelId}`);
}

export function getHistory(): Promise<HistoryEntry[]> {
  return api.get<HistoryEntry[]>("/me/history");
}

export function recordWatch(channelId: string): Promise<unknown> {
  return api.post(`/me/history/${channelId}`, undefined);
}

/** Perfil y estado de la cuenta del cliente (para "Más" y polling). */
export function getAccountStatus(): Promise<AccountStatus> {
  return api.get<AccountStatus>("/auth/status");
}
