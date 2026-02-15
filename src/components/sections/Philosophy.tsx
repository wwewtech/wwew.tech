'use client';

import React, { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useLanguage, useTheme } from '@/context/AppContext';

// Lazy load HolographicScene для улучшения TBT
const HolographicScene = dynamic(
  () => import('@/components/ui/HolographicScene').then(mod => mod.HolographicScene),
  { 
    ssr: false,
    loading: () => (
      <div className="aspect-square max-w-lg mx-auto flex items-center justify-center">
        <div className="w-32 h-32 rounded-full border border-(--border) opacity-20 animate-pulse" />
      </div>
    )
  }
);

export const Philosophy = () => {
  const ref = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);
  const { t } = useLanguage();
  const { theme } = useTheme();

  // IntersectionObserver вместо framer-motion
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '-100px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative overflow-hidden">
      {/* Decorative lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" preserveAspectRatio="none">
        <path
          d="M0 200 Q 300 100, 600 200 T 1200 200"
          stroke="var(--border)"
          fill="none"
          strokeWidth="1"
        />
      </svg>

      <div className="grid lg:grid-cols-2 gap-20 items-center relative">
        {/* Left: Interactive 3D Visual */}
        <div
          style={{
            opacity: isInView ? 1 : 0,
            transition: 'opacity 0.8s ease',
          }}
          className="relative order-2 lg:order-1"
        >
          <HolographicScene key={theme} />
        </div>

        {/* Right: Text Content */}
        <div
          style={{
            opacity: isInView ? 1 : 0,
            transform: isInView ? 'translateX(0)' : 'translateX(30px)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
          }}
          className="order-1 lg:order-2"
        >
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight mb-8 leading-[1.05]">
            <span className="text-gradient block pb-1">{t('philosophy.title1')}</span>
            <span className="text-(--muted) block pb-1">{t('philosophy.title2')}</span>
          </h2>
          
          <div className="space-y-6 text-(--muted) leading-relaxed">
            <p>
              {t('philosophy.text1')}{' '}
              <span className="text-foreground">{t('philosophy.highlight1')}</span>
            </p>
            <p>
              {t('philosophy.text2')} <span className="text-foreground">{t('philosophy.backend')}</span> {t('philosophy.text3')}{' '}
              <span className="text-foreground">{t('philosophy.frontend')}</span> {t('philosophy.text4')}
            </p>
          </div>

          {/* Stats */}
          <div className="mt-12 pt-8 border-t border-(--border) flex gap-16">
            {[
              { value: '50+', label: t('philosophy.stat1') },
              { value: '3+', label: t('philosophy.stat2') },
              { value: '∞', label: t('philosophy.stat3') },
            ].map((stat, idx) => (
              <div
                key={idx}
                style={{
                  opacity: isInView ? 1 : 0,
                  transform: isInView ? 'translateY(0)' : 'translateY(20px)',
                  transition: `opacity 0.5s ease ${0.3 + idx * 0.1}s, transform 0.5s ease ${0.3 + idx * 0.1}s`,
                }}
              >
                <p className="text-4xl font-medium text-foreground tracking-tight">{stat.value}</p>
                <p className="text-sm text-(--muted) mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
