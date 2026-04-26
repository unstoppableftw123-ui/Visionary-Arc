# XP QA Report

Date: 2026-04-25

## Summary

This audit checked every XP-earning action listed in `CLAUDE.md` section 4 and the full XP table against live service wiring in the app. The missing reward paths found during the audit were added.

## Verified Reward Wiring

| Action | Reward path | Status |
|---|---|---|
| Daily login | [src/App.js](/Users/Swiss/Downloads/Visionary-arc-Copy-main%202/src/App.js:155) -> `awardActivityXP(userId, 'login')` | Wired |
| Flashcard session | [src/components/study-hub/anthropicClient.js](/Users/Swiss/Downloads/Visionary-arc-Copy-main%202/src/components/study-hub/anthropicClient.js:114), [src/components/ai-tools/hooks/useAITool.js](/Users/Swiss/Downloads/Visionary-arc-Copy-main%202/src/components/ai-tools/hooks/useAITool.js:527) -> `awardActivityXP(..., 'flashcards')` | Wired |
| Quiz | [src/components/study-hub/anthropicClient.js](/Users/Swiss/Downloads/Visionary-arc-Copy-main%202/src/components/study-hub/anthropicClient.js:114), [src/components/ai-tools/hooks/useAITool.js](/Users/Swiss/Downloads/Visionary-arc-Copy-main%202/src/components/ai-tools/hooks/useAITool.js:527) -> `awardActivityXP(..., 'quiz')` | Wired |
| Summary | [src/components/study-hub/anthropicClient.js](/Users/Swiss/Downloads/Visionary-arc-Copy-main%202/src/components/study-hub/anthropicClient.js:114), [src/components/ai-tools/hooks/useAITool.js](/Users/Swiss/Downloads/Visionary-arc-Copy-main%202/src/components/ai-tools/hooks/useAITool.js:527) -> `awardActivityXP(..., 'summary')` | Wired |
| Notes saved | [src/pages/NotesStudio.jsx](/Users/Swiss/Downloads/Visionary-arc-Copy-main%202/src/pages/NotesStudio.jsx:165) -> `awardActivityXP(..., 'notes')` | Added |
| Whiteboard saved | [src/pages/NotesStudio.jsx](/Users/Swiss/Downloads/Visionary-arc-Copy-main%202/src/pages/NotesStudio.jsx:165) -> `awardActivityXP(..., 'whiteboard')` when canvas data exists | Added |
| Vocab drill | [src/pages/Competitions.jsx](/Users/Swiss/Downloads/Visionary-arc-Copy-main%202/src/pages/Competitions.jsx:309) -> `awardActivityXP(..., 'vocab')` on Vocab Jam completion | Added |
| Practice / SAT-ACT | [src/pages/PracticePage.jsx](/Users/Swiss/Downloads/Visionary-arc-Copy-main%202/src/pages/PracticePage.jsx:484), [src/pages/SATACTPractice.jsx](/Users/Swiss/Downloads/Visionary-arc-Copy-main%202/src/pages/SATACTPractice.jsx:149) -> `awardActivityXP(..., 'practice')` | Added |
| Daily mission completed | [src/services/missionService.js](/Users/Swiss/Downloads/Visionary-arc-Copy-main%202/src/services/missionService.js:288) -> `awardBonusXP()` plus `awardCoins()` | Wired |
| 7-day streak | [src/services/xpService.js](/Users/Swiss/Downloads/Visionary-arc-Copy-main%202/src/services/xpService.js:413) -> `awardXP()` plus `awardCoins()` | Wired |
| 30-day streak | [src/services/xpService.js](/Users/Swiss/Downloads/Visionary-arc-Copy-main%202/src/services/xpService.js:417) -> `awardXP()` plus `awardCoins()` | Wired |
| Generate project brief | [src/services/briefService.js](/Users/Swiss/Downloads/Visionary-arc-Copy-main%202/src/services/briefService.js:162) -> `awardCustomReward()` | Added |
| Project submission: Starter / Standard / Advanced / Expert | [src/pages/projects/ProjectPage.jsx](/Users/Swiss/Downloads/Visionary-arc-Copy-main%202/src/pages/projects/ProjectPage.jsx:121) -> `awardProjectSubmissionXP()` plus `awardCoins()` | Wired |
| Referral: sign up | [src/services/referralService.js](/Users/Swiss/Downloads/Visionary-arc-Copy-main%202/src/services/referralService.js:161) -> `awardCoins()` plus `awardXP()` | Wired |
| Referral: 7-day streak | [src/services/referralService.js](/Users/Swiss/Downloads/Visionary-arc-Copy-main%202/src/services/referralService.js:211) -> `awardCoins()` plus `awardXP()` | Wired |
| Referral: paid upgrade | [src/services/referralService.js](/Users/Swiss/Downloads/Visionary-arc-Copy-main%202/src/services/referralService.js:211) -> `awardCoins()` plus `awardXP()` | Wired |
| Friend streak | [src/services/xpService.js](/Users/Swiss/Downloads/Visionary-arc-Copy-main%202/src/services/xpService.js:347) -> `awardXP()` plus `awardCoins()` for both users | Wired |
| Portfolio entry published | [src/services/db.js](/Users/Swiss/Downloads/Visionary-arc-Copy-main%202/src/services/db.js:345), [src/services/guildService.js](/Users/Swiss/Downloads/Visionary-arc-Copy-main%202/src/services/guildService.js:292) -> `awardCustomReward()` | Added |

## Coin RPC Audit

`increment_coins` exists in [supabase/migrations/20260425_track_hub_projects_profiles.sql](/Users/Swiss/Downloads/Visionary-arc-Copy-main%202/supabase/migrations/20260425_track_hub_projects_profiles.sql:93).

`deduct_coins` exists in [supabase/migrations/20260403_create_deduct_coins_function.sql](/Users/Swiss/Downloads/Visionary-arc-Copy-main%202/supabase/migrations/20260403_create_deduct_coins_function.sql:1).

No new migration was needed for coin RPC coverage.

The client-side deduction flow now verifies this sequence:

1. `coinService.spendCoins()` reads the current balance from `profiles`.
2. It calls `deduct_coins(p_user_id, p_amount, p_reason)`.
3. The RPC writes the negative ledger row to `coins_transactions`.
4. The client refreshes and returns the new balance.

## Fixes Made During QA

- `coinService.awardCoins()` now calls `increment_coins(p_user_id, p_amount)` with the correct RPC parameter names and logs to `coins_transactions`.
- `coinService.getTransactions()` now reads from `coins_transactions`.
- `usageService` now reads `coins` and `founder_tier` from `profiles`, matching the schema.
- `aiRouter` now reads from `profiles` and uses `spendCoins()` instead of mutating balances directly.
- Added `awardCustomReward()` in [src/services/xpService.js](/Users/Swiss/Downloads/Visionary-arc-Copy-main%202/src/services/xpService.js:182) for non-table rewards such as brief generation and portfolio publishing.

## Remaining Notes

- The app still has broader `users` table reads outside this audit scope, especially in auth/profile flows. The reward services fixed here are now aligned to `profiles`, but the rest of the app should be normalized onto one user table.
- The brief reward weekly limit is enforced client-side with `localStorage`, which matches the existing reward-limit pattern in `xpService`, but it is not server-enforced.
- The vocab reward is now wired through Vocab Jam completion because that is the only live vocab gameplay surface in this repo.
