import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useChannels } from "@/hooks/use-channels";
import { useCategories, useCountries } from "@/hooks/use-catalog";
import { ChannelCard } from "@/components/channel-card";
import { ChannelSkeleton } from "@/components/channel-skeleton";
import { EmptyState, ErrorState } from "@/components/states";
import { colors } from "@/constants/theme";
import { categoryLabel, flagEmoji } from "@/lib/flags";
import type { ChannelItem } from "@/lib/types";

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
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function CanalesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ country?: string; category?: string }>();
  const [country, setCountry] = useState<string | undefined>(params.country);
  const [category, setCategory] = useState<string | undefined>(params.category);

  const countries = useCountries();
  const categories = useCategories();
  const { items, loading, loadingMore, refreshing, error, offline, loadMore, refresh } =
    useChannels({
      country,
      category,
    });

  function renderItem({ item }: { item: ChannelItem }) {
    return (
      <View style={styles.cell}>
        <ChannelCard
          channel={item}
          onPress={() => router.push(`/channel/${item.id}`)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Canales</Text>
      </View>

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          <Chip
            label="🌎 Todos"
            active={country === undefined}
            onPress={() => setCountry(undefined)}
          />
          {countries.map((c) => (
            <Chip
              key={c.code}
              label={`${flagEmoji(c.code)} ${c.name}`}
              active={country === c.code}
              onPress={() => setCountry(c.code)}
            />
          ))}
        </ScrollView>
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
              key={c.id}
              label={categoryLabel(c.slug)}
              active={category === c.slug}
              onPress={() => setCategory(c.slug)}
            />
          ))}
        </ScrollView>
      </View>

      {offline && items.length > 0 && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            📴 Sin conexión — mostrando catálogo guardado
          </Text>
        </View>
      )}

      {loading && items.length === 0 ? (
        <View style={styles.body}>
          <ChannelSkeleton />
        </View>
      ) : error !== null && items.length === 0 ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(c) => c.id}
          numColumns={3}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.listContent}
          renderItem={renderItem}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshing={refreshing}
          onRefresh={refresh}
          ListEmptyComponent={
            <EmptyState title="Sin canales" hint="Probá con otro filtro." />
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
    paddingBottom: 8,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  chipsRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  body: {
    padding: 12,
  },
  offlineBanner: {
    marginHorizontal: 16,
    marginBottom: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  offlineText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
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
