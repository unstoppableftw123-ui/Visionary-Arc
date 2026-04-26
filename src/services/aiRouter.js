import { supabase } from './supabaseClient';
import { canMakeCall } from './usageService';
import { spendCoins } from './coinService';
import { toast } from 'sonner';

const TIER_MAP = {
  fast: { tier: 1, cost: 1, model: 'meta-llama/llama-3.3-70b-instruct:free', provider: 'groq' },
  ai_tutor: { tier: 1, cost: 1, model: 'meta-llama/llama-3.3-70b-instruct:free', provider: 'groq' },
  flashcards: { tier: 1, cost: 1, model: 'meta-llama/llama-3.3-70b-instruct:free', provider: 'groq' },
  grammar: { tier: 1, cost: 1, model: 'meta-llama/llama-3.3-70b-instruct:free', provider: 'groq' },
  short_summary: { tier: 1, cost: 1, model: 'meta-llama/llama-3.3-70b-instruct:free', provider: 'groq' },

  lesson_plan: { tier: 2, cost: 3, model: 'anthropic/claude-sonnet-4-5', provider: 'openrouter' },
  essay_feedback: { tier: 2, cost: 3, model: 'anthropic/claude-sonnet-4-5', provider: 'openrouter' },
  quiz: { tier: 2, cost: 3, model: 'anthropic/claude-sonnet-4-5', provider: 'openrouter' },
  document: { tier: 2, cost: 3, model: 'anthropic/claude-sonnet-4-5', provider: 'openrouter' },
  notes: { tier: 2, cost: 3, model: 'anthropic/claude-sonnet-4-5', provider: 'openrouter' },
  summarize: { tier: 2, cost: 3, model: 'anthropic/claude-sonnet-4-5', provider: 'openrouter' },

  brief_generation: { tier: 2, cost: 3, model: 'anthropic/claude-haiku-4-5', provider: 'openrouter' },

  slides: { tier: 3, cost: 8, model: 'moonshotai/kimi-k2.5', provider: 'openrouter' },
  visual: { tier: 3, cost: 8, model: 'moonshotai/kimi-k2.5', provider: 'openrouter' },
  screenshot_to_code: { tier: 3, cost: 8, model: 'moonshotai/kimi-k2.5', provider: 'openrouter' },
  deep_research: { tier: 3, cost: 8, model: 'moonshotai/kimi-k2.5', provider: 'openrouter' },
};

// Human-readable labels for toast messages
const FEATURE_LABELS = {
  flashcards:      'flashcard',
  quiz:            'quiz',
  summarize:       'summary',
  notes:           'notes',
  short_summary:   'summary',
  brief_generation:'brief',
  slides:          'slides',
  lesson_plan:     'lesson plan',
  essay_feedback:  'essay feedback',
  document:        'document',
  fast:            'AI',
  ai_tutor:        'AI mentor',
};

export async function callAI({ feature, prompt, systemPrompt, userId, imageBase64, onCoinsUpdated }) {
  const config = TIER_MAP[feature];
  if (!config) {
    throw new Error(`Unknown feature: ${feature}`);
  }

  const { cost, model, provider } = config;
  const featureLabel = FEATURE_LABELS[feature] ?? feature;

  // ── Daily limit check ────────────────────────────────────────────────────────
  if (userId) {
    const limitCheck = await canMakeCall(userId, feature);

    if (!limitCheck.allowed) {
      // Hard limit — no coins to continue
      toast.error(`Daily limit reached for ${featureLabel}. Upgrade for more calls.`, {
        action: {
          label: 'View Plans →',
          onClick: () => { window.location.href = '/pricing'; },
        },
      });
      throw new Error('DAILY_LIMIT');
    }

    if (limitCheck.reason === 'costs_coins') {
      // Over free limit — ask user to confirm coin spend
      const confirmed = await new Promise((resolve) => {
        const id = toast(
          `You've used your free ${featureLabel} calls today. This will cost ${limitCheck.coinCost} coins. Continue?`,
          {
            duration: Infinity,
            action: {
              label: 'Use Coins',
              onClick: () => { toast.dismiss(id); resolve(true); },
            },
            cancel: {
              label: 'Cancel',
              onClick: () => { toast.dismiss(id); resolve(false); },
            },
            onDismiss: () => resolve(false),
          }
        );
      });

      if (!confirmed) throw new Error('USER_CANCELLED');

      // Deduct 50 coins for the extra call
      const newBalance = await spendCoins(userId, limitCheck.coinCost, `Extra ${featureLabel} call`);
      if (newBalance === null) throw new Error('INSUFFICIENT_COINS');
      onCoinsUpdated?.();
    }
  }
  // ── End daily limit check ────────────────────────────────────────────────────

  // Check coin balance for the base AI call cost
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('coins')
    .eq('id', userId)
    .single();

  if (userError) throw userError;
  if (userData.coins < cost) throw new Error('INSUFFICIENT_COINS');

  // Build messages
  const userContent = imageBase64
    ? [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
      ]
    : prompt;

  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: userContent });

  // Make the API call
  let response;
  if (provider === 'groq') {
    response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.REACT_APP_GROQ_API_KEY}`,
      },
      body: JSON.stringify({ model, messages }),
    });
  } else {
    response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.REACT_APP_OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://visionary-arc.vercel.app',
        'X-Title': 'Visionary Academy',
      },
      body: JSON.stringify({ model, messages }),
    });
  }

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`AI call failed (${response.status}): ${err}`);
  }

  const data = await response.json();
  const tokensUsed = data.usage?.total_tokens ?? 0;
  const content = data.choices[0].message.content;

  const deductedBalance = await spendCoins(userId, cost, `ai_${feature}`);
  if (deductedBalance === null) throw new Error('INSUFFICIENT_COINS');

  onCoinsUpdated?.();

  // Log usage
  await supabase.from('ai_usage_log').insert({
    user_id: userId,
    model,
    tokens_used: tokensUsed,
    coins_deducted: cost,
    feature,
  });

  return content;
}
