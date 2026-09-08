'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from '@/context/AppContext';

const Prism = dynamic(() => import('@/components/reactbits/Prism'), {
  ssr: false,
});

export const HeroBackground: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0"
      style={{
        maskImage:
          'radial-gradient(ellipse 85% 70% at 50% 45%, black 25%, transparent 85%), linear-gradient(to bottom, black 55%, transparent 98%)',
        WebkitMaskImage:
          'radial-gradient(ellipse 85% 70% at 50% 45%, black 25%, transparent 85%), linear-gradient(to bottom, black 55%, transparent 98%)',
        maskComposite: 'intersect',
        WebkitMaskComposite: 'destination-in',
      }}
    >
      <div className="w-full h-full absolute inset-0 animate-hero-fade-in">
        <Prism
          height={3.2}
          baseWidth={5.0}
          glow={0.6}
          noise={0.3}
          transparent={true}
          scale={3.2}
          timeScale={0.3}
          lightMode={!isDark}
        />
      </div>

      {/* Universal bottom fader: guarantees 100% seamless melt into page background */}
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-background via-background/70 to-transparent pointer-events-none" />
    </div>
  );
};

export default HeroBackground;
