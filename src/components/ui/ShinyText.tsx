'use client';

import React from 'react';

interface ShinyTextProps {
  text: string;
  className?: string;
  /** Скорость анимации в секундах (больше = медленнее) */
  speed?: number;
  /** Угол градиента для блика */
  spread?: number;
}

export const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  className = '',
  speed = 4,
  spread = 120,
}) => {
  return (
    <span 
      className={`shiny-text ${className}`}
      style={{
        '--shiny-speed': `${speed}s`,
        '--shiny-spread': `${spread}deg`,
      } as React.CSSProperties}
    >
      {text}
    </span>
  );
};

export default ShinyText;
