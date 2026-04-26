-- Phase 2: extend portfolio_entries for mission-based submissions

-- Add mission-specific columns to existing portfolio_entries table
alter table portfolio_entries
  add column if not exists assignment_id  uuid references mission_assignments(id) on delete set null,
  add column if not exists difficulty     text,
  add column if not exists guild_id       uuid references guilds(id) on delete set null,
  add column if not exists guild_name     text,
  add column if not exists star_rating    int check (star_rating between 1 and 5),
  add column if not exists is_featured    boolean default false,
  add column if not exists completed_at   timestamptz;

-- Index for fast public portfolio queries
create index if not exists portfolio_entries_assignment_id on portfolio_entries(assignment_id);

-- Allow up to 3 featured entries per user (enforced in app layer)
-- No DB-level partial unique — app enforces max 3 featured

-- RLS: users can update their own entries (for featured toggle)
drop policy if exists "own entries update" on portfolio_entries;
create policy "own entries update" on portfolio_entries
  for update using (auth.uid() = user_id);
