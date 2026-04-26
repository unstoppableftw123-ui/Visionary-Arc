import React from 'react';
import StreakFlame from '../ui/StreakFlame';
import ShieldIcon from '../ui/ShieldIcon';
import type { ShieldState } from '../../assets/icons';

interface StreakBarProps {
  streakCount: number;
  isActive: boolean;
  shieldState?: ShieldState;
  size?: number;
}

const StreakBar: React.FC<StreakBarProps> = ({
  streakCount,
  isActive,
  shieldState = 'full',
  size = 28,
}) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <StreakFlame isActive={isActive} streakCount={streakCount} size={size} />
      <span
        style={{
          fontWeight: 700,
          fontSize: size * 0.5,
          color: isActive ? '#FF7A3D' : '#C9B8AD',
          fontFamily: 'var(--font-display, system-ui)',
          lineHeight: 1,
        }}
      >
        {streakCount}d streak
      </span>
      <ShieldIcon state={shieldState} size={size} pulse={shieldState === 'full' && isActive} />
    </div>
  );
};

export default React.memo(StreakBar);
