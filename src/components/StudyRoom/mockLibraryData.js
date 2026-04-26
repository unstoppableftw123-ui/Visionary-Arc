/**
 * Mock library file data for Study Room library drawer.
 * Shape: { id, type, title, tag, lastEdited, content, cardCount? }
 */
export const MOCK_LIBRARY_FILES = [
  {
    id: "file-1",
    type: "note",
    title: "Quadratic Equations",
    tag: "Math",
    lastEdited: "2026-03-04",
    content:
      "The standard form of a quadratic equation is ax² + bx + c = 0. To solve, use the quadratic formula: x = (-b ± √(b² - 4ac)) / 2a. The discriminant b² - 4ac tells us how many real roots exist.",
  },
  {
    id: "file-2",
    type: "note",
    title: "Cell Biology Basics",
    tag: "Science",
    lastEdited: "2026-03-03",
    content:
      "Eukaryotic cells contain a nucleus and membrane-bound organelles. Mitochondria produce ATP. The endoplasmic reticulum is involved in protein synthesis and transport. Chloroplasts are found in plant cells and perform photosynthesis.",
  },
  {
    id: "file-3",
    type: "summary",
    title: "SAT Reading Strategies",
    tag: "SAT/ACT",
    lastEdited: "2026-03-05",
    content:
      "Summary: Always read the passage first, then tackle questions. Look for evidence in the text. Main idea questions often focus on the opening and closing. Vocabulary-in-context questions require substituting the answer choices back into the sentence.",
  },
  {
    id: "file-4",
    type: "summary",
    title: "Shakespeare Themes",
    tag: "English",
    lastEdited: "2026-03-01",
    content:
      "Common themes in Shakespeare: ambition (Macbeth), love and conflict (Romeo and Juliet), appearance vs reality (Hamlet), power and betrayal. His use of iambic pentameter and soliloquies reveals character psychology.",
  },
  {
    id: "file-5",
    type: "flashcard_deck",
    title: "AP Calculus Derivatives",
    tag: "Math",
    lastEdited: "2026-03-02",
    content: "",
    cardCount: 24,
    questions: [
      "What is d/dx(x^n)?",
      "What is d/dx(sin x)?",
      "What is the chain rule?",
    ],
  },
  {
    id: "file-6",
    type: "flashcard_deck",
    title: "Vocabulary Unit 7",
    tag: "English",
    lastEdited: "2026-02-28",
    content: "",
    cardCount: 15,
    questions: [
      "Define 'ubiquitous'",
      "Define 'paradigm'",
      "Define 'empirical'",
    ],
  },
];
