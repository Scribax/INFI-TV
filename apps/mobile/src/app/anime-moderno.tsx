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
import {
  getTrending,
  searchModernAnime,
} from "@/lib/miruro";
import type { MiruroAnime } from "@/lib/miruro";
import { colors, fonts } from "@/constants/theme";

function animeName(a: MiruroAnime): string {
  return a.title?.english ?? a.title?.romaji ?? "Anime";
}

function AnimeCard({
  anime,
  onPress,
}: {
  anime: MiruroAnime;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
    >
      {anime.coverImage?.large ? (
        <Image
          source={{ uri: anime.coverImage.large }}
          style={styles.poster}
          contentFit="cover"
          transition={150}
        />
      ) : (
        <View style={[styles.poster, styles.posterFallback]}>
          <Text style={styles.posterInitial}>{animeName(anime).charAt(0)}</Text>
        </View>
      )}
      <Text style={styles.name} numberOfLines={2}>
        {animeName(anime)}
      </Text>
    </Pressable>
  );
}

export default function AnimeModernoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<MiruroAnime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((q: string) => {
    let alive = true;
    setLoading(true);
    setError(null);
    const promise = q.trim() === "" ? getTrending() : searchModernAnime(q);
    promise
      .then((r) => {
        if (alive) setItems(r.results ?? []);
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
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(query.trim()), 400);
    return () => clearTimeout(t);
  }, [query, load]);

  const openAnime = useCallback(
    (a: MiruroAnime) =>
      router.push({
        pathname: "/anime-moderno/[id]",
        params: { id: String(a.id), title: animeName(a) },
      }),
    [router],
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Anime moderno</Text>
      </View>

      <View style={styles.searchWrap}>
        <Search size={16} color={colors.textFaint} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar anime (Naruto, Record of Ragnarok...)"
          placeholderTextColor={colors.textFaint}
          autoCorrect={false}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: 24 }} />
      ) : error !== null ? (
        <Text style={styles.empty}>
          {error}{"\n"}¿Está corriendo el Miruro-API?
        </Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(a) => String(a.id)}
          numColumns={3}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <AnimeCard anime={item} onPress={() => openAnime(item)} />
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
