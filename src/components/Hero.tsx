'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/lib/context';
import { ShinyText } from './ShinyText';

export const Hero = () => {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Запускаем анимацию после монтирования
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-16 overflow-hidden bg-lines">

      {/* Decorative curved lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50 dark:opacity-100" preserveAspectRatio="none">
        <path
          d="M0 400 Q 400 200, 800 400 T 1600 400"
          stroke="var(--border)"
          fill="none"
          strokeWidth="1"
        />
        <path
          d="M0 500 Q 500 300, 1000 500 T 2000 500"
          stroke="var(--border-subtle)"
          fill="none"
          strokeWidth="1"
        />
        <path
          d="M0 600 Q 300 450, 700 600 T 1400 600"
          stroke="var(--border)"
          fill="none"
          strokeWidth="1"
        />
      </svg>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Pill Badge - CSS transition вместо framer-motion */}
        <div
          className={`pill-badge mb-10 cursor-default transition-all duration-500 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
          </span>
          <span>{t('hero.available')}</span>
        </div>

        {/* Main Title - CSS transition */}
        <h1
          className={`text-6xl md:text-8xl lg:text-9xl font-medium tracking-tight mb-8 leading-[1.05] transition-all duration-700 ease-out delay-100 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <span className="block pb-1">
            <ShinyText text={t('hero.title1')} />
          </span>
          <span className="block pb-1">
            <ShinyText text={t('hero.title2')} />
          </span>
          <span className="block pb-1">
            <ShinyText text={t('hero.title3')} />
          </span>
        </h1>

        {/* Subtitle - CSS transition */}
        <p
          className={`text-[var(--muted)] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-12 transition-all duration-600 ease-out delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}
        >
          {t('hero.subtitle')}
        </p>

        {/* CTA Buttons - CSS transition */}
        <div
          className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-600 ease-out delay-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}
        >
          <a
            href="#contact"
            className="group flex items-center gap-2 px-8 py-4 rounded-full bg-[var(--foreground)] text-[var(--background)] font-medium hover:opacity-90 transition-all select-none"
          >
            {t('hero.cta1')}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </a>

          <a
            href="#projects"
            className="flex items-center gap-2 px-8 py-4 rounded-full border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground)]/30 transition-all"
          >
            {t('hero.cta2')}
          </a>
        </div>
      </div>


    </section>
  );
};
