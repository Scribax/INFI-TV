import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { APP_NAME } from "@infitv/config";
import { activate, validateSession } from "@/lib/activation";
import { colors } from "@/constants/theme";

export default function ActivateScreen() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let alive = true;
    validateSession().then((valid) => {
      if (!alive) return;
      if (valid) router.replace("/(tabs)/");
      else setChecking(false);
    });
    return () => {
      alive = false;
    };
  }, [router]);

  async function onSubmit() {
    const normalized = code.trim().toUpperCase();
    if (normalized.length < 8) {
      setError("Ingresá el código completo.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await activate(normalized);
      router.replace("/(tabs)/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo activar.");
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>IT</Text>
      </View>
      <Text style={styles.title}>{APP_NAME}</Text>
      <Text style={styles.subtitle}>Ingresá tu código</Text>

      <TextInput
        style={styles.input}
        value={code}
        onChangeText={setCode}
        placeholder="INFITV-XXXX-XXXX"
        placeholderTextColor={colors.textFaint}
        autoCapitalize="characters"
        autoCorrect={false}
        autoFocus
        editable={!busy}
        maxLength={32}
      />

      {error !== null && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={({ pressed }) => [
          styles.button,
          (busy || pressed) && styles.buttonDim,
        ]}
        onPress={onSubmit}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>ACTIVAR</Text>
        )}
      </Pressable>

      <Text style={styles.hint}>
        ¿Necesitás un código?{"\n"}Contactá al administrador.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
    backgroundColor: colors.background,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brand,
  },
  logoText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    marginTop: 4,
  },
  input: {
    width: "100%",
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    color: colors.text,
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 2,
    textAlign: "center",
  },
  button: {
    width: "100%",
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: colors.brand,
  },
  buttonDim: {
    opacity: 0.85,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    textAlign: "center",
  },
  hint: {
    color: colors.textFaint,
    fontSize: 13,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 20,
  },
});
