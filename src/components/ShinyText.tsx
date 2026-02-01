'use client';

import React, { useId } from 'react';
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
  const animationId = `shimmer${id.replace(/:/g, '')}`;

  const isDark = theme === 'dark';

  const keyframes = `
    @keyframes ${animationId} {
      0% {
        background-position: 100% 0, 0 0;
      }
      100% {
        background-position: -100% 0, 0 0;
      }
    }
  `;

  const style: React.CSSProperties = {
    backgroundImage: `
      linear-gradient(
        90deg,
        transparent 0%,
        transparent 25%,
        ${isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.2)'} 45%,
        ${isDark ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 0.5)'} 50%,
        ${isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.2)'} 55%,
        transparent 75%,
        transparent 100%
      ),
      linear-gradient(
        180deg,
        ${isDark ? '#ffffff' : '#000000'} 0%,
        ${isDark ? '#b0b0b0' : '#4a4a4a'} 50%,
        ${isDark ? '#808080' : '#888888'} 100%
      )
    `,
    backgroundSize: '200% 100%, 100% 100%',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    color: 'transparent',
    animation: `${animationId} 8s ease-in-out infinite`,
    display: 'inline-block',
  };

  return (
    <>
      <style>{keyframes}</style>
      <span className={className} style={style}>
        {text}
      </span>
    </>
  );
};

export default ShinyText;
