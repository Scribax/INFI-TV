import { Pressable, StyleSheet, Text, View } from "react-native";
import { AlertTriangle, Inbox } from "lucide-react-native";
import { colors, fonts } from "@/constants/theme";

export function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Inbox size={26} color={colors.textFaint} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {hint !== undefined && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <AlertTriangle size={26} color={colors.warn} />
      </View>
      <Text style={styles.title}>{message}</Text>
      {onRetry !== undefined && (
        <Pressable style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Reintentar</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 8,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 4,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
    fontFamily: fonts.semibold,
    textAlign: "center",
  },
  hint: {
    color: colors.textFaint,
    fontSize: 13,
    textAlign: "center",
  },
  button: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: colors.brand,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: fonts.semibold,
  },
});
