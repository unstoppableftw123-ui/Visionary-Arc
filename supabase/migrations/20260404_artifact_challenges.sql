-- ─────────────────────────────────────────────────────────────────────────────
-- Artifact Challenge System
-- §13 of CLAUDE.md: Patch / Finish / Rebuild broken-file challenges
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS artifact_challenges (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid        REFERENCES profiles(id) ON DELETE CASCADE,
  track                 text        NOT NULL
    CHECK (track IN ('builder','analyst','creator','designer','founder')),
  difficulty            text        NOT NULL
    CHECK (difficulty IN ('patch','finish','rebuild')),
  context_brief         text        NOT NULL,   -- one-para brief shown to student
  hidden_rubric         text        NOT NULL,   -- revealed after submission
  file_type             text        NOT NULL,   -- e.g. 'py','xlsx','docx'
  artifact_content      text,                  -- generated broken file content (needed for diff review)
  artifact_prompt       text        NOT NULL,   -- the system prompt used to generate it
  status                text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','submitted','reviewed')),
  xp_awarded            int         NOT NULL DEFAULT 0,
  reviewer_bonus_awarded boolean    NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE artifact_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "artifact_challenges_own"
  ON artifact_challenges
  FOR ALL
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS artifact_submissions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id    uuid        REFERENCES artifact_challenges(id) ON DELETE CASCADE,
  user_id         uuid        REFERENCES profiles(id),
  file_url        text,                    -- Supabase Storage path
  diff_review     text,                    -- raw JSON from Claude's diff analysis
  what_changed    text,
  what_still_off  text,
  what_they_missed text,
  reviewer_bonus  boolean     NOT NULL DEFAULT false,
  submitted_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE artifact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "artifact_submissions_own"
  ON artifact_submissions
  FOR ALL
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Extend portfolio_entries with artifact challenge columns
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE portfolio_entries
  ADD COLUMN IF NOT EXISTS challenge_id  uuid REFERENCES artifact_challenges(id),
  ADD COLUMN IF NOT EXISTS diff_summary  text,
  ADD COLUMN IF NOT EXISTS file_type     text;

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS artifact_challenges_user_created
  ON artifact_challenges(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS artifact_submissions_challenge
  ON artifact_submissions(challenge_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Supabase Storage bucket (run this separately in the Supabase Dashboard
-- or via the Storage API — SQL cannot create storage buckets):
--
--   Bucket name : artifact-submissions
--   Public      : false  (auth required)
--   File size   : 10 MB max
-- ─────────────────────────────────────────────────────────────────────────────
