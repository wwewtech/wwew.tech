'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useLanguage } from '@/lib/context';

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
        {/* Left: Visual */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="relative order-2 lg:order-1"
        >
          <div className="relative aspect-square max-w-md mx-auto">
            {/* Abstract 3D-like visual */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-64 h-64">
                {/* Radial lines effect - like v2RayTun turbine */}
                {[...Array(36)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-1/2 top-1/2 w-32 h-[1px] origin-left"
                    style={{
                      transform: `rotate(${i * 10}deg)`,
                      background: `linear-gradient(90deg, var(--muted) 0%, transparent 100%)`,
                      opacity: 0.1 + (i % 3) * 0.05
                    }}
                  />
                ))}
                {/* Center circle */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-[var(--border-subtle)] border border-[var(--border)]" />
                </div>
              </div>
            </div>
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-radial from-[var(--border-subtle)] to-transparent rounded-full blur-3xl" />
          </div>
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
          
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight mb-8 leading-[0.95]">
            <span className="text-gradient block">{t('philosophy.title1')}</span>
            <span className="text-[var(--muted)] block">{t('philosophy.title2')}</span>
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
