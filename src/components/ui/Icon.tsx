import React from 'react';

interface IconProps {
  src: string;
  size?: number | string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}

const Icon: React.FC<IconProps> = ({
  src,
  size = 24,
  alt = '',
  className = '',
  style,
}) => (
  <img
    src={src}
    alt={alt}
    width={size}
    height={size}
    className={className}
    style={{ display: 'inline-block', flexShrink: 0, ...style }}
    draggable={false}
  />
);

export default React.memo(Icon);
