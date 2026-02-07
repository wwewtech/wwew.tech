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
    setIsMobile(isMobileDevice());
  }, []);

  useEffect(() => {
    // На мобильных устройствах используем нативный скролл
    if (isMobile) return;

    // Defer Lenis initialization to not block main thread during FCP/LCP
    const initTimeout = setTimeout(() => {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        // Не перехватываем touch события
        touchMultiplier: 0,
        infinite: false,
        // Отключаем на touch устройствах
        syncTouch: false,
        syncTouchLerp: 0,
      });

      let rafId: number;
      function raf(time: number) {
        lenis.raf(time);
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
            if (element) {
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
        lenis.destroy();
        document.removeEventListener('click', handleAnchorClick);
      };
    }, 100); // Small delay to let critical rendering finish

    return () => {
      clearTimeout(initTimeout);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cleanup = (window as any).__lenisCleanup as (() => void) | undefined;
      if (cleanup) {
        cleanup();
        delete (window as any).__lenisCleanup;
      }
    };
  }, [isMobile]);

  return <>{children}</>;
};
