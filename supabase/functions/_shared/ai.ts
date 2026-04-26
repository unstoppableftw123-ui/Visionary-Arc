import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") ?? "";
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") ?? "";

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const PROVIDERS = {
  groq: "groq",
  openrouter: "openrouter",
} as const;

export const FEATURE_CONFIG = {
  fast: { model: "meta-llama/llama-3.3-70b-instruct:free", provider: PROVIDERS.groq, coinCost: 1 },
  ai_tutor: { model: "meta-llama/llama-3.3-70b-instruct:free", provider: PROVIDERS.groq, coinCost: 1 },
  flashcards: { model: "meta-llama/llama-3.3-70b-instruct:free", provider: PROVIDERS.groq, coinCost: 1 },
  grammar: { model: "meta-llama/llama-3.3-70b-instruct:free", provider: PROVIDERS.groq, coinCost: 1 },
  short_summary: { model: "meta-llama/llama-3.3-70b-instruct:free", provider: PROVIDERS.groq, coinCost: 1 },
  lesson_plan: { model: "anthropic/claude-sonnet-4-5", provider: PROVIDERS.openrouter, coinCost: 3 },
  essay_feedback: { model: "anthropic/claude-sonnet-4-5", provider: PROVIDERS.openrouter, coinCost: 3 },
  quiz: { model: "anthropic/claude-sonnet-4-5", provider: PROVIDERS.openrouter, coinCost: 3 },
  document: { model: "anthropic/claude-sonnet-4-5", provider: PROVIDERS.openrouter, coinCost: 3 },
  notes: { model: "anthropic/claude-sonnet-4-5", provider: PROVIDERS.openrouter, coinCost: 3 },
  summarize: { model: "anthropic/claude-sonnet-4-5", provider: PROVIDERS.openrouter, coinCost: 3 },
  brief_generation: {
    model: "anthropic/claude-haiku-4-5",
    provider: PROVIDERS.openrouter,
    coinCost: 3,
    limitBucket: "brief",
  },
  artifact_review: {
    model: "anthropic/claude-haiku-4-5",
    provider: PROVIDERS.openrouter,
    coinCost: 3,
    limitBucket: "brief",
  },
  slides: { model: "moonshotai/kimi-k2.5", provider: PROVIDERS.openrouter, coinCost: 8 },
  visual: { model: "moonshotai/kimi-k2.5", provider: PROVIDERS.openrouter, coinCost: 8 },
  screenshot_to_code: { model: "moonshotai/kimi-k2.5", provider: PROVIDERS.openrouter, coinCost: 8 },
  deep_research: { model: "moonshotai/kimi-k2.5", provider: PROVIDERS.openrouter, coinCost: 8 },
} as const;

const DAILY_LIMITS = {
  free: { flashcards: 10, quiz: 5, summary: 5, brief: 1 },
  seed: { flashcards: 30, quiz: 15, summary: 15, brief: 4 },
  bronze: { flashcards: 30, quiz: 15, summary: 15, brief: 4 },
  silver: { flashcards: 60, quiz: 30, summary: 30, brief: 7 },
  gold: { flashcards: 100, quiz: 50, summary: 50, brief: 14 },
} as const;

const OVERFLOW_COIN_COST = 50;

export type FeatureKey = keyof typeof FEATURE_CONFIG;
type Provider = typeof PROVIDERS[keyof typeof PROVIDERS];
type LimitBucket = "flashcards" | "quiz" | "summary" | "brief";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string | Array<Record<string, unknown>>;
};

export type AuthContext = {
  authHeader: string;
  userClient: ReturnType<typeof createClient>;
  serviceClient: ReturnType<typeof createClient>;
  user: { id: string };
  profile: {
    id: string;
    coins: number | null;
    founder_tier: string | null;
  };
};

function createUserClient(authHeader: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: authHeader } },
  });
}

function createServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function featureToLimitKey(feature: FeatureKey): LimitBucket {
  const config = FEATURE_CONFIG[feature];
  if (config.limitBucket) return config.limitBucket;
  if (feature === "flashcards") return "flashcards";
  if (feature === "quiz") return "quiz";
  return "summary";
}

function getLimits(founderTier: string | null) {
  if (!founderTier) return DAILY_LIMITS.free;
  return DAILY_LIMITS[founderTier as keyof typeof DAILY_LIMITS] ?? DAILY_LIMITS.free;
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
  });
}

export function jsonError(message: string, status = 400, details?: Record<string, unknown>) {
  return json({ error: message, ...details }, status);
}

export function jsonSuccess(body: Record<string, unknown>, status = 200) {
  return json(body, status);
}

export async function authenticateRequest(req: Request): Promise<AuthContext> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    throw new Response(JSON.stringify({ error: "Missing Authorization header" }), {
      status: 401,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const userClient = createUserClient(authHeader);
  const serviceClient = createServiceClient();

  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser();

  if (authError || !user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const { data: profile, error: profileError } = await serviceClient
    .from("profiles")
    .select("id, coins, founder_tier")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new Response(JSON.stringify({ error: "Profile not found" }), {
      status: 404,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  return {
    authHeader,
    userClient,
    serviceClient,
    user: { id: user.id },
    profile,
  };
}

export async function parseJsonBody(req: Request) {
  try {
    return await req.json();
  } catch {
    throw new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
}

export async function checkUsageLimit(
  serviceClient: ReturnType<typeof createClient>,
  userId: string,
  feature: FeatureKey,
  founderTier: string | null,
  coins: number,
) {
  const limitKey = featureToLimitKey(feature);
  const limits = getLimits(founderTier);
  const limit = limits[limitKey] ?? limits.summary;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await serviceClient
    .from("ai_usage_log")
    .select("feature")
    .eq("user_id", userId)
    .gte("created_at", today.toISOString());

  if (error) {
    throw new Error(`Usage check failed: ${error.message}`);
  }

  const used = (data ?? []).reduce((count, row) => {
    const rowKey = row?.feature && row.feature in FEATURE_CONFIG
      ? featureToLimitKey(row.feature as FeatureKey)
      : "summary";
    return rowKey === limitKey ? count + 1 : count;
  }, 0);

  if (used < limit) {
    return { allowed: true, remaining: limit - used, overflowCoinCost: 0 };
  }

  if (coins >= OVERFLOW_COIN_COST) {
    return { allowed: true, remaining: 0, overflowCoinCost: OVERFLOW_COIN_COST };
  }

  return { allowed: false, remaining: 0, overflowCoinCost: 0 };
}

export async function getCurrentBalance(
  serviceClient: ReturnType<typeof createClient>,
  userId: string,
) {
  const { data, error } = await serviceClient
    .from("profiles")
    .select("coins")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(`Failed to read balance: ${error.message}`);
  }

  return data?.coins ?? 0;
}

export async function deductCoins(
  serviceClient: ReturnType<typeof createClient>,
  userId: string,
  amount: number,
  reason: string,
) {
  if (!amount) return getCurrentBalance(serviceClient, userId);

  const { error } = await serviceClient.rpc("deduct_coins", {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason,
  });

  if (error) {
    throw new Error(`Coin deduction failed: ${error.message}`);
  }

  return getCurrentBalance(serviceClient, userId);
}

export async function logAiUsage(
  serviceClient: ReturnType<typeof createClient>,
  params: {
    userId: string;
    feature: string;
    model: string;
    provider: Provider;
    tokensUsed: number;
    coinsDeducted: number;
  },
) {
  const { error } = await serviceClient.from("ai_usage_log").insert({
    user_id: params.userId,
    feature: params.feature,
    model: params.model,
    provider: params.provider,
    tokens_used: params.tokensUsed,
    coins_deducted: params.coinsDeducted,
  });

  if (error) {
    throw new Error(`Usage log failed: ${error.message}`);
  }
}

export async function sendChatCompletion(params: {
  provider: Provider;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: Record<string, unknown>;
}) {
  if (params.provider === PROVIDERS.groq && !GROQ_API_KEY) {
    throw new Error("Missing GROQ_API_KEY secret");
  }

  if (params.provider === PROVIDERS.openrouter && !OPENROUTER_API_KEY) {
    throw new Error("Missing OPENROUTER_API_KEY secret");
  }

  const endpoint =
    params.provider === PROVIDERS.groq
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://openrouter.ai/api/v1/chat/completions";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${
      params.provider === PROVIDERS.groq ? GROQ_API_KEY : OPENROUTER_API_KEY
    }`,
  };

  if (params.provider === PROVIDERS.openrouter) {
    headers["HTTP-Referer"] = "https://visionary-arc.vercel.app";
    headers["X-Title"] = "Visionary Academy";
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      temperature: params.temperature,
      max_tokens: params.max_tokens,
      response_format: params.response_format,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.error?.message ??
      payload?.message ??
      `Provider request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

export function buildMessages(body: Record<string, unknown>, fallbackPrompt?: string): ChatMessage[] {
  const incomingMessages = Array.isArray(body.messages) ? body.messages as ChatMessage[] : [];
  if (incomingMessages.length > 0) return incomingMessages;

  const systemPrompt = typeof body.systemPrompt === "string" ? body.systemPrompt : null;
  const prompt =
    typeof body.prompt === "string"
      ? body.prompt
      : typeof fallbackPrompt === "string"
      ? fallbackPrompt
      : "";

  const messages: ChatMessage[] = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });
  return messages;
}
