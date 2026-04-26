// src/db/mockData.js
// Matches schema.sql exactly — all enum values, field names, and constraints verified.
// Toggle via: REACT_APP_USE_MOCK=true in .env.local

// ─────────────────────────────────────────────────────────────────────────────
// PROFILES
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_PROFILES = [
  {
    id: 'mock-profile-1',
    email: 'maya.chen@student.com',
    name: 'Maya Chen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maya',
    school: 'Lincoln High School',
    grade: 11,
    xp: 3200,
    level: 8,
    coins: 340,
    streak: 12,
    max_streak: 21,
    last_activity_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    status_tier: 'Creator',          // 2000–5999 XP → Creator ✓
    founder_tier: 'silver',
    is_premium: true,
    onboarded: true,
    track_primary: 'design',
    referral_code: 'MAYA2026',
    referred_by: null,
    daily_coin_allowance: 50,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'mock-profile-2',
    email: 'jordan.osei@student.com',
    name: 'Jordan Osei',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jordan',
    school: 'Westside Academy',
    grade: 10,
    xp: 890,
    level: 4,
    coins: 120,
    streak: 4,
    max_streak: 9,
    last_activity_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    status_tier: 'Builder',          // 500–1999 XP → Builder ✓
    founder_tier: null,
    is_premium: false,
    onboarded: true,
    track_primary: 'tech',
    referral_code: 'JORD2026',
    referred_by: 'mock-profile-1',
    daily_coin_allowance: 50,
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 'mock-profile-3',
    email: 'priya.sharma@student.com',
    name: 'Priya Sharma',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya',
    school: 'Eastview Charter',
    grade: 12,
    xp: 16400,
    level: 22,
    coins: 1200,
    streak: 31,
    max_streak: 45,
    last_activity_date: new Date().toISOString().split('T')[0],
    status_tier: 'Elite',            // 15000+ XP → Elite ✓
    founder_tier: 'gold',
    is_premium: true,
    onboarded: true,
    track_primary: 'business',
    referral_code: 'PRIYA2026',
    referred_by: null,
    daily_coin_allowance: 50,
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    id: 'mock-profile-4',
    email: 'devon.walker@student.com',
    name: 'Devon Walker',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=devon',
    school: 'Northgate High',
    grade: 9,
    xp: 210,
    level: 2,
    coins: 80,
    streak: 2,
    max_streak: 3,
    last_activity_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    status_tier: 'Beginner',         // 0–499 XP → Beginner ✓
    founder_tier: 'seed',
    is_premium: false,
    onboarded: false,
    track_primary: 'media',
    referral_code: 'DEVN2026',
    referred_by: 'mock-profile-2',
    daily_coin_allowance: 50,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// STREAKS
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_STREAKS = [
  {
    id: 'mock-streak-1',
    user_id: 'mock-profile-1',
    current_streak: 12,
    max_streak: 21,
    last_activity_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    freeze_count: 1,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'mock-streak-2',
    user_id: 'mock-profile-3',
    current_streak: 31,
    max_streak: 45,
    last_activity_date: new Date().toISOString().split('T')[0],
    freeze_count: 0,
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MISSIONS
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_MISSIONS = [
  {
    id: 'mock-mission-1',
    user_id: 'mock-profile-1',
    type: 'daily',
    title: 'Study Session Starter',
    description: 'Complete a flashcard session with 10+ cards',
    xp_reward: 25,
    coins_reward: 10,
    progress: 1,
    target: 1,
    completed: true,
    claimed: false,
    date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  },
  {
    id: 'mock-mission-2',
    user_id: 'mock-profile-1',
    type: 'daily',
    title: 'Quiz Champion',
    description: 'Score 80%+ on a quiz',
    xp_reward: 50,
    coins_reward: 20,
    progress: 0,
    target: 1,
    completed: false,
    claimed: false,
    date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  },
  {
    id: 'mock-mission-3',
    user_id: 'mock-profile-1',
    type: 'weekly',
    title: 'Project Builder',
    description: 'Submit a completed project this week',
    xp_reward: 75,
    coins_reward: 25,
    progress: 0,
    target: 1,
    completed: false,
    claimed: false,
    date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  },
  {
    id: 'mock-mission-4',
    user_id: 'mock-profile-2',
    type: 'daily',
    title: 'Note Taker',
    description: 'Save a summary or note in Study Hub',
    xp_reward: 25,
    coins_reward: 10,
    progress: 0,
    target: 1,
    completed: false,
    claimed: false,
    date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TRANSACTIONS (coin ledger)
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_TRANSACTIONS = [
  {
    id: 'mock-txn-1',
    user_id: 'mock-profile-1',
    amount: 100,
    reason: 'starting_balance',
    balance_after: 100,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'mock-txn-2',
    user_id: 'mock-profile-1',
    amount: 8,
    reason: 'quiz_completed',
    balance_after: 108,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'mock-txn-3',
    user_id: 'mock-profile-1',
    amount: -50,
    reason: 'shop_purchase',
    balance_after: 58,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PROJECTS
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_PROJECTS = [
  {
    id: 'mock-project-1',
    user_id: 'mock-profile-1',
    track: 'design',
    difficulty: 'Standard',
    track_difficulty: 'Standard',
    title: 'Rebrand a Local Business',
    role: 'Brand Designer',
    client_name: 'Brew & Bean Café',
    brief_json: {
      title: 'Rebrand a Local Business',
      role: 'Brand Designer',
      client: 'Brew & Bean Café',
      clientNeed: 'A modern visual identity to attract college students',
      briefSummary: 'Design a complete brand refresh including logo, color palette, and social media templates.',
      deliverables: ['Logo (SVG + PNG)', 'Color palette guide', '3 Instagram post templates', 'Brand style PDF'],
      skills: ['Figma', 'Typography', 'Color theory', 'Brand strategy'],
      timeline: '2 weeks',
      difficulty: 'Standard',
    },
    status: 'active',
    submission_url: null,
    submission_notes: null,
    xp_awarded: 0,
    coins_awarded: 0,
    is_public: false,
    cover_image_url: null,
    submitted_at: null,
    completed_at: null,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'mock-project-2',
    user_id: 'mock-profile-3',
    track: 'business',
    difficulty: 'Advanced',
    track_difficulty: 'Advanced',
    title: 'Launch a Micro SaaS Pricing Page',
    role: 'Growth Strategist',
    client_name: 'TaskFlow AI',
    brief_json: {
      title: 'Launch a Micro SaaS Pricing Page',
      role: 'Growth Strategist',
      client: 'TaskFlow AI',
      clientNeed: 'Optimize pricing page to improve trial-to-paid conversion',
      briefSummary: 'Analyze competitor pricing, propose a 3-tier model, and design the pricing page copy and layout.',
      deliverables: ['Competitor analysis doc', 'Pricing tier recommendation', 'Copywriting for page', 'A/B test plan'],
      skills: ['Market research', 'Copywriting', 'SaaS pricing strategy', 'Conversion optimization'],
      timeline: '3 weeks',
      difficulty: 'Advanced',
    },
    status: 'completed',
    submission_url: 'https://notion.so/priya-taskflow-project',
    submission_notes: 'Included Loom walkthrough of the pricing page redesign.',
    xp_awarded: 700,
    coins_awarded: 175,
    is_public: true,
    cover_image_url: null,
    submitted_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    completed_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'mock-project-3',
    user_id: 'mock-profile-2',
    track: 'tech',
    difficulty: 'Starter',
    track_difficulty: 'Starter',
    title: 'Build a Personal Portfolio Website',
    role: 'Frontend Developer',
    client_name: 'Self',
    brief_json: {
      title: 'Build a Personal Portfolio Website',
      role: 'Frontend Developer',
      client: 'Self',
      clientNeed: 'A clean online presence to share with colleges and internship applications',
      briefSummary: 'Create a responsive personal portfolio using HTML, CSS, and JavaScript.',
      deliverables: ['Deployed website URL', 'About page', 'Projects section', 'Contact form'],
      skills: ['HTML', 'CSS', 'JavaScript', 'Responsive design'],
      timeline: '1 week',
      difficulty: 'Starter',
    },
    status: 'submitted',
    submission_url: 'https://jordan-portfolio.vercel.app',
    submission_notes: 'Used Tailwind for styling.',
    xp_awarded: 200,
    coins_awarded: 50,
    is_public: true,
    cover_image_url: null,
    submitted_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    completed_at: null,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PORTFOLIO ENTRIES
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_PORTFOLIO_ENTRIES = [
  {
    id: 'mock-portfolio-1',
    user_id: 'mock-profile-3',
    project_id: 'mock-project-2',
    track: 'business',
    title: 'Launch a Micro SaaS Pricing Page',
    role: 'Growth Strategist',
    description: 'Redesigned pricing strategy for a B2B SaaS tool. Delivered competitor analysis, 3-tier pricing model, and full page copy.',
    skills: ['Market research', 'Copywriting', 'SaaS pricing strategy'],
    submission_url: 'https://notion.so/priya-taskflow-project',
    cover_image_url: null,
    likes: 14,
    views: 82,
    featured: true,
    is_public: true,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'mock-portfolio-2',
    user_id: 'mock-profile-2',
    project_id: 'mock-project-3',
    track: 'tech',
    title: 'Personal Portfolio Website',
    role: 'Frontend Developer',
    description: 'Built and deployed a responsive personal portfolio to showcase projects and skills for college applications.',
    skills: ['HTML', 'CSS', 'JavaScript', 'Responsive design'],
    submission_url: 'https://jordan-portfolio.vercel.app',
    cover_image_url: null,
    likes: 3,
    views: 21,
    featured: false,
    is_public: true,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CHALLENGES (company-sponsored)
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_CHALLENGES = [
  {
    id: 'mock-challenge-1',
    sponsor_name: 'Adobe',
    sponsor_logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Adobe_Corporate_Logo.png/320px-Adobe_Corporate_Logo.png',
    title: 'Design a Student App Icon',
    description: 'Create a bold, modern app icon for a fictional student productivity tool. Judged on originality, scalability, and brand fit.',
    track: 'design',
    reward_type: 'gift_card',
    reward_value: '$150 Adobe Creative Cloud credit',
    max_slots: 50,
    current_slots: 23,
    required_tier: 'Builder',
    required_status_tier: 'Builder',
    brief_template: null,
    status: 'open',
    deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'mock-challenge-2',
    sponsor_name: 'Notion',
    sponsor_logo_url: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png',
    title: 'Build a Notion Template for Students',
    description: 'Design and publish a Notion template that helps high school students manage assignments, goals, and study time.',
    track: 'tech',
    reward_type: 'gift_card',
    reward_value: '$100 Amazon gift card + Notion Pro for 1 year',
    max_slots: 100,
    current_slots: 41,
    required_tier: 'Beginner',
    required_status_tier: 'Beginner',
    brief_template: null,
    status: 'open',
    deadline: new Date(Date.now() + 21 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'mock-challenge-3',
    sponsor_name: 'Canva',
    sponsor_logo_url: 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Canva_Logo.png',
    title: 'Create a Pitch Deck for a Student Startup',
    description: 'Design a compelling 10-slide pitch deck for a student-run business idea using Canva. Winners get featured on Canva\'s student blog.',
    track: 'business',
    reward_type: 'gift_card',
    reward_value: '$75 gift card + Canva Pro for 6 months',
    max_slots: 75,
    current_slots: 12,
    required_tier: 'Builder',
    required_status_tier: 'Builder',
    brief_template: null,
    status: 'open',
    deadline: new Date(Date.now() + 30 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// REFERRALS
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_REFERRALS = [
  {
    id: 'mock-referral-1',
    referrer_id: 'mock-profile-1',
    referred_id: 'mock-profile-2',
    status: 'streak_7',
    coins_awarded: 150,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'mock-referral-2',
    referrer_id: 'mock-profile-2',
    referred_id: 'mock-profile-4',
    status: 'signed_up',
    coins_awarded: 100,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// FRIENDS
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_FRIENDS = [
  {
    id: 'mock-friend-1',
    user_id: 'mock-profile-1',
    friend_id: 'mock-profile-2',
    initiated_by: 'mock-profile-1',
    status: 'accepted',
    friend_streak: 4,
    last_both_active: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: 'mock-friend-2',
    user_id: 'mock-profile-1',
    friend_id: 'mock-profile-3',
    initiated_by: 'mock-profile-3',
    status: 'accepted',
    friend_streak: 8,
    last_both_active: new Date().toISOString().split('T')[0],
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// XP EVENTS
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_XP_EVENTS = [
  {
    id: 'mock-xp-1',
    user_id: 'mock-profile-1',
    event_type: 'daily_login',
    xp_amount: 5,
    xp_balance_after: 5,
    reference_id: null,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'mock-xp-2',
    user_id: 'mock-profile-1',
    event_type: 'flashcard_session',
    xp_amount: 15,
    xp_balance_after: 20,
    reference_id: 'mock-session-1',
    created_at: new Date(Date.now() - 29 * 86400000).toISOString(),
  },
  {
    id: 'mock-xp-3',
    user_id: 'mock-profile-1',
    event_type: 'submit_project_standard',
    xp_amount: 400,
    xp_balance_after: 3200,
    reference_id: 'mock-project-1',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SHOP ITEMS
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_SHOP_ITEMS = [
  {
    id: 'mock-item-1',
    name: 'Streak Freeze',
    description: 'Protect your streak for 1 day',
    category: 'freeze',
    coin_cost: 50,
    xp_cost: 0,
    required_tier: 'Beginner',
    is_active: true,
    image_url: null,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'mock-item-2',
    name: 'XP Boost (2×, 1hr)',
    description: 'Double XP earned for 1 hour',
    category: 'boost',
    coin_cost: 100,
    xp_cost: 0,
    required_tier: 'Beginner',
    is_active: true,
    image_url: null,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'mock-item-3',
    name: 'Dark Mode Avatar Frame',
    description: 'Sleek dark frame for your profile',
    category: 'avatar',
    coin_cost: 200,
    xp_cost: 0,
    required_tier: 'Builder',
    is_active: true,
    image_url: null,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'mock-item-4',
    name: 'Neon Theme Pack',
    description: 'Unlocks neon color scheme across the app',
    category: 'theme',
    coin_cost: 350,
    xp_cost: 0,
    required_tier: 'Creator',
    is_active: true,
    image_url: null,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'mock-item-5',
    name: 'Elite Badge',
    description: 'Exclusive badge displayed on your portfolio',
    category: 'badge',
    coin_cost: 500,
    xp_cost: 0,
    required_tier: 'Pro',
    is_active: true,
    image_url: null,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ONBOARDING STATE
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_ONBOARDING = [
  {
    id: 'mock-onboard-1',
    user_id: 'mock-profile-1',
    step_completed: 3,
    track_selected: 'design',
    goal_selected: 'portfolio',
    avatar_selected: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maya',
    completed_at: new Date(Date.now() - 29 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'mock-onboard-4',
    user_id: 'mock-profile-4',
    step_completed: 1,
    track_selected: 'media',
    goal_selected: null,
    avatar_selected: null,
    completed_at: null,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// LEADERBOARD (derived from profiles)
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_LEADERBOARD = [...MOCK_PROFILES]
  .sort((a, b) => b.xp - a.xp)
  .map((p, i) => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    school: p.school,
    xp: p.xp,
    level: p.level,
    streak: p.streak,
    status_tier: p.status_tier,
    rank: i + 1,
  }));

// ─────────────────────────────────────────────────────────────────────────────
// CONVENIENCE EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

// Default current user for mock sessions (swap index to test different tiers)
export const MOCK_CURRENT_USER = MOCK_PROFILES[0];

// Helper: find profile by id
export function getMockProfile(id) {
  return MOCK_PROFILES.find((p) => p.id === id) ?? MOCK_CURRENT_USER;
}
