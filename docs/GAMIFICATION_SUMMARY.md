# Visionary Academy — Gamification System: Complete Summary

This document is the single reference for **XP (Experience)**, **Levels**, and **Coins** in the app: how they work, how users earn and spend them, and what free vs paid users get.

---

## 1. Overview

| Concept | Purpose |
|--------|--------|
| **XP** | Progress currency; determines level and shows activity. |
| **Level** | Derived from total XP; shown on Dashboard, Profile, Competitions. |
| **Coins** | Spendable currency for Store items and extra AI calls. |

- **Students and teachers** share the same system: same `user.xp`, `user.level`, `user.coins`. There is no separate “teacher XP” or “teacher coins.”
- Stats are loaded via **Gamification API** (`/api/gamification/stats` or mock from `user`). Dashboard, Sidebar, Profile, Store, and Competitions all read from this.

---

## 2. XP (Experience Points)

### 2.1 Where XP Appears

- **Dashboard:** “XP & Level” card (level, progress bar, total XP).
- **Sidebar:** Optional display of user level/XP.
- **Profile:** Total XP.
- **Competitions:** Per-game XP and in-session level (separate curve; see below).
- **Practice:** Per-question XP shown in-session (e.g. “XP Earned”).

### 2.2 How Users Earn XP (All Free + Paid)

| Source | Who | How | XP Amount | Persisted to Profile? |
|--------|-----|-----|-----------|------------------------|
| **Missions** | All | Complete daily/weekly missions, then **Claim** | See Mission table below | Yes (when backend applies it) |
| **Competitions — Vocab Jam** | All | Correct answer; finish game | 10 base + speed bonus (≤5) + streak bonus (5 per streak); +25 completion | Session only in mock |
| **Competitions — Knowledge Blitz** | All | Win the game | 50 XP per win | Session only in mock |
| **Competitions — Accuracy Duel** | All | Win the duel | 50 XP per win | Session only in mock |
| **Practice** | Students | Correct answer per question | 10–20 XP per question (varies) | Session only (no API in mock) |
| **Competition submit** | All | Submit to a competition | Mock returns e.g. 50–250 `xp_earned` | Not applied in frontend |
| **Study Hub / Assignments** | Students | Complete assignments | Mock has `xpEarned` in results | Backend would apply |
| **Founder / Premium** | Paid | One-time or subscription | e.g. 500 XP on premium subscribe (toast) | Backend would apply |

### 2.3 Level and Level-Up (Main App)

- **Stored:** `user.level` and `user.xp` (from backend or mock).
- **Formula (Dashboard/Profile):**  
  - XP needed for **current level** (already earned): sum of previous thresholds.  
  - XP needed for **next level**: `xp_for_next_level = 100 + (level - 1) * 50`.  
  - So: Level 1→2 = 100 XP, 2→3 = 150 more, 3→4 = 200 more, etc.
- **Progress bar:** `xp_in_level / xp_for_next_level` (capped at 100%).
- When total XP crosses the next threshold, the user **levels up** (level increases by 1).

### 2.4 Level in Competitions (Separate Curve)

- **Used only in:** Competitions lobby and in-game (session state).
- **Thresholds:**  
  `[0, 500, 1250, 2500, 5000, 8500, 13000, 18500, 25000, 33000]` total XP → Levels 1–10.
- This is **not** the same as the main app level; it’s for Competitions UI/animations only. If you want one source of truth, the backend should own XP and level and Competitions should use that.

---

## 3. Coins

### 3.1 Where Coins Appear

- **Dashboard:** “XP & Level” card (coin count).
- **Sidebar:** Coin balance.
- **Profile:** Coins.
- **Store / Shop:** Balance and item prices.
- **Settings:** “Use Coins” for extra AI calls (rate: 50 coins = 5 extra calls).
- **Competitions:** In-session coin rewards.

### 3.2 How Users Earn Coins

| Source | Who | How | Coins | Persisted? |
|--------|-----|-----|-------|------------|
| **New account** | All | Sign up (mock) | 100 | Yes |
| **Missions** | All | Complete + claim daily/weekly | See Mission table | Yes (when backend applies) |
| **Competitions — Vocab Jam** | All | Per correct; game completion | 1 per correct; 5 completion | Session only in mock |
| **Competitions — Blitz / Duel** | All | Win | 15 per win | Session only in mock |
| **Competition submit** | All | Submit to competition | Mock returns e.g. 10–60 | Backend would apply |
| **Study Hub** | Students | Assignment completion | Mock has coins in results | Backend would apply |
| **Founder tiers** | Paid | One-time on launch | 100 / 500 / 2,000 / 10,000 by tier | Backend |
| **Premium subscribe** | Paid | Subscribe to premium | e.g. 500 (toast in Store) | Backend |

### 3.3 How Users Spend Coins

| Use | Rate / Cost | Implemented? |
|-----|-------------|--------------|
| **Store / Shop items** | Per-item price (e.g. 50, 499 coins) | Yes in mock: `dataService.purchaseItem()` deducts from `user.coins`. |
| **Extra AI calls (Settings)** | 50 coins = 5 extra calls | UI only; no deduction or API in mock. |

---

## 4. Missions (Daily & Weekly)

Missions are the main **structured** way to earn both XP and coins for free.

| Mission | Type | XP | Coins |
|---------|------|----|-------|
| Complete 3 tasks | Daily | 50 | 10 |
| Study for 30 minutes | Daily | 75 | 15 |
| Check in to all tasks | Daily | 100 | 20 |
| Complete 20 tasks this week | Weekly | 200 | 50 |

- User must **complete** the mission, then **Claim** to receive rewards.
- **Per day (all 3 dailies):** 225 XP, 45 coins.  
- **Per week (3 dailies × 7 + 1 weekly):** 1,775 XP, 365 coins.  
- No daily cap in code; repeatable every day/week.

---

## 5. Free Users: What They Get (No Payment)

### 5.1 Starting Balance (New Free Account)

- **XP:** 0  
- **Coins:** 100  
- **Level:** 1  

*(From auth mock: `xp: 0, coins: 100, level: 1`.)*

### 5.2 Earning Potential (No Cap in Code)

| Source | XP | Coins |
|--------|----|-------|
| **Missions (max per day)** | 225 | 45 |
| **Missions (max per week)** | 1,775 | 365 |
| **Vocab Jam** | 10+ per correct, +25 finish; bonuses possible | 1 per correct, +5 finish |
| **Knowledge Blitz / Accuracy Duel (win)** | 50 per win | 15 per win |
| **Practice (per correct)** | 10–20 | 0 |

So **without paying**, a free user can earn **unlimited** XP and coins from missions (225 XP / 45 coins per day from dailies alone), plus whatever they get from Competitions and Practice once the backend persists it.

---

## 6. Founder Tiers (Paid) — Coins on Launch

| Tier | Coins on launch |
|------|------------------|
| Seed | 100 |
| Bronze | 500 |
| Silver | 2,000 |
| Gold | 10,000 |

Other perks (games per week, skins, battle passes, etc.) are defined in `src/lib/founder.js`.

---

## 7. Persistence and Mock vs Backend

| What | Mock behavior | With real backend |
|------|----------------|-------------------|
| **user.xp, user.level, user.coins** | Read from `dataService.getCurrentUser()` / localStorage. | From `/api/gamification/stats` or `/auth/me`. |
| **Mission claim** | Returns `{ xp, coins }`; does not update user. | Should add XP/coins to user and return new totals. |
| **Competitions (addXP / addCoins)** | Session state only; not written to user. | Backend should receive game result and update user. |
| **Practice XP** | Shown in-session only; not sent anywhere. | Backend would receive session summary and grant XP. |
| **Shop purchase** | `dataService.purchaseItem()` deducts coins via `updateUser`. | Backend would deduct coins and record purchase. |
| **Settings “Buy with Coins” (AI calls)** | Toast only; no deduction. | Backend would deduct coins and add extra calls. |

---

## 8. Code Locations (Quick Reference)

| Concern | File(s) |
|--------|--------|
| Gamification stats (main app) | `src/services/apiService.js` → `gamificationAPI.getStats()` |
| Level formula (Dashboard) | `apiService.js` (xpForNext = 100 + (level-1)*50) |
| Missions list & claim | `apiService.js` → `missionsAPI` |
| Competitions XP/coins (session) | `src/components/competitions/useGameXP.js`, VocabJamGame, KnowledgeBlitzGame, AccuracyDuelGame |
| Competitions level curve | `useGameXP.js` → `LEVEL_THRESHOLDS` |
| Practice XP per question | `src/data/mockPracticeData.js` (xpReward), `PracticePage.jsx` (session XP) |
| Shop purchase (deduct coins) | `src/services/dataService.js` → `purchaseItem()` |
| Extra AI calls for coins | `src/pages/Settings.jsx` (UI only) |
| Founder tiers & launch coins | `src/lib/founder.js` |

---

## 9. One-Page Summary Table

| Item | Detail |
|------|--------|
| **XP** | Earned from missions (claim), competitions (per game), practice (per correct). Main level from `user.xp`; next level = 100 + (level−1)×50. |
| **Level** | From total XP (main app). Competitions use a different curve (e.g. 500, 1250, 2500 … for levels 2, 3, 4). |
| **Coins** | Earned from signup (100), missions, competitions, founder launch, premium. Spent on store items and (when implemented) extra AI calls (50 coins = 5 calls). |
| **Free daily (missions)** | Up to 225 XP, 45 coins (3 dailies). |
| **Free weekly (missions)** | Up to 1,775 XP, 365 coins (3 dailies × 7 + 1 weekly). |
| **Students vs teachers** | Same XP, level, and coins; no separate teacher economy. |
| **Persistence** | Missions and store purchases are the only flows that currently deduct/add in mock; competitions and practice need backend to persist. |

This is the full picture of the gamification system as implemented in the codebase.
