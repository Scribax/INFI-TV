import { StyleSheet, View } from "react-native";
import { colors } from "@/constants/theme";

/** Placeholder de carga para la grilla de canales. */
export function ChannelSkeleton({ count = 9 }: { count?: number }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.card}>
          <View style={styles.logo} />
          <View style={styles.line} />
          <View style={[styles.line, styles.lineShort]} />
        </View>
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
