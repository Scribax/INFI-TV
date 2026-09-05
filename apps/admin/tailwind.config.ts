import type { Config } from "tailwindcss";

/**
 * Design system INFI TV Admin — dark, sobrio, profesional.
 * Paleta inspirada en dashboards modernos (tipo Linear/Vercel) con
 * acento violeta de marca.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Superficies
        canvas: "#0B0F1A",
        surface: "#111827",
        raised: "#1A2234",
        overlay: "#202A41",
        line: "#26314A",
        "line-strong": "#33415F",
        // Texto
        ink: "#E7ECF5",
        "ink-muted": "#97A1B8",
        "ink-faint": "#5F6B85",
        // Marca / acento
        brand: {
          DEFAULT: "#7C6CF0",
          strong: "#6A5BE8",
          soft: "#2A2560",
        },
        // Semántica
        ok: "#34D399",
        warn: "#FBBF24",
        danger: "#F87171",
        info: "#60A5FA",
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.4), 0 8px 24px -12px rgba(0,0,0,0.5)",
        "card-hover":
          "0 2px 4px rgba(0,0,0,0.4), 0 16px 40px -16px rgba(124,108,240,0.18)",
        pop: "0 24px 60px -12px rgba(0,0,0,0.7)",
      },
      backgroundImage: {
        "brand-glow":
          "radial-gradient(1200px 500px at 20% -10%, rgba(124,108,240,0.16), transparent 60%)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.18s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
