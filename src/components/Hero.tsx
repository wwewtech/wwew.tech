'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/lib/context';
import { ShinyText } from './ShinyText';

export const Hero = () => {
  const { t } = useLanguage();

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
        {/* Pill Badge - v2RayTun style with glow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="pill-badge mb-10 cursor-default"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
          </span>
          <span>{t('hero.available')}</span>
        </motion.div>

        {/* Main Title - Massive typography */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-6xl md:text-8xl lg:text-9xl font-medium tracking-tight mb-8 leading-[1.05]"
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
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-[var(--muted)] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-12"
        >
          {t('hero.subtitle')}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
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
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-6 h-10 rounded-full border border-[var(--border)] flex items-start justify-center p-2"
        >
          <div className="w-1 h-2 bg-[var(--muted)] rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
};
