'use client';

import React from 'react';

interface ShinyTextProps {
  text: string;
  className?: string;
  /** Длительность одного прохода блика в секундах */
  speed?: number;
}

export const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  className = '',
  speed = 5,
}) => {
  return (
    <span
      className={`shiny-text ${className}`}
      style={{ '--shiny-speed': `${speed}s` } as React.CSSProperties}
    >
      {text}
    </span>
  );
};

export default ShinyText;
