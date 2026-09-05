import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { ArrowLeft, Search } from "lucide-react-native";
import { colors, fonts } from "@/constants/theme";
import { posterUrl, searchMovies, trendingMovies, hasTmdbKey } from "@/lib/tmdb";
import type { TmdbMovie } from "@/lib/tmdb";

function MoviePoster({ movie, onPress }: { movie: TmdbMovie; onPress: () => void }) {
  const poster = posterUrl(movie.poster_path);
  return (
    <Pressable
      style={({ pressed }) => [styles.poster, pressed && styles.posterPressed]}
      onPress={onPress}
    >
      {poster !== null ? (
        <Image
          source={{ uri: poster }}
          style={styles.posterImg}
          contentFit="cover"
          transition={150}
        />
      ) : (
        <View style={[styles.posterImg, styles.posterFallback]}>
          <Text style={styles.posterInitial}>{movie.title.charAt(0)}</Text>
        </View>
      )}
      <Text style={styles.posterTitle} numberOfLines={2}>
        {movie.title}
      </Text>
    </Pressable>
  );
}

export default function MoviesScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState<TmdbMovie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    searchMovies(query)
      .then((r) => {
        if (alive) setMovies(r);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [query]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
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

      {!hasTmdbKey() && (
        <Text style={styles.banner}>
          Sin API key de TMDB → mostrando títulos de prueba. Configurá
          EXPO_PUBLIC_TMDB_API_KEY para el catálogo completo.
        </Text>
      )}

      <FlatList
        data={movies}
        keyExtractor={(m) => String(m.id)}
        numColumns={3}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <MoviePoster
            movie={item}
            onPress={() =>
              router.push({ pathname: "/movie/[id]", params: { id: String(item.id), title: item.title } })
            }
          />
        )}
        ListEmptyComponent={
          loading ? null : (
            <Text style={styles.empty}>No se encontraron películas.</Text>
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
    paddingVertical: 10,
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
  banner: {
    marginHorizontal: 12,
    marginBottom: 4,
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: fonts.regular,
  },
  gridRow: {
    gap: 10,
  },
  listContent: {
    padding: 12,
    gap: 12,
  },
  poster: {
    width: "31%",
    flexGrow: 1,
    gap: 6,
  },
  posterPressed: {
    opacity: 0.7,
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
  empty: {
    color: colors.textMuted,
    textAlign: "center",
    paddingVertical: 24,
    fontFamily: fonts.regular,
  },
});
