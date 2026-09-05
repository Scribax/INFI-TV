import { useCallback } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { useCountries } from "@/hooks/use-catalog";
import { colors, fonts } from "@/constants/theme";
import { flagEmoji } from "@/lib/flags";
import type { CountryItem } from "@/lib/types";

/** Lista completa de países (todos, en grilla) para elegir uno y ver sus canales. */
export default function PaisesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const countries = useCountries();

  const openCountry = useCallback(
    (code: string) =>
      router.push({ pathname: "/canales", params: { country: code } }),
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: CountryItem }) => (
      <Pressable
        style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
        onPress={() => openCountry(item.code)}
      >
        <Text style={styles.flag}>{flagEmoji(item.code)}</Text>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
      </Pressable>
    ),
    [openCountry],
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Países</Text>
      </View>

      <FlatList
        data={countries}
        keyExtractor={(c) => c.code}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        renderItem={renderItem}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={7}
        removeClippedSubviews
        ListEmptyComponent={
          <Text style={styles.empty}>Cargando países…</Text>
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
  row: {
    gap: 10,
  },
  listContent: {
    padding: 12,
    gap: 10,
    paddingBottom: 40,
  },
  tile: {
    width: "31%",
    flexGrow: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    gap: 8,
  },
  tilePressed: {
    borderColor: colors.brand,
    backgroundColor: colors.surfaceRaised,
    transform: [{ scale: 0.96 }],
  },
  flag: {
    fontSize: 30,
  },
  name: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "600",
    fontFamily: fonts.semibold,
    textAlign: "center",
    paddingHorizontal: 4,
  },
  empty: {
    color: colors.textMuted,
    textAlign: "center",
    paddingVertical: 24,
    fontFamily: fonts.regular,
  },
});
