/**
 * LLM API client for Study Hub — routes through aiRouter for coin deduction + logging.
 */

import { callAI } from '../../services/aiRouter';
import { getStudyHubMockResponse } from './studyHubMock';
import { awardActivityXP } from '../../services/xpService';

const AGENT_LABELS = {
  deep: "Deep Analysis",
  quick: "Quick Summary",
  study: "Study Notes",
};

/**
 * Build system prompt string from active tab and options.
 * @param {string} activeTab - "summarize" | "quiz" | "flashcards"
 * @param {object} options - tab-specific options
 */
export function buildSystemPrompt(activeTab, options = {}) {
  const agent = AGENT_LABELS[options.agent] || AGENT_LABELS.deep;

  if (activeTab === "summarize") {
    const style = options.summaryStyle || "Concise";
    const length = options.summaryLength || "Medium";
    return `You are a study assistant. Generate a ${style} summary in ${length} length using a ${agent} approach. Return clean markdown only: use headers, bullets, and bold for key terms. Do not include a title or preamble.`;
  }

  if (activeTab === "quiz") {
    const count = options.numQuestions ?? 5;
    const questionTypeMap = { multiple_choice: "Multiple Choice", true_false: "True or False", short_answer: "Short Answer", mixed: "Mixed" };
    const questionType = questionTypeMap[options.questionType] || "Multiple Choice";
    const difficulty = options.difficulty || "Medium";
    return `You are a study assistant. Generate exactly ${count} ${questionType} questions at ${difficulty} difficulty based on the given content. Return a valid JSON array only, no markdown or explanation. Each item must have: "question" (string), "options" (array of strings, for multiple choice/true-false), "answer" (string, the correct answer text or index as string e.g. "0"), "explanation" (string, optional). For multiple choice use "options" with 4 options; for true/false use "options": ["True", "False"]. Use "answer" as the exact correct option text (e.g. "True" or the full answer text).`;
  }

  if (activeTab === "flashcards") {
    const count = options.numCards ?? 10;
    const cardStyleMap = { term_def: "Term → Definition", question_answer: "Question → Answer", cloze: "Cloze (fill-in-the-blank)" };
    const cardStyle = cardStyleMap[options.cardStyle] || "Term → Definition";
    return `You are a study assistant. Generate exactly ${count} flashcards in "${cardStyle}" format based on the given content. Return a valid JSON array only, no markdown or explanation. Each item must have: "front" (string), "back" (string). For Cloze (fill-in-the-blank), put the sentence with _____ for the blank in "front" and the missing word/phrase in "back".`;
  }

  if (activeTab === "notes") {
    const style = options.notesStyle || "Outline";
    return `You are a study assistant. Generate structured study notes in "${style}" style from the given content. Use markdown: headers, bullets, bold for key terms. Return clean markdown only, no preamble.`;
  }

  if (activeTab === "slides") {
    const count = options.slideCount ?? 5;
    return `You are a study assistant. Turn the given content into ${count} presentation slides. Return a valid JSON array only, no markdown or explanation. Each item must have: "title" (string), "content" (string).`;
  }

  return "You are a helpful study assistant.";
}

/**
 * Build user message as plain text (Groq chat format).
 * @param {string} textContent - main text (paste + file text + link note)
 * @param {Array<{type: string, name?: string, data?: string, text?: string}>} attachments - from state
 */
function buildUserContent(textContent, attachments = []) {
  let combinedText = textContent && textContent.trim().length > 0 ? textContent.trim() : "";

  const linkNote = attachments
    .filter((a) => a.type === "link" && a.url)
    .map((a) => `URL (for context; you cannot fetch live): ${a.url}`)
    .join("\n");
  if (linkNote) combinedText += (combinedText ? "\n\n" : "") + linkNote;

  const imageCount = attachments.filter((a) => a.type === "image" && a.data).length;
  if (imageCount > 0) combinedText += (combinedText ? "\n\n" : "") + `[${imageCount} image(s) attached — describe or use the text above.]`;

  return combinedText || "(No content provided.)";
}

/**
 * Call Groq Chat Completions API (OpenAI-compatible).
 * @param {string} activeTab - "summarize" | "quiz" | "flashcards"
 * @param {object} options - tab-specific options (agent, summaryStyle, numQuestions, etc.)
 * @param {string} textContent - main content
 * @param {Array} attachments - [{ type, url?, data?, mediaType?, name?, text? }]
 * @returns {Promise<{ type: string, data: any, raw?: string }>} - { type, data } with parsed data or error
 */
const FEATURE_MAP = {
  flashcards: 'flashcards',
  quiz: 'quiz',
  slides: 'slides',
  summarize: 'summarize',
  notes: 'summarize',
};

const TAB_ACTIVITY_MAP = {
  flashcards: 'flashcards',
  quiz: 'quiz',
  summarize: 'summary',
  notes: 'notes',
  slides: 'summary',
};

export async function callAnthropic(activeTab, options, textContent, attachments = [], refreshCoins) {
  const feature = FEATURE_MAP[activeTab] ?? 'fast';
  const systemPrompt = buildSystemPrompt(activeTab, options);
  const prompt = buildUserContent(textContent, attachments);
  const userId = (() => { try { return JSON.parse(localStorage.getItem('auth_user'))?.id; } catch (_) { return null; } })();

  let raw;
  try {
    raw = await callAI({ feature, prompt, systemPrompt, userId, onCoinsUpdated: refreshCoins });
    raw = (raw ?? "").trim();
    // Award XP for successful generation (fire-and-forget, don't block response)
    const activityType = TAB_ACTIVITY_MAP[activeTab];
    if (userId && activityType) {
      awardActivityXP(userId, activityType, null).catch(() => {});
    }
  } catch (err) {
    if (err?.message === 'INSUFFICIENT_COINS') throw err;
    return getStudyHubMockResponse(activeTab, options, textContent, attachments);
  }

  if (activeTab === "summarize") {
    return { type: "summary", data: raw, raw };
  }

  if (activeTab === "notes") {
    return { type: "notes", data: raw, raw };
  }

  if (activeTab === "slides") {
    const parsed = parseJsonArray(raw);
    const slides = Array.isArray(parsed)
      ? parsed.map((item) => ({
          title: item.title ?? "Slide",
          content: item.content ?? item.text ?? "",
        }))
      : [];
    return { type: "slides", data: slides, raw };
  }

  if (activeTab === "quiz") {
    const parsed = parseJsonArray(raw);
    const questions = normalizeQuizItems(parsed);
    return { type: "quiz", data: questions, raw };
  }

  if (activeTab === "flashcards") {
    const parsed = parseJsonArray(raw);
    const cards = Array.isArray(parsed)
      ? parsed.map((item) => ({
          front: item.front ?? item.term ?? "",
          back: item.back ?? item.definition ?? "",
        }))
      : [];
    return { type: "flashcards", data: cards, raw };
  }

  return { type: "summary", data: raw, raw };
}

function parseJsonArray(raw) {
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  try {
    return JSON.parse(stripped);
  } catch (_) {
    return null;
  }
}

function normalizeQuizItems(parsed) {
  if (!Array.isArray(parsed)) return [];
  return parsed.map((item) => {
    const options = item.options || [];
    const answer = item.answer ?? item.correct_answer;
    let correctIndex = 0;
    if (typeof answer === "number") correctIndex = answer;
    else if (typeof answer === "string") {
      const idx = options.findIndex((o) => String(o).trim() === String(answer).trim());
      correctIndex = idx >= 0 ? idx : 0;
    }
    return {
      question: item.question || "",
      options,
      correct_answer: correctIndex,
      answer: options[correctIndex],
      explanation: item.explanation,
    };
  });
}
