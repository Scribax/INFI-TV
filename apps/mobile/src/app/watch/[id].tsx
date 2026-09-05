import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { ArrowLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "@/constants/theme";
import { fetchMovieStream } from "@/lib/vod";
import { getProgressById, saveProgress } from "@/lib/progress";

function VideoPlayer({
  url,
  startAt,
  onPosition,
}: {
  url: string;
  startAt: number;
  onPosition: (position: number, duration: number) => void;
}) {
  const player = useVideoPlayer(url, (p) => {
    if (startAt > 5) {
      p.currentTime = startAt;
    }
    p.play();
  });

  useEffect(() => {
    const sub = player.addListener("timeUpdate", (e) => {
      onPosition(e.currentTime, player.duration);
    });
    return () => sub.remove();
  }, [player, onPosition]);

  return <VideoView player={player} style={styles.video} nativeControls />;
}

/** Reproductor nativo (expo-video) con resume de posición. */
export default function WatchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, title, poster } = useLocalSearchParams<{
    id: string;
    title?: string;
    poster?: string;
  }>();
  const [url, setUrl] = useState<string | null>(null);
  const [startAt, setStartAt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const positionRef = useRef(0);
  const durationRef = useRef(0);

  useEffect(() => {
    let alive = true;
    getProgressById(id).then((p) => {
      if (alive && p !== null) setStartAt(p.position);
    });
    fetchMovieStream(id)
      .then((r) => {
        if (alive) setUrl(r.url);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : "No se pudo cargar el stream.");
      });
    return () => {
      alive = false;
    };
  }, [id]);

  const onPosition = useCallback((position: number, duration: number) => {
    positionRef.current = position;
    durationRef.current = duration;
  }, []);

  // Al salir, guarda el progreso si se avanzó lo suficiente (más de 10s y falta +30s).
  useEffect(() => {
    return () => {
      const pos = positionRef.current;
      const dur = durationRef.current;
      if (pos > 10 && dur > 0 && pos < dur - 30) {
        void saveProgress({
          id,
          name: title ?? "Película",
          poster: poster ?? null,
          position: pos,
          duration: dur,
          updatedAt: Date.now(),
        });
      }
    };
  }, [id, title, poster]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {title ?? "Reproduciendo"}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {url !== null ? (
        <VideoPlayer url={url} startAt={startAt} onPosition={onPosition} />
      ) : error !== null ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} size="large" />
        </View>
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
    flex: 1,
    backgroundColor: "#000000",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    textAlign: "center",
    fontFamily: fonts.regular,
  },
});
