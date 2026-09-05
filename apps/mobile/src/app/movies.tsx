import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Image } from "expo-image";
import { ArrowLeft, Search } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "@/constants/theme";
import { fetchMovies, fetchVodCategories } from "@/lib/vod";
import type { VodCategory, VodMovie } from "@/lib/vod";
import { getProgress } from "@/lib/progress";
import type { ProgressItem } from "@/lib/progress";

function MovieCard({
  movie,
  onPress,
  width,
}: {
  movie: VodMovie;
  onPress: () => void;
  width: number | `${number}%`;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, { width }, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      {movie.poster !== null ? (
        <Image
          source={{ uri: movie.poster }}
          style={styles.posterImg}
          contentFit="cover"
          transition={150}
        />
      ) : (
        <View style={[styles.posterImg, styles.posterFallback]}>
          <Text style={styles.posterInitial}>{movie.name.charAt(0)}</Text>
        </View>
      )}
      <Text style={styles.posterTitle} numberOfLines={2}>
        {movie.name}
      </Text>
    </Pressable>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export default function MoviesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState<string | undefined>(undefined);
  const [categories, setCategories] = useState<VodCategory[]>([]);
  const [genreRows, setGenreRows] = useState<
    { cat: VodCategory; movies: VodMovie[] }[]
  >([]);
  const [results, setResults] = useState<VodMovie[]>([]);
  const [progress, setProgress] = useState<ProgressItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      getProgress().then(setProgress);
    }, []),
  );

  // Debounce de búsqueda.
  useEffect(() => {
    const t = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Categorías → carruseles por género (top 8).
  useEffect(() => {
    let alive = true;
    fetchVodCategories()
      .then(async (cats) => {
        const clean = cats.filter((c) => c.category_name.trim() !== "");
        if (!alive) return;
        setCategories(clean);
        const top = clean.slice(0, 8);
        const rows = await Promise.all(
          top.map(async (cat) => ({
            cat,
            movies: await fetchMovies({ category: cat.category_id, limit: 12 }),
          })),
        );
        if (alive) setGenreRows(rows);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Resultados de búsqueda.
  useEffect(() => {
    if (search === "") {
      setResults([]);
      return;
    }
    let alive = true;
    fetchMovies({ search, language, limit: 60 })
      .then((r) => {
        if (alive) setResults(r);
      })
      .catch(() => {
        if (alive) setResults([]);
      });
    return () => {
      alive = false;
    };
  }, [search, language]);

  const openMovie = useCallback(
    (id: string, title: string) =>
      router.push({ pathname: "/movie/[id]", params: { id, title } }),
    [router],
  );

  const searching = search !== "";

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Películas</Text>
      </View>

      <View style={styles.searchWrap}>
        <Search size={18} color={colors.textFaint} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar película..."
          placeholderTextColor={colors.textFaint}
          autoCorrect={false}
        />
      </View>

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          <Chip
            label="🌐 Todos"
            active={language === undefined}
            onPress={() => setLanguage(undefined)}
          />
          <Chip
            label="🇪🇸 Español"
            active={language === "es"}
            onPress={() => setLanguage("es")}
          />
          <Chip
            label="🇬🇧 Inglés"
            active={language === "en"}
            onPress={() => setLanguage("en")}
          />
        </ScrollView>
      </View>

      {searching ? (
        <FlatList
          data={results}
          keyExtractor={(m) => m.id}
          numColumns={3}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContent}
          renderItem={({ item }) => (
            <MovieCard
              movie={item}
              width="31%"
              onPress={() => openMovie(item.id, item.name)}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No se encontraron películas.</Text>
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.browseContent}
          showsVerticalScrollIndicator={false}
        >
          {progress.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Continuar viendo</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.row}
              >
                {progress.map((p) => (
                  <Pressable
                    key={p.id}
                    style={styles.continueCard}
                    onPress={() =>
                      router.push({
                        pathname: "/watch/[id]",
                        params: { id: p.id, title: p.name, poster: p.poster ?? undefined },
                      })
                    }
                  >
                    {p.poster ? (
                      <Image
                        source={{ uri: p.poster }}
                        style={styles.continuePoster}
                        contentFit="cover"
                        transition={150}
                      />
                    ) : (
                      <View style={[styles.continuePoster, styles.continueFallback]}>
                        <Text style={styles.continueInitial}>{p.name.charAt(0)}</Text>
                      </View>
                    )}
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(100, (p.position / Math.max(1, p.duration)) * 100)}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.continueTitle} numberOfLines={1}>
                      {p.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {genreRows.map((row) => (
            <View key={row.cat.category_id} style={styles.section}>
              <Text style={styles.sectionTitle}>{row.cat.category_name}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.row}
              >
                {row.movies.map((m) => (
                  <MovieCard
                    key={m.id}
                    movie={m}
                    width={120}
                    onPress={() => openMovie(m.id, m.name)}
                  />
                ))}
              </ScrollView>
            </View>
          ))}
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
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    fontFamily: fonts.bold,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: fonts.regular,
  },
  chipsRow: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 8,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brand,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: fonts.semibold,
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  card: {
    gap: 6,
  },
  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  posterImg: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: 10,
    backgroundColor: colors.surfaceRaised,
  },
  posterFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  posterInitial: {
    color: colors.brand,
    fontSize: 32,
    fontWeight: "700",
    fontFamily: fonts.bold,
  },
  posterTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "600",
    fontFamily: fonts.semibold,
  },
  gridRow: {
    gap: 10,
  },
  gridContent: {
    padding: 12,
    gap: 12,
  },
  browseContent: {
    paddingBottom: 32,
    gap: 22,
  },
  section: {
    paddingHorizontal: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
    fontFamily: fonts.bold,
    marginBottom: 10,
  },
  row: {
    gap: 10,
    paddingRight: 12,
  },
  empty: {
    color: colors.textMuted,
    textAlign: "center",
    paddingVertical: 24,
    fontFamily: fonts.regular,
  },
  continueCard: {
    width: 120,
    gap: 5,
  },
  continuePoster: {
    width: 120,
    height: 72,
    borderRadius: 8,
    backgroundColor: colors.surfaceRaised,
  },
  continueFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  continueInitial: {
    color: colors.brand,
    fontSize: 24,
    fontWeight: "700",
    fontFamily: fonts.bold,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.surfaceRaised,
    overflow: "hidden",
  },
  progressFill: {
    height: 3,
    backgroundColor: colors.brand,
  },
  continueTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "600",
    fontFamily: fonts.semibold,
  },
});
