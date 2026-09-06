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
import { ArrowLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { catalogEpisodes, catalogInfo } from "@/lib/anime-api";
import type { CatalogAnimeDetail } from "@/lib/anime-api";
import { colors, fonts } from "@/constants/theme";

function cleanHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();
}

export default function AnimeCatalogoDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const [detail, setDetail] = useState<CatalogAnimeDetail | null>(null);
  const [epCount, setEpCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    catalogInfo(id)
      .then((d) => {
        if (alive) setDetail(d);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : "Error al cargar.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    catalogEpisodes(id)
      .then((e) => {
        if (alive) setEpCount(e.count);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [id]);

  const name = detail?.title ?? title ?? "Anime";
  const score = detail?.score != null ? (detail.score / 10).toFixed(1) : null;

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

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} size="large" />
        </View>
      ) : detail === null ? (
        <View style={styles.center}>
          <Text style={styles.muted}>{error ?? "No se encontró."}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {detail.banner !== null ? (
            <Image
              source={{ uri: detail.banner }}
              style={styles.banner}
              contentFit="cover"
              transition={150}
            />
          ) : null}

          <View style={styles.row}>
            {detail.cover !== null ? (
              <Image
                source={{ uri: detail.cover }}
                style={styles.cover}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.cover, styles.coverFallback]}>
                <Text style={styles.coverInitial}>{name.charAt(0)}</Text>
              </View>
            )}
            <View style={styles.meta}>
              <Text style={styles.title} numberOfLines={3}>
                {name}
              </Text>
              {score !== null && <Text style={styles.score}>⭐ {score}</Text>}
              <View style={styles.tags}>
                {detail.format !== null && (
                  <Text style={styles.tag}>{detail.format}</Text>
                )}
                {detail.status !== null && (
                  <Text style={styles.tag}>{detail.status}</Text>
                )}
                {epCount !== null && (
                  <Text style={styles.tag}>{epCount} eps</Text>
                )}
              </View>
            </View>
          </View>

          {detail.genres.length > 0 && (
            <View style={styles.genreRow}>
              {detail.genres.map((g) => (
                <View key={g} style={styles.genre}>
                  <Text style={styles.genreText}>{g}</Text>
                </View>
              ))}
            </View>
          )}

          {detail.description !== null && (
            <>
              <Text style={styles.sectionLabel}>Sinopsis</Text>
              <Text style={styles.description}>
                {cleanHtml(detail.description)}
              </Text>
            </>
          )}

          <View style={styles.episodeNote}>
            <Text style={styles.episodeNoteText}>
              {epCount !== null
                ? `${epCount} episodios disponibles en el catálogo.`
                : "Cargando episodios..."}
            </Text>
          </View>
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  muted: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
    fontFamily: fonts.regular,
  },
  content: {
    paddingBottom: 40,
  },
  banner: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: colors.surfaceRaised,
  },
  row: {
    flexDirection: "row",
    gap: 14,
    padding: 16,
  },
  cover: {
    width: 110,
    height: 165,
    borderRadius: 10,
    backgroundColor: colors.surfaceRaised,
  },
  coverFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  coverInitial: {
    color: colors.brand,
    fontSize: 44,
    fontWeight: "700",
    fontFamily: fonts.bold,
  },
  meta: {
    flex: 1,
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
    fontFamily: fonts.bold,
  },
  score: {
    color: colors.warn,
    fontSize: 15,
    fontWeight: "700",
    fontFamily: fonts.bold,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    color: colors.brand,
    fontSize: 11,
    fontWeight: "700",
    fontFamily: fonts.bold,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: "rgba(124,108,240,0.15)",
  },
  genreRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
  },
  genre: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  genreText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    fontFamily: fonts.semibold,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: fonts.bold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  description: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
    paddingHorizontal: 16,
    fontFamily: fonts.regular,
  },
  episodeNote: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  episodeNoteText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
    fontFamily: fonts.regular,
  },
});
