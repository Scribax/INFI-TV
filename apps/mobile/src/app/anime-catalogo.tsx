import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { ArrowLeft, Search } from "lucide-react-native";
import { catalogSearch, catalogTrending } from "@/lib/anime-api";
import type { CatalogAnime } from "@/lib/anime-api";
import { colors, fonts } from "@/constants/theme";

function AnimeCard({
  anime,
  onPress,
}: {
  anime: CatalogAnime;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
    >
      {anime.cover !== null ? (
        <Image
          source={{ uri: anime.cover }}
          style={styles.poster}
          contentFit="cover"
          transition={150}
        />
      ) : (
        <View style={[styles.poster, styles.posterFallback]}>
          <Text style={styles.posterInitial}>{anime.title.charAt(0)}</Text>
        </View>
      )}
      <Text style={styles.name} numberOfLines={2}>
        {anime.title}
      </Text>
    </Pressable>
  );
}

export default function AnimeCatalogoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<CatalogAnime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      setLoading(true);
      setError(null);
      const promise =
        query.trim() === "" ? catalogTrending() : catalogSearch(query.trim());
      promise
        .then((r) => {
          if (alive) setItems(r);
        })
        .catch((e) => {
          if (alive) {
            setItems([]);
            setError(e instanceof Error ? e.message : "Error al cargar.");
          }
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
    }, 400);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [query]);

  const open = useCallback(
    (a: CatalogAnime) =>
      router.push({
        pathname: "/anime-catalogo/[id]",
        params: { id: a.id, title: a.title },
      }),
    [router],
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Catálogo anime</Text>
      </View>

      <View style={styles.searchWrap}>
        <Search size={16} color={colors.textFaint} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar anime..."
          placeholderTextColor={colors.textFaint}
          autoCorrect={false}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: 24 }} />
      ) : error !== null ? (
        <Text style={styles.empty}>{error}</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(a) => a.id}
          numColumns={3}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <AnimeCard anime={item} onPress={() => open(item)} />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No se encontraron resultados.</Text>
          }
        />
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
  gridRow: {
    gap: 10,
    paddingHorizontal: 12,
  },
  listContent: {
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    width: "31%",
    flexGrow: 1,
    gap: 6,
  },
  poster: {
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
  name: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "600",
    fontFamily: fonts.semibold,
  },
  empty: {
    color: colors.textMuted,
    textAlign: "center",
    paddingVertical: 24,
    paddingHorizontal: 24,
    fontFamily: fonts.regular,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.7,
  },
});
