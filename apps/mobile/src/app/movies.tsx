import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { ArrowLeft, Search } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "@/constants/theme";
import { fetchMovies, fetchVodCategories } from "@/lib/vod";
import type { VodCategory, VodMovie } from "@/lib/vod";

function MoviePoster({ movie, onPress }: { movie: VodMovie; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.poster, pressed && styles.posterPressed]}
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
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [categories, setCategories] = useState<VodCategory[]>([]);
  const [movies, setMovies] = useState<VodMovie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchVodCategories()
      .then((c) => {
        if (alive) setCategories(c.filter((x) => x.category_name.trim() !== ""));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchMovies({ category, search: query, limit: 60 })
      .then((r) => {
        if (alive) setMovies(r);
      })
      .catch(() => {
        if (alive) setMovies([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [query, category]);

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
            label="Todas"
            active={category === undefined}
            onPress={() => setCategory(undefined)}
          />
          {categories.map((c) => (
            <Chip
              key={c.category_id}
              label={c.category_name}
              active={category === c.category_id}
              onPress={() => setCategory(c.category_id)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={movies}
        keyExtractor={(m) => m.id}
        numColumns={3}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <MoviePoster
            movie={item}
            onPress={() =>
              router.push({
                pathname: "/movie/[id]",
                params: { id: item.id, title: item.name },
              })
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
