// Centralized design tokens for the Magic Formulae dark theme.
// Use these tokens across components for consistent styling.

export const theme = {
  colors: {
    palette: {
      black: "#000000",
      ink: "#0a0a0a",
      charcoal: "#101010",
      graphite: "#141414",
      slate: "#1a1a1a",
      border: "#1f2937",
      muted: "#4b5563",
      white: "#ffffff",
      primary: "#00ff88",
      primaryHover: "#00cc6f",
      secondary: "#8b5cf6",
      warning: "#facc15",
      danger: "#ef4444",
      info: "#38bdf8",
    },
    background: {
      base: "#0a0a0a",
      subtle: "#101010",
      surface: "#141414",
      card: "#1a1a1a",
      overlay: "rgba(10, 10, 10, 0.7)",
    },
    text: {
      primary: "#ffffff",
      secondary: "#d1d5db",
      muted: "#9ca3af",
      accent: "#00ff88",
    },
    border: {
      subtle: "#1f2937",
      strong: "#111827",
      accent: "#00ff88",
    },
    shadows: {
      glow: "0 0 25px rgba(0, 255, 136, 0.2)",
    },
  },

  radii: {
    xs: "4px",
    sm: "6px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    pill: "999px",
  },

  spacing: {
    none: "0px",
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
    "2xl": "32px",
    "3xl": "40px",
    "4xl": "48px",
  },

  fontSizes: {
    xs: "12px",
    sm: "14px",
    base: "16px",
    lg: "18px",
    xl: "20px",
    "2xl": "24px",
    "3xl": "30px",
    "4xl": "36px",
  },

  fontWeights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  shadows: {
    sm: "0 2px 6px rgba(0, 0, 0, 0.35)",
    md: "0 8px 20px rgba(0, 0, 0, 0.45)",
    lg: "0 14px 30px rgba(0, 0, 0, 0.55)",
    glow: "0 0 20px rgba(0, 255, 136, 0.25)",
  },
} as const;

