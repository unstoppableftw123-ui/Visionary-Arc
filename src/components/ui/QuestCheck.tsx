import React from 'react';

interface QuestCheckProps {
  isComplete: boolean;
  size?: number;
}

const QuestCheck: React.FC<QuestCheckProps> = ({ isComplete, size = 24 }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      style={{
        display: 'inline-block',
        flexShrink: 0,
        transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: isComplete ? 'scale(1)' : 'scale(1)',
      }}
      aria-label={isComplete ? 'Quest complete' : 'Quest incomplete'}
    >
      <circle
        cx="12"
        cy="12"
        r="9.5"
        fill={isComplete ? '#FF7A3D' : 'transparent'}
        stroke={isComplete ? '#C4581A' : '#D4A58A'}
        strokeWidth="0.8"
        style={{ transition: 'fill 0.5s ease, stroke 0.5s ease' }}
      />
      <path
        d="M8 12L10.5 14.5L16 9"
        stroke="#FFE8D6"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray="22"
        strokeDashoffset={isComplete ? 0 : 22}
        style={{ transition: 'stroke-dashoffset 0.4s ease 0.1s' }}
      />
    </svg>
  );
};

export default React.memo(QuestCheck);
