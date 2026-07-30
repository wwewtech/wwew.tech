'use client';

import { ReactNode, useEffect } from 'react';

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

    const timerId = setTimeout(() => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          if (!isDisposed) {
            initLenis().then((result) => { cleanup = result; });
          }
        });
      } else {
        initLenis().then((result) => { cleanup = result; });
      }
    }, 1500);

    return () => {
      isDisposed = true;
      clearTimeout(timerId);
      cleanup?.();
    };
  }, []);

  return <div id="native-scroll-root">{children}</div>;
};
