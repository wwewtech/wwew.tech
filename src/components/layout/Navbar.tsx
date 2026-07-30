'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, ArrowUpRight, Sun, Moon, Languages, Droplet, DropletOff } from 'lucide-react';
import { useLanguage, useTheme, useFluidCursor } from '@/context/AppContext';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { language, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { isFluidCursorEnabled, toggleFluidCursor } = useFluidCursor();

  const navItems = [
    { label: t('nav.about'), href: '#about' },
    { label: t('nav.stack'), href: '#stack' },
    { label: t('nav.contact'), href: '#contact' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const nativeRoot = document.getElementById('native-scroll-root');
      const scrollY = nativeRoot ? Math.max(window.scrollY, nativeRoot.scrollTop) : window.scrollY;
      setIsScrolled(scrollY > 20);
    };

    handleScroll();

    document.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('scroll', handleScroll, { capture: true });
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const currentLangInUrl = pathname.startsWith('/en') ? 'en' : pathname.startsWith('/ru') ? 'ru' : language;
  const targetLang = currentLangInUrl === 'ru' ? 'en' : 'ru';
  let targetLangUrl = pathname;
  if (pathname.startsWith(`/${currentLangInUrl}`)) {
    targetLangUrl = pathname.replace(`/${currentLangInUrl}`, `/${targetLang}`);
  } else {
    targetLangUrl = `/${targetLang}${pathname === '/' ? '' : pathname}`;
  }

  return (
    <>
      {/* Navbar - Premium minimal */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <nav
          className={`transition-all duration-300 border-b ${
            isScrolled || isMobileMenuOpen
              ? 'bg-background/90 backdrop-blur-xl border-(--border)'
              : 'bg-transparent border-transparent'
          }`}
        >
          {/* Центрированный контейнер */}
          <div className="max-w-7xl mx-auto h-16 flex md:grid md:grid-cols-[1fr_auto_1fr] items-center justify-between px-4 md:px-6">
            {/* Logo */}
            <a href="#" className="flex items-center gap-2.5 group">
              <svg className="w-6 h-6 text-foreground transition-transform duration-200 group-hover:scale-105" viewBox="0 0 24 24" fill="currentColor">
                <rect x="5" y="5" width="14" height="14" rx="2" transform="rotate(45 12 12)" />
              </svg>
              <span className="font-medium text-foreground">
                wwew.tech
              </span>
            </a>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="px-4 py-2 text-sm text-(--muted) hover:text-foreground transition-colors duration-200"
                >
                  {item.label}
                </a>
              ))}
            </div>

            {/* Right Side: Theme, Language, CTA */}
            <div className="hidden md:flex items-center gap-2 justify-self-end">
              {/* Fluid Cursor Toggle */}
              <button
                onClick={toggleFluidCursor}
                className="relative flex items-center gap-1.5 px-3 py-2 rounded-full text-sm text-(--muted) hover:text-foreground hover:bg-(--border-subtle) transition-all duration-200"
                aria-label="Toggle fluid cursor"
                title={isFluidCursorEnabled ? t('nav.cursorOff') : t('nav.cursorOn')}
              >
                {isFluidCursorEnabled ? (
                  <Droplet className="w-4 h-4" />
                ) : (
                  <DropletOff className="w-4 h-4" />
                )}
              </button>

              {/* Language Toggle */}
              <Link
                href={targetLangUrl}
                scroll={false}
                className="relative flex items-center gap-1.5 px-3 py-2 rounded-full text-sm text-(--muted) hover:text-foreground hover:bg-(--border-subtle) transition-all duration-200"
                aria-label="Toggle language"
              >
                <Languages className="w-4 h-4" />
                <span className="uppercase font-medium">
                  {language}
                </span>
              </Link>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-(--muted) hover:text-foreground hover:bg-(--border-subtle) transition-all duration-200 theme-toggle"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              {/* CTA Button */}
              <a
                href="https://t.me/wwewtech"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-5 py-2 ml-2 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-all duration-200 select-none"
              >
                {t('nav.contactBtn')}
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>

            {/* Mobile: Theme, Language & Menu Toggle */}
            <div className="md:hidden flex items-center gap-1 justify-self-end">
              <Link
                href={targetLangUrl}
                scroll={false}
                className="relative flex items-center gap-1.5 px-3 py-2 rounded-full text-sm text-(--muted) hover:text-foreground hover:bg-(--border-subtle) transition-all duration-200"
                aria-label="Toggle language"
              >
                <Languages className="w-4 h-4" />
                <span className="uppercase font-medium">
                  {language}
                </span>
              </Link>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-(--muted) hover:text-foreground hover:bg-(--border-subtle) transition-all duration-200 theme-toggle"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-full text-(--muted) hover:text-foreground hover:bg-(--border-subtle) transition-colors"
                aria-label={isMobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div
            className="absolute top-16 left-0 right-0 p-6 bg-background/95 backdrop-blur-xl border-b border-(--border) shadow-2xl"
            style={{
              animation: 'fadeIn 0.2s ease',
            }}
          >
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-4 text-(--muted) hover:text-foreground border-b border-(--border-subtle) transition-colors"
              >
                {item.label}
              </a>
            ))}
            <div className="mt-6">
              <a
                href="https://t.me/wwewtech"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-4 rounded-full bg-foreground text-background text-sm font-medium"
              >
                {t('nav.contactBtn')}
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
