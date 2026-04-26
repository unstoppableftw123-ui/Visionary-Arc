import React from 'react';
import { Icons } from '../../assets/icons';
import type { TierKey } from '../../assets/icons';

interface TierBadgeProps {
  tier?: TierKey;
  label?: string;
  size?: number;
  className?: string;
}

const TIER_COLORS: Record<TierKey, string> = {
  d: '#C9B8AD',
  c: '#D4A58A',
  b: '#C4581A',
  a: '#FF7A3D',
  s: '#FF7A3D',
};

const STATUS_COLORS: Record<string, string> = {
  Beginner: 'bg-white/10 text-zinc-200 border-white/20',
  Builder: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
  Creator: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
  Pro: 'bg-orange-500/20 text-orange-300 border-orange-400/30',
  Elite: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
};

const TierBadge: React.FC<TierBadgeProps> = ({ tier, label, size = 32, className = '' }) => {
  if (label) {
    const classes = STATUS_COLORS[label] ?? STATUS_COLORS.Beginner;
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${classes} ${className}`}>
        {label}
      </span>
    );
  }

  const safeTier: TierKey = tier ?? 'd';
  const src = Icons.tier[safeTier];
  const color = TIER_COLORS[safeTier];
  const fontWeight = safeTier === 's' ? 800 : 600;

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <img
        src={src}
        alt={`Tier ${safeTier.toUpperCase()}`}
        width={size}
        height={size}
        style={{ display: 'block', flexShrink: 0 }}
        draggable={false}
      />
      <span style={{ fontSize: size * 0.3, fontWeight, color, lineHeight: 1, fontFamily: 'var(--font-display, system-ui)' }}>
        {safeTier.toUpperCase()}
      </span>
    </div>
  );
};

export default React.memo(TierBadge);
