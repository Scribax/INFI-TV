import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { ArrowLeft } from "lucide-react-native";
import { colors, fonts } from "@/constants/theme";

/**
 * Auto-selecciona el servidor "Goodstream" (sin publicidad) apenas el player
 * de unlimplay lista los servidores. MutationObserver espera a que el botón
 * aparezca (el scrape es async) y le dispara click.
 */
const AUTO_GOODSTREAM_JS = `(function () {
  function pick() {
    var nodes = document.querySelectorAll("button, a, div, span, li");
    var best = null;
    for (var i = 0; i < nodes.length; i++) {
      var t = (nodes[i].textContent || "").trim();
      if (/goodstream/i.test(t) && t.length < 40) {
        if (!best || nodes[i].children.length <= best.children.length) {
          best = nodes[i];
        }
      }
    }
    if (best) {
      best.click();
      return true;
    }
    return false;
  }
  if (!pick()) {
    var obs = new MutationObserver(function () {
      if (pick()) obs.disconnect();
    });
    obs.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
    });
  }
})(); true;`;

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
        injectedJavaScript={AUTO_GOODSTREAM_JS}
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
