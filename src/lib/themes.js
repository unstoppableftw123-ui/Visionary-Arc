/**
 * Theme definitions for TaskFlow. Each theme has hex (for preview cards) and HSL values
 * mapped to Tailwind-compatible CSS variable names.
 */

const THEME_STORAGE_KEY = "taskflow-theme";

export const themes = [
  {
    id: "light",
    name: "Light",
    mode: "light",
    hex: {
      background: "#ffffff",
      surface: "#fafafa",
      surface2: "#f4f4f4",
      border: "#e5e5e5",
      accent: "#2c3542",
      text1: "#333333",
      text2: "#737373",
    },
    css: {
      "--background": "0 0% 100%",
      "--foreground": "0 0% 20%",
      "--card": "0 0% 98%",
      "--card-foreground": "0 0% 20%",
      "--popover": "0 0% 100%",
      "--popover-foreground": "0 0% 20%",
      "--primary": "210 12% 21%",
      "--primary-foreground": "0 0% 100%",
      "--secondary": "40 14% 96%",
      "--secondary-foreground": "0 0% 20%",
      "--muted": "40 9% 94%",
      "--muted-foreground": "0 0% 45%",
      "--accent": "40 6% 89%",
      "--accent-foreground": "0 0% 20%",
      "--border": "40 6% 91%",
      "--input": "40 6% 91%",
      "--ring": "210 12% 21%",
    },
  },
  {
    id: "dark",
    name: "Dark",
    mode: "dark",
    hex: {
      background: "#090909",
      surface: "#111111",
      surface2: "#1a1a1a",
      border: "#2a2a2a",
      accent: "#6e5ff0",
      text1: "#e5e5e5",
      text2: "#9ca3af",
    },
    css: {
      "--background": "0 0% 4%",
      "--foreground": "0 0% 90%",
      "--card": "0 0% 7%",
      "--card-foreground": "0 0% 90%",
      "--popover": "0 0% 7%",
      "--popover-foreground": "0 0% 90%",
      "--primary": "246 84% 65%",
      "--primary-foreground": "0 0% 100%",
      "--secondary": "0 0% 10%",
      "--secondary-foreground": "0 0% 90%",
      "--muted": "0 0% 10%",
      "--muted-foreground": "0 0% 61%",
      "--accent": "0 0% 14%",
      "--accent-foreground": "0 0% 90%",
      "--border": "0 0% 16%",
      "--input": "0 0% 16%",
      "--ring": "246 84% 65%",
    },
  },
  {
    id: "slate",
    name: "Slate",
    mode: "dark",
    hex: {
      background: "#0f172a",
      surface: "#1e293b",
      surface2: "#334155",
      border: "#475569",
      accent: "#38bdf8",
      text1: "#f1f5f9",
      text2: "#94a3b8",
    },
    css: {
      "--background": "222 47% 11%",
      "--foreground": "210 40% 98%",
      "--card": "217 33% 17%",
      "--card-foreground": "210 40% 98%",
      "--popover": "217 33% 17%",
      "--popover-foreground": "210 40% 98%",
      "--primary": "199 89% 58%",
      "--primary-foreground": "222 47% 11%",
      "--secondary": "215 28% 25%",
      "--secondary-foreground": "210 40% 98%",
      "--muted": "215 28% 25%",
      "--muted-foreground": "215 20% 65%",
      "--accent": "215 28% 25%",
      "--accent-foreground": "210 40% 98%",
      "--border": "215 20% 42%",
      "--input": "215 20% 42%",
      "--ring": "199 89% 58%",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    mode: "dark",
    hex: {
      background: "#0c1929",
      surface: "#132f4c",
      surface2: "#1a3a5c",
      border: "#2a4a6e",
      accent: "#0ea5e9",
      text1: "#e0f2fe",
      text2: "#7dd3fc",
    },
    css: {
      "--background": "211 64% 12%",
      "--foreground": "204 94% 94%",
      "--card": "211 58% 22%",
      "--card-foreground": "204 94% 94%",
      "--popover": "211 58% 22%",
      "--popover-foreground": "204 94% 94%",
      "--primary": "199 89% 48%",
      "--primary-foreground": "0 0% 100%",
      "--secondary": "211 45% 28%",
      "--secondary-foreground": "204 94% 94%",
      "--muted": "211 45% 28%",
      "--muted-foreground": "199 89% 68%",
      "--accent": "211 45% 28%",
      "--accent-foreground": "204 94% 94%",
      "--border": "211 40% 38%",
      "--input": "211 40% 38%",
      "--ring": "199 89% 48%",
    },
  },
  {
    id: "forest",
    name: "Forest",
    mode: "dark",
    hex: {
      background: "#0d1f12",
      surface: "#14532d",
      surface2: "#166534",
      border: "#15803d",
      accent: "#22c55e",
      text1: "#dcfce7",
      text2: "#86efac",
    },
    css: {
      "--background": "140 52% 10%",
      "--foreground": "138 76% 97%",
      "--card": "142 69% 18%",
      "--card-foreground": "138 76% 97%",
      "--popover": "142 69% 18%",
      "--popover-foreground": "138 76% 97%",
      "--primary": "142 71% 45%",
      "--primary-foreground": "0 0% 100%",
      "--secondary": "142 50% 25%",
      "--secondary-foreground": "138 76% 97%",
      "--muted": "142 50% 25%",
      "--muted-foreground": "142 69% 58%",
      "--accent": "142 50% 25%",
      "--accent-foreground": "138 76% 97%",
      "--border": "142 45% 32%",
      "--input": "142 45% 32%",
      "--ring": "142 71% 45%",
    },
  },
  {
    id: "rose",
    name: "Rose",
    mode: "dark",
    hex: {
      background: "#1c0a0d",
      surface: "#2d1519",
      surface2: "#451a23",
      border: "#5c242d",
      accent: "#f43f5e",
      text1: "#ffe4e6",
      text2: "#fda4af",
    },
    css: {
      "--background": "350 65% 9%",
      "--foreground": "351 100% 95%",
      "--card": "350 45% 15%",
      "--card-foreground": "351 100% 95%",
      "--popover": "350 45% 15%",
      "--popover-foreground": "351 100% 95%",
      "--primary": "347 77% 62%",
      "--primary-foreground": "0 0% 100%",
      "--secondary": "350 40% 22%",
      "--secondary-foreground": "351 100% 95%",
      "--muted": "350 40% 22%",
      "--muted-foreground": "351 76% 81%",
      "--accent": "350 40% 22%",
      "--accent-foreground": "351 100% 95%",
      "--border": "350 35% 28%",
      "--input": "350 35% 28%",
      "--ring": "347 77% 62%",
    },
  },
  {
    id: "amber",
    name: "Amber",
    mode: "light",
    hex: {
      background: "#fffbeb",
      surface: "#fef3c7",
      surface2: "#fde68a",
      border: "#fcd34d",
      accent: "#d97706",
      text1: "#451a03",
      text2: "#92400e",
    },
    css: {
      "--background": "48 100% 96%",
      "--foreground": "25 95% 14%",
      "--card": "48 96% 89%",
      "--card-foreground": "25 95% 14%",
      "--popover": "48 100% 96%",
      "--popover-foreground": "25 95% 14%",
      "--primary": "32 95% 44%",
      "--primary-foreground": "0 0% 100%",
      "--secondary": "48 96% 76%",
      "--secondary-foreground": "25 95% 14%",
      "--muted": "48 96% 89%",
      "--muted-foreground": "25 58% 31%",
      "--accent": "48 96% 76%",
      "--accent-foreground": "25 95% 14%",
      "--border": "48 96% 65%",
      "--input": "48 96% 65%",
      "--ring": "32 95% 44%",
    },
  },
  {
    id: "violet",
    name: "Violet",
    mode: "light",
    hex: {
      background: "#f5f3ff",
      surface: "#ede9fe",
      surface2: "#ddd6fe",
      border: "#c4b5fd",
      accent: "#6d28d9",
      text1: "#2e1065",
      text2: "#5b21b6",
    },
    css: {
      "--background": "270 100% 98%",
      "--foreground": "263 85% 22%",
      "--card": "263 84% 94%",
      "--card-foreground": "263 85% 22%",
      "--popover": "270 100% 98%",
      "--popover-foreground": "263 85% 22%",
      "--primary": "263 70% 50%",
      "--primary-foreground": "0 0% 100%",
      "--secondary": "263 84% 92%",
      "--secondary-foreground": "263 85% 22%",
      "--muted": "263 84% 92%",
      "--muted-foreground": "263 50% 40%",
      "--accent": "263 84% 92%",
      "--accent-foreground": "263 85% 22%",
      "--border": "263 83% 88%",
      "--input": "263 83% 88%",
      "--ring": "263 70% 50%",
    },
  },
];

export function getTheme(id) {
  return themes.find((t) => t.id === id) ?? themes[0];
}

export function getDefaultThemeId() {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem(THEME_STORAGE_KEY) || "dark";
}

/**
 * Apply a theme by setting CSS variables on :root and data-theme-mode.
 */
export function applyTheme(themeId) {
  const theme = getTheme(themeId);
  if (!theme) return;
  const root = document.documentElement;
  Object.entries(theme.css).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  root.setAttribute("data-theme-mode", theme.mode);
  root.classList.toggle("dark", theme.mode === "dark");
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
  }
}
