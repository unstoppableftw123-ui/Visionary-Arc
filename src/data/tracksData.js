// ── Career track definitions ────────────────────────────────────────────────
// colors object contains full Tailwind class strings (no dynamic interpolation)

export const TRACKS = [
  {
    id: 'tech-ai',
    name: 'Tech',
    accent: '#3B82F6',
    tagline: 'Build the future with code and AI',
    color: 'blue',
    colors: {
      border:  'border-[#3B82F6]/50',
      bg:      'bg-[#3B82F6]/10',
      bgSolid: 'bg-[#3B82F6]',
      text:    'text-[#3B82F6]',
      badge:   'bg-[#3B82F6]/20 text-[#93C5FD]',
      button:  'bg-[#3B82F6] hover:bg-[#2563EB] text-white',
      ring:    'ring-[#3B82F6]/40',
    },
    description:
      'Design and ship software, AI automations, and developer tools. ' +
      'Work on real-world problems using APIs, prompts, and code.',
    skills: ['Prompt Engineering', 'APIs & Automation', 'App Development', 'Data Analysis', 'AI Tools'],
    icon: 'Cpu',
    xpRange: '200–1,000 XP per project',
  },
  {
    id: 'design-branding',
    name: 'Design',
    accent: '#EC4899',
    tagline: 'Turn ideas into identity',
    color: 'purple',
    colors: {
      border:  'border-[#EC4899]/50',
      bg:      'bg-[#EC4899]/10',
      bgSolid: 'bg-[#EC4899]',
      text:    'text-[#EC4899]',
      badge:   'bg-[#EC4899]/20 text-[#F9A8D4]',
      button:  'bg-[#EC4899] hover:bg-[#DB2777] text-white',
      ring:    'ring-[#EC4899]/40',
    },
    description:
      'Craft visual identities, UI/UX flows, and brand strategy for real clients. ' +
      'Build a portfolio that shows you can make anything look and feel right.',
    skills: ['UI/UX Design', 'Visual Identity', 'Brand Strategy', 'Graphic Design', 'Typography'],
    icon: 'Palette',
    xpRange: '200–1,000 XP per project',
  },
  {
    id: 'business',
    name: 'Business',
    accent: '#10B981',
    tagline: 'Think like a founder',
    color: 'amber',
    colors: {
      border:  'border-[#10B981]/50',
      bg:      'bg-[#10B981]/10',
      bgSolid: 'bg-[#10B981]',
      text:    'text-[#10B981]',
      badge:   'bg-[#10B981]/20 text-[#6EE7B7]',
      button:  'bg-[#10B981] hover:bg-[#059669] text-white',
      ring:    'ring-[#10B981]/40',
    },
    description:
      'Build go-to-market plans, financial models, and sales strategies for growing companies. ' +
      'Learn the language of business by doing real founder-level work.',
    skills: ['Marketing Strategy', 'Pricing & Finance', 'Sales', 'Business Planning', 'Market Research'],
    icon: 'TrendingUp',
    xpRange: '200–1,000 XP per project',
  },
  {
    id: 'content-storytelling',
    name: 'Content',
    accent: '#8B5CF6',
    tagline: 'Your voice, amplified',
    color: 'pink',
    colors: {
      border:  'border-[#8B5CF6]/50',
      bg:      'bg-[#8B5CF6]/10',
      bgSolid: 'bg-[#8B5CF6]',
      text:    'text-[#8B5CF6]',
      badge:   'bg-[#8B5CF6]/20 text-[#C4B5FD]',
      button:  'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white',
      ring:    'ring-[#8B5CF6]/40',
    },
    description:
      'Write, script, and produce content that actually gets noticed — newsletters, videos, brand voice guides. ' +
      'Every deliverable here is a portfolio piece you can share.',
    skills: ['Writing & Copywriting', 'Video Production', 'Brand Voice', 'Presentations', 'Social Media'],
    icon: 'Mic2',
    xpRange: '200–1,000 XP per project',
  },
  {
    id: 'social-impact',
    name: 'Impact',
    accent: '#F59E0B',
    tagline: 'Change starts here',
    color: 'teal',
    colors: {
      border:  'border-[#F59E0B]/50',
      bg:      'bg-[#F59E0B]/10',
      bgSolid: 'bg-[#F59E0B]',
      text:    'text-[#F59E0B]',
      badge:   'bg-[#F59E0B]/20 text-[#FCD34D]',
      button:  'bg-[#F59E0B] hover:bg-[#D97706] text-white',
      ring:    'ring-[#F59E0B]/40',
    },
    description:
      'Design campaigns, conduct research, and build community programs that drive real change. ' +
      'Work that matters — and a portfolio that proves it.',
    skills: ['Campaign Design', 'Community Research', 'Leadership', 'Community Organizing', 'Grant Writing'],
    icon: 'Heart',
    xpRange: '200–1,000 XP per project',
  },
];

export function getTrack(id) {
  return TRACKS.find((t) => t.id === id) ?? null;
}
