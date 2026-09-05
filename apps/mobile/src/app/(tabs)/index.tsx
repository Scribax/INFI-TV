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
import { LinearGradient } from "expo-linear-gradient";
import {
  Clapperboard,
  ChevronRight,
  Film,
  Globe,
  Music,
  Newspaper,
  PlayCircle,
  Search,
  Trophy,
  UserRound,
  type LucideIcon,
} from "lucide-react-native";
import { APP_NAME } from "@infitv/config";
import { useHistory } from "@/hooks/use-me";
import { useChannels } from "@/hooks/use-channels";
import { ChannelCard } from "@/components/channel-card";
import { colors, fonts } from "@/constants/theme";
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

function Section({
  title,
  onSeeAll,
}: {
  title: string;
  onSeeAll?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll !== undefined && (
        <Pressable style={styles.seeAll} onPress={onSeeAll} hitSlop={8}>
          <Text style={styles.seeAllText}>Ver todo</Text>
          <ChevronRight size={16} color={colors.brand} />
        </Pressable>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { history } = useHistory();
  // Página 1 sin filtro = catálogo general para "En vivo ahora".
  const { items: liveChannels } = useChannels({});

  const openChannel = useCallback(
    (id: string) => router.push(`/channel/${id}`),
    [router],
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header + avatar */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>Hola 👋</Text>
          <Text style={styles.subGreeting}>¿Qué querés ver hoy?</Text>
        </View>
        <View style={styles.avatar}>
          <UserRound size={20} color={colors.text} strokeWidth={2} />
        </View>
      </View>

      {/* Buscador */}
      <Pressable
        style={({ pressed }) => [styles.search, pressed && styles.searchPressed]}
        onPress={() => router.push("/buscar")}
      >
        <Search size={18} color={colors.textFaint} />
        <Text style={styles.searchText}>Buscar canal, película o serie…</Text>
      </Pressable>

      {/* Hero */}
      <LinearGradient
        colors={["#7C6CF0", "#4431A8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroBadge}>
          <View style={styles.heroDot} />
          <Text style={styles.heroBadgeText}>EN VIVO</Text>
        </View>
        <Text style={styles.heroTitle}>+9.000 canales{"\n"}del mundo</Text>
        <Text style={styles.heroSub}>
          Deportes, noticias y entretenimiento en HD.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.heroCta, pressed && { opacity: 0.85 }]}
          onPress={() => router.push("/canales")}
        >
          <PlayCircle size={18} color="#FFFFFF" />
          <Text style={styles.heroCtaText}>Explorar canales</Text>
        </Pressable>
      </LinearGradient>

      {/* Continuar viendo */}
      {history.length > 0 && (
        <View>
          <Section title="Continuar viendo" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carousel}
          >
            {history.map((h) => (
              <View key={h.channel.id} style={styles.carouselItem}>
                <ChannelCard channel={h.channel} onPress={openChannel} />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* En vivo ahora */}
      {liveChannels.length > 0 && (
        <View>
          <Section title="En vivo ahora" onSeeAll={() => router.push("/canales")} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carousel}
          >
            {liveChannels.slice(0, 12).map((c) => (
              <View key={c.id} style={styles.carouselItem}>
                <ChannelCard channel={c} onPress={openChannel} />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Países */}
      <View>
        <Section title="Países" onSeeAll={() => router.push("/canales")} />
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
      </View>

      {/* Categorías */}
      <View>
        <Section title="Categorías" onSeeAll={() => router.push("/canales")} />
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
    paddingBottom: 120,
    gap: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerText: {
    gap: 2,
  },
  greeting: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "700",
    fontFamily: fonts.bold,
  },
  subGreeting: {
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  searchPressed: {
    borderColor: colors.brand,
  },
  searchText: {
    color: colors.textFaint,
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  hero: {
    borderRadius: 18,
    padding: 20,
    gap: 10,
    overflow: "hidden",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F87171",
  },
  heroBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    fontFamily: fonts.bold,
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    fontFamily: fonts.bold,
    lineHeight: 30,
  },
  heroSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontFamily: fonts.regular,
  },
  heroCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  heroCtaText: {
    color: "#4431A8",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: fonts.bold,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
    fontFamily: fonts.bold,
  },
  seeAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  seeAllText: {
    color: colors.brand,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: fonts.semibold,
  },
  carousel: {
    gap: 10,
  },
  carouselItem: {
    width: 140,
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    gap: 6,
  },
  tilePressed: {
    borderColor: colors.brand,
    backgroundColor: colors.surfaceRaised,
    transform: [{ scale: 0.96 }],
  },
  tileEmoji: {
    fontSize: 24,
  },
  tileLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "600",
    fontFamily: fonts.semibold,
    textAlign: "center",
  },
});
