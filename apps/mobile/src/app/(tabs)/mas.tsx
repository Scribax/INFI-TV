import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { APP_NAME } from "@infitv/config";
import { logout } from "@/lib/activation";
import { colors } from "@/constants/theme";

export default function MasScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  async function onLogout() {
    await logout();
    router.replace("/");
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Más</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.appName}>{APP_NAME}</Text>
        <Text style={styles.version}>v0.1.0</Text>
      </View>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}
        onPress={onLogout}
      >
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
    gap: 16,
  },
  header: {
    paddingTop: 16,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 4,
  },
  appName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  version: {
    color: colors.textFaint,
    fontSize: 13,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: "rgba(248,113,113,0.1)",
    alignItems: "center",
  },
  buttonText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: "600",
  },
});
