import { supabase } from './supabaseClient';

type CheckoutPayload =
  | { type: 'subscription'; companyId: string; tier: 'basic' | 'elite' }
  | { type: 'coin_deposit'; companyId: string; guildId: string; coinAmount: number }
  | { type: 'featured_boost'; guildId: string };

type StudentCheckoutPayload =
  | { type: 'season_pass'; userId: string }
  | { type: 'coin_top_up'; userId: string; packId: 'starter' | 'standard' | 'pro' };

async function createCheckoutSession(payload: CheckoutPayload): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{ url: string }>(
    'stripe-company-checkout',
    { body: payload }
  );
  if (error) throw new Error(error.message ?? 'Checkout session creation failed');
  if (!data?.url) throw new Error('No checkout URL returned');
  return data.url;
}

/** Create a subscription checkout session for a company guild.
 *  Redirects to /company/dashboard?subscribed=true on success. */
export async function createGuildSubscription(
  companyId: string,
  tier: 'basic' | 'elite'
): Promise<string> {
  return createCheckoutSession({ type: 'subscription', companyId, tier });
}

/** Create a one-time coin deposit checkout session.
 *  Minimum coinAmount is 500 (= $10 at $0.02/coin). */
export async function depositCoinBudget(
  companyId: string,
  guildId: string,
  coinAmount: number
): Promise<string> {
  if (coinAmount < 500) throw new Error('Minimum deposit is 500 coins ($10)');
  return createCheckoutSession({ type: 'coin_deposit', companyId, guildId, coinAmount });
}

/** Create a $29 featured boost checkout session (7-day guild feature). */
export async function createFeaturedBoost(guildId: string): Promise<string> {
  return createCheckoutSession({ type: 'featured_boost', guildId });
}

// ── Student-facing purchases ──────────────────────────────────────────────────

async function createStudentCheckoutSession(payload: StudentCheckoutPayload): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{ url: string }>(
    'stripe-student-checkout',
    { body: payload }
  );
  if (error) throw new Error(error.message ?? 'Checkout session creation failed');
  if (!data?.url) throw new Error('No checkout URL returned');
  return data.url;
}

/** $9.99 Season Pass — 25% XP boost + exclusive badge for the active season. */
export async function purchaseSeasonPass(userId: string): Promise<string> {
  return createStudentCheckoutSession({ type: 'season_pass', userId });
}

/** Coin top-up packs: starter 200/$3.99 · standard 600/$9.99 · pro 1500/$19.99. */
export async function purchaseCoinTopUp(
  userId: string,
  packId: 'starter' | 'standard' | 'pro'
): Promise<string> {
  return createStudentCheckoutSession({ type: 'coin_top_up', userId, packId });
}

/**
 * Deduct coins from the student's profile and log the transaction.
 * Throws if the user has insufficient balance.
 */
export async function spendCoins(userId: string, amount: number, reason: string): Promise<void> {
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('coins')
    .eq('id', userId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const currentCoins: number = profile?.coins ?? 0;
  if (currentCoins < amount) throw new Error('Insufficient coin balance');

  const balanceAfter = currentCoins - amount;

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ coins: balanceAfter })
    .eq('id', userId);
  if (updateError) throw new Error(updateError.message);

  await supabase.from('transactions').insert({
    user_id: userId,
    amount: -amount,
    reason,
    balance_after: balanceAfter,
  });
}

/**
 * Spend 50 coins to unlock one extra mission-claim slot for today (UTC).
 * Stores the date so the slot resets at midnight UTC.
 */
export async function unlockExtraClaimSlot(userId: string): Promise<void> {
  await spendCoins(userId, 50, 'extra_claim_slot');
  const todayUTC = new Date().toISOString().split('T')[0];
  await supabase
    .from('profiles')
    .update({ extra_claim_slots_today: { date: todayUTC, count: 1 } })
    .eq('id', userId);
}
