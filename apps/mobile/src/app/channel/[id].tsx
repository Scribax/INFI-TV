import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { ArrowLeft, Star } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { getAccountStatus } from "@/lib/me";
import { recordWatch } from "@/lib/me";
import { useFavorites } from "@/hooks/use-me";
import { useChannelEpg } from "@/hooks/use-epg";
import { useChannels } from "@/hooks/use-channels";
import { ChannelCard } from "@/components/channel-card";
import { colors, fonts } from "@/constants/theme";
import { flagEmoji } from "@/lib/flags";
import { channelQuality } from "@/lib/quality";
import type {
  AccountStatus,
  ChannelItem,
  EpgProgramItem,
} from "@/lib/types";

/** Frecuencia de chequeo del estado de la cuenta mientras se reproduce. */
const POLL_MS = 20_000;

function Player({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.play();
  });

  return (
    <VideoView
      player={player}
      style={styles.video}
      contentFit="contain"
      nativeControls
    />
  );
}

function SuspendedOverlay({
  status,
  reason,
  onBack,
}: {
  status: AccountStatus["status"];
  reason: string | null;
  onBack: () => void;
}) {
  const title =
    status === "EXPIRED"
      ? "SUSCRIPCIÓN VENCIDA"
      : status === "DEVICE_REVOKED"
        ? "DISPOSITIVO DESVINCULADO"
        : "CUENTA SUSPENDIDA";
  return (
    <View style={styles.suspended}>
      <Text style={styles.suspendedIcon}>⛔</Text>
      <Text style={styles.suspendedTitle}>{title}</Text>
      {reason !== null && reason !== "" && (
        <Text style={styles.suspendedReason}>Motivo: {reason}</Text>
      )}
      <Text style={styles.suspendedHint}>
        Contactá al administrador para más información.
      </Text>
      <Pressable style={styles.suspendedButton} onPress={onBack}>
        <Text style={styles.suspendedButtonText}>Volver</Text>
      </Pressable>
    </View>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function EpgSection({ programs }: { programs: EpgProgramItem[] }) {
  return (
    <View style={styles.epg}>
      <Text style={styles.sectionLabel}>Programación</Text>
      {programs.slice(0, 8).map((p) => (
        <View key={p.id} style={styles.epgRow}>
          <Text style={[styles.epgTime, p.isLive && styles.epgTimeNow]}>
            {formatTime(p.startsAt)}
          </Text>
          <View style={styles.epgBody}>
            <Text
              style={[styles.epgName, p.isLive && styles.epgNameNow]}
              numberOfLines={1}
            >
              {p.isLive ? "● " : ""}
              {p.title}
            </Text>
            {p.description !== null && (
              <Text style={styles.epgDesc} numberOfLines={2}>
                {p.description}
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

/** Canales del mismo país (o categoría) como sugerencia. */
function RelatedChannels({ channel }: { channel: ChannelItem }) {
  const router = useRouter();
  const { items } = useChannels(
    channel.countryCode !== null
      ? { country: channel.countryCode }
      : channel.categories[0] !== undefined
        ? { category: channel.categories[0].slug }
        : {},
  );
  const related = items.filter((c) => c.id !== channel.id).slice(0, 12);
  if (related.length === 0) return null;
  return (
    <View style={styles.related}>
      <Text style={styles.sectionLabel}>Canales relacionados</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.relatedRow}
      >
        {related.map((c) => (
          <View key={c.id} style={styles.relatedItem}>
            <ChannelCard
              channel={c}
              onPress={(cid) => router.replace(`/channel/${cid}`)}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export default function ChannelScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isFavorite, toggle } = useFavorites();
  const { programs } = useChannelEpg(id);
  const [channel, setChannel] = useState<ChannelItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgFailed, setImgFailed] = useState(false);
  const [accountStatus, setAccountStatus] = useState<AccountStatus["status"] | null>(null);
  const [suspensionReason, setSuspensionReason] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ch = await api.get<ChannelItem>(`/channels/${id}`);
        if (!cancelled) setChannel(ch);
        void recordWatch(id).catch(() => {});
      } catch {
        // el estado vacío lo maneja el render
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Polling del estado de la cuenta: si el admin suspende mientras el cliente
  // mira un canal en vivo, en <20s se corta y aparece "CUENTA SUSPENDIDA".
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const acc = await getAccountStatus();
        if (cancelled) return;
        setAccountStatus(acc.status);
        setSuspensionReason(acc.suspensionReason);
      } catch {
        // 401 (sesión muerta) u otro fallo de red: no interrumpir la reproducción
      }
    };
    void check();
    const t = setInterval(() => void check(), POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const fav = channel !== null && isFavorite(id);
  const blocked = accountStatus !== null && accountStatus !== "ACTIVE";
  const quality = channel !== null ? channelQuality(channel.name) : null;
  const isLive = channel?.streamStatus === "ONLINE";

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.headerBtn}
        >
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {channel?.name ?? "Canal"}
        </Text>
        {channel !== null && !blocked ? (
          <Pressable
            onPress={() => toggle(channel)}
            hitSlop={10}
            style={styles.headerBtn}
          >
            <Star
              size={22}
              color={fav ? colors.warn : colors.textMuted}
              fill={fav ? colors.warn : "none"}
            />
          </Pressable>
        ) : (
          <View style={styles.headerBtn} />
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <Text style={styles.muted}>Cargando…</Text>
        </View>
      ) : channel === null ? (
        <View style={styles.center}>
          <Text style={styles.muted}>Canal no disponible.</Text>
        </View>
      ) : blocked ? (
        <SuspendedOverlay
          status={accountStatus as AccountStatus["status"]}
          reason={suspensionReason}
          onBack={() => router.back()}
        />
      ) : (
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          <Player uri={channel.streamUrl} />

          <View style={styles.meta}>
            {channel.logoUrl !== null && !imgFailed ? (
              <Image
                source={{ uri: channel.logoUrl }}
                style={styles.logo}
                resizeMode="contain"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <View style={[styles.logo, styles.logoFallback]}>
                <Text style={styles.logoInitial}>
                  {channel.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.metaText}>
              <Text style={styles.name} numberOfLines={2}>
                {channel.name}
              </Text>
              <View style={styles.badges}>
                {isLive && (
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveBadgeText}>EN VIVO</Text>
                  </View>
                )}
                {quality !== null && (
                  <View style={[styles.badge, { backgroundColor: quality.bg }]}>
                    <Text style={[styles.badgeText, { color: quality.color }]}>
                      {quality.label}
                    </Text>
                  </View>
                )}
                {channel.countryCode !== null && (
                  <Text style={styles.flag}>{flagEmoji(channel.countryCode)}</Text>
                )}
              </View>
            </View>
          </View>

          {programs.length > 0 && <EpgSection programs={programs} />}

          <RelatedChannels channel={channel} />
        </ScrollView>
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
  },
  headerBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: fonts.bold,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingBottom: 32,
  },
  video: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
  },
  logo: {
    width: 72,
    height: 52,
    borderRadius: 10,
  },
  logoFallback: {
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  logoInitial: {
    color: colors.brand,
    fontSize: 26,
    fontWeight: "700",
    fontFamily: fonts.bold,
  },
  metaText: {
    flex: 1,
    gap: 8,
  },
  name: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
    fontFamily: fonts.bold,
  },
  badges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: "rgba(248,113,113,0.16)",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.danger,
  },
  liveBadgeText: {
    color: colors.danger,
    fontSize: 10,
    fontWeight: "700",
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: fonts.bold,
    letterSpacing: 0.4,
  },
  flag: {
    fontSize: 20,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: fonts.bold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  epg: {
    paddingHorizontal: 16,
    paddingTop: 4,
    marginBottom: 8,
  },
  epgRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    paddingVertical: 6,
  },
  epgTime: {
    color: colors.textFaint,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    width: 44,
    marginTop: 2,
  },
  epgTimeNow: {
    color: colors.brand,
    fontWeight: "700",
  },
  epgBody: {
    flex: 1,
  },
  epgName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "500",
    fontFamily: fonts.medium,
  },
  epgNameNow: {
    color: colors.brand,
    fontWeight: "700",
    fontFamily: fonts.bold,
  },
  epgDesc: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
    fontFamily: fonts.regular,
  },
  related: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  relatedRow: {
    gap: 10,
  },
  relatedItem: {
    width: 140,
  },
  muted: {
    color: colors.textFaint,
    fontSize: 14,
  },
  suspended: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
    backgroundColor: colors.background,
  },
  suspendedIcon: {
    fontSize: 52,
  },
  suspendedTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    fontFamily: fonts.bold,
    textAlign: "center",
  },
  suspendedReason: {
    color: colors.textMuted,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  suspendedHint: {
    color: colors.textFaint,
    fontSize: 13,
    textAlign: "center",
  },
  suspendedButton: {
    marginTop: 12,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.brand,
  },
  suspendedButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: fonts.bold,
  },
});
