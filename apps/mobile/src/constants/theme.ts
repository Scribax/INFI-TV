export const colors = {
  background: "#0B0F1A",
  surface: "#111827",
  surfaceRaised: "#1A2234",
  border: "#26314A",
  text: "#E7ECF5",
  textMuted: "#97A1B8",
  textFaint: "#5F6B85",
  brand: "#7C6CF0",
  brandStrong: "#6A5BE8",
  danger: "#F87171",
  ok: "#34D399",
  warn: "#FBBF24",
};

/** Fuentes Inter (cargadas en el layout raíz vía @expo-google-fonts). */
export const fonts = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
};

/** Tono del badge de calidad, derivada del nombre del canal (iptv-org). */
export const qualityTones = {
  "4k": { label: "4K", color: "#C4B5FD", bg: "rgba(124,108,240,0.18)" },
  fhd: { label: "FHD", color: "#6EE7B7", bg: "rgba(52,211,153,0.15)" },
  hd: { label: "HD", color: "#93C5FD", bg: "rgba(59,130,246,0.15)" },
  sd: { label: "SD", color: "#97A1B8", bg: "rgba(151,161,184,0.15)" },
} as const;
