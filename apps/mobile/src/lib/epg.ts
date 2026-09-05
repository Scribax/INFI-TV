import { api } from "./api";
import type { EpgProgramItem } from "./types";

export function getChannelEpg(
  channelId: string,
  limit = 12,
): Promise<EpgProgramItem[]> {
  return api.get<EpgProgramItem[]>(
    `/channels/${channelId}/epg?limit=${limit}`,
  );
}
