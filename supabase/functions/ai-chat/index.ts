// Required secrets:
// - SUPABASE_URL
// - SUPABASE_ANON_KEY
// - SUPABASE_SERVICE_ROLE_KEY
// - OPENROUTER_API_KEY
// - GROQ_API_KEY

import {
  FEATURE_CONFIG,
  CORS_HEADERS,
  authenticateRequest,
  buildMessages,
  checkUsageLimit,
  deductCoins,
  jsonError,
  jsonSuccess,
  logAiUsage,
  parseJsonBody,
  sendChatCompletion,
  type FeatureKey,
} from "../_shared/ai.ts";

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

    const feature = String(body.feature ?? "fast") as FeatureKey;
    const config = FEATURE_CONFIG[feature];
    if (!config) {
      return jsonError(`Unknown feature: ${feature}`, 400);
    }

    const messages = buildMessages(body);
    if (messages.length === 0) {
      return jsonError("messages or prompt is required", 400);
    }

    const usage = await checkUsageLimit(
      auth.serviceClient,
      auth.user.id,
      feature,
      auth.profile.founder_tier,
      auth.profile.coins ?? 0,
    );

    if (!usage.allowed) {
      return jsonError("Daily limit reached", 429, { feature });
    }

    const totalCoinCost = config.coinCost + usage.overflowCoinCost;
    if ((auth.profile.coins ?? 0) < totalCoinCost) {
      return jsonError("Insufficient coins", 402, { requiredCoins: totalCoinCost });
    }

    const upstream = await sendChatCompletion({
      provider: config.provider,
      model: config.model,
      messages,
      temperature: typeof body.temperature === "number" ? body.temperature : undefined,
      max_tokens: typeof body.max_tokens === "number" ? body.max_tokens : undefined,
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
      `ai_${feature}`,
    );

    await logAiUsage(auth.serviceClient, {
      userId: auth.user.id,
      feature,
      model: config.model,
      provider: config.provider,
      tokensUsed,
      coinsDeducted: totalCoinCost,
    });

    return jsonSuccess({
      feature,
      provider: config.provider,
      model: config.model,
      content,
      usage: upstream?.usage ?? null,
      balance: newBalance,
      raw: upstream,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return jsonError(error instanceof Error ? error.message : "AI chat failed", 500);
  }
});
