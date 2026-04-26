import { callAI } from './aiRouter';
import { getTrack } from '../data/tracksData';
import { awardCustomReward } from './xpService';

// ── Fallback briefs (one per track) ──────────────────────────────────────────

const FALLBACK_BRIEFS = {
  'tech-ai': {
    title: 'Launch an AI-Powered Study Tool',
    role: 'AI Developer',
    client: 'EduStart Labs',
    clientNeed: 'They need a browser extension that summarizes articles for students.',
    briefSummary:
      'Build a Chrome extension using the OpenAI API that lets students paste any article and get a 3-bullet AI summary. The tool should have a clean popup UI and work on any webpage.',
    deliverables: [
      'Working Chrome extension with popup UI',
      'API integration for text summarization',
      'User settings panel (tone, length)',
      'README with setup and usage instructions',
    ],
    skills: ['Prompt Engineering', 'JavaScript', 'Chrome Extensions API', 'API Integration'],
    timeline: '2–3 weeks',
    difficulty: 'Starter',
  },
  'design-branding': {
    title: 'Brand Identity for a Local Café',
    role: 'Brand Designer',
    client: 'The Morning Cup',
    clientNeed: 'They want a fresh identity to attract a younger, design-conscious audience.',
    briefSummary:
      'Create a complete visual brand identity including a logo system, color palette, typography stack, and two branded mockups (menu + storefront sign) for a cozy neighborhood café.',
    deliverables: [
      'Primary logo with 3 lockup variations',
      'Brand color palette + typography guide',
      'Menu design mockup (A4)',
      'Storefront sign mockup',
    ],
    skills: ['Logo Design', 'Color Theory', 'Brand Strategy', 'Typography'],
    timeline: '1–2 weeks',
    difficulty: 'Starter',
  },
  'business': {
    title: 'Go-to-Market Plan for a Fitness App',
    role: 'Marketing Strategist',
    client: 'FitStart',
    clientNeed: 'They need a launch strategy to reach their first 1,000 users.',
    briefSummary:
      'Develop a go-to-market strategy including target persona, channel mix, launch timeline, and three campaign ideas for a new fitness app targeting teens and young adults.',
    deliverables: [
      'Target persona document (1 page)',
      'Channel strategy with 3 primary channels',
      'Launch timeline (4 weeks)',
      '3 campaign concepts with copy hooks',
    ],
    skills: ['Market Research', 'Marketing Strategy', 'Copywriting', 'Audience Analysis'],
    timeline: '1–2 weeks',
    difficulty: 'Starter',
  },
  'content-storytelling': {
    title: 'Launch a Niche Newsletter',
    role: 'Content Creator',
    client: 'GreenPulse Media',
    clientNeed: 'They need a weekly newsletter to grow a community around sustainable living.',
    briefSummary:
      'Create the first 3 editions of a weekly sustainability newsletter: editorial plan, newsletter format template, and one social media post per edition to drive sign-ups.',
    deliverables: [
      '3-week editorial calendar',
      '3 complete newsletter editions',
      '3 matching social media posts',
      'Subject line variants for A/B testing',
    ],
    skills: ['Content Writing', 'Newsletter Design', 'Social Media', 'Editorial Planning'],
    timeline: '2–3 weeks',
    difficulty: 'Starter',
  },
  'social-impact': {
    title: 'Community Awareness Campaign',
    role: 'Campaign Strategist',
    client: 'Clean Rivers Coalition',
    clientNeed: 'They need a local awareness campaign around river pollution.',
    briefSummary:
      'Design a multi-channel awareness campaign with a campaign name, messaging guide, poster brief, and social media rollout plan targeting local high school students.',
    deliverables: [
      'Campaign name + tagline',
      'Messaging guide (2 pages)',
      'Poster concept brief',
      'Social media rollout plan (2 weeks)',
    ],
    skills: ['Campaign Strategy', 'Community Organizing', 'Visual Communication', 'Copywriting'],
    timeline: '1–2 weeks',
    difficulty: 'Starter',
  },
};

// ── Brief generation ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT =
  'You are a senior project director. Return ONLY valid JSON with these exact keys: ' +
  '{title,role,client,clientNeed,briefSummary,deliverables,skills,timeline,difficulty} ' +
  'where deliverables and skills are arrays of strings. No markdown. JSON only.';

function buildUserPrompt(track, difficulty, userProfile) {
  const trackObj = getTrack(track);
  return (
    `Track: ${trackObj?.name ?? track}. Difficulty: ${difficulty}. ` +
    `Student: Grade ${userProfile.grade ?? 10} at ${userProfile.school ?? 'high school'}.`
  );
}

function parseJsonBrief(raw) {
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
  try {
    return JSON.parse(stripped);
  } catch (_) {
    return null;
  }
}

function getRewardWeekKey() {
  const now = new Date();
  const firstDay = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const elapsedDays = Math.floor((now.getTime() - firstDay.getTime()) / 86400000);
  const week = Math.floor((elapsedDays + firstDay.getUTCDay()) / 7);
  return `${now.getUTCFullYear()}_${week}`;
}

export async function generateBrief(track, difficulty, userProfile) {
  const cacheKey = `brief_cache_${track}_${difficulty}`;

  // 24-hour cache check
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      const isFresh = parsed?.cachedAt && (Date.now() - parsed.cachedAt) < 24 * 60 * 60 * 1000;
      if (isFresh && parsed?.brief?.title) {
        return { brief: parsed.brief, fromCache: true };
      }
    } catch (_) {}
  }

  const systemPrompt = SYSTEM_PROMPT;
  const userPrompt = buildUserPrompt(track, difficulty, userProfile);

  let raw;
  try {
    raw = await callAI({
      feature: 'brief_generation',
      prompt: userPrompt,
      systemPrompt,
      userId: userProfile.userId,
    });
  } catch (err) {
    // If coin error, propagate; otherwise fall through to fallback
    if (err?.message === 'INSUFFICIENT_COINS') throw err;
    return { brief: FALLBACK_BRIEFS[track] ?? FALLBACK_BRIEFS['tech-ai'], fromCache: false, fallback: true };
  }

  let brief = parseJsonBrief(raw ?? '');

  // Retry once if parse failed
  if (!brief) {
    try {
      const raw2 = await callAI({
        feature: 'brief_generation',
        prompt: userPrompt + ' Return only JSON, no text.',
        systemPrompt,
        userId: userProfile.userId,
      });
      brief = parseJsonBrief(raw2 ?? '');
    } catch (_) {}
  }

  // Final fallback
  if (!brief || !brief.title) {
    return { brief: FALLBACK_BRIEFS[track] ?? FALLBACK_BRIEFS['tech-ai'], fromCache: false, fallback: true };
  }

  // Normalise arrays
  if (!Array.isArray(brief.deliverables)) brief.deliverables = [];
  if (!Array.isArray(brief.skills)) brief.skills = [];

  if (userProfile?.userId) {
    const rewardWeekKey = getRewardWeekKey();
    await awardCustomReward(
      userProfile.userId,
      'brief_generation_reward',
      { xp: 50, coins: 5 },
      {
        storageKey: `brief_reward_${userProfile.userId}_${track}_${rewardWeekKey}`,
        subject: track,
        coinReason: `brief_generation_${track}`,
      },
    ).catch(() => {});
  }

  localStorage.setItem(cacheKey, JSON.stringify({ brief, cachedAt: Date.now() }));
  return { brief, fromCache: false, fallback: false };
}
