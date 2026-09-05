import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { ArrowLeft } from "lucide-react-native";
import { colors, fonts } from "@/constants/theme";

/**
 * Reproductor de películas vía unlimplay (embed en WebView).
 * Recibe el ID de TMDb en la ruta: /movie/{id}.
 */
export default function MovieScreen() {
  const router = useRouter();
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {title ?? "Película"}
        </Text>
        <View style={styles.backBtn} />
      </View>
      <WebView
        source={{ uri: `https://unlimplay.com/embed/movie/${id}` }}
        style={styles.web}
        allowsFullscreenVideo
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        onShouldStartLoadWithRequest={(request) => {
          // Bloquear navegación top-level a dominios de ads/redirects: unlimplay
          // mete popups y prerolls de apuestas. Solo se permite el dominio de
          // unlimplay en el frame principal; los streams viven en subframes.
          if (request.isTopFrame) {
            try {
              const host = new URL(request.url).hostname;
              if (!host.endsWith("unlimplay.com")) return false;
            } catch {
              return true;
            }
          }
          return true;
        }}
      />
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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: fonts.bold,
  },
  web: {
    flex: 1,
    backgroundColor: "#000000",
  },
});
