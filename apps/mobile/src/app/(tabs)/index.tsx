import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  Clapperboard,
  Film,
  Globe,
  Music,
  Newspaper,
  Trophy,
  type LucideIcon,
} from "lucide-react-native";
import { APP_NAME } from "@infitv/config";
import { useHistory } from "@/hooks/use-me";
import { ChannelCard } from "@/components/channel-card";
import { colors } from "@/constants/theme";
import { flagEmoji } from "@/lib/flags";

const QUICK_COUNTRIES = [
  { code: "AR", label: "Argentina" },
  { code: "CL", label: "Chile" },
  { code: "US", label: "Estados Unidos" },
  { code: "ES", label: "España" },
  { code: "MX", label: "México" },
  { code: "BR", label: "Brasil" },
];

const QUICK_CATEGORIES: { slug: string; label: string; icon: LucideIcon }[] = [
  { slug: "news", label: "Noticias", icon: Newspaper },
  { slug: "sports", label: "Deportes", icon: Trophy },
  { slug: "entertainment", label: "Entretenimiento", icon: Clapperboard },
  { slug: "movies", label: "Películas", icon: Film },
  { slug: "music", label: "Música", icon: Music },
  { slug: "general", label: "General", icon: Globe },
];

export default function HomeScreen() {
  const router = useRouter();
  const { history } = useHistory();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.brand}>{APP_NAME}</Text>

      {history.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Continuar viendo</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.historyRow}
          >
            {history.map((h) => (
              <View key={h.channel.id} style={styles.historyItem}>
                <ChannelCard
                  channel={h.channel}
                  onPress={() => router.push(`/channel/${h.channel.id}`)}
                />
              </View>
            ))}
          </ScrollView>
        </>
      )}

      <Text style={styles.sectionTitle}>Países</Text>
      <View style={styles.grid}>
        {QUICK_COUNTRIES.map((c) => (
          <Pressable
            key={c.code}
            style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
            onPress={() =>
              router.push({ pathname: "/canales", params: { country: c.code } })
            }
          >
            <Text style={styles.tileEmoji}>{flagEmoji(c.code)}</Text>
            <Text style={styles.tileLabel}>{c.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Categorías</Text>
      <View style={styles.grid}>
        {QUICK_CATEGORIES.map((c) => (
          <Pressable
            key={c.slug}
            style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
            onPress={() =>
              router.push({ pathname: "/canales", params: { category: c.slug } })
            }
          >
            <c.icon size={24} color={colors.brand} />
            <Text style={styles.tileLabel}>{c.label}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  brand: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  historyRow: {
    gap: 10,
  },
  historyItem: {
    width: 128,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tile: {
    width: "31%",
    flexGrow: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    gap: 6,
  },
  tilePressed: {
    borderColor: colors.brand,
    backgroundColor: colors.surfaceRaised,
  },
  tileEmoji: {
    fontSize: 24,
  },
  tileLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
