import React from 'react';
import { Icons } from '../../assets/icons';

interface CoinIconProps {
  animated?: boolean;
  size?: number;
  variant?: 'base' | 'stack' | 'plus';
}

const COIN_STYLES = `
@media (prefers-reduced-motion: no-preference) {
  @keyframes coin-3d-flip {
    0%,30% { transform: rotateY(0deg); }
    45% { transform: rotateY(90deg); }
    55%,85% { transform: rotateY(180deg); }
    95% { transform: rotateY(270deg); }
    100% { transform: rotateY(360deg); }
  }
  @keyframes coin-sheen {
    0%,35% { opacity: 0; transform: translateX(-120%) rotate(25deg); }
    45% { opacity: .6; transform: translateX(0%) rotate(25deg); }
    55%,100% { opacity: 0; transform: translateX(120%) rotate(25deg); }
  }
  @keyframes coin-shadow-squish {
    0%,30% { transform: translateX(-50%) scaleX(1); opacity: .4; }
    45% { transform: translateX(-50%) scaleX(0.1); opacity: .1; }
    55%,85% { transform: translateX(-50%) scaleX(1); opacity: .4; }
    95% { transform: translateX(-50%) scaleX(0.1); opacity: .1; }
    100% { transform: translateX(-50%) scaleX(1); opacity: .4; }
  }
}
`;

const srcMap = {
  base: Icons.coin.base,
  stack: Icons.coin.stack,
  plus: Icons.coin.plus,
};

const CoinIcon: React.FC<CoinIconProps> = ({ animated = false, size = 24, variant = 'base' }) => {
  const src = srcMap[variant];

  if (!animated) {
    return (
      <img
        src={src}
        alt="Coin"
        width={size}
        height={size}
        style={{ display: 'inline-block', flexShrink: 0 }}
        draggable={false}
      />
    );
  }

  return (
    <>
      <style>{COIN_STYLES}</style>
      <div style={{ perspective: '200px', width: size, height: size + 4, position: 'relative', display: 'inline-block' }}>
        {/* Shadow */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            width: size * 0.7,
            height: 4,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.3)',
            animation: 'coin-shadow-squish 3.5s cubic-bezier(.4,0,.2,1) infinite',
          }}
        />
        {/* Coin + sheen wrapper */}
        <div
          style={{
            width: size,
            height: size,
            transformStyle: 'preserve-3d',
            animation: 'coin-3d-flip 3.5s cubic-bezier(.4,0,.2,1) infinite',
            position: 'relative',
          }}
        >
          <img
            src={src}
            alt="Coin"
            width={size}
            height={size}
            style={{ display: 'block', position: 'relative', zIndex: 1 }}
            draggable={false}
          />
          {/* Sheen overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,.5) 50%, transparent 70%)',
              animation: 'coin-sheen 3.5s cubic-bezier(.4,0,.2,1) infinite',
              zIndex: 2,
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    </>
  );
};

export default React.memo(CoinIcon);
