'use client';

import React from 'react';
import { useLanguage } from '@/lib/context';

export const Footer = () => {
  const { language } = useLanguage();

  return (
    <footer className="border-t border-[var(--border)] mt-32">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col items-center justify-center text-center gap-6">
          {/* Logo & Year */}
          <div className="flex items-center gap-3 text-[var(--foreground)]">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 19.5h20L12 2z" />
            </svg>
            <span className="font-medium tracking-wide">WWEW.TECH</span>
            <span className="text-[var(--muted-foreground)]">//</span>
            <span className="text-[var(--muted-foreground)]">{new Date().getFullYear()}</span>
          </div>
          
          {/* Tagline */}
          <p className="text-xs tracking-[0.2em] uppercase text-[var(--muted-foreground)]">
            {language === 'ru' ? 'Создание цифровых продуктов' : 'Building Digital Products'}
          </p>
          
          {/* Credits */}
          <p className="text-sm text-[var(--muted)]">
            {language === 'ru' ? 'Создано ' : 'Built by '}
            <a 
              href="https://t.me/your_username" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[var(--foreground)] underline underline-offset-4 hover:opacity-70 transition-opacity"
            >
              wwew
            </a>
            {language === 'ru' ? '. Исходный код доступен на ' : '. The source code is available on '}
            <a 
              href="https://github.com/username" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[var(--foreground)] underline underline-offset-4 hover:opacity-70 transition-opacity"
            >
              GitHub
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
};
