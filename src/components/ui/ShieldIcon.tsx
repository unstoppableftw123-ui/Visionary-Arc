import React, { useEffect, useRef, useState } from 'react';
import { Icons } from '../../assets/icons';
import type { ShieldState } from '../../assets/icons';

interface ShieldIconProps {
  state: ShieldState;
  size?: number;
  pulse?: boolean;
}

const SHIELD_STYLES = `
@media (prefers-reduced-motion: no-preference) {
  @keyframes shield-ring-expand {
    0% { transform: scale(.85); opacity: .7; border-width: 2px; }
    100% { transform: scale(1.6); opacity: 0; border-width: .5px; }
  }
  @keyframes shield-pulse {
    0%,100% { transform: scale(1); }
    50% { transform: scale(1.04); }
  }
  @keyframes shield-shake {
    0%,100% { transform: translateX(0); }
    20% { transform: translateX(-3px); }
    40% { transform: translateX(3px); }
    60% { transform: translateX(-2px); }
    80% { transform: translateX(2px); }
  }
}
`;

const ShieldIcon: React.FC<ShieldIconProps> = ({ state, size = 32, pulse = false }) => {
  const [shaking, setShaking] = useState(false);
  const prevState = useRef(state);

  useEffect(() => {
    if (prevState.current !== 'broken' && state === 'broken') {
      setShaking(true);
      const t = setTimeout(() => setShaking(false), 600);
      prevState.current = state;
      return () => clearTimeout(t);
    }
    prevState.current = state;
  }, [state]);

  const src = Icons.shield[state];

  if (state === 'full' && pulse) {
    return (
      <>
        <style>{SHIELD_STYLES}</style>
        <div style={{ position: 'relative', width: size, height: size, display: 'inline-block' }}>
          {/* Expanding ring */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '2px solid #FF7A3D',
              animation: 'shield-ring-expand 2s ease-out infinite',
              pointerEvents: 'none',
            }}
          />
          <img
            src={src}
            alt="Shield full"
            width={size}
            height={size}
            style={{
              display: 'block',
              position: 'relative',
              zIndex: 1,
              animation: 'shield-pulse 2s ease-in-out infinite',
            }}
            draggable={false}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <style>{SHIELD_STYLES}</style>
      <img
        src={src}
        alt={`Shield ${state}`}
        width={size}
        height={size}
        style={{
          display: 'inline-block',
          flexShrink: 0,
          animation: shaking ? 'shield-shake 0.6s ease' : undefined,
        }}
        draggable={false}
      />
    </>
  );
};

export default React.memo(ShieldIcon);
