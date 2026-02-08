'use client';

import React from 'react';
import { useLanguage } from '@/context/AppContext';

export const Footer = () => {
  const { language } = useLanguage();

  return (
    <footer className="border-t border-(--border)/50 mt-32">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-(--muted)">
          
          <div className="flex items-center gap-4">
            <span className="font-mono">© {new Date().getFullYear()} wwew.tech</span>
            <span className="hidden md:block">—</span>
            <span className="text-xs">built with care</span>
          </div>

          <div className="flex items-center gap-6">
            <a 
              href="https://vercel.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs hover:text-foreground transition-colors"
            >
              vercel
            </a>
            <a 
              href="https://get.tech" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs hover:text-foreground transition-colors"
            >
              get.tech
            </a>
            <a 
              href="https://t.me/wwew_tech" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs hover:text-foreground transition-colors"
            >
              contact
            </a>
          </div>

        </div>
      </div>
    </footer>
  );
};
