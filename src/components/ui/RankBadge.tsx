import React, { useEffect, useRef, useState } from 'react';
import { Icons } from '../../assets/icons';
import type { RankKey } from '../../assets/icons';

interface RankBadgeProps {
  rank: RankKey;
  size?: number;
  animate?: boolean;
}

const RANK_STYLES = `
@media (prefers-reduced-motion: no-preference) {
  @keyframes badge-float {
    0%,100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-3px) scale(1.03); }
  }
  @keyframes badge-spring {
    0% { transform: scale(0) rotate(-20deg); opacity: 0; }
    55% { transform: scale(1.15) rotate(4deg); opacity: 1; }
    75% { transform: scale(.93) rotate(-2deg); }
    100% { transform: scale(1) rotate(0deg); }
  }
}
`;

const RankBadge: React.FC<RankBadgeProps> = ({ rank, size = 32, animate = false }) => {
  const [springing, setSpringing] = useState(false);
  const prevRank = useRef<RankKey | null>(null);

  useEffect(() => {
    if (prevRank.current !== null && prevRank.current !== rank) {
      setSpringing(true);
      const t = setTimeout(() => setSpringing(false), 600);
      prevRank.current = rank;
      return () => clearTimeout(t);
    }
    prevRank.current = rank;
  }, [rank]);

  const src = Icons.rank[rank];

  let animStyle: React.CSSProperties = {};
  if (springing) {
    animStyle = { animation: 'badge-spring 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' };
  } else if (animate) {
    animStyle = { animation: 'badge-float 3s ease-in-out infinite' };
  }

  return (
    <>
      <style>{RANK_STYLES}</style>
      <img
        src={src}
        alt={`Rank: ${rank}`}
        width={size}
        height={size}
        style={{ display: 'inline-block', flexShrink: 0, ...animStyle }}
        draggable={false}
      />
    </>
  );
};

export default React.memo(RankBadge);
