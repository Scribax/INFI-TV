import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { api } from "@/lib/api";
import { recordWatch } from "@/lib/me";
import { useFavorites } from "@/hooks/use-me";
import { useChannelEpg } from "@/hooks/use-epg";
import { colors } from "@/constants/theme";
import { flagEmoji } from "@/lib/flags";
import type { ChannelItem, EpgProgramItem } from "@/lib/types";

function Player({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.play();
  });
  return (
    <VideoView
      player={player}
      style={styles.video}
      contentFit="contain"
      nativeControls
    />
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function EpgSection({ programs }: { programs: EpgProgramItem[] }) {
  return (
    <View style={styles.epg}>
      <Text style={styles.epgTitle}>Programación</Text>
      {programs.slice(0, 8).map((p) => (
        <View key={p.id} style={styles.epgRow}>
          <Text style={[styles.epgTime, p.isLive && styles.epgTimeNow]}>
            {formatTime(p.startsAt)}
          </Text>
          <View style={styles.epgBody}>
            <Text
              style={[styles.epgName, p.isLive && styles.epgNameNow]}
              numberOfLines={1}
            >
              {p.isLive ? "● " : ""}
              {p.title}
            </Text>
            {p.description !== null && (
              <Text style={styles.epgDesc} numberOfLines={2}>
                {p.description}
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

export default function ChannelScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isFavorite, toggle } = useFavorites();
  const { programs } = useChannelEpg(id);
  const [channel, setChannel] = useState<ChannelItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ch = await api.get<ChannelItem>(`/channels/${id}`);
        if (!cancelled) setChannel(ch);
        void recordWatch(id).catch(() => {});
      } catch {
        // el estado vacío lo maneja el render
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const fav = channel !== null && isFavorite(id);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.back}>‹ Volver</Text>
        </Pressable>
        {channel !== null && (
          <Pressable onPress={() => toggle(channel)} hitSlop={8}>
            <Text style={styles.fav}>{fav ? "⭐" : "☆"}</Text>
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <Text style={styles.muted}>Cargando…</Text>
        </View>
      ) : channel === null ? (
        <View style={styles.center}>
          <Text style={styles.muted}>Canal no disponible.</Text>
        </View>
      ) : (
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          <Player uri={channel.streamUrl} />

          <View style={styles.meta}>
            {channel.logoUrl !== null && !imgFailed ? (
              <Image
                source={{ uri: channel.logoUrl }}
                style={styles.logo}
                resizeMode="contain"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <View style={[styles.logo, styles.logoFallback]}>
                <Text style={styles.logoInitial}>
                  {channel.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.metaText}>
              <Text style={styles.name} numberOfLines={2}>
                {channel.name}
              </Text>
              {channel.countryCode !== null && (
                <Text style={styles.flag}>
                  {flagEmoji(channel.countryCode)}
                </Text>
              )}
            </View>
          </View>

          {programs.length > 0 && <EpgSection programs={programs} />}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  back: {
    color: colors.textMuted,
    fontSize: 16,
  },
  fav: {
    fontSize: 22,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingBottom: 24,
  },
  video: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  logo: {
    width: 64,
    height: 44,
    borderRadius: 8,
  },
  logoFallback: {
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  logoInitial: {
    color: colors.brand,
    fontSize: 22,
    fontWeight: "700",
  },
  metaText: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  flag: {
    fontSize: 18,
  },
  epg: {
    paddingHorizontal: 16,
    gap: 10,
  },
  epgTitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  epgRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  epgTime: {
    color: colors.textFaint,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    width: 44,
    marginTop: 2,
  },
  epgTimeNow: {
    color: colors.brand,
    fontWeight: "700",
  },
  epgBody: {
    flex: 1,
  },
  epgName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "500",
  },
  epgNameNow: {
    color: colors.brand,
    fontWeight: "700",
  },
  epgDesc: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  muted: {
    color: colors.textFaint,
    fontSize: 14,
  },
});
