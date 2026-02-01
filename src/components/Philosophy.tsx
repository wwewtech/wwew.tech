'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useLanguage } from '@/lib/context';
import { InteractiveBlob } from './InteractiveBlob';

export const Philosophy = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const { t } = useLanguage();

  return (
    <section ref={ref} className="relative">
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
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="relative order-2 lg:order-1"
        >
          <InteractiveBlob />
        </motion.div>

        {/* Right: Text Content */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="order-1 lg:order-2"
        >
          <div className="pill-badge mb-8">
            <span>{t('philosophy.badge')}</span>
          </div>
          
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight mb-8 leading-[1.05]">
            <span className="text-gradient block pb-1">{t('philosophy.title1')}</span>
            <span className="text-[var(--muted)] block pb-1">{t('philosophy.title2')}</span>
          </h2>
          
          <div className="space-y-6 text-[var(--muted)] leading-relaxed">
            <p>
              {t('philosophy.text1')}{' '}
              <span className="text-[var(--foreground)]">{t('philosophy.highlight1')}</span>
            </p>
            <p>
              {t('philosophy.text2')} <span className="text-[var(--foreground)]">{t('philosophy.backend')}</span> {t('philosophy.text3')}{' '}
              <span className="text-[var(--foreground)]">{t('philosophy.frontend')}</span> {t('philosophy.text4')}
            </p>
          </div>

          {/* Stats */}
          <div className="mt-12 pt-8 border-t border-[var(--border)] flex gap-16">
            {[
              { value: '50+', label: t('philosophy.stat1') },
              { value: '3+', label: t('philosophy.stat2') },
              { value: '∞', label: t('philosophy.stat3') },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + idx * 0.1 }}
              >
                <p className="text-4xl font-medium text-[var(--foreground)] tracking-tight">{stat.value}</p>
                <p className="text-sm text-[var(--muted)] mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
