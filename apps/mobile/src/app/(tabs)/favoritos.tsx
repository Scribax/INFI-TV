import { useCallback } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFavorites } from "@/hooks/use-me";
import { ChannelCard } from "@/components/channel-card";
import { ChannelSkeleton } from "@/components/channel-skeleton";
import { EmptyState, ErrorState } from "@/components/states";
import { colors } from "@/constants/theme";
import type { ChannelItem } from "@/lib/types";

export default function FavoritosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { favorites, loading, error, toggle, reload } = useFavorites();

  const openChannel = useCallback(
    (id: string) => router.push(`/channel/${id}`),
    [router],
  );

  const toggleFavorite = useCallback(
    (channel: ChannelItem) => toggle(channel),
    [toggle],
  );

  const renderItem = useCallback(
    ({ item }: { item: ChannelItem }) => (
      <View style={styles.cell}>
        <ChannelCard
          channel={item}
          onPress={openChannel}
          isFavorite
          onToggleFavorite={toggleFavorite}
        />
      </View>
    ),
    [openChannel, toggleFavorite],
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Favoritos</Text>
      </View>

      {loading ? (
        <View style={styles.body}>
          <ChannelSkeleton count={6} />
        </View>
      ) : error !== null ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(c) => c.id}
          numColumns={3}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[styles.list, { paddingBottom: 90 }]}
          renderItem={renderItem}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={7}
          removeClippedSubviews
          ListEmptyComponent={
            <EmptyState
              title="Sin favoritos"
              hint="Marcá canales con la estrella desde el detalle."
            />
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  body: {
    padding: 12,
  },
  row: {
    gap: 10,
  },
  list: {
    padding: 12,
    gap: 10,
  },
  cell: {
    flex: 1,
  },
});
