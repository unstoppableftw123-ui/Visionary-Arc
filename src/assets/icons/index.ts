export const Icons = {
  streak: {
    active: '/assets/icons/streak-active.svg',
    off: '/assets/icons/streak-off.svg',
    seven: '/assets/icons/streak-7.svg',
    thirty: '/assets/icons/streak-30.svg',
    shield: '/assets/icons/streak-shield.svg',
    calendar: '/assets/icons/streak-calendar.svg',
  },
  shield: {
    full: '/assets/icons/shield-full.svg',
    cracked: '/assets/icons/shield-cracked.svg',
    broken: '/assets/icons/shield-broken.svg',
  },
  coin: {
    base: '/assets/icons/coin.svg',
    stack: '/assets/icons/coin-stack.svg',
    plus: '/assets/icons/coin-plus.svg',
  },
  tier: {
    d: '/assets/icons/tier-d.svg',
    c: '/assets/icons/tier-c.svg',
    b: '/assets/icons/tier-b.svg',
    a: '/assets/icons/tier-a.svg',
    s: '/assets/icons/tier-s.svg',
  },
  rank: {
    initiate: '/assets/icons/rank-initiate.svg',
    apprentice: '/assets/icons/rank-apprentice.svg',
    journeyman: '/assets/icons/rank-journeyman.svg',
    expert: '/assets/icons/rank-expert.svg',
    master: '/assets/icons/rank-master.svg',
    elite: '/assets/icons/rank-elite.svg',
  },
  xp: {
    bolt: '/assets/icons/xp-bolt.svg',
    boost: '/assets/icons/xp-boost.svg',
  },
  ui: {
    questMarker: '/assets/icons/quest-marker.svg',
    claimSlot: '/assets/icons/claim-slot.svg',
    reroll: '/assets/icons/reroll-dice.svg',
    giftCard: '/assets/icons/gift-card.svg',
    certificate: '/assets/icons/certificate-ribbon.svg',
    portfolioExport: '/assets/icons/portfolio-export.svg',
    referral: '/assets/icons/referral-link.svg',
    leaderboard: '/assets/icons/leaderboard.svg',
    dailyQuest: '/assets/icons/daily-quest.svg',
    spotlight: '/assets/icons/spotlight.svg',
    missionSubmit: '/assets/icons/mission-submit.svg',
  },
} as const;

export type RankKey = keyof typeof Icons.rank;
export type TierKey = keyof typeof Icons.tier;
export type ShieldState = keyof typeof Icons.shield;
