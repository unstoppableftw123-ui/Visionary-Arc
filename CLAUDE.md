# CLAUDE.md — Visionary Arc
# Student Career + Study App | Solo founder | React 18 CRA | Supabase | Low budget
# Updated: March 2026

---

## 1. WHAT THIS APP IS (LOCKED)

Visionary Arc is a **gamified student productivity and career platform for ages 13–19**.

**One sentence:** "A gamified study + career app where students earn XP by studying
AND building real-world projects — turning schoolwork into a portfolio that gets them discovered."

**NOT:** a teacher tool, investor dashboard, Discord clone, or custom design/code editor.

**Core daily loop:**
Study tools (flashcards/quiz/notes) → Earn XP + Coins → Level up → Unlock project briefs
→ Build in external tools → Submit link → Portfolio auto-generated → Status tier rises
→ Companies discover top students

---

## 2. TECH STACK

- **Frontend:** React 18 CRA, Tailwind, shadcn/radix, Framer Motion
- **Backend:** Supabase (auth + DB + storage + edge functions)
- **AI:** OpenRouter (primary — cheaper) + Groq (interactive/fast features only)
- **Payments:** Stripe (Founder Pass one-time)
- **Rewards:** Tremendous API (gift cards, zero platform fees)
- **Hosting:** Vercel Pro ($20/month)
- **Canvas:** Excalidraw (npm — already installed, embed only)
- **Notes:** Tiptap (already installed, embed only)
- **Offline:** Dexie.js (already installed — IndexedDB for flashcards)

**AI model routing:**
| Task | Model | Provider | Approx cost/1K calls |
|---|---|---|---|
| Flashcards, quiz, summary | Llama 3.1 8B | OpenRouter | $0.07 |
| Notes, slides, AI tools | Llama 3.3 70B | OpenRouter | $0.42 |
| Project briefs | Claude Haiku 4.5 | OpenRouter | $1.25 |
| AI tutor (interactive) | Llama 3.3 70B | Groq | $0.79 (fast) |

---

## 3. WHAT'S BUILT VS WHAT'S NEEDED

### BUILT AND WORKING (just need API keys + Supabase tables):
- Supabase auth wired in App.js (signIn, signUp, getSession)
- supabaseClient.js singleton
- aiRouter.js (triple-tier routing, coin deduction, usage logging)
- useAITool.js wired to aiRouter
- anthropicClient.js (Study Hub) wired to aiRouter
- Study Hub (flashcards/quiz/summary/notes/slides)
- Notes Studio (Tiptap)
- Notes Knowledge Graph (d3)
- Whiteboard (Excalidraw)
- SAT/ACT Practice (mock data — keep as-is)
- Shop UI (connect to real coin balance)
- Competitions (3 game modes — rename to Challenges)
- Dashboard (connect XP/coins/streaks to real DB)
- Leaderboard (connect to real Supabase profiles)
- Referral page (connect referralService.js)
- Pricing page (connect Stripe payment links)
- Profile page (extend with portfolio section)
- Settings page (connect real user data)
- Services: coinService, missionService, referralService, flashcardService

### MUST BUILD (the actual Visionary Arc product):
1. Track Hub pages (5 career tracks)
2. AI Brief Generator (personalized project briefs per track+difficulty)
3. Project submission flow (paste link → XP → portfolio card)
4. Auto-portfolio page (public profile with project cards)
5. Status tier system (XP thresholds + feature gates)
6. Sponsored challenges board (company-posted challenges)
7. Friend system (follow, friend streaks, friend leaderboard)
8. Onboarding (3-step first-run experience)
9. Landing page rebuild (career accelerator angle)
10. Supabase SQL tables (ALL 12 tables)

### REMOVE FROM ROUTER (hide, keep files):
- /teacher/* — all teacher routes
- /investor — investor dashboard
- /community — replace with simple activity feed in Phase 2
- /wishlists — Phase 2
- /schools — absorb into onboarding (text field only)

---

## 4. DATABASE TABLES (paste in Supabase SQL Editor)

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- profiles (extends auth.users)
create table profiles (
  id uuid references auth.users(id) primary key,
  email text, name text, avatar text,
  school text, grade integer,
  xp integer default 0, level integer default 1,
  coins integer default 100,
  streak integer default 0, max_streak integer default 0,
  last_activity_date date,
  founder_tier text check (founder_tier in ('seed','bronze','silver','gold')),
  is_premium boolean default false,
  onboarded boolean default false,
  track_primary text,
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "own profile" on profiles for all using (auth.uid() = id);

-- streaks
create table streaks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id),
  current_streak integer default 0,
  max_streak integer default 0,
  last_activity_date date,
  freeze_count integer default 0,
  created_at timestamptz default now()
);
alter table streaks enable row level security;
create policy "own streaks" on streaks for all using (auth.uid() = user_id);

-- study_sessions (XP activity log)
create table study_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id),
  activity_type text, -- 'flashcards','quiz','summary','notes','whiteboard','practice'
  subject text,
  xp_earned integer default 0,
  coins_earned integer default 0,
  duration_seconds integer,
  created_at timestamptz default now()
);
alter table study_sessions enable row level security;
create policy "own sessions" on study_sessions for all using (auth.uid() = user_id);

-- missions (daily missions)
create table missions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id),
  type text, -- 'daily','weekly'
  title text, description text,
  xp_reward integer, coins_reward integer,
  progress integer default 0, target integer,
  completed boolean default false,
  claimed boolean default false,
  date date default current_date,
  created_at timestamptz default now()
);
alter table missions enable row level security;
create policy "own missions" on missions for all using (auth.uid() = user_id);

-- transactions (coin ledger, append-only)
create table transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id),
  amount integer, -- positive = credit, negative = debit
  reason text,
  balance_after integer,
  created_at timestamptz default now()
);
alter table transactions enable row level security;
create policy "own transactions" on transactions for all using (auth.uid() = user_id);

-- projects (brief + submission)
create table projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id),
  track text, difficulty text,
  title text, role text, client_name text,
  brief_json jsonb, -- full brief object from AI
  status text default 'active' check (status in ('active','submitted','completed','abandoned')),
  submission_url text,
  submission_notes text,
  xp_awarded integer default 0,
  coins_awarded integer default 0,
  submitted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);
alter table projects enable row level security;
create policy "own projects" on projects for all using (auth.uid() = user_id);

-- portfolio_entries (public)
create table portfolio_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id),
  project_id uuid references projects(id),
  track text, title text, role text,
  description text, skills text[],
  submission_url text,
  is_public boolean default true,
  created_at timestamptz default now()
);
alter table portfolio_entries enable row level security;
create policy "read public" on portfolio_entries for select using (is_public = true);
create policy "own entries" on portfolio_entries for all using (auth.uid() = user_id);

-- challenges (company-sponsored)
create table challenges (
  id uuid primary key default uuid_generate_v4(),
  sponsor_name text, sponsor_logo_url text,
  title text, description text, track text,
  reward_type text, reward_value text,
  max_slots integer, current_slots integer default 0,
  required_tier text default 'Beginner',
  status text default 'open',
  deadline timestamptz,
  created_at timestamptz default now()
);
alter table challenges enable row level security;
create policy "read all challenges" on challenges for select using (status = 'open');

-- referrals
create table referrals (
  id uuid primary key default uuid_generate_v4(),
  referrer_id uuid references profiles(id),
  referred_id uuid references profiles(id),
  status text default 'pending', -- 'pending','signed_up','streak_7','upgraded'
  coins_awarded integer default 0,
  created_at timestamptz default now()
);
alter table referrals enable row level security;
create policy "own referrals" on referrals for all using (auth.uid() = referrer_id);

-- friends
create table friends (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id),
  friend_id uuid references profiles(id),
  status text default 'pending', -- 'pending','accepted'
  friend_streak integer default 0,
  last_both_active date,
  created_at timestamptz default now()
);
alter table friends enable row level security;
create policy "own friends" on friends for all using (auth.uid() = user_id or auth.uid() = friend_id);

-- ai_usage_log (cost tracking)
create table ai_usage_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id),
  feature text, model text,
  tokens_used integer, coins_deducted integer,
  created_at timestamptz default now()
);
alter table ai_usage_log enable row level security;
create policy "own usage" on ai_usage_log for all using (auth.uid() = user_id);

-- leaderboard materialized view (refresh hourly)
create materialized view leaderboard_weekly as
select id, name, avatar, school, xp, level, streak,
  rank() over (order by xp desc) as rank
from profiles
order by xp desc limit 100;

-- Indexes for performance
create index on study_sessions(user_id, created_at);
create index on transactions(user_id, created_at);
create index on missions(user_id, date);
create index on projects(user_id, status);
create index on portfolio_entries(user_id, is_public);
```

---

## 5. XP EARNING TABLE

| Action | XP | Coin | Daily limit |
|---|---|---|---|
| Daily login | +5 | +2 | 1/day |
| Flashcard session (10+ cards) | +15 | +5 | 1/subject/day |
| Quiz (5+ questions) | +20 | +8 | 1/subject/day |
| Summary/notes saved | +10 | +3 | 1/day |
| Whiteboard saved | +10 | +3 | 1/day |
| Vocab drill (20 words) | +15 | +5 | 1/day |
| Daily mission completed | +25–75 | +10–25 | 3/day |
| SAT/ACT session | +30 | +10 | 1/day |
| 7-day streak bonus | +200 | +50 | Once at 7 days |
| 30-day streak bonus | +1,000 | +200 | Once at 30 days |
| Generate project brief | +50 | +5 | 1/track/week |
| Submit completed project (Starter) | +200 | +50 | Per project |
| Submit completed project (Standard) | +400 | +100 | Per project |
| Submit completed project (Advanced) | +700 | +175 | Per project |
| Submit completed project (Expert) | +1,000 | +250 | Per project |
| Refer friend (signs up) | +300 | +100 | Per referral |
| Refer friend (hits 7-day streak) | +100 | +50 | Per referral |
| Refer friend (upgrades to paid) | +500 | +250 | Per referral |
| Friend both active (friend streak day) | +20 | +10 | Per active friend |
| Portfolio entry published | +25 | +5 | Per project |

---

## 6. STATUS TIER THRESHOLDS

| Tier | XP | Unlocks |
|---|---|---|
| Beginner | 0 | Study tools, Starter briefs (1/week) |
| Builder | 500 | Standard briefs, public profile visible |
| Creator | 2,000 | Advanced briefs, challenge board access |
| Pro | 6,000 | Exclusive cohorts, apply to company challenges |
| Elite | 15,000 | Featured on discovery, direct company opportunities |

---

## 7. AI PROMPT RULES (save credits)

System prompts MUST be under 150 tokens. Always request JSON output.

**Flashcards:**
System: `Generate {n} flashcards as JSON array [{front, back}]. JSON only, no markdown.`

**Quiz:**
System: `Generate {n} MCQ questions as JSON [{question, options:["a","b","c","d"], answer:"a", explanation:""}]. JSON only.`

**Summary:**
System: `Summarize as {style} style. Use markdown headers and bullets. Max {length}.`

**Project brief:**
System: `You are a senior project director. Return ONLY JSON: {"title":"","role":"","client":"","clientNeed":"","briefSummary":"","deliverables":[],"skills":[],"timeline":"","difficulty":""}`
User: `Track: {track}. Difficulty: {difficulty}. Grade: {grade}. School: {school}.`
Model: Claude Haiku 4.5 via OpenRouter (quality required here)

**Cache everything:** 24h for briefs, per-content-hash for flashcards/quizzes.

---

## 8. ENVIRONMENT VARIABLES NEEDED

```
REACT_APP_SUPABASE_URL=                    # supabase.com → project → settings → API
REACT_APP_SUPABASE_ANON_KEY=               # same place
REACT_APP_OPENROUTER_API_KEY=              # openrouter.ai/keys
REACT_APP_GROQ_API_KEY=                    # console.groq.com (for fast interactive)
REACT_APP_STRIPE_PUBLISHABLE_KEY=          # stripe.com (already set)
REACT_APP_USE_MOCK=false                   # switch to true locally if needed
```

After adding keys: NEVER commit to GitHub. Keys go in .env.local only.
After building Supabase Edge Functions: move ALL AI calls server-side.

---

## 9. CODING RULES FOR CURSOR

- Read the ENTIRE file before editing any part of it
- Keep USE_REAL_API toggle working — mock always stays as fallback
- Add loading skeleton to every component that fetches data
- Use existing shadcn/radix components — no new UI libraries
- Use Framer Motion for animations — it's already installed
- After EVERY change, verify the app compiles without errors
- Commit after every successful Cursor session: git add . && git commit -m "what I built" && git push

NEVER:
- Set USE_REAL_API=true before Supabase tables are confirmed to exist
- Add new npm packages without checking existing packages first
- Make direct API calls from page components — always use aiRouter.js
- Hardcode user data — always pull from AuthContext
- Build teacher/investor pages
- Expose API keys in browser code (after backend is ready)

## 10!
# CLAUDE.md — Visionary Academy
# Read ONLY the sections listed in your task prompt. Do not read the whole file.
# Each section is self-contained. Jump to the § you need.

---

## § INDEX
- §1  PROJECT SNAPSHOT
- §2  RULES (read always)
- §3  BRAND & DESIGN SYSTEM
- §4  COIN & XP ECONOMY
- §5  DATABASE SCHEMA
- §6  AI ROUTER & MODELS
- §7  SERVICES MAP
- §8  MOCK → REAL API
- §9  COMMUNITY UNLOCK SYSTEM
- §10 REFERRAL SYSTEM
- §11 GIFT CARD REDEMPTION
- §12 ENV VARS

---

## §1 PROJECT SNAPSHOT

- **Name:** Visionary Academy (repo: Visionary-arc-Copy)
- **Stack:** React 18 CRA, Tailwind CSS, Framer Motion, Supabase, Stripe, Liveblocks, Socket.io
- **Roles:** student, company (admin only internal)
- **Build cmd:** `DISABLE_ESLINT_PLUGIN=true react-scripts start`
- **Deploy:** Vercel
- **DO NOT TOUCH:** Any teacher/* pages, InvestorDashboard, TeacherDashboard, mockAdapter.js internals

---

## §2 RULES (read always, every task)

1. Dark theme ONLY. `--bg-base: #0A0A0F`. No white backgrounds. Ever.
2. Glassmorphism pattern: `bg-white/5 backdrop-blur-md border border-white/10 rounded-xl`
3. Animations via Framer Motion only. No CSS keyframes.
4. Fonts: headings = `font-[Clash_Display]`, body = `font-[Satoshi]`
5. No console.log in final code. No placeholder TODOs.
6. All Supabase calls go through `src/services/supabaseClient.js`
7. Coin mutations: use `coinService.js` (awardCoins / spendCoins). Never update coins column directly.
8. XP mutations: use `xpService.js` (awardActivityXP). Never update xp column directly.
9. After each task output: list SQL migrations needed + ENV vars required.
10. One task at a time. Stop and confirm before next task.

---

## §3 BRAND & DESIGN SYSTEM

**File:** `src/styles/design-system.css`

### Core Palette (CSS vars)
```
--bg-base:    #0A0A0F   ← page background
--surface:    #12121A   ← cards
--surface-2:  #1A1A26   ← nested cards
--surface-3:  #22223A   ← hover states
--border:     rgba(255,255,255,0.07)
--border-hover: rgba(255,255,255,0.14)
--text-primary:   #F9FAFB
--text-secondary: #9CA3AF
--text-muted:     #4B5563
--accent:       #EAB308   ← GOLD (primary CTA, highlights)
--accent-glow:  rgba(234,179,8,0.3)
--accent-dim:   rgba(234,179,8,0.12)
```

### Rank Colors
```
E → #9CA3AF (gray)
D → #22C55E (green)
C → #3B82F6 (blue)
B → #A855F7 (purple)
A → #F97316 (orange)
S → #EAB308 (gold)
```

### Track Colors
```
tech:    #3B82F6
design:  #EC4899
content: #8B5CF6
business:#10B981
impact:  #F59E0B
```

### Glassmorphism Card Template
```jsx
<div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
```

### Glow Button Template
```jsx
<button className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold
  px-4 py-2 rounded-lg shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all">
```

### Animations
```js
// Card entrance
initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
// Spring pop
transition={{ type: 'spring', stiffness: 300, damping: 20 }}
// Hover lift
whileHover={{ scale: 1.02, y: -2 }}
```

---

## §4 COIN & XP ECONOMY

**Files:** `src/services/coinService.js`, `src/services/xpService.js`, `src/services/usageService.js`
**Docs:** `docs/GAMIFICATION_SUMMARY.md`

### XP Level Formula
```
xp_for_next_level = 100 + (level - 1) * 50
Level 1→2: 100 XP | 2→3: 150 XP | 3→4: 200 XP
```

### Rank Thresholds (from xpService.js)
```
E: 0 XP | D: 500 | C: 1,500 | B: 4,000 | A: 10,000 | S: 25,000
```

### Tier Thresholds
```
Beginner: 0 XP | Builder: 500 | Creator: 2,000 | Pro: 6,000 | Elite: 15,000
```

### Activity Rewards (from xpService.ACTIVITY_REWARDS)
```
flashcards: 15 XP / 5 coins
quiz:        20 XP / 8 coins
summary:     10 XP / 3 coins
notes:       10 XP / 3 coins
whiteboard:  10 XP / 3 coins
vocab:       15 XP / 5 coins
practice:    30 XP / 10 coins
login:        5 XP / 2 coins
```

### Daily Coin Cap (anti-farm): 200 coins/day from tool activity

### Daily AI Call Limits (from usageService.DAILY_LIMITS)
```
free:   flashcards:10, quiz:5, summary:5, brief:1
seed:   flashcards:30, quiz:15, summary:15, brief:4
bronze: flashcards:30, quiz:15, summary:15, brief:4
silver: flashcards:60, quiz:30, summary:30, brief:7
gold:   flashcards:100, quiz:50, summary:50, brief:14
```

### Coin Spend Rate (AI overflow)
```
50 coins = 1 extra AI call (shown in toast, confirmed before deduct)
```

### Founder Tier Launch Coins
```
Seed: 100 | Bronze: 500 | Silver: 2,000 | Gold: 10,000
```

### Gift Card Conversion
```
1,000 coins = $1.00 gift card value
Minimum redemption: 5,000 coins = $5
Gate: redemptions_enabled=true AND subscriber_count >= 5
```

### Referral Rewards
```
1 referral:  50 coins + 100 XP
5 referrals: 300 coins + 500 XP + avatar frame 'anime_gold'
10 referrals: 500 coins + 1,000 XP + unlock 1 locked tool early
25 referrals: 1,000 coins + 2,500 XP + badge 'pioneer' + frame 'pioneer_aura'
```

### Streak Milestone Bonuses
```
7-day streak:  200 XP + 50 coins
30-day streak: 1,000 XP + 200 coins
Friend streak 7 days: +20 XP + 10 coins to both users
```

---

## §5 DATABASE SCHEMA

**All migrations in:** `supabase/migrations/`

### Core Tables (already exist in Supabase)

#### profiles
```sql
id uuid (auth.users FK)
role text ('student' | 'company' | 'admin')
coins int
xp int
level int
rank text ('E'|'D'|'C'|'B'|'A'|'S')
badges jsonb default '[]'
stat_radar jsonb -- { technical, creativity, communication, leadership, impact }
streak_current int
streak_longest int
last_active_date date
```

#### coins_transactions
```sql
id uuid PK
user_id uuid → profiles
amount int (positive=earn, negative=spend)
reason text
balance_after int
created_at timestamptz
```

#### ai_usage_log
```sql
id uuid PK
user_id uuid
model text
tokens_used int
coins_deducted int
feature text
created_at timestamptz
```

#### guilds
```sql
id uuid PK
name text
slug text UNIQUE
type text ('adventurer' | 'company')
company_id uuid → auth.users
tier text ('basic' | 'elite')
color_theme text default '#EAB308'
entry_min_rank text default 'C'
coin_budget int
```

#### guild_missions
```sql
id uuid PK
guild_id uuid → guilds
title text
difficulty text ('E'|'D'|'C'|'B'|'A'|'S')
type text ('story'|'bounty'|'repeatable'|'gathering'|'escort')
track text ('tech'|'design'|'content'|'business'|'impact')
xp_reward int
coin_reward int
status text ('draft'|'published'|'completed'|'expired')
```

#### mission_assignments
```sql
id uuid PK
mission_id uuid → guild_missions
user_id uuid → auth.users
guild_id uuid → guilds
status text ('in_progress'|'submitted'|'approved'|'rejected'|'abandoned'|'expired')
star_rating int (1-5)
task_progress jsonb
```

#### company_wallets
```sql
company_id uuid → auth.users (UNIQUE)
coin_balance int
total_deposited int
total_spent int
```

#### leaderboard_seasons + seasons
```sql
seasons: id, name, start_date, end_date, is_active
leaderboard_seasons: user_id, season_id, season_score, weekly_score
hall_of_fame: season_id, user_id, position, season_score
```

#### referrals (already exists)
```sql
id uuid PK
referrer_id uuid → profiles
referred_id uuid → profiles
status text ('pending'|'signed_up'|'streak_7'|'upgraded')
coins_awarded int
milestone_count int
created_at timestamptz
```

### New Tables (create via migration if task requires)

#### community_stats
```sql
CREATE TABLE community_stats (
  id int PRIMARY KEY DEFAULT 1,
  total_users int DEFAULT 0,
  redemptions_enabled boolean DEFAULT false,
  subscriber_count int DEFAULT 0
);
INSERT INTO community_stats DEFAULT VALUES;
```

#### feature_unlocks
```sql
CREATE TABLE feature_unlocks (
  threshold int PRIMARY KEY,
  feature_key text NOT NULL,
  label text NOT NULL,
  unlocked_at timestamptz
);
INSERT INTO feature_unlocks VALUES
  (100,  'quiz_generator',       'Advanced Quiz Generator', null),
  (250,  'challenge_board',      'Company Challenge Board',  null),
  (500,  'competitions',         'Guild Competitions',       null),
  (1000, 'gift_card_redemption', 'Gift Card Redemptions',    null),
  (2500, 'live_study_rooms',     'Live Study Rooms',         null),
  (5000, 'hiring_pipeline',      'Company Hiring Pipeline',  null);
```

#### referral_badges
```sql
CREATE TABLE referral_badges (
  user_id uuid REFERENCES profiles(id),
  badge_key text,
  earned_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, badge_key)
);
```

#### gift_card_requests
```sql
CREATE TABLE gift_card_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  coin_amount int NOT NULL,
  dollar_value numeric(10,2) NOT NULL,
  status text DEFAULT 'pending', -- pending | processing | fulfilled
  created_at timestamptz DEFAULT now()
);
```

### Supabase RPC Functions (already exist)
```sql
increment_coins(user_id uuid, amount int) RETURNS int
deduct_coins(p_user_id uuid, p_amount int, p_reason text) RETURNS void
```

---

## §6 AI ROUTER & MODELS

**File:** `src/services/aiRouter.js`

### Tier Map
```
TIER 1 — Free/Fast (Groq)
  model: meta-llama/llama-3.3-70b-instruct:free
  features: fast, flashcards, grammar, short_summary
  coin cost: 1

TIER 2 — Quality (OpenRouter → Claude Sonnet 4.5)
  model: anthropic/claude-sonnet-4-5
  features: lesson_plan, essay_feedback, quiz, document, notes, summarize
  coin cost: 3

TIER 2B — Briefs (OpenRouter → Claude Haiku)
  model: anthropic/claude-haiku-4-5
  features: brief_generation
  coin cost: 3

TIER 3 — Power (OpenRouter → Kimi K2.5)
  model: moonshotai/kimi-k2.5
  features: slides, visual, screenshot_to_code, deep_research
  coin cost: 8
```

### API Endpoints
```
Groq:       https://api.groq.com/openai/v1/chat/completions
OpenRouter: https://openrouter.ai/api/v1/chat/completions
            Headers: HTTP-Referer: https://visionary-arc.vercel.app
                     X-Title: Visionary Academy
```

---

## §7 SERVICES MAP

```
src/services/
├── supabaseClient.js   ← import { supabase } — ALL DB access goes here
├── coinService.js      ← awardCoins(), spendCoins() — ONLY way to change coins
├── xpService.js        ← awardActivityXP(), getRankFromXP(), checkRankUp()
├── referralService.js  ← trackReferral(), getReferralStats(), awardReferralMilestone()
├── usageService.js     ← canMakeCall(), getLimits(), getUsageToday()
├── aiRouter.js         ← callAI({ feature, prompt, userId }) — ONLY AI entry point
├── guildService.js     ← autoJoinAdventurersGuild(), guild queries
├── missionService.js   ← mission CRUD
├── leaderboardService.ts ← leaderboard queries
├── db.js               ← low-level awardXP(), awardCoins() wrappers
├── apiService.js       ← USE_REAL_API flag, REST API fallback layer
└── mockAdapter.js      ← DO NOT EDIT. Auto-loaded when USE_REAL_API=false
```

---

## §8 MOCK → REAL API

**Flag location:** `src/services/apiService.js` line 1
```js
const USE_REAL_API = true;  // ← already set to true
```

**Mock loads when:** `isUsingRealAPI()` returns false → `App.js` requires mockAdapter

**How to verify real API is active:**
- No `mock_token_demo` in localStorage after login
- Network tab shows real Supabase requests

**Always-real services (don't need flag):**
- coinService.js, xpService.js, referralService.js, usageService.js, aiRouter.js
- These call Supabase directly, never through mockAdapter

---

## §9 COMMUNITY UNLOCK SYSTEM

**Purpose:** Community-wide feature unlocks. Every student sees progress. Referrals accelerate it.

**Always-unlocked features:**
```
study_hub, ai_tutor, flashcards, notes_studio, dashboard, profile, shop
```

**Hook:** `src/hooks/useFeatureGate.js`
```js
useFeatureGate(featureKey) → { unlocked: bool, threshold: int, currentUsers: int, nextUnlock: obj }
```

**Overlay component:** `src/components/LockedFeatureOverlay.jsx`
- Renders ON TOP of page (don't unmount underlying component)
- Shows: anime lock icon, feature name, users needed, progress bar
- CTA: "Invite friends → /referral"
- Style: glassmorphism dark, gold border glow

**Pages to gate:**
```
Competitions.jsx        → 'competitions'       (unlocks at 500)
ChallengesPage.jsx      → 'challenge_board'    (unlocks at 250)
Shop.jsx gift cards     → 'gift_card_redemption'(unlocks at 1000)
```

**Community progress bar component:** `src/components/CommunityProgressBar.jsx`
- Show in Dashboard.jsx below stat cards
- Live user count + next 3 upcoming unlocks with thresholds
- Framer Motion fill animation on progress bar

---

## §10 REFERRAL SYSTEM

**File:** `src/services/referralService.js`
**Page:** `src/pages/ReferralPage.jsx`

**Referral code format:** `userId.slice(0,8).toUpperCase()`

**Milestone progression:**
```
signed_up → streak_7 → upgraded
```
(STATUS_ORDER in referralService prevents downgrade)

**New milestone rewards to add:**
```js
const REFERRAL_MILESTONES = [
  { count: 1,  coins: 50,   xp: 100,  frame: null,         badge: null      },
  { count: 5,  coins: 300,  xp: 500,  frame: 'anime_gold', badge: null      },
  { count: 10, coins: 500,  xp: 1000, frame: null,         toolUnlock: true },
  { count: 25, coins: 1000, xp: 2500, frame: 'pioneer_aura', badge: 'pioneer'},
];
```

**Avatar frames:** store in `referral_badges` table with badge_key = frame key

**ReferralPage.jsx must show:**
- Shareable link with copy button
- Current referral count (live from Supabase)
- Milestone progress bar 1→5→10→25
- Reward preview per milestone (coins, frames, badges)
- Gold/dark anime aesthetic, glassmorphism cards

---

## §11 GIFT CARD REDEMPTION

**Gating logic (check in order):**
1. `community_stats.redemptions_enabled = true`
2. `community_stats.subscriber_count >= 5`
3. `user.coins >= 5000`

**Conversion:** 1,000 coins = $1.00 | Min: 5,000 coins = $5

**Redemption flow:**
1. Check eligibility via `checkRedemptionEligibility(userId)`
2. Call `spendCoins(userId, amount, 'gift_card_redemption')`
3. Insert into `gift_card_requests` with status='pending'
4. Show: "Request submitted! Processing within 48 hours"
5. Tango Card API = FUTURE, do not implement now

**Shop.jsx gift card section states:**
- Locked (community < 1000): show LockedFeatureOverlay
- Unlocked but insufficient coins: show coins needed + how to earn more
- Eligible: show redemption form (1000-coin increment selector)

---

## §12 ENV VARS

**File:** `.env` (never commit, transfer manually)

```
REACT_APP_SUPABASE_URL=
REACT_APP_SUPABASE_ANON_KEY=
REACT_APP_OPENROUTER_API_KEY=
REACT_APP_GROQ_API_KEY=
REACT_APP_STRIPE_PUBLISHABLE_KEY=
REACT_APP_BACKEND_URL=http://localhost:8000
```

**Supabase client reads:**
```js
process.env.REACT_APP_SUPABASE_URL
process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY
```

**Warning:** If `ANTHROPIC_API_KEY` is set in your shell environment,
Claude Code will bill against your API instead of your Pro/Max subscription.
Run `claude logout && claude login` to reset to subscription billing.

## §13 ARTIFACT CHALLENGE SYSTEM

### XP Rewards
Patch:   100 XP | Finish: 250 XP | Rebuild: 600 XP | Reviewer bonus: +150 XP
Streak 3 days in a row: 2x XP multiplier

### Track → File Type Map
builder:  .py .js .html .sql
analyst:  .xlsx .csv .ipynb
creator:  .docx .md .txt
designer: .pdf .docx .md
founder:  .pptx .docx .xlsx

### Track → Accent Color
builder:  #3B82F6 | analyst: #10B981 | creator: #8B5CF6
designer: #EC4899 | founder: #F59E0B

### Artifact Generation Prompt (inject track/difficulty/filetype)
System: "You are generating a broken {filetype} artifact for a student challenge.
Track: {track}. Difficulty: {difficulty}.
Generate: (1) a realistic broken artifact as raw file content,
(2) a one-paragraph context brief explaining what it was supposed to be,
(3) a hidden rubric of exactly what's wrong (3-5 specific issues).
Calibrate errors to difficulty: Patch=1 obvious bug, Finish=partial work,
Rebuild=fundamentally flawed approach.
Return JSON: { artifact_content, context_brief, hidden_rubric, file_type }"

### Diff Review Prompt
System: "You reviewed the original broken artifact and the student's submission.
Compare them. Return JSON:
{ what_changed, what_still_off, what_they_missed,
  reviewer_bonus: bool (true if student caught something not in rubric),
  summary_two_sentences }"

### Supabase Storage
Bucket: 'artifact-submissions' (private, auth required)
Path pattern: {userId}/{challengeId}.{fileType}