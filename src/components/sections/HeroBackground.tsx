'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme, useFluidCursor } from '@/context/AppContext';

const Prism = dynamic(() => import('@/components/reactbits/Prism'), {
  ssr: false,
});

export const HeroBackground: React.FC = () => {
  const { theme } = useTheme();
  const { prefersReducedMotion } = useFluidCursor();
  const isDark = theme === 'dark';

  // Defer the Prism chunk until the browser is idle. The hero text - the LCP
  // element - does not depend on the background, but the Prism chunk (~61 KB
  // plus a shader compile) used to load during hydration and compete with
  // first paint for the main thread. Deferring keeps the visual identical
  // (the canvas fades in via animate-hero-fade-in, and it is absolutely
  // positioned inside a fixed-size container, so this cannot shift layout).
  //
  // The 700ms fallback matters as much as the idle callback: rIC is not
  // guaranteed to fire before the user interacts (in a background tab it
  // never fires). Measured with fps-scroll.mjs, when the shader compile
  // landed at the first scroll instead of before it, that frame spiked to
  // ~667ms - the "hero stutters on the first scroll" report - while the
  // built-ahead case scrolls at a flat 17-18ms.
  const [showPrism, setShowPrism] = useState(false);
  useEffect(() => {
    const start = () => setShowPrism(true);
    let idleId: number | undefined;
    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(start);
    } else {
      idleId = window.setTimeout(start, 0);
    }
    const timerId = window.setTimeout(start, 700);
    return () => {
      if (idleId !== undefined) {
        if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idleId);
        else clearTimeout(idleId);
      }
      clearTimeout(timerId);
    };
  }, []);

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
        {showPrism && (
          <Prism
            height={3.2}
            baseWidth={5.0}
            glow={0.6}
            noise={0.3}
            transparent={true}
            scale={3.2}
            timeScale={prefersReducedMotion ? 0 : 0.3}
            suspendWhenOffscreen={true}
            lightMode={!isDark}
          />
        )}
      </div>

      {/* Universal bottom fader: guarantees 100% seamless melt into page background */}
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-background via-background/70 to-transparent pointer-events-none" />
    </div>
  );
};

export default HeroBackground;
