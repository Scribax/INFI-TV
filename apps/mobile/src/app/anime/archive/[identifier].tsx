import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { ArrowLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchArchiveEpisodes } from "@/lib/anime";
import type { AnimeEpisode } from "@/lib/anime";
import { colors, fonts } from "@/constants/theme";

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

/** Serie completa de archive.org: lista de episodios .mp4. */
export default function AnimeArchiveScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { identifier, title } = useLocalSearchParams<{
    identifier: string;
    title?: string;
  }>();
  const [episodes, setEpisodes] = useState<AnimeEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState<AnimeEpisode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchArchiveEpisodes(identifier ?? "")
      .then((eps) => {
        if (!alive) return;
        setEpisodes(eps);
        setLoading(false);
        if (eps.length > 0) setCurrent(eps[0]);
      })
      .catch((e) => {
        if (!alive) return;
        setLoading(false);
        setError(e instanceof Error ? e.message : "Error al cargar los episodios.");
      });
    return () => {
      alive = false;
    };
  }, [identifier]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {title ?? "Serie"}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {current !== null ? (
        <Player key={current.url} uri={current.url} />
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} size="large" />
        </View>
      ) : (
        <View style={styles.center}>
          <Text style={styles.muted}>
            {error ?? "Sin episodios disponibles."}
          </Text>
        </View>
      )}

      <FlatList
        data={episodes}
        keyExtractor={(e, i) => `${i}-${e.url}`}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => {
          const active = current?.url === item.url;
          return (
            <Pressable
              style={[styles.epRow, active && styles.epActive]}
              onPress={() => setCurrent(item)}
            >
              <Text style={[styles.epNum, active && styles.epNumActive]}>
                {String(index + 1).padStart(2, "0")}
              </Text>
              <Text
                style={[styles.epName, active && styles.epNameActive]}
                numberOfLines={2}
              >
                {item.name}
              </Text>
              {active && <Text style={styles.epPlaying}>▶</Text>}
            </Pressable>
          );
        }}
      />
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
    gap: 12,
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: fonts.bold,
  },
  video: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
  },
  center: {
    aspectRatio: 16 / 9,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
  muted: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 24,
    fontFamily: fonts.regular,
  },
  listContent: {
    padding: 12,
    paddingBottom: 40,
    gap: 8,
  },
  epRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  epActive: {
    borderColor: colors.brand,
    backgroundColor: colors.surfaceRaised,
  },
  epNum: {
    color: colors.textFaint,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: fonts.bold,
    fontVariant: ["tabular-nums"],
  },
  epNumActive: {
    color: colors.brand,
  },
  epName: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: "500",
    fontFamily: fonts.medium,
  },
  epNameActive: {
    color: colors.brand,
  },
  epPlaying: {
    color: colors.brand,
    fontSize: 14,
  },
});
