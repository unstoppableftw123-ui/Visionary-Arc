import { supabase } from "./supabaseClient";
import { callAI } from "./aiRouter";
import { awardBonusXP } from "./xpService";

export const ARTIFACT_TRACKS = [
  { key: "builder", accent: "#3B82F6", fileTypes: ["py", "js", "html", "sql"] },
  { key: "analyst", accent: "#10B981", fileTypes: ["xlsx", "csv", "ipynb"] },
  { key: "creator", accent: "#8B5CF6", fileTypes: ["docx", "md", "txt"] },
  { key: "designer", accent: "#EC4899", fileTypes: ["pdf", "docx", "md"] },
  { key: "founder", accent: "#F59E0B", fileTypes: ["pptx", "docx", "xlsx"] },
];

export const ARTIFACT_DIFFICULTIES = [
  { key: "patch", xp: 100, label: "Patch" },
  { key: "finish", xp: 250, label: "Finish" },
  { key: "rebuild", xp: 600, label: "Rebuild" },
];

const REVIEWER_BONUS_XP = 150;
const TEXT_REVIEWABLE_TYPES = new Set(["py", "js", "html", "sql", "csv", "ipynb", "md", "txt"]);

function parseJson(raw) {
  const stripped = String(raw ?? "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(stripped);
  } catch {
    return null;
  }
}

function getTrackConfig(track) {
  return ARTIFACT_TRACKS.find((item) => item.key === track) ?? null;
}

function getDifficultyConfig(difficulty) {
  return ARTIFACT_DIFFICULTIES.find((item) => item.key === difficulty) ?? ARTIFACT_DIFFICULTIES[0];
}

function getMimeType(fileType) {
  const mimeTypes = {
    py: "text/x-python",
    js: "text/javascript",
    html: "text/html",
    sql: "text/plain",
    csv: "text/csv",
    ipynb: "application/x-ipynb+json",
    md: "text/markdown",
    txt: "text/plain",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    pdf: "application/pdf",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };

  return mimeTypes[fileType] ?? "application/octet-stream";
}

async function readSubmissionForReview(file, fileType) {
  if (TEXT_REVIEWABLE_TYPES.has(fileType)) {
    return file.text();
  }

  return [
    "Binary submission uploaded.",
    `name: ${file.name || "artifact"}`,
    `type: ${file.type || "application/octet-stream"}`,
    `size_bytes: ${file.size || 0}`,
    "Use the artifact context and file metadata when reviewing this submission.",
  ].join("\n");
}

async function getStreakMultiplier(userId) {
  const { data: streakRow } = await supabase
    .from("streaks")
    .select("current_streak")
    .eq("user_id", userId)
    .maybeSingle();

  const streak = streakRow?.current_streak ?? 0;
  return streak >= 3 ? 2 : 1;
}

export async function generateArtifactChallenge(userId, track, difficulty) {
  if (!userId) throw new Error("userId required");

  const trackConfig = getTrackConfig(track);
  if (!trackConfig) throw new Error("Unknown track");

  const fileType =
    trackConfig.fileTypes[Math.floor(Math.random() * trackConfig.fileTypes.length)];

  const systemPrompt = `You are generating a broken ${fileType} artifact for a student challenge.
Track: ${track}. Difficulty: ${difficulty}.
Generate: (1) a realistic broken artifact as raw file content,
(2) a one-paragraph context brief explaining what it was supposed to be,
(3) a hidden rubric of exactly what's wrong (3-5 specific issues).
Calibrate errors to difficulty: Patch=1 obvious bug, Finish=partial work,
Rebuild=fundamentally flawed approach.
Return JSON: { artifact_content, context_brief, hidden_rubric, file_type }`;

  const prompt = `Generate one ${difficulty} artifact challenge for the ${track} track using a .${fileType} file. Return JSON only.`;

  const raw = await callAI({
    feature: "brief_generation",
    prompt,
    systemPrompt,
    userId,
  });

  const parsed = parseJson(raw);
  if (!parsed?.artifact_content || !parsed?.context_brief) {
    throw new Error("AI failed to generate a valid artifact challenge.");
  }

  const resolvedFileType = parsed.file_type ?? fileType;

  const { data: challenge, error } = await supabase
    .from("artifact_challenges")
    .insert({
      user_id: userId,
      track,
      difficulty,
      context_brief: parsed.context_brief,
      hidden_rubric: parsed.hidden_rubric ?? "",
      file_type: resolvedFileType,
      artifact_content: parsed.artifact_content,
      artifact_prompt: systemPrompt,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;

  const downloadUrl = URL.createObjectURL(
    new Blob([parsed.artifact_content], { type: getMimeType(resolvedFileType) }),
  );

  return {
    challengeId: challenge.id,
    track: challenge.track,
    difficulty: challenge.difficulty,
    contextBrief: challenge.context_brief,
    fileType: challenge.file_type,
    downloadUrl,
  };
}

export async function submitArtifact(challengeId, userId, file) {
  if (!challengeId || !userId || !file) {
    throw new Error("Missing required artifact submission details.");
  }

  const { data: challenge, error: challengeError } = await supabase
    .from("artifact_challenges")
    .select("*")
    .eq("id", challengeId)
    .eq("user_id", userId)
    .single();

  if (challengeError || !challenge) throw new Error("Artifact challenge not found.");
  if (challenge.status === "reviewed") throw new Error("This artifact has already been reviewed.");

  const filePath = `${userId}/${challengeId}.${challenge.file_type}`;
  const { error: uploadError } = await supabase.storage
    .from("artifact-submissions")
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type || getMimeType(challenge.file_type),
    });

  if (uploadError) throw uploadError;

  await supabase
    .from("artifact_challenges")
    .update({ status: "submitted" })
    .eq("id", challengeId);

  const submissionContent = await readSubmissionForReview(file, challenge.file_type);

  const reviewPrompt = `ORIGINAL BROKEN ARTIFACT (.${challenge.file_type}):
${challenge.artifact_content ?? ""}

STUDENT SUBMISSION:
${submissionContent}

HIDDEN RUBRIC:
${challenge.hidden_rubric ?? ""}`;

  const reviewSystemPrompt = `You reviewed the original broken artifact and the student's submission.
Compare them. Return JSON:
{ what_changed, what_still_off, what_they_missed,
  reviewer_bonus: bool (true if student caught something not in rubric),
  summary_two_sentences }`;

  const reviewRaw = await callAI({
    feature: "brief_generation",
    prompt: reviewPrompt,
    systemPrompt: reviewSystemPrompt,
    userId,
  });

  const review = parseJson(reviewRaw) ?? {};
  const reviewerBonus = review.reviewer_bonus === true;
  const streakMultiplier = await getStreakMultiplier(userId);
  const difficultyConfig = getDifficultyConfig(challenge.difficulty);
  const baseXp = difficultyConfig.xp;
  const bonusXp = reviewerBonus ? REVIEWER_BONUS_XP : 0;
  const xpAwarded = (baseXp + bonusXp) * streakMultiplier;

  const { error: submissionError } = await supabase
    .from("artifact_submissions")
    .insert({
      challenge_id: challengeId,
      user_id: userId,
      file_url: filePath,
      diff_review: reviewRaw,
      what_changed: review.what_changed ?? "",
      what_still_off: review.what_still_off ?? "",
      what_they_missed: review.what_they_missed ?? "",
      reviewer_bonus: reviewerBonus,
    });

  if (submissionError) throw submissionError;

  const { error: updateError } = await supabase
    .from("artifact_challenges")
    .update({
      status: "reviewed",
      xp_awarded: xpAwarded,
      reviewer_bonus_awarded: reviewerBonus,
    })
    .eq("id", challengeId);

  if (updateError) throw updateError;

  await awardBonusXP(userId, xpAwarded, `artifact_${challenge.difficulty}`);

  return {
    xpAwarded,
    streakMultiplier,
    reviewerBonus,
    review: {
      whatChanged: review.what_changed ?? "Your updated file was reviewed.",
      whatStillOff: review.what_still_off ?? "Nothing major left off.",
      whatTheyMissed: review.what_they_missed ?? "No missed items noted.",
      summary: review.summary_two_sentences ?? "Artifact review complete.",
    },
  };
}

export async function getChallengeHistory(userId) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("artifact_challenges")
    .select(`
      id,
      track,
      difficulty,
      file_type,
      context_brief,
      status,
      xp_awarded,
      reviewer_bonus_awarded,
      created_at,
      artifact_submissions (
        id,
        what_changed,
        what_still_off,
        what_they_missed,
        reviewer_bonus,
        file_url,
        submitted_at
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
