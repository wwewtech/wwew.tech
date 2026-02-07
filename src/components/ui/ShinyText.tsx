'use client';

import React, { useState, useEffect } from 'react';

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <span
      className={`${mounted ? 'shiny-text' : ''} ${className}`}
      style={{ 
        '--shiny-speed': `${speed}s`,
        // Fallback color prevents LCP issues by ensuring text is visible initially
        // Use inline-block to match .shiny-text behavior to prevent layout shifts
        display: 'inline-block',
        color: mounted ? undefined : 'var(--shiny-base-color)'
      } as React.CSSProperties}
    >
      {text}
    </span>
  );
};

export default ShinyText;
