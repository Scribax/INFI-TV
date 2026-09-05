import { memo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Star } from "lucide-react-native";
import { colors, fonts } from "@/constants/theme";
import { flagEmoji } from "@/lib/flags";
import { channelQuality } from "@/lib/quality";
import type { ChannelItem } from "@/lib/types";

/**
 * Card de canal memoizada: con grillas de miles de canales, cada re-render
 * del padre re-renderizaba todas las celdas visibles. `memo` + callbacks
 * estables (onPress recibe el id, la card crea la closure internamente)
 * cortan ese costo. El logo sin transition evita el fade en cada aparición
 * durante el scroll.
 */
export const ChannelCard = memo(function ChannelCard({
  channel,
  onPress,
  isFavorite = false,
  onToggleFavorite,
}: {
  channel: ChannelItem;
  onPress: (id: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (channel: ChannelItem) => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showLogo = channel.logoUrl !== null && !imgFailed;
  const quality = channelQuality(channel.name);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress(channel.id)}
    >
      {showLogo ? (
        <Image
          source={{ uri: channel.logoUrl as string }}
          style={styles.logo}
          contentFit="contain"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <LinearGradient
          colors={[colors.surfaceRaised, "#232E4A"]}
          style={[styles.logo, styles.logoFallback]}
        >
          <Text style={styles.logoInitial}>
            {channel.name.charAt(0).toUpperCase()}
          </Text>
        </LinearGradient>
      )}

      {quality !== null && (
        <View style={[styles.badge, { backgroundColor: quality.bg }]}>
          <Text style={[styles.badgeText, { color: quality.color }]}>
            {quality.label}
          </Text>
        </View>
      )}

      <Text style={styles.name} numberOfLines={2}>
        {channel.name}
      </Text>

      {channel.countryCode !== null && (
        <Text style={styles.flag}>{flagEmoji(channel.countryCode)}</Text>
      )}

      {onToggleFavorite !== undefined && (
        <Pressable
          style={styles.favButton}
          onPress={() => onToggleFavorite(channel)}
          hitSlop={8}
        >
          <Star
            size={16}
            color={isFavorite ? colors.warn : colors.textFaint}
            fill={isFavorite ? colors.warn : "none"}
          />
        </Pressable>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    gap: 8,
  },
  cardPressed: {
    borderColor: colors.brand,
    backgroundColor: colors.surfaceRaised,
    transform: [{ scale: 0.96 }],
  },
  logo: {
    width: 56,
    height: 40,
    borderRadius: 8,
  },
  logoFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoInitial: {
    color: colors.brand,
    fontSize: 20,
    fontWeight: "700",
    fontFamily: fonts.bold,
  },
  badge: {
    position: "absolute",
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    fontFamily: fonts.bold,
    letterSpacing: 0.4,
  },
  name: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "600",
    fontFamily: fonts.semibold,
    textAlign: "center",
    minHeight: 30,
  },
  flag: {
    fontSize: 14,
  },
  favButton: {
    position: "absolute",
    top: 6,
    right: 6,
    padding: 2,
  },
});
