'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowUpRight, Sun, Moon, Languages } from 'lucide-react';
import { useLanguage, useTheme } from '@/lib/context';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { label: t('nav.about'), href: '#about' },
    { label: t('nav.stack'), href: '#stack' },
    { label: t('nav.work'), href: '#projects' },
    { label: t('nav.contact'), href: '#contact' },
  ];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLanguageToggle = () => {
    setLanguage(language === 'ru' ? 'en' : 'ru');
  };

  return (
    <>
      {/* Navbar - Premium minimal */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <nav
          className={`transition-all duration-300 border-b ${
            isScrolled
              ? 'bg-[var(--background)]/90 backdrop-blur-xl border-[var(--border)]'
              : 'bg-transparent border-transparent'
          }`}
        >
          {/* Центрированный контейнер */}
          <div className="max-w-7xl mx-auto h-16 flex items-center justify-between px-6">
            {/* Logo */}
            <a href="#" className="flex items-center gap-2.5 group">
              <svg className="w-6 h-6 text-[var(--foreground)]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 19.5h20L12 2z" />
              </svg>
              <span className="font-medium text-[var(--foreground)]">
                wwew.tech
              </span>
            </a>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="px-4 py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors duration-200"
                >
                  {item.label}
                </a>
              ))}
            </div>

            {/* Right Side: Theme, Language, CTA */}
            <div className="hidden md:flex items-center gap-2">
              {/* Language Toggle */}
              <button
                onClick={handleLanguageToggle}
                className="relative flex items-center gap-1.5 px-3 py-2 rounded-full text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border-subtle)] transition-all duration-200"
                aria-label="Toggle language"
              >
                <Languages className="w-4 h-4" />
                <AnimatePresence mode="wait">
                  <motion.span
                    key={language}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="uppercase font-medium"
                  >
                    {language}
                  </motion.span>
                </AnimatePresence>
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border-subtle)] transition-all duration-200 theme-toggle"
                aria-label="Toggle theme"
              >
                <AnimatePresence mode="wait">
                  {theme === 'dark' ? (
                    <motion.div
                      key="sun"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Sun className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Moon className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>

              {/* CTA Button */}
              <a
                href="https://t.me/your_username"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-5 py-2 ml-2 rounded-full bg-[var(--foreground)] text-[var(--background)] text-sm font-medium hover:opacity-90 transition-all duration-200 select-none"
              >
                {t('nav.contactBtn')}
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>

            {/* Mobile: Theme, Language & Menu Toggle */}
            <div className="md:hidden flex items-center gap-1">
              {/* Language Toggle Mobile */}
              <button
                onClick={handleLanguageToggle}
                className="p-2 rounded-full text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border-subtle)] transition-colors"
                aria-label="Toggle language"
              >
                <span className="text-xs font-medium uppercase">{language}</span>
              </button>

              {/* Theme Toggle Mobile */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border-subtle)] transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-full hover:bg-[var(--border-subtle)] transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-[var(--muted)]" />
                ) : (
                  <Menu className="w-5 h-5 text-[var(--muted)]" />
                )}
              </button>
            </div>
          </div>
        </nav>
      </motion.div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div
              className="absolute inset-0 bg-[var(--background)]/98"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-16 left-0 right-0 p-6 border-b border-[var(--border)]"
            >
              {navItems.map((item, idx) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="block px-4 py-4 text-[var(--muted)] hover:text-[var(--foreground)] border-b border-[var(--border-subtle)] transition-colors"
                >
                  {item.label}
                </motion.a>
              ))}
              <div className="mt-6">
                <a
                  href="https://t.me/your_username"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-4 rounded-full bg-[var(--foreground)] text-[var(--background)] text-sm font-medium"
                >
                  {t('nav.contactBtn')}
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
