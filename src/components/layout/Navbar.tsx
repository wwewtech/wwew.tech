'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowUpRight, Sun, Moon, Languages, Droplet, DropletOff } from 'lucide-react';
import { useLanguage, useTheme, useFluidCursor } from '@/context/AppContext';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { isFluidCursorEnabled, toggleFluidCursor } = useFluidCursor();

  const navItems = [
    { label: t('nav.about'), href: '#about' },
    { label: t('nav.stack'), href: '#stack' },
    { label: t('nav.work'), href: '#projects' },
    { label: t('nav.contact'), href: '#contact' },
  ];

  useEffect(() => {
    // Анимация появления
    setIsVisible(true);
    
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLanguageToggle = () => {
    setLanguage(language === 'ru' ? 'en' : 'ru');
  };

  return (
    <>
      {/* Navbar - Premium minimal */}
      <div
        style={{
          transform: isVisible ? 'translateY(0)' : 'translateY(-100px)',
          opacity: isVisible ? 1 : 0,
          transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <nav
          className={`transition-all duration-300 border-b ${
            isScrolled
              ? 'bg-(--background)/90 backdrop-blur-xl border-(--border)'
              : 'bg-transparent border-transparent'
          }`}
        >
          {/* Центрированный контейнер */}
          <div className="max-w-7xl mx-auto h-16 flex items-center justify-between px-6">
            {/* Logo */}
            <a href="#" className="flex items-center gap-2.5 group">
              <svg className="w-6 h-6 text-foreground" viewBox="0 0 24 24" fill="currentColor">
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
            <div className="hidden md:flex items-center gap-2">
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
              <button
                onClick={handleLanguageToggle}
                className="relative flex items-center gap-1.5 px-3 py-2 rounded-full text-sm text-(--muted) hover:text-foreground hover:bg-(--border-subtle) transition-all duration-200"
                aria-label="Toggle language"
              >
                <Languages className="w-4 h-4" />
                <span className="uppercase font-medium">
                  {language}
                </span>
              </button>

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
                href="https://t.me/wwew_tech"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-5 py-2 ml-2 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-all duration-200 select-none"
              >
                {t('nav.contactBtn')}
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>

            {/* Mobile: Theme, Language & Menu Toggle */}
            <div className="md:hidden flex items-center gap-1">
              {/* Fluid Cursor Toggle Mobile */}
              <button
                onClick={toggleFluidCursor}
                className="p-2 rounded-full text-(--muted) hover:text-foreground hover:bg-(--border-subtle) transition-colors"
                aria-label="Toggle fluid cursor"
              >
                {isFluidCursorEnabled ? <Droplet className="w-5 h-5" /> : <DropletOff className="w-5 h-5" />}
              </button>

              {/* Language Toggle Mobile */}
              <button
                onClick={handleLanguageToggle}
                className="p-2 rounded-full text-(--muted) hover:text-foreground hover:bg-(--border-subtle) transition-colors"
                aria-label="Toggle language"
              >
                <span className="text-xs font-medium uppercase">{language}</span>
              </button>

              {/* Theme Toggle Mobile */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-(--muted) hover:text-foreground hover:bg-(--border-subtle) transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-full hover:bg-(--border-subtle) transition-colors"
                aria-label={isMobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-(--muted)" />
                ) : (
                  <Menu className="w-5 h-5 text-(--muted)" />
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
            className="absolute inset-0 bg-(--background)/98"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div
            className="absolute top-16 left-0 right-0 p-6 border-b border-(--border)"
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
                href="https://t.me/wwew_tech"
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
