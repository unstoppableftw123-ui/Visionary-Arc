-- Guild system schema
-- Note: this app already uses `missions` and `tasks`, so the new RPG/guild
-- mission tables are namespaced as `guild_missions` and `mission_tasks`.

create extension if not exists pgcrypto;

-- GUILDS
create table if not exists guilds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  type text not null check (type in ('adventurer', 'company')),
  company_id uuid references auth.users(id),
  tier text check (tier in ('basic', 'elite')),
  max_members int default 50,
  banner_url text,
  color_theme text default '#EAB308',
  entry_min_rank text default 'C',
  entry_min_stars numeric default 0,
  entry_track text,
  coin_budget int default 0,
  is_featured boolean default false,
  featured_until timestamptz,
  created_at timestamptz default now()
);

-- GUILD MEMBERS
create table if not exists guild_members (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid references guilds(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  status text default 'pending' check (status in ('pending', 'active', 'rejected', 'banned')),
  joined_at timestamptz default now(),
  unique(guild_id, user_id)
);

-- GUILD MISSIONS
create table if not exists guild_missions (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid references guilds(id) on delete cascade,
  title text not null,
  description text not null,
  difficulty text not null check (difficulty in ('E','D','C','B','A','S')),
  type text not null check (type in ('story','bounty','repeatable','gathering','escort')),
  track text not null check (track in ('tech','design','content','business','impact')),
  status text default 'draft' check (status in ('draft','published','completed','expired')),
  xp_reward int not null,
  coin_reward int not null,
  min_rank_required text default 'E',
  max_claims int default 1,
  is_repeatable boolean default false,
  repeat_cooldown_hours int default 168,
  expiry_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- MISSION TASKS (sub-objectives inside a guild mission)
create table if not exists mission_tasks (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid references guild_missions(id) on delete cascade,
  title text not null,
  description text,
  order_index int default 0,
  is_optional boolean default false,
  completion_condition text default 'manual' check (completion_condition in ('manual','auto_trigger','item_turn_in')),
  target_count int default 1,
  created_at timestamptz default now()
);

-- MISSION ASSIGNMENTS (the contract between student and mission)
create table if not exists mission_assignments (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid references guild_missions(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  guild_id uuid references guilds(id),
  status text default 'in_progress' check (status in ('in_progress','submitted','approved','rejected','abandoned','expired')),
  submission_url text,
  submission_note text,
  star_rating int check (star_rating between 1 and 5),
  reviewer_feedback text,
  task_progress jsonb default '[]'::jsonb,
  claimed_at timestamptz default now(),
  submitted_at timestamptz,
  completed_at timestamptz,
  deadline timestamptz,
  unique(mission_id, user_id)
);

-- SEASONS
create table if not exists seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date timestamptz not null,
  end_date timestamptz not null,
  is_active boolean default false,
  created_at timestamptz default now()
);

-- LEADERBOARD SEASONS (competitive scores per season, separate from total XP)
create table if not exists leaderboard_seasons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  season_id uuid references seasons(id) on delete cascade,
  weekly_score int default 0,
  season_score int default 0,
  rank_achieved text,
  last_active timestamptz default now(),
  unique(user_id, season_id)
);

-- COMPANY WALLETS (escrow system)
create table if not exists company_wallets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references auth.users(id) on delete cascade unique,
  coin_balance int default 0,
  total_deposited int default 0,
  total_spent int default 0,
  updated_at timestamptz default now()
);

-- WALLET TRANSACTIONS (audit log)
create table if not exists wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  from_id uuid,
  to_id uuid,
  amount int not null,
  type text check (type in ('deposit','reward','platform_cut','refund','top_up','redemption')),
  mission_assignment_id uuid references mission_assignments(id),
  note text,
  created_at timestamptz default now()
);

-- SCOUTING LOG
create table if not exists scout_views (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references auth.users(id),
  student_id uuid references auth.users(id),
  viewed_at timestamptz default now()
);

-- RLS: enable on all tables
alter table guilds enable row level security;
alter table guild_members enable row level security;
alter table guild_missions enable row level security;
alter table mission_tasks enable row level security;
alter table mission_assignments enable row level security;
alter table seasons enable row level security;
alter table leaderboard_seasons enable row level security;
alter table company_wallets enable row level security;
alter table wallet_transactions enable row level security;
alter table scout_views enable row level security;

-- Seed: create the Adventurer's Guild
insert into guilds (name, slug, description, type, max_members, color_theme)
values (
  'Adventurer''s Guild',
  'adventurers-guild',
  'The home of every adventurer. Complete missions. Rank up. Get discovered.',
  'adventurer',
  999999,
  '#EAB308'
)
on conflict (slug) do nothing;

-- Seed: create first active season
insert into seasons (name, start_date, end_date, is_active)
select
  'Season 1: The Beginning',
  now(),
  now() + interval '90 days',
  true
where not exists (
  select 1
  from seasons
  where name = 'Season 1: The Beginning'
);
