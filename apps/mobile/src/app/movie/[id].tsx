import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { ArrowLeft, Play } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "@/constants/theme";
import { fetchMovieDetail } from "@/lib/vod";
import type { VodMovieDetail } from "@/lib/vod";

/** Ficha de película: poster, metadata y botón de reproducción. */
export default function MovieScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const [movie, setMovie] = useState<VodMovieDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchMovieDetail(id)
      .then((m) => {
        if (alive) setMovie(m);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : "Error al cargar.");
      });
    return () => {
      alive = false;
    };
  }, [id]);

  const name = movie?.name ?? title ?? "Película";

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {name}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {movie?.poster !== null && movie?.poster !== undefined ? (
          <Image
            source={{ uri: movie.poster }}
            style={styles.poster}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <View style={[styles.poster, styles.posterFallback]}>
            <Text style={styles.posterInitial}>{name.charAt(0)}</Text>
          </View>
        )}

        <Text style={styles.name}>{name}</Text>

        {(movie?.year !== null && movie?.year !== undefined) || (movie?.rating !== null && movie?.rating !== undefined) ? (
          <Text style={styles.meta}>
            {movie.year ? `${movie.year}` : ""}
            {movie.year && movie.rating ? " · " : ""}
            {movie.rating ? `⭐ ${movie.rating}` : ""}
          </Text>
        ) : null}

        {movie?.plot ? <Text style={styles.plot}>{movie.plot}</Text> : null}

        {movie === null && error === null ? (
          <ActivityIndicator color={colors.brand} size="large" style={{ marginTop: 24 }} />
        ) : null}

        <Pressable
          style={({ pressed }) => [styles.playBtn, pressed && styles.playPressed]}
          onPress={() =>
            router.push({
              pathname: "/watch/[id]",
              params: { id, title: name, poster: movie?.poster ?? undefined },
            })
          }
        >
          <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
          <Text style={styles.playText}>Reproducir</Text>
        </Pressable>

        {error !== null && <Text style={styles.error}>{error}</Text>}
      </ScrollView>
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
  headerTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: fonts.bold,
  },
  content: {
    padding: 16,
    gap: 12,
    alignItems: "center",
  },
  poster: {
    width: 180,
    height: 270,
    borderRadius: 14,
    backgroundColor: colors.surfaceRaised,
  },
  posterFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  posterInitial: {
    color: colors.brand,
    fontSize: 64,
    fontWeight: "700",
    fontFamily: fonts.bold,
  },
  name: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
    fontFamily: fonts.bold,
    textAlign: "center",
  },
  meta: {
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  plot: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: fonts.regular,
    textAlign: "center",
  },
  playBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 999,
    backgroundColor: colors.brand,
    marginTop: 8,
  },
  playPressed: {
    opacity: 0.85,
  },
  playText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: fonts.bold,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    textAlign: "center",
    fontFamily: fonts.regular,
  },
});
