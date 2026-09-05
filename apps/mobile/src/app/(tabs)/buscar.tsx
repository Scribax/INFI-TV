import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SEARCH_DEBOUNCE_MS } from "@infitv/config";
import { useChannels } from "@/hooks/use-channels";
import { ChannelCard } from "@/components/channel-card";
import { ChannelSkeleton } from "@/components/channel-skeleton";
import { EmptyState, ErrorState } from "@/components/states";
import { colors } from "@/constants/theme";
import type { ChannelItem } from "@/lib/types";

export default function BuscarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setSearch(input.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [input]);

  const { items, loading, loadingMore, refreshing, error, loadMore, refresh } =
    useChannels({
      search: search === "" ? undefined : search,
    });

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Buscar</Text>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Buscar canal…"
          placeholderTextColor={colors.textFaint}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      {loading && items.length === 0 ? (
        <View style={styles.body}>
          <ChannelSkeleton />
        </View>
      ) : error !== null && items.length === 0 ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : search === "" ? (
        <EmptyState title="Buscá un canal" hint="Por nombre, país o categoría." />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(c) => c.id}
          numColumns={3}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }: { item: ChannelItem }) => (
            <View style={styles.cell}>
              <ChannelCard
                channel={item}
                onPress={() => router.push(`/channel/${item.id}`)}
              />
            </View>
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshing={refreshing}
          onRefresh={refresh}
          ListEmptyComponent={
            <EmptyState title="Sin resultados" hint={`Nada para "${search}".`} />
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                color={colors.brand}
                style={{ marginVertical: 16 }}
              />
            ) : null
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
    gap: 12,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  input: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    color: colors.text,
    fontSize: 16,
  },
  body: {
    padding: 12,
  },
  gridRow: {
    gap: 10,
  },
  listContent: {
    padding: 12,
    gap: 10,
  },
  cell: {
    flex: 1,
  },
});
