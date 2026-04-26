/**
 * Font definitions for TaskFlow. applyFont() sets the CSS variable and optional link preload.
 */

const FONT_STORAGE_KEY = "taskflow-font";

export const fonts = [
  { id: "inter", name: "Inter", family: "Inter", category: "sans" },
  { id: "manrope", name: "Manrope", family: "Manrope", category: "sans" },
  { id: "dm-sans", name: "DM Sans", family: "DM Sans", category: "sans" },
  { id: "open-sans", name: "Open Sans", family: "Open Sans", category: "sans" },
  { id: "poppins", name: "Poppins", family: "Poppins", category: "sans" },
  { id: "lora", name: "Lora", family: "Lora", category: "serif" },
  { id: "jetbrains-mono", name: "JetBrains Mono", family: "JetBrains Mono", category: "mono" },
];

const GOOGLE_FONT_URLS = {
  inter: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
  manrope: "https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap",
  "dm-sans":
    "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap",
  "open-sans":
    "https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap",
  poppins:
    "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap",
  lora: "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap",
  "jetbrains-mono":
    "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap",
};

export function getFont(id) {
  return fonts.find((f) => f.id === id) ?? fonts[0];
}

export function getDefaultFontId() {
  if (typeof window === "undefined") return "inter";
  return localStorage.getItem(FONT_STORAGE_KEY) || "inter";
}

/**
 * Apply font by setting body font-family and persisting to localStorage.
 */
export function applyFont(fontId) {
  const font = getFont(fontId);
  if (!font) return;
  document.body.style.fontFamily = `"${font.family}", sans-serif`;
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(FONT_STORAGE_KEY, fontId);
  }
}

export function getGoogleFontUrl(fontId) {
  return GOOGLE_FONT_URLS[fontId] || null;
}
