/**
 * AI game content generation for Competitions tab.
 * Calls Anthropic API with mode-specific prompts; returns parsed JSON arrays.
 */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-4-20250514";

const RANDOM_TOPICS = [
  "Human Biology",
  "World History 1900-2000",
  "Algebra Fundamentals",
  "Literary Devices",
  "Chemistry Elements",
  "Geography of Asia",
  "US Government",
  "Shakespeare's Works",
  "Calculus Basics",
  "Spanish Vocabulary",
];

function parseJsonArray(raw) {
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  try {
    return JSON.parse(stripped);
  } catch (_) {
    return null;
  }
}

/**
 * Generate game content for Vocab Jam, Knowledge Blitz, or Accuracy Duel.
 * @param {string} mode - 'vocabJam' | 'knowledgeBlitz' | 'accuracyDuel'
 * @param {string} topic - topic string, or 'ai_picks' for random
 * @param {number} count - number of items to generate
 * @param {string} difficulty - e.g. 'Easy', 'Medium', 'Hard'
 * @returns {Promise<Array>} - parsed array of questions/cards
 */
export async function generateGameContent(mode, topic, count, difficulty = "Medium") {
  const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("REACT_APP_ANTHROPIC_API_KEY is not set.");
  }

  const finalTopic =
    topic === "ai_picks" || !topic
      ? RANDOM_TOPICS[Math.floor(Math.random() * RANDOM_TOPICS.length)]
      : topic;

  const prompts = {
    vocabJam: `Generate exactly ${count} vocabulary flashcards on the topic: "${finalTopic}" at ${difficulty} difficulty level.
Return ONLY a valid JSON array, no markdown or preamble. Each object must have:
"term" (string), "definition" (string), "distractors" (array of exactly 3 wrong definition strings).
Example: [{"term": "Mitochondria", "definition": "Powerhouse of the cell", "distractors": ["Cell wall structure", "DNA storage", "Digestive organelle"]}]`,

    knowledgeBlitz: `Generate exactly ${count} multiple choice trivia questions on the topic: "${finalTopic}" at ${difficulty} difficulty level.
Return ONLY a valid JSON array, no markdown or preamble. Each object must have:
"question" (string), "options" (array of exactly 4 strings: ["A) ...", "B) ...", "C) ...", "D) ..."]), "answer" (string: "A", "B", "C", or "D"), "explanation" (string, brief).
Example: [{"question": "What is the capital of Australia?", "options": ["A) Sydney", "B) Canberra", "C) Melbourne", "D) Brisbane"], "answer": "B", "explanation": "Canberra is the capital."}]`,

    accuracyDuel: `Generate exactly ${count} rapid-fire questions on the topic: "${finalTopic}" at ${difficulty} difficulty level. Mix question types (fact recall, short answer style).
Return ONLY a valid JSON array, no markdown or preamble. Each object must have:
"question" (string), "answer" (string, the exact correct answer), "options" (array of exactly 4 strings including the correct answer, for multiple choice display), "correct_index" (number 0-3).
Example: [{"question": "What year did WWII end?", "answer": "1945", "options": ["1943", "1944", "1945", "1946"], "correct_index": 2}]`,
  };

  const prompt = prompts[mode];
  if (!prompt) throw new Error(`Unknown game mode: ${mode}`);

  const body = {
    model: DEFAULT_MODEL,
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  };

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    let message = `API error ${response.status}`;
    try {
      const j = JSON.parse(errText);
      message = j.error?.message || errText || message;
    } catch (_) {
      message = errText || message;
    }
    throw new Error(message);
  }

  const data = await response.json();
  const textBlock = data.content?.find((b) => b.type === "text");
  const raw = textBlock?.text?.trim() || "";
  const parsed = parseJsonArray(raw);

  if (!Array.isArray(parsed)) {
    throw new Error("AI did not return a valid JSON array.");
  }

  // Normalize per mode
  if (mode === "vocabJam") {
    return parsed.map((item) => ({
      term: item.term ?? "",
      definition: item.definition ?? "",
      distractors: Array.isArray(item.distractors) ? item.distractors : [],
    }));
  }

  if (mode === "knowledgeBlitz") {
    return parsed.map((item) => {
      const options = item.options || [];
      const answer = String(item.answer || "A").toUpperCase().replace(/[^ABCD]/, "A");
      const letterIndex = answer.charCodeAt(0) - 65;
      const correctIndex = Math.min(Math.max(0, letterIndex), options.length - 1);
      return {
        question: item.question ?? "",
        options,
        answer,
        correct_index: correctIndex,
        explanation: item.explanation ?? "",
      };
    });
  }

  if (mode === "accuracyDuel") {
    return parsed.map((item) => ({
      question: item.question ?? "",
      answer: String(item.answer ?? "").trim(),
      options: Array.isArray(item.options) ? item.options : [],
      correct_index: typeof item.correct_index === "number" ? item.correct_index : 0,
    }));
  }

  return parsed;
}
