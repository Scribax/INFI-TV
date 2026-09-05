import { useEffect, useState } from "react";
import { getChannelEpg } from "@/lib/epg";
import type { EpgProgramItem } from "@/lib/types";

export function useChannelEpg(channelId: string) {
  const [programs, setPrograms] = useState<EpgProgramItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getChannelEpg(channelId);
        if (!cancelled) setPrograms(data);
      } catch {
        // sin EPG: lista vacía, la app sigue funcionando
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [channelId]);

  return { programs, loading };
}
