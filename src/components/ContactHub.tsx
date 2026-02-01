'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Send, Mail, Github, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/lib/context';

const contacts = [
  { 
    name: 'Telegram', 
    value: '@wwew_tech',
    href: 'https://t.me/wwew_tech', 
    icon: Send,
  },
  { 
    name: 'Email', 
    value: 'loiwerde666@gmail.com',
    href: 'mailto:loiwerde666@gmail.com', 
    icon: Mail,
  },
  { 
    name: 'GitHub', 
    value: 'github.com/wwewtech',
    href: 'https://github.com/wwewtech', 
    icon: Github,
  },
];

export const ContactHub = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const { t } = useLanguage();

  return (
    <section ref={ref} className="relative">
      {/* Decorative lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
        <path
          d="M0 100 Q 400 0, 800 100 T 1600 100"
          stroke="var(--border-subtle)"
          fill="none"
          strokeWidth="1"
        />
        <path
          d="M0 200 Q 300 100, 600 200 T 1200 200"
          stroke="var(--border-subtle)"
          fill="none"
          strokeWidth="1"
        />
      </svg>

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="pill-badge mx-auto mb-8">
            <span>{t('contact.badge')}</span>
          </div>
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight mb-6 leading-[1.05]">
            <span className="text-gradient block pb-1">{t('contact.title1')}</span>
            <span className="text-[var(--muted)] block pb-1">{t('contact.title2')}</span>
          </h2>
          <p className="text-[var(--muted)] text-lg max-w-xl mx-auto mb-12">
            {t('contact.subtitle')}
          </p>
        </motion.div>

        {/* Contact Links - horizontal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-6 mb-14"
        >
          {contacts.map((contact, idx) => (
            <a
              key={contact.name}
              href={contact.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 px-5 py-3 rounded-full border border-[var(--border)] hover:border-[var(--foreground)]/20 bg-[var(--border-subtle)] hover:bg-[var(--border)] transition-all"
            >
              <contact.icon className="w-5 h-5 text-[var(--muted)] group-hover:text-[var(--foreground)] transition-colors" />
              <span className="text-[var(--muted)] group-hover:text-[var(--foreground)] transition-colors">{contact.value}</span>
            </a>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <a
            href="https://t.me/wwew_tech"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3 px-10 py-5 rounded-full bg-[var(--foreground)] text-[var(--background)] font-medium text-lg hover:opacity-90 transition-all select-none"
          >
            {t('contact.telegram')}
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};
