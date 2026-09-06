import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Tv2 } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { colors, fonts } from "@/constants/theme";
import { flagEmoji } from "@/lib/flags";

interface NowItem {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  channelId: string;
  channel: { id: string; name: string; logoUrl: string | null; countryCode: string | null };
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function EpgGridScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<NowItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get<NowItem[]>("/epg/now?limit=100");
        if (!cancelled) setItems(data);
      } catch {
        if (!cancelled) setItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const now = Date.now();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.headerBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Guía TV</Text>
          <Text style={styles.headerSub}>Ahora en vivo</Text>
        </View>
      </View>

      {items === null ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Tv2 size={48} color={colors.textFaint} />
          <Text style={styles.emptyTitle}>Guía no disponible aún</Text>
          <Text style={styles.emptySub}>Se llena automáticamente cuando configures la fuente EPG. Los canales siguen funcionando normal.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const start = new Date(item.startsAt).getTime();
            const end = new Date(item.endsAt).getTime();
            const progress = Math.min(1, Math.max(0, (now - start) / (end - start)));
            const remaining = Math.max(0, Math.round((end - now) / 60000));
            return (
              <Pressable style={styles.row} onPress={() => router.push(`/channel/${item.channelId}`)}>
                {item.channel.logoUrl ? (
                  <Image source={{ uri: item.channel.logoUrl }} style={styles.logo} resizeMode="contain" />
                ) : (
                  <View style={[styles.logo, styles.logoFallback]}>
                    <Text style={styles.logoInitial}>{item.channel.name.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.rowBody}>
                  <View style={styles.rowTop}>
                    <Text style={styles.channelName} numberOfLines={1}>
                      {item.channel.countryCode ? `${flagEmoji(item.channel.countryCode)} ` : ""}
                      {item.channel.name}
                    </Text>
                    <Text style={styles.time}>
                      {formatTime(item.startsAt)} - {formatTime(item.endsAt)}
                    </Text>
                  </View>
                  <Text style={styles.program} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${progress * 100}%` }]} />
                  </View>
                  <Text style={styles.remaining}>Quedan {remaining} min</Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, paddingVertical: 10 },
  headerBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerText: { gap: 2 },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: "700", fontFamily: fonts.bold },
  headerSub: { color: colors.textMuted, fontSize: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 12 },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: "600", marginTop: 8 },
  emptySub: { color: colors.textMuted, fontSize: 13, textAlign: "center" },
  list: { padding: 12, gap: 10, paddingBottom: 32 },
  row: { flexDirection: "row", gap: 12, backgroundColor: colors.surface, borderRadius: 12, padding: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  logo: { width: 52, height: 36, borderRadius: 8, backgroundColor: "#000" },
  logoFallback: { alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceRaised },
  logoInitial: { color: colors.brand, fontWeight: "700" },
  rowBody: { flex: 1, gap: 4 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  channelName: { color: colors.text, fontSize: 13, fontWeight: "600", flex: 1 },
  time: { color: colors.textFaint, fontSize: 11, fontVariant: ["tabular-nums"] },
  program: { color: colors.text, fontSize: 14, fontWeight: "500" },
  track: { height: 3, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 2, overflow: "hidden", marginTop: 4 },
  fill: { height: "100%", backgroundColor: colors.brand },
  remaining: { color: colors.textFaint, fontSize: 11, marginTop: 2 },
});
