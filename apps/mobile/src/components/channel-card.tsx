import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/constants/theme";
import { flagEmoji } from "@/lib/flags";
import type { ChannelItem } from "@/lib/types";

export function ChannelCard({
  channel,
  onPress,
  isFavorite = false,
  onToggleFavorite,
}: {
  channel: ChannelItem;
  onPress: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showLogo = channel.logoUrl !== null && !imgFailed;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      {showLogo ? (
        <Image
          source={{ uri: channel.logoUrl as string }}
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
      <Text style={styles.name} numberOfLines={2}>
        {channel.name}
      </Text>
      {channel.countryCode !== null && (
        <Text style={styles.flag}>{flagEmoji(channel.countryCode)}</Text>
      )}

      {onToggleFavorite !== undefined && (
        <Pressable style={styles.favButton} onPress={onToggleFavorite} hitSlop={8}>
          <Text style={styles.favIcon}>{isFavorite ? "⭐" : "☆"}</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

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
  },
  logo: {
    width: 56,
    height: 40,
    borderRadius: 8,
  },
  logoFallback: {
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  logoInitial: {
    color: colors.brand,
    fontSize: 20,
    fontWeight: "700",
  },
  name: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "600",
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
  favIcon: {
    fontSize: 16,
  },
});
