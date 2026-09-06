import { useCallback } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { ArrowLeft, ChevronRight } from "lucide-react-native";
import { useChannels } from "@/hooks/use-channels";
import { ChannelCard } from "@/components/channel-card";
import { ANIME_TITLES } from "@/lib/anime";
import type { AnimeTitle } from "@/lib/anime";
import { colors, fonts } from "@/constants/theme";

function AnimePoster({
  title,
  onPress,
}: {
  title: AnimeTitle;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.posterCard, pressed && styles.pressed]}
      onPress={onPress}
    >
      {title.cover !== null ? (
        <Image
          source={{ uri: title.cover }}
          style={styles.posterImg}
          contentFit="cover"
          transition={150}
        />
      ) : (
        <View style={[styles.posterImg, styles.posterFallback]}>
          <Text style={styles.posterInitial}>{title.name.charAt(0)}</Text>
        </View>
      )}
      <Text style={styles.posterTitle} numberOfLines={2}>
        {title.name}
      </Text>
    </Pressable>
  );
}

export default function AnimeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items: liveChannels } = useChannels({ category: "animation" });

  const openChannel = useCallback(
    (id: string) => router.push(`/channel/${id}`),
    [router],
  );
  const openTitle = useCallback(
    (id: string) => router.push({ pathname: "/anime/[id]", params: { id } }),
    [router],
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Anime</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* On-demand desde GitHub */}
        <Text style={styles.sectionTitle}>Películas y series</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {ANIME_TITLES.map((t) => (
            <AnimePoster key={t.id} title={t} onPress={() => openTitle(t.id)} />
          ))}
        </ScrollView>

        {/* Canales en vivo (categoría animation) */}
        <Text style={styles.sectionTitle}>Canales en vivo</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {liveChannels.slice(0, 12).map((c) => (
            <View key={c.id} style={styles.channelItem}>
              <ChannelCard channel={c} onPress={openChannel} />
            </View>
          ))}
        </ScrollView>
        <Pressable
          style={({ pressed }) => [styles.seeAllBtn, pressed && styles.pressed]}
          onPress={() =>
            router.push({ pathname: "/canales", params: { category: "animation" } })
          }
        >
          <Text style={styles.seeAllText}>Ver todos los canales de anime</Text>
          <ChevronRight size={16} color={colors.brand} />
        </Pressable>
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
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    fontFamily: fonts.bold,
  },
  content: {
    paddingVertical: 16,
    paddingBottom: 40,
    gap: 6,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
    fontFamily: fonts.bold,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  row: {
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  posterCard: {
    width: 120,
    gap: 6,
  },
  posterImg: {
    width: 120,
    height: 180,
    borderRadius: 10,
    backgroundColor: colors.surfaceRaised,
  },
  posterFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  posterInitial: {
    color: colors.brand,
    fontSize: 40,
    fontWeight: "700",
    fontFamily: fonts.bold,
  },
  posterTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "600",
    fontFamily: fonts.semibold,
  },
  channelItem: {
    width: 140,
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  seeAllText: {
    color: colors.brand,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: fonts.semibold,
  },
  pressed: {
    opacity: 0.7,
  },
});
