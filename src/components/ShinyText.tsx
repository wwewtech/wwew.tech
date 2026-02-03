'use client';

import React, { useId, useEffect, useState } from 'react';
import { useTheme } from '@/lib/context';

interface ShinyTextProps {
  text: string;
  className?: string;
  /** Отключить анимацию shimmer для улучшения производительности */
  disableAnimation?: boolean;
}

export const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  className = '',
  disableAnimation = false,
}) => {
  const id = useId();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const animationId = `shimmer${id.replace(/:/g, '')}`;

  useEffect(() => {
    // Задержка анимации для улучшения FCP/TBT
    const timer = setTimeout(() => setMounted(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const isDark = theme === 'dark';

  // Статичный градиент без анимации - лучшая производительность
  const staticStyle = {
    background: `linear-gradient(180deg, ${isDark ? '#ffffff' : '#000000'} 0%, ${isDark ? '#b0b0b0' : '#4a4a4a'} 50%, ${isDark ? '#808080' : '#888888'} 100%)`,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    color: 'transparent',
    display: 'inline-block',
  } as const;

  // Не анимируем до монтирования или если отключено
  if (!mounted || disableAnimation) {
    return (
      <span className={className} style={staticStyle}>
        {text}
      </span>
    );
  }

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

  return (
    <>
      <style>{keyframes}</style>
      <span 
        className={`${className} relative overflow-hidden`}
        style={staticStyle}
      >
        {text}
        {/* Блик через pseudo-element с transform (GPU-accelerated) */}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(90deg, transparent 0%, transparent 25%, ${isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)'} 50%, transparent 75%, transparent 100%)`,
            animation: `${animationId} 5s ease-in-out infinite`,
            willChange: 'transform',
            pointerEvents: 'none',
          }}
        />
      </span>
    </>
  );
};

export default ShinyText;
