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
import { getEpisodes, getStream, pickStream } from "@/lib/miruro";
import type { MiruroEpisode } from "@/lib/miruro";
import { colors, fonts } from "@/constants/theme";

interface StreamSource {
  uri: string;
  headers: Record<string, string>;
}

function Player({ source }: { source: StreamSource }) {
  const player = useVideoPlayer(source, (p) => {
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

/** Anime moderno (Miruro): episodios + m3u8 en vivo con Referer. */
export default function AnimeModernoWatchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const [episodes, setEpisodes] = useState<MiruroEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState<StreamSource | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getEpisodes(Number(id))
      .then((eps) => {
        if (!alive) return;
        setEpisodes(eps);
        setLoading(false);
      })
      .catch((e) => {
        if (!alive) return;
        setLoading(false);
        setError(e instanceof Error ? e.message : "Error al cargar episodios.");
      });
    return () => {
      alive = false;
    };
  }, [id]);

  const play = async (ep: MiruroEpisode) => {
    setBusy(true);
    setError(null);
    try {
      const { streams } = await getStream(ep.id);
      const s = pickStream(streams);
      if (s === null) {
        setError("Sin stream disponible para este episodio.");
      } else {
        const headers: Record<string, string> = {};
        if (s.referer) headers.Referer = s.referer;
        setCurrent({ uri: s.url, headers });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo obtener el stream.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {title ?? "Anime"}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {current !== null ? (
        <Player key={current.uri} source={current} />
      ) : (
        <View style={styles.center}>
          {busy ? (
            <ActivityIndicator color={colors.brand} size="large" />
          ) : (
            <Text style={styles.muted}>
              {error ?? "Elegí un episodio para reproducir."}
            </Text>
          )}
        </View>
      )}

      <FlatList
        data={episodes}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <Pressable
            style={styles.epRow}
            onPress={() => play(item)}
          >
            <Text style={styles.epNum}>
              {String(index + 1).padStart(2, "0")}
            </Text>
            <Text style={styles.epName} numberOfLines={2}>
              {item.title || `Episodio ${item.number}`}
            </Text>
            {item.audio === "dub" && (
              <Text style={styles.epTag}>DUB</Text>
            )}
          </Pressable>
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.brand} style={{ marginTop: 24 }} />
          ) : (
            <Text style={styles.muted}>Sin episodios.</Text>
          )
        }
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
    lineHeight: 20,
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
  epNum: {
    color: colors.textFaint,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: fonts.bold,
    fontVariant: ["tabular-nums"],
  },
  epName: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: "500",
    fontFamily: fonts.medium,
  },
  epTag: {
    color: colors.brand,
    fontSize: 11,
    fontWeight: "700",
    fontFamily: fonts.bold,
  },
});
