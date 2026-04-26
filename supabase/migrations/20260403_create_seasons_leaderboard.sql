-- Seasons table
create table if not exists seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date timestamptz not null,
  end_date timestamptz not null,
  is_active boolean default false,
  created_at timestamptz default now()
);

-- Seed the first season (90 days from project launch)
insert into seasons (name, start_date, end_date, is_active)
values ('Season 1', now(), now() + interval '90 days', true);

-- Per-user per-season scores
create table if not exists leaderboard_seasons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  season_id uuid references seasons(id) on delete cascade,
  season_score integer default 0,
  weekly_score integer default 0,
  last_active timestamptz,
  unique (user_id, season_id)
);

alter table leaderboard_seasons enable row level security;
create policy "read leaderboard_seasons" on leaderboard_seasons for select using (true);
create policy "own leaderboard_seasons" on leaderboard_seasons for all using (auth.uid() = user_id);

create index if not exists idx_leaderboard_seasons_season_score on leaderboard_seasons(season_id, season_score desc);
create index if not exists idx_leaderboard_seasons_weekly_score on leaderboard_seasons(season_id, weekly_score desc);

-- Weekly reset log
create table if not exists resets_log (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id),
  reset_type text not null, -- 'weekly' | 'season_end'
  users_affected integer default 0,
  decayed_count integer default 0,
  executed_at timestamptz default now()
);

-- Hall of fame (top 10 per season end)
create table if not exists hall_of_fame (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id),
  user_id uuid references auth.users(id),
  position int,
  season_score int,
  rank_achieved text,
  captured_at timestamptz default now()
);

alter table hall_of_fame enable row level security;
create policy "read hall_of_fame" on hall_of_fame for select using (true);

-- Add badges column to profiles if not present
alter table profiles add column if not exists badges jsonb default '[]'::jsonb;
