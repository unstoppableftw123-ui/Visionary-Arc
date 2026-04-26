-- ─────────────────────────────────────────────────────────────────────────────
-- Track Hub: ensure projects + profiles tables have all required columns
-- Generated 2026-04-25 for src/pages/tracks and src/pages/projects pages
-- Paste into Supabase SQL Editor (Dashboard → SQL Editor → New query → Run)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. PROFILES — add missing student-profile columns ────────────────────────

alter table profiles
  add column if not exists grade  integer,
  add column if not exists school text;

-- ── 2. PROJECTS — core table (create if it doesn't exist yet) ────────────────
--    If the table already exists the CREATE TABLE ... IF NOT EXISTS is a no-op;
--    the ALTER TABLE blocks below then add any missing columns safely.

create table if not exists projects (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        references profiles(id) on delete cascade,
  track            text,
  difficulty       text,
  title            text,
  role             text,
  client_name      text,
  brief_json       jsonb,
  status           text        default 'active'
                   check (status in ('active','submitted','completed','abandoned')),
  submission_url   text,
  submission_notes text,
  xp_awarded       integer     default 0,
  coins_awarded    integer     default 0,
  submitted_at     timestamptz,
  completed_at     timestamptz,
  created_at       timestamptz default now()
);

-- ── 3. PROJECTS — add missing columns to existing table (idempotent) ─────────

alter table projects
  add column if not exists submission_notes text,
  add column if not exists xp_awarded       integer default 0,
  add column if not exists coins_awarded    integer default 0;

-- ── 4. PORTFOLIO_ENTRIES — core table (create if missing) ────────────────────

create table if not exists portfolio_entries (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        references profiles(id) on delete cascade,
  project_id     uuid        references projects(id) on delete set null,
  track          text,
  title          text,
  role           text,
  description    text,
  skills         text[],
  submission_url text,
  is_public      boolean     default true,
  created_at     timestamptz default now()
);

-- ── 5. ROW-LEVEL SECURITY ─────────────────────────────────────────────────────

alter table projects         enable row level security;
alter table portfolio_entries enable row level security;

-- Projects: users can read/write their own rows
drop policy if exists "own projects" on projects;
create policy "own projects" on projects
  for all using (auth.uid() = user_id);

-- Portfolio: public entries are readable by everyone; owners can write
drop policy if exists "read public portfolio" on portfolio_entries;
create policy "read public portfolio" on portfolio_entries
  for select using (is_public = true);

drop policy if exists "own portfolio entries" on portfolio_entries;
create policy "own portfolio entries" on portfolio_entries
  for all using (auth.uid() = user_id);

-- ── 6. HELPER RPCs (create if they don't exist) ──────────────────────────────

-- increment_xp: used by src/services/db.js → awardXP()
create or replace function increment_xp(p_user_id uuid, p_amount int)
returns int
language sql
security definer
as $$
  update profiles set xp = coalesce(xp, 0) + p_amount
  where id = p_user_id
  returning xp;
$$;

-- increment_coins: used by src/services/coinService.js → awardCoins()
create or replace function increment_coins(p_user_id uuid, p_amount int)
returns int
language sql
security definer
as $$
  update profiles set coins = coalesce(coins, 0) + p_amount
  where id = p_user_id
  returning coins;
$$;

-- ── 7. PERFORMANCE INDEXES ────────────────────────────────────────────────────

create index if not exists projects_user_id_status on projects(user_id, status);
create index if not exists projects_user_id_track  on projects(user_id, track);
create index if not exists portfolio_user_public    on portfolio_entries(user_id, is_public);
