import React from 'react';
import { Icons } from '../../assets/icons';

interface XPBoltProps {
  size?: number;
  boosted?: boolean;
}

const XP_STYLES = `
@media (prefers-reduced-motion: no-preference) {
  @keyframes bolt-charge {
    0%,60%,100% { transform: translateY(0) scale(1); filter: brightness(1); }
    70% { transform: translateY(-4px) scale(1.12); filter: brightness(1.8) drop-shadow(0 0 6px #FF7A3D); }
    80% { transform: translateY(1px) scale(.96); filter: brightness(1); }
    90% { transform: translateY(-2px) scale(1.06); filter: brightness(1.3); }
  }
  @keyframes spark-fly {
    0%,58% { transform: translate(0,0) scale(0); opacity: 0; }
    62% { transform: translate(var(--tx), var(--ty)) scale(1); opacity: 1; }
    80% { transform: translate(calc(var(--tx)*2.5), calc(var(--ty)*2.5)) scale(.3); opacity: 0; }
    100% { opacity: 0; }
  }
}
`;

const SPARKS = [
  { tx: '-8px', ty: '-8px' },
  { tx: '8px',  ty: '-8px' },
  { tx: '-8px', ty: '8px'  },
  { tx: '8px',  ty: '8px'  },
];

const XPBolt: React.FC<XPBoltProps> = ({ size = 24, boosted = false }) => {
  const src = boosted ? Icons.xp.boost : Icons.xp.bolt;

  return (
    <>
      <style>{XP_STYLES}</style>
      <div style={{ position: 'relative', width: size, height: size, display: 'inline-block' }}>
        {/* Sparks (only when boosted) */}
        {boosted && SPARKS.map((spark, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: '#FF7A3D',
              animation: `spark-fly 3s ease-out ${i * 0.15}s infinite`,
              // @ts-ignore -- CSS custom properties
              '--tx': spark.tx,
              '--ty': spark.ty,
              pointerEvents: 'none',
            } as React.CSSProperties}
          />
        ))}
        <img
          src={src}
          alt={boosted ? 'XP Boosted' : 'XP'}
          width={size}
          height={size}
          style={{
            display: 'block',
            position: 'relative',
            zIndex: 1,
            animation: 'bolt-charge 3s ease-in-out infinite',
          }}
          draggable={false}
        />
      </div>
    </>
  );
};

export default React.memo(XPBolt);
