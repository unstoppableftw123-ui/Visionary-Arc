// Required secrets:
// - SUPABASE_URL
// - SUPABASE_ANON_KEY
// - SUPABASE_SERVICE_ROLE_KEY
// - OPENROUTER_API_KEY

import {
  CORS_HEADERS,
  FEATURE_CONFIG,
  authenticateRequest,
  buildMessages,
  checkUsageLimit,
  deductCoins,
  jsonError,
  jsonSuccess,
  logAiUsage,
  parseJsonBody,
  sendChatCompletion,
} from "../_shared/ai.ts";

const DEFAULT_SYSTEM_PROMPT = `You reviewed the original broken artifact and the student's submission.
Compare them. Return JSON:
{ what_changed, what_still_off, what_they_missed,
  reviewer_bonus: bool (true if student caught something not in rubric),
  summary_two_sentences }`;

function buildArtifactPrompt(body: Record<string, unknown>) {
  const fileType = String(body.fileType ?? "txt");
  const originalArtifact = String(body.originalArtifact ?? "");
  const submission = String(body.submission ?? "");
  const hiddenRubric = String(body.hiddenRubric ?? "");

  return `ORIGINAL BROKEN ARTIFACT (.${fileType}):
${originalArtifact}

STUDENT SUBMISSION:
${submission}

HIDDEN RUBRIC:
${hiddenRubric}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonError("Method not allowed", 405);
  }

  try {
    const auth = await authenticateRequest(req);
    const body = await parseJsonBody(req);
    const config = FEATURE_CONFIG.artifact_review;

    const usage = await checkUsageLimit(
      auth.serviceClient,
      auth.user.id,
      "artifact_review",
      auth.profile.founder_tier,
      auth.profile.coins ?? 0,
    );

    if (!usage.allowed) {
      return jsonError("Daily artifact review limit reached", 429);
    }

    const totalCoinCost = config.coinCost + usage.overflowCoinCost;
    if ((auth.profile.coins ?? 0) < totalCoinCost) {
      return jsonError("Insufficient coins", 402, { requiredCoins: totalCoinCost });
    }

    const messages = buildMessages(body, buildArtifactPrompt(body));
    if (!messages.some((message) => message.role === "system")) {
      messages.unshift({ role: "system", content: DEFAULT_SYSTEM_PROMPT });
    }

    const upstream = await sendChatCompletion({
      provider: config.provider,
      model: config.model,
      messages,
      temperature: typeof body.temperature === "number" ? body.temperature : 0.2,
      max_tokens: typeof body.max_tokens === "number" ? body.max_tokens : 900,
      response_format:
        body.response_format && typeof body.response_format === "object"
          ? body.response_format as Record<string, unknown>
          : undefined,
    });

    const content = upstream?.choices?.[0]?.message?.content ?? "";
    const tokensUsed = upstream?.usage?.total_tokens ?? 0;
    const newBalance = await deductCoins(
      auth.serviceClient,
      auth.user.id,
      totalCoinCost,
      "ai_artifact_review",
    );

    await logAiUsage(auth.serviceClient, {
      userId: auth.user.id,
      feature: "artifact_review",
      model: config.model,
      provider: config.provider,
      tokensUsed,
      coinsDeducted: totalCoinCost,
    });

    return jsonSuccess({
      feature: "artifact_review",
      provider: config.provider,
      model: config.model,
      content,
      usage: upstream?.usage ?? null,
      balance: newBalance,
      raw: upstream,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return jsonError(error instanceof Error ? error.message : "Artifact review failed", 500);
  }
});
