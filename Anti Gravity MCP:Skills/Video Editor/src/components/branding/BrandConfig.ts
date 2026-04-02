export const BRAND = {
  colors: {
    primary: "#FF0000",
    background: "#000000",
    text: "#FFFFFF",
    textSecondary: "#CCCCCC",
    accent: "#FF0000",
    accentGlow: "rgba(255, 0, 0, 0.4)",
    overlay: "rgba(0, 0, 0, 0.85)",
    overlayLight: "rgba(0, 0, 0, 0.5)",
  },
  fonts: {
    heading: "Arial Black, Impact, sans-serif",
    body: "Arial, Helvetica, sans-serif",
  },
  fontWeights: { bold: 900, medium: 700, regular: 400 },
  spacing: { xs: 8, sm: 16, md: 24, lg: 40, xl: 60 },
  borderRadius: { sm: 4, md: 8, lg: 16, pill: 999 },
} as const;
