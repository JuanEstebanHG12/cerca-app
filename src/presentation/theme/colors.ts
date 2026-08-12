// Semantic tokens, not raw hex scattered across screens (Cerca.md: "colores semánticos, no
// descriptivos"). A "night market" palette — the everyday, after-work errand this product is
// actually for (the plumber, the dog walker) — instead of the generic light/blue defaults.
export const colors = {
  background: '#101C24',
  surface: '#17262F',
  surfaceBorder: '#283944',
  ink: '#F4F1EA',
  inkMuted: '#93A5AD',
  accent: '#FF9F45',
  accentInk: '#101C24',
  danger: '#FF6B5E',
  // Status badges (paused, under review) need their own color: distinct from danger (removed)
  // and never the only signal — every badge using this also carries text, not just a dot.
  warning: '#F2C94C',
  warningInk: '#101C24',
} as const;
