export function getThemeTokens(mode) {
  const common = {
    radius: 16,
    radius2: 22,
    shadow: "0 10px 30px rgba(0,0,0,0.08)",
    shadowStrong: "0 16px 50px rgba(0,0,0,0.12)",
  };

  const light = {
    ...common,
    // Light & bright
    bg: "#fdfefe",
    card: "#ffffff",
    card2: "#f9fbff",
    text: "#0f172a",
    text2: "#475569",
    border: "rgba(15, 23, 42, 0.08)",
    accent: "#ff5a1f",
    accent2: "#ff7a4a",
    muted: "rgba(15, 23, 42, 0.04)",
  };

  const dark = {
    ...common,
    bg: "#0b1220",
    card: "#101a2c",
    card2: "#0e1728",
    text: "#e5e7eb",
    text2: "#9aa4b2",
    border: "rgba(229, 231, 235, 0.10)",
    accent: "#ff5a1f",
    accent2: "#ff7a4a",
    muted: "rgba(229, 231, 235, 0.06)",
  };

  // Cream & coffee (warm paper + coffee accent)
  const sepia = {
    ...common,
    bg: "#fdf5e6", // cream background
    card: "#fff8e9",
    card2: "#f9edd8",
    text: "#3b2a20", // coffee text
    text2: "#6b5038",
    border: "rgba(59, 42, 32, 0.12)",
    accent: "#c47a3d", // coffee accent
    accent2: "#de9a5a",
    muted: "rgba(59, 42, 32, 0.06)",
  };

  if (mode === "dark") return dark;
  if (mode === "sepia") return sepia;
  return light;
}

export const THEMES = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "sepia", label: "Sepia" },
];