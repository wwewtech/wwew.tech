'use client';

import { useEffect, type ReactNode } from 'react';

interface LenisProviderProps {
  children: ReactNode;
}

const shouldUseNativeScroll = () => {
  if (typeof window === 'undefined') return false;

  const userAgent = navigator.userAgent || navigator.vendor;
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const noHover = window.matchMedia('(hover: none)').matches;
  const smallViewport = window.matchMedia('(max-width: 1024px)').matches;

  return isIOS || (hasCoarsePointer && (noHover || smallViewport));
};

const isIOSDevice = () => {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent || navigator.vendor;
  return /iPhone|iPad|iPod/i.test(userAgent);
};

export const LenisProvider = ({ children }: LenisProviderProps) => {
  useEffect(() => {
    let lenisInstance: { destroy: () => void; scrollTo: (target: HTMLElement, options?: { duration?: number }) => void } | null = null;
    let isDisposed = false;

    const initLenis = async () => {
      const nativeScroll = shouldUseNativeScroll();
      const ios = isIOSDevice();

      if (nativeScroll) {
        document.documentElement.classList.remove('lenis', 'lenis-smooth');

        if (ios) {
          document.documentElement.classList.add('ios-native-scroll');
          document.body.classList.add('ios-native-scroll');
        }

        return () => {
          document.documentElement.classList.remove('ios-native-scroll');
          document.body.classList.remove('ios-native-scroll');
        };
      }

      document.documentElement.classList.remove('ios-native-scroll');
      document.body.classList.remove('ios-native-scroll');

      const { default: Lenis } = await import('lenis');
      if (isDisposed) return;

      lenisInstance = new Lenis({
        duration: 1.05,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        infinite: false,
        autoRaf: true,
        smoothWheel: true,
        syncTouch: false,
        touchMultiplier: 1,
        wheelMultiplier: 0.9,
      });

      const handleAnchorClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const anchor = target.closest('a[href^="#"]');
        if (!anchor) return;

        const href = anchor.getAttribute('href');
        if (!href || href.length <= 1) return;

        const element = document.querySelector(href);
        if (!element) return;

        e.preventDefault();
        lenisInstance?.scrollTo(element as HTMLElement, { duration: 0.9 });
      };

      document.addEventListener('click', handleAnchorClick);

      return () => {
        document.removeEventListener('click', handleAnchorClick);
        lenisInstance?.destroy();
        document.documentElement.classList.remove('lenis', 'lenis-smooth');
      };
    };

    let cleanup: (() => void) | undefined;
    let settled = false;

    // Initialise before the first scroll, not at it.
    //
    // Measured with fps-scroll.mjs (rAF recorder + real wheel events): when
    // the chunk import + `new Lenis()` ran at the first wheel event, that
    // frame spiked to 650-667ms while every burst after it stayed flat at
    // 17-18ms. On a laptop that reads as "the site stutters when I start
    // scrolling". requestIdleCallback alone was not enough to prevent that:
    // there is no guarantee the idle slot fires before the user scrolls
    // (in a background tab it does not fire at all), so the init could still
    // land on the first gesture.
    //
    // Two-stage init closes both windows:
    //   1. immediately after hydration, `import('lenis')` warms the module
    //      (network/cache fetch off the critical path, nothing runs yet);
    //   2. construction happens at the earlier of "browser idle" or a
    //      700ms fallback timer - bounded, so it can no longer collide with
    //      a fast first scroll the way an un-fired idle callback could.
    // A second init call is a no-op via `settled`; the rejection handlers
    // keep a failed import from surfacing as an unhandled rejection.
    const buildOnce = () => {
      if (settled || isDisposed) return;
      settled = true;
      if (timerId !== undefined) clearTimeout(timerId);
      if (idleId !== undefined && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
      initLenis().then((result) => { cleanup = result; }).catch(() => {});
    };

    // Stage 1: warm the chunk straight away.
    void import('lenis').catch(() => {});

    // Stage 2: construct at idle or at 700ms, whichever comes first.
    let idleId: number | undefined;
    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(buildOnce);
    } else {
      idleId = window.setTimeout(buildOnce, 0);
    }
    const timerId = window.setTimeout(buildOnce, 700);

    return () => {
      isDisposed = true;
      if (timerId !== undefined) clearTimeout(timerId);
      if (idleId !== undefined) {
        if (typeof window.cancelIdleCallback === 'function') {
          window.cancelIdleCallback(idleId);
        } else {
          clearTimeout(idleId);
        }
      }
      cleanup?.();
    };
  }, []);

  return <div id="native-scroll-root">{children}</div>;
};
