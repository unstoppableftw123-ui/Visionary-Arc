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

function buildBriefPrompt(body: Record<string, unknown>) {
  const userProfile =
    body.userProfile && typeof body.userProfile === "object"
      ? body.userProfile as Record<string, unknown>
      : {};
  const track = String(body.track ?? "general");
  const difficulty = String(body.difficulty ?? "starter");
  const grade = String(body.grade ?? userProfile.grade ?? "10");
  const school = String(body.school ?? userProfile.school ?? "high school");
  return `Track: ${track}. Difficulty: ${difficulty}. Grade: ${grade}. School: ${school}.`;
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
    const config = FEATURE_CONFIG.brief_generation;

    const usage = await checkUsageLimit(
      auth.serviceClient,
      auth.user.id,
      "brief_generation",
      auth.profile.founder_tier,
      auth.profile.coins ?? 0,
    );

    if (!usage.allowed) {
      return jsonError("Daily brief limit reached", 429);
    }

    const totalCoinCost = config.coinCost + usage.overflowCoinCost;
    if ((auth.profile.coins ?? 0) < totalCoinCost) {
      return jsonError("Insufficient coins", 402, { requiredCoins: totalCoinCost });
    }

    const messages = buildMessages(body, buildBriefPrompt(body));
    const upstream = await sendChatCompletion({
      provider: config.provider,
      model: config.model,
      messages,
      temperature: typeof body.temperature === "number" ? body.temperature : 0.7,
      max_tokens: typeof body.max_tokens === "number" ? body.max_tokens : 1200,
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
      "ai_brief_generation",
    );

    await logAiUsage(auth.serviceClient, {
      userId: auth.user.id,
      feature: "brief_generation",
      model: config.model,
      provider: config.provider,
      tokensUsed,
      coinsDeducted: totalCoinCost,
    });

    return jsonSuccess({
      feature: "brief_generation",
      provider: config.provider,
      model: config.model,
      content,
      usage: upstream?.usage ?? null,
      balance: newBalance,
      raw: upstream,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return jsonError(error instanceof Error ? error.message : "Brief generation failed", 500);
  }
});
