import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { colors } from "@/constants/theme";

/** Placeholder de carga con shimmer (opacidad oscilante). */
export function ChannelSkeleton({ count = 9 }: { count?: number }) {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <Animated.View key={i} style={[styles.card, animatedStyle]}>
          <View style={styles.logo} />
          <View style={styles.line} />
          <View style={[styles.line, styles.lineShort]} />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  card: {
    width: "31%",
    flexGrow: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    gap: 8,
  },
  logo: {
    width: 56,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.surfaceRaised,
  },
  line: {
    width: "90%",
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceRaised,
  },
  lineShort: {
    width: "60%",
  },
});
