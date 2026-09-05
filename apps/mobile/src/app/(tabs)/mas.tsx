import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronRight, Lock, LogOut, Shield } from "lucide-react-native";
import { APP_NAME } from "@infitv/config";
import { logout } from "@/lib/activation";
import { getAccountStatus } from "@/lib/me";
import { clearAdultPin, hasAdultPin, setAdultPin } from "@/lib/pin";
import { colors, fonts } from "@/constants/theme";
import type { AccountStatus } from "@/lib/types";

function statusTone(status: AccountStatus["status"]): {
  label: string;
  color: string;
  bg: string;
} {
  switch (status) {
    case "ACTIVE":
      return { label: "Activa", color: colors.ok, bg: "rgba(52,211,153,0.15)" };
    case "SUSPENDED":
      return { label: "Suspendida", color: colors.danger, bg: "rgba(248,113,113,0.15)" };
    case "EXPIRED":
      return { label: "Vencida", color: colors.danger, bg: "rgba(248,113,113,0.15)" };
    case "DEVICE_REVOKED":
      return { label: "Dispositivo revocado", color: colors.danger, bg: "rgba(248,113,113,0.15)" };
  }
}

function daysLeft(expiresAt: string | null): string {
  if (expiresAt === null) return "Sin vencimiento";
  const diff = new Date(expiresAt).getTime() - Date.now();
  const days = Math.ceil(diff / 86_400_000);
  if (days <= 0) return "Vencido";
  if (days === 1) return "Vence hoy";
  return `${days} días restantes`;
}

export default function MasScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [account, setAccount] = useState<AccountStatus | null>(null);
  const [hasPin, setHasPin] = useState(false);
  const [pinModal, setPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");

  useEffect(() => {
    let cancelled = false;
    getAccountStatus()
      .then((a) => {
        if (!cancelled) setAccount(a);
      })
      .catch(() => {});
    hasAdultPin()
      .then((h) => {
        if (!cancelled) setHasPin(h);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function onLogout() {
    await logout();
    router.replace("/");
  }

  async function onSavePin() {
    if (pinInput.length < 4) return;
    await setAdultPin(pinInput);
    setHasPin(true);
    setPinModal(false);
    setPinInput("");
  }

  async function onRemovePin() {
    await clearAdultPin();
    setHasPin(false);
  }

  const tone = account !== null ? statusTone(account.status) : null;
  const initial = (account?.displayName?.charAt(0) ?? "U").toUpperCase();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Más</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Perfil */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={["#7C6CF0", "#4431A8"]}
            style={styles.avatar}
          >
            <Text style={styles.avatarInitial}>{initial}</Text>
          </LinearGradient>
          <View style={styles.profileBody}>
            <Text style={styles.displayName}>
              {account?.displayName ?? "Cliente"}
            </Text>
            {tone !== null && (
              <View style={[styles.statusBadge, { backgroundColor: tone.bg }]}>
                <Text style={[styles.statusText, { color: tone.color }]}>
                  {tone.label}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Datos de la cuenta */}
        <View style={styles.card}>
          <Row label="Plan" value={account?.plan ?? "—"} />
          <Row label="Vencimiento" value={daysLeft(account?.expiresAt ?? null)} />
        </View>

        {/* Contenido adulto */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.rowIcon}>
              <Shield size={18} color={colors.brand} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>Bloqueo de contenido adulto</Text>
                <Text style={styles.rowSub}>
                  {hasPin ? "Protegido con PIN" : "Sin PIN configurado"}
                </Text>
              </View>
            </View>
            <Switch
              value={hasPin}
              onValueChange={(v) => (v ? setPinModal(true) : onRemovePin())}
              trackColor={{ false: colors.border, true: colors.brand }}
              thumbColor="#FFFFFF"
            />
          </View>
          {hasPin && (
            <Pressable style={styles.linkRow} onPress={() => setPinModal(true)}>
              <Lock size={16} color={colors.textMuted} />
              <Text style={styles.linkText}>Cambiar PIN</Text>
              <ChevronRight size={16} color={colors.textFaint} />
            </Pressable>
          )}
        </View>

        {/* Acerca de */}
        <View style={styles.card}>
          <Row label="App" value={APP_NAME} />
          <Row label="Versión" value="v0.1.0" />
        </View>

        {/* Cerrar sesión */}
        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.8 }]}
          onPress={onLogout}
        >
          <LogOut size={18} color={colors.danger} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>

      {/* Modal de PIN */}
      <Modal
        visible={pinModal}
        transparent
        animationType="fade"
        onRequestClose={() => setPinModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Lock size={28} color={colors.brand} />
            <Text style={styles.modalTitle}>PIN de adultos</Text>
            <Text style={styles.modalSub}>
              Elegí un PIN de 4 dígitos para bloquear el contenido adulto.
            </Text>
            <TextInput
              style={styles.pinInput}
              value={pinInput}
              onChangeText={(t) => setPinInput(t.replace(/\D/g, "").slice(0, 4))}
              placeholder="••••"
              placeholderTextColor={colors.textFaint}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnGhost]}
                onPress={() => {
                  setPinModal(false);
                  setPinInput("");
                }}
              >
                <Text style={styles.modalBtnGhostText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalBtn,
                  styles.modalBtnPrimary,
                  pinInput.length < 4 && { opacity: 0.5 },
                ]}
                onPress={onSavePin}
                disabled={pinInput.length < 4}
              >
                <Text style={styles.modalBtnPrimaryText}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.rowBetween}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
    fontFamily: fonts.bold,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    fontFamily: fonts.bold,
  },
  profileBody: {
    flex: 1,
    gap: 6,
  },
  displayName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    fontFamily: fonts.bold,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: fonts.bold,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 12,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  rowLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  rowValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: fonts.semibold,
  },
  rowSub: {
    color: colors.textFaint,
    fontSize: 12,
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  linkText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: "rgba(248,113,113,0.08)",
  },
  logoutText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: "700",
    fontFamily: fonts.bold,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    padding: 24,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: "center",
    gap: 12,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    fontFamily: fonts.bold,
  },
  modalSub: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    fontFamily: fonts.regular,
  },
  pinInput: {
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
    fontFamily: fonts.bold,
    textAlign: "center",
    letterSpacing: 12,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginTop: 4,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modalBtnGhost: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalBtnGhostText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "600",
    fontFamily: fonts.semibold,
  },
  modalBtnPrimary: {
    backgroundColor: colors.brand,
  },
  modalBtnPrimaryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    fontFamily: fonts.bold,
  },
});
