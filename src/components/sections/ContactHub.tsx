'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Send, Mail, Github, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/AppContext';

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
  const ref = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);
  const { t } = useLanguage();

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
        <div
          style={{
            opacity: isInView ? 1 : 0,
            transform: isInView ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight mb-6 leading-[1.05]">
            <span className="text-gradient block pb-1">{t('contact.title1')}</span>
            <span className="text-(--muted) block pb-1">{t('contact.title2')}</span>
          </h2>
          <p className="text-(--muted) text-lg max-w-xl mx-auto mb-12">
            {t('contact.subtitle')}
          </p>
        </div>

        {/* Contact Links - horizontal */}
        <div
          style={{
            opacity: isInView ? 1 : 0,
            transform: isInView ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s',
          }}
          className="flex flex-wrap justify-center gap-6 mb-14"
        >
          {contacts.map((contact) => (
            <a
              key={contact.name}
              href={contact.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 px-5 py-3 rounded-full border border-(--border) hover:border-(--foreground)/20 bg-(--border-subtle) hover:bg-(--border) transition-all"
            >
              <contact.icon className="w-5 h-5 text-(--muted) group-hover:text-foreground transition-colors" />
              <span className="text-(--muted) group-hover:text-foreground transition-colors">{contact.value}</span>
            </a>
          ))}
        </div>

        {/* CTA Button */}
        <div
          style={{
            opacity: isInView ? 1 : 0,
            transition: 'opacity 0.5s ease 0.4s',
          }}
        >
          <a
            href="https://t.me/wwew_tech"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3 px-10 py-5 rounded-full bg-foreground text-background font-medium text-lg hover:opacity-90 transition-all select-none"
          >
            {t('contact.telegram')}
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  );
};
