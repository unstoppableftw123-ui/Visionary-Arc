const PREFIXES = {
  Math: "MATH",
  Mathematics: "MATH",
  Science: "SCI",
  Biology: "BIO",
  "AP Environmental Science": "ENV",
  English: "ENG",
  History: "HIST",
  "Social Studies": "SOC",
  Art: "ART",
  Other: "CLS",
};

/**
 * Generates a random class join code like "BIO-2841".
 * @param {string} subject - The class subject name.
 * @returns {string}
 */
export function generateClassCode(subject) {
  const prefix = PREFIXES[subject] || subject.slice(0, 3).toUpperCase() || "CLS";
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${digits}`;
}
