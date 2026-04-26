-- ── TASK 1a: Community Unlock System ────────────────────────────────────────

-- Community stats singleton (id always = 1)
create table if not exists community_stats (
  id int primary key default 1,
  total_users int default 0,
  redemptions_enabled boolean default false,
  subscriber_count int default 0
);
insert into community_stats (id) values (1) on conflict (id) do nothing;

-- Feature unlocks gated by member count
create table if not exists feature_unlocks (
  threshold int primary key,
  feature_key text not null,
  label text not null,
  unlocked_at timestamptz
);

insert into feature_unlocks (threshold, feature_key, label, unlocked_at) values
  (100,  'quiz_generator',       'Advanced Quiz Generator', null),
  (250,  'challenge_board',      'Company Challenge Board',  null),
  (500,  'competitions',         'Guild Competitions',       null),
  (1000, 'gift_card_redemption', 'Gift Card Redemptions',    null),
  (2500, 'live_study_rooms',     'Live Study Rooms',         null),
  (5000, 'hiring_pipeline',      'Company Hiring Pipeline',  null)
on conflict (threshold) do nothing;

-- RPC: atomically increment total_users and return new count
create or replace function increment_community_users()
returns int language sql as $$
  update community_stats
  set total_users = total_users + 1
  where id = 1
  returning total_users;
$$;

-- ── TASK 2a: Referral Badges + milestone_count ───────────────────────────────

alter table referrals add column if not exists milestone_count int default 0;

create table if not exists referral_badges (
  user_id uuid references profiles(id),
  badge_key text,
  earned_at timestamptz default now(),
  primary key (user_id, badge_key)
);

-- ── TASK 4a: Gift Card Requests ──────────────────────────────────────────────

create table if not exists gift_card_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  coin_amount int not null,
  dollar_value numeric(10, 2) not null,
  status text default 'pending' check (status in ('pending', 'processing', 'fulfilled')),
  created_at timestamptz default now()
);
alter table gift_card_requests enable row level security;
create policy "own requests" on gift_card_requests
  for all using (auth.uid() = user_id);
