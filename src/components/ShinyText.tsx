'use client';

import React, { useId, useEffect, useState } from 'react';
import { useTheme } from '@/lib/context';

interface ShinyTextProps {
  text: string;
  className?: string;
}

export const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  className = '',
}) => {
  const id = useId();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const animationId = `shimmer${id.replace(/:/g, '')}`;

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === 'dark';

  // GPU-accelerated анимация через transform вместо background-position
  const keyframes = `
    @keyframes ${animationId} {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(200%);
      }
    }
  `;

  // Не анимируем до монтирования для лучшего FCP
  if (!mounted) {
    return (
      <span 
        className={className}
        style={{
          background: `linear-gradient(180deg, ${isDark ? '#ffffff' : '#000000'} 0%, ${isDark ? '#b0b0b0' : '#4a4a4a'} 50%, ${isDark ? '#808080' : '#888888'} 100%)`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          color: 'transparent',
          display: 'inline-block',
        }}
      >
        {text}
      </span>
    );
  }

  return (
    <>
      <style>{keyframes}</style>
      <span 
        className={`${className} relative overflow-hidden`}
        style={{
          background: `linear-gradient(180deg, ${isDark ? '#ffffff' : '#000000'} 0%, ${isDark ? '#b0b0b0' : '#4a4a4a'} 50%, ${isDark ? '#808080' : '#888888'} 100%)`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          color: 'transparent',
          display: 'inline-block',
        }}
      >
        {text}
        {/* Блик через pseudo-element с transform (GPU-accelerated) */}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(90deg, transparent 0%, transparent 25%, ${isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.15)'} 50%, transparent 75%, transparent 100%)`,
            animation: `${animationId} 4s ease-in-out infinite`,
            willChange: 'transform',
            pointerEvents: 'none',
          }}
        />
      </span>
    </>
  );
};

export default ShinyText;
