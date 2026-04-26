import React from 'react';
import { Icons } from '../../assets/icons';

interface StreakFlameProps {
  isActive: boolean;
  streakCount: number;
  size?: number;
}

const FLAME_STYLES = `
@media (prefers-reduced-motion: no-preference) {
  @keyframes flame-waver {
    0%,100% { transform: scaleX(1) skewX(0deg); }
    25% { transform: scaleX(.96) skewX(-1.5deg); }
    75% { transform: scaleX(1.04) skewX(1.5deg); }
  }
  @keyframes flame-rise {
    0%,100% { transform: translateY(0); }
    50% { transform: translateY(-2px); }
  }
  @keyframes orb-pulse {
    0%,100% { transform: translate(-50%,-50%) scale(1); opacity: .5; }
    50% { transform: translate(-50%,-50%) scale(1.3); opacity: .8; }
  }
  @keyframes halo-expand {
    0% { transform: translate(-50%,-50%) scale(.7); opacity: .7; }
    100% { transform: translate(-50%,-50%) scale(2); opacity: 0; }
  }
}
`;

const StreakFlame: React.FC<StreakFlameProps> = ({ isActive, streakCount, size = 32 }) => {
  let src: string = Icons.streak.active;
  if (!isActive) {
    src = Icons.streak.off;
  } else if (streakCount >= 30) {
    src = Icons.streak.thirty;
  } else if (streakCount >= 7) {
    src = Icons.streak.seven;
  }

  if (!isActive) {
    return (
      <img
        src={src}
        alt="Streak inactive"
        width={size}
        height={size}
        style={{ display: 'inline-block', flexShrink: 0 }}
        draggable={false}
      />
    );
  }

  return (
    <>
      <style>{FLAME_STYLES}</style>
      <div style={{ position: 'relative', width: size, height: size, display: 'inline-block' }}>
        {/* Halo rings */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: size,
            height: size,
            borderRadius: '50%',
            border: '1.5px solid #FF7A3D',
            animation: 'halo-expand 2.5s ease-out infinite',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: size,
            height: size,
            borderRadius: '50%',
            border: '1.5px solid #FF7A3D',
            animation: 'halo-expand 2.5s ease-out infinite',
            animationDelay: '1.25s',
            pointerEvents: 'none',
          }}
        />
        {/* Orb glow */}
        <div
          style={{
            position: 'absolute',
            top: '75%',
            left: '50%',
            width: size * 0.6,
            height: size * 0.6,
            borderRadius: '50%',
            background: '#FF7A3D',
            filter: 'blur(10px)',
            animation: 'orb-pulse 2s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
        {/* Flame image */}
        <img
          src={src}
          alt={`Streak: ${streakCount} days`}
          width={size}
          height={size}
          style={{
            position: 'relative',
            zIndex: 1,
            animation: 'flame-waver 1.8s ease-in-out infinite, flame-rise 2.2s ease-in-out infinite',
            transformOrigin: 'bottom center',
            display: 'block',
          }}
          draggable={false}
        />
      </div>
    </>
  );
};

export default React.memo(StreakFlame);
