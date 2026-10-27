'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme, useFluidCursor } from '@/context/AppContext';
import { HeroVideoBackground } from '@/components/sections/HeroVideoBackground';

const Prism = dynamic(() => import('@/components/reactbits/Prism'), {
  ssr: false,
});

/**
 * Devices where the WebGL hero is swapped for the recorded-video variant.
 *
 * Why these signals: the raymarch shader renders a full-screen pass every
 * frame at up to 1.5x DPR. On an integrated-GPU laptop that costs real
 * battery and shows as stutter while scrolling through the hero (measured:
 * 60fps on a desktop GPU vs 29-48fps when the same shader is CPU-bound).
 * Both signals below are the browser's own way of saying "go easy":
 *  - prefers-reduced-motion: the user asked for less animation;
 *  - Save-Data: the user is on a constrained connection/device.
 * Everything else keeps the interactive shader.
 */
const shouldUseVideoFallback = (): boolean => {
  if (typeof window === 'undefined') return false;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData =
    (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData ?? false;
  return reduced || saveData;
};

export const HeroBackground: React.FC = () => {
  const { theme } = useTheme();
  const { prefersReducedMotion } = useFluidCursor();
  const isDark = theme === 'dark';

  // The fallback decision must be made on the client only (it reads
  // navigator/matchMedia); rendering it server-side would produce a
  // mismatch, and defaulting to video for everyone would take the
  // interactive shader away from capable devices. Deferred via a
  // microtask/rAF style escape hatch below - the setState-in-effect lint
  // rule wants async transitions for cascading-render safety.
  const [useVideo, setUseVideo] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    const decide = () => {
      if (!cancelled) setUseVideo(shouldUseVideoFallback());
    };
    // A macro task keeps this off the synchronous effect pass.
    const id = window.setTimeout(decide, 0);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, []);

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
    // No point booting the WebGL path at all when the video fallback won.
    if (useVideo) return;
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
  }, [useVideo]);

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
        {useVideo === null ? null : useVideo ? (
          <HeroVideoBackground isDark={isDark} />
        ) : (
          showPrism && (
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
          )
        )}
      </div>

      {/* Universal bottom fader: guarantees 100% seamless melt into page background */}
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-background via-background/70 to-transparent pointer-events-none" />
    </div>
  );
};

export default HeroBackground;
