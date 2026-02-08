'use client';

import { ReactNode, useEffect, useState } from 'react';
import Lenis from 'lenis';

interface LenisProviderProps {
  children: ReactNode;
}

// Определение мобильного устройства
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
    || window.matchMedia('(max-width: 768px)').matches
    || 'ontouchstart' in window;
};

export const LenisProvider = ({ children }: LenisProviderProps) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Force check on mount
    setIsMobile(isMobileDevice());

    const handleResize = () => {
      setIsMobile(isMobileDevice());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // На мобильных устройствах используем нативный скролл и полностью отключаем Lenis
    if (isMobile) {
      document.documentElement.classList.remove('lenis', 'lenis-smooth');
      return;
    }

    let lenis: Lenis | null = null;
    let rafId: number;

    // Defer Lenis initialization to not block main thread during FCP/LCP
    const initTimeout = setTimeout(() => {
      // Double check mobile state before creating instance
      if (isMobileDevice()) return;

      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        // Полностью отключаем обработку тач-событий в Lenis
        touchMultiplier: 0,
        infinite: false,
        syncTouch: false,
        syncTouchLerp: 0,
      });

      function raf(time: number) {
        lenis?.raf(time);
        rafId = requestAnimationFrame(raf);
      }

      rafId = requestAnimationFrame(raf);

      // Handle anchor links for smooth scroll
      const handleAnchorClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const anchor = target.closest('a[href^="#"]');
        if (anchor) {
          const href = anchor.getAttribute('href');
          if (href && href.length > 1) {
            e.preventDefault();
            const element = document.querySelector(href);
            if (element && lenis) {
              lenis.scrollTo(element as HTMLElement);
            }
          }
        }
      };

      document.addEventListener('click', handleAnchorClick);

      // Store cleanup reference
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__lenisCleanup = () => {
        cancelAnimationFrame(rafId);
        lenis?.destroy();
        document.removeEventListener('click', handleAnchorClick);
      };
    }, 100); 

    return () => {
      clearTimeout(initTimeout);
      if (rafId) cancelAnimationFrame(rafId);
      if (lenis) {
        lenis.destroy();
        lenis = null;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cleanup = (window as any).__lenisCleanup as (() => void) | undefined;
      if (cleanup) {
        cleanup();
        delete (window as any).__lenisCleanup;
      }
      document.documentElement.classList.remove('lenis', 'lenis-smooth');
    };
  }, [isMobile]);

  return <>{children}</>;
};
