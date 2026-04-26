-- Visionary Arc — Database Schema
-- Last updated: 2026-04-03
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Tables: profiles, streaks, study_sessions, missions, transactions,
--         projects, portfolio_entries, challenges, referrals, friends,
--         ai_usage_log, onboarding_state, xp_events, shop_items, user_purchases
-- Views: leaderboard_weekly

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. EXTENSIONS
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. TABLES (dependency order — no forward references)
-- ─────────────────────────────────────────────────────────────────────────────

-- profiles (extends auth.users)
create table profiles (
  id                   uuid references auth.users(id) primary key,
  email                text,
  name                 text,
  avatar               text,
  school               text,
  grade                integer,
  xp                   integer default 0,
  level                integer default 1,
  coins                integer default 100,
  streak               integer default 0,
  max_streak           integer default 0,
  last_activity_date   date,
  status_tier          text default 'Beginner'
    check (status_tier in ('Beginner','Builder','Creator','Pro','Elite')),
  founder_tier         text
    check (founder_tier in ('seed','bronze','silver','gold')),
  is_premium           boolean default false,
  onboarded            boolean default false,
  track_primary        text,
  referral_code        text unique,
  referred_by          uuid references profiles(id),
  daily_coin_allowance integer default 50,
  created_at           timestamptz default now()
);
alter table profiles enable row level security;
create policy "own profile" on profiles for all using (auth.uid() = id);

-- streaks
create table streaks (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid references profiles(id),
  current_streak     integer default 0,
  max_streak         integer default 0,
  last_activity_date date,
  freeze_count       integer default 0,
  created_at         timestamptz default now()
);
alter table streaks enable row level security;
create policy "own streaks" on streaks for all using (auth.uid() = user_id);

-- study_sessions (XP activity log)
create table study_sessions (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references profiles(id),
  activity_type    text, -- 'flashcards','quiz','summary','notes','whiteboard','practice'
  subject          text,
  xp_earned        integer default 0,
  coins_earned     integer default 0,
  duration_seconds integer,
  created_at       timestamptz default now()
);
alter table study_sessions enable row level security;
create policy "own sessions" on study_sessions for all using (auth.uid() = user_id);

-- missions (daily/weekly missions per user)
create table missions (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references profiles(id),
  type         text, -- 'daily','weekly'
  title        text,
  description  text,
  xp_reward    integer,
  coins_reward integer,
  progress     integer default 0,
  target       integer,
  completed        boolean default false,
  claimed          boolean default false,
  date             date default current_date,
  submission_url   text,
  submission_notes text,
  created_at       timestamptz default now()
);
alter table missions enable row level security;
create policy "own missions" on missions for all using (auth.uid() = user_id);

-- transactions (coin ledger — append-only)
create table transactions (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references profiles(id),
  amount        integer, -- positive = credit, negative = debit
  reason        text,
  balance_after integer,
  created_at    timestamptz default now()
);
alter table transactions enable row level security;
create policy "own transactions" on transactions for all using (auth.uid() = user_id);

-- projects (brief + submission)
create table projects (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid references profiles(id),
  track             text,
  difficulty        text,
  track_difficulty  text, -- e.g. 'Starter','Standard','Advanced','Expert'
  title             text,
  role              text,
  client_name       text,
  brief_json        jsonb, -- full brief object from AI
  status            text default 'active'
    check (status in ('active','submitted','completed','abandoned')),
  submission_url    text,
  submission_notes  text,
  xp_awarded        integer default 0,
  coins_awarded     integer default 0,
  is_public         boolean default false,
  cover_image_url   text,
  submitted_at      timestamptz,
  completed_at      timestamptz,
  created_at        timestamptz default now()
);
alter table projects enable row level security;
create policy "own projects" on projects for all using (auth.uid() = user_id);

-- portfolio_entries (public)
create table portfolio_entries (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references profiles(id),
  project_id      uuid references projects(id),
  track           text,
  title           text,
  role            text,
  description     text,
  skills          text[],
  submission_url  text,
  cover_image_url text,
  likes           integer default 0,
  views           integer default 0,
  featured        boolean default false,
  is_public       boolean default true,
  created_at      timestamptz default now()
);
alter table portfolio_entries enable row level security;
create policy "read public" on portfolio_entries for select using (is_public = true);
create policy "own entries" on portfolio_entries for all using (auth.uid() = user_id);

-- challenges (company-sponsored)
create table challenges (
  id                   uuid primary key default uuid_generate_v4(),
  sponsor_name         text,
  sponsor_logo_url     text,
  title                text,
  description          text,
  track                text,
  reward_type          text,
  reward_value         text,
  max_slots            integer,
  current_slots        integer default 0,
  required_tier        text default 'Beginner',
  required_status_tier text default 'Beginner'
    check (required_status_tier in ('Beginner','Builder','Creator','Pro','Elite')),
  brief_template       jsonb,
  status               text default 'open',
  deadline             timestamptz,
  created_at           timestamptz default now()
);
alter table challenges enable row level security;
create policy "read all challenges" on challenges for select using (status = 'open');

-- referrals
create table referrals (
  id           uuid primary key default uuid_generate_v4(),
  referrer_id  uuid references profiles(id),
  referred_id  uuid references profiles(id),
  status       text default 'pending', -- 'pending','signed_up','streak_7','upgraded'
  coins_awarded integer default 0,
  created_at   timestamptz default now()
);
alter table referrals enable row level security;
create policy "own referrals" on referrals for all using (auth.uid() = referrer_id);

-- friends
create table friends (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid references profiles(id),
  friend_id         uuid references profiles(id),
  initiated_by      uuid references profiles(id),
  status            text default 'pending', -- 'pending','accepted'
  friend_streak     integer default 0,
  last_both_active  date,
  created_at        timestamptz default now()
);
alter table friends enable row level security;
create policy "own friends" on friends
  for all using (auth.uid() = user_id or auth.uid() = friend_id);

-- ai_usage_log (cost tracking)
create table ai_usage_log (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references profiles(id),
  feature         text,
  model           text,
  tokens_used     integer,
  coins_deducted  integer,
  created_at      timestamptz default now()
);
alter table ai_usage_log enable row level security;
create policy "own usage" on ai_usage_log for all using (auth.uid() = user_id);

-- onboarding_state (3-step first-run flow)
create table onboarding_state (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references profiles(id) unique,
  step_completed   integer default 0, -- 0,1,2,3 (3 = done)
  track_selected   text,
  goal_selected    text,
  avatar_selected  text,
  completed_at     timestamptz,
  created_at       timestamptz default now()
);
alter table onboarding_state enable row level security;
create policy "own onboarding" on onboarding_state
  for all using (auth.uid() = user_id);

-- xp_events (granular XP ledger — mirrors transactions for coins)
create table xp_events (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references profiles(id),
  event_type       text, -- matches XP earning table in Section 5
  xp_amount        integer,
  xp_balance_after integer,
  reference_id     uuid, -- optional: session/project/mission id
  created_at       timestamptz default now()
);
alter table xp_events enable row level security;
create policy "own xp" on xp_events for all using (auth.uid() = user_id);

-- shop_items
create table shop_items (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  description   text,
  category      text
    check (category in ('avatar','theme','freeze','boost','badge')),
  coin_cost     integer not null,
  xp_cost       integer default 0,
  required_tier text default 'Beginner',
  is_active     boolean default true,
  image_url     text,
  created_at    timestamptz default now()
);
alter table shop_items enable row level security;
create policy "read active shop items" on shop_items
  for select using (is_active = true);

-- user_purchases
create table user_purchases (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references profiles(id),
  item_id     uuid references shop_items(id),
  coins_spent integer,
  created_at  timestamptz default now()
);
alter table user_purchases enable row level security;
create policy "own purchases" on user_purchases
  for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

create index on study_sessions(user_id, created_at);
create index on transactions(user_id, created_at);
create index on missions(user_id, date);
create index on projects(user_id, status);
create index on portfolio_entries(user_id, is_public);
create index on xp_events(user_id, created_at);
create index on user_purchases(user_id);
create index on onboarding_state(user_id);
create index on friends(user_id, status);
create index on friends(friend_id, status);
create index on referrals(referrer_id);
create index on referrals(referred_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. MATERIALIZED VIEWS + REFRESH FUNCTION
-- ─────────────────────────────────────────────────────────────────────────────

create materialized view leaderboard_weekly as
select
  id, name, avatar, school, xp, level, streak, status_tier,
  rank() over (order by xp desc) as rank
from profiles
order by xp desc
limit 100;

create or replace function refresh_leaderboard()
returns void language plpgsql as $$
begin
  refresh materialized view leaderboard_weekly;
end;
$$;

-- Schedule via pg_cron (run this separately in Supabase SQL editor):
-- select cron.schedule('refresh-leaderboard', '0 * * * *', 'select refresh_leaderboard()');

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. SEED DATA — shop_items
-- ─────────────────────────────────────────────────────────────────────────────

insert into shop_items (name, description, category, coin_cost, xp_cost, required_tier, is_active)
values
  ('Streak Freeze',         'Protect your streak for 1 day',                  'freeze', 50,  0, 'Beginner', true),
  ('XP Boost (2×, 1hr)',    'Double XP earned for 1 hour',                    'boost',  100, 0, 'Beginner', true),
  ('Dark Mode Avatar Frame','Sleek dark frame for your profile',               'avatar', 200, 0, 'Builder',  true),
  ('Neon Theme Pack',       'Unlocks neon color scheme across the app',        'theme',  350, 0, 'Creator',  true),
  ('Elite Badge',           'Exclusive badge displayed on your portfolio',     'badge',  500, 0, 'Pro',      true);
