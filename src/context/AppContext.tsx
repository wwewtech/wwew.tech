'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { isMobileDevice, checkReducedMotion } from '@/lib/device';
import { translations, type Language, type TranslationKey } from '@/i18n/translations';

export type { Language };

// ========== LANGUAGE CONTEXT ==========
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// ========== THEME CONTEXT ==========
type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ========== FLUID CURSOR CONTEXT ==========
interface FluidCursorContextType {
  isFluidCursorEnabled: boolean;
  setFluidCursorEnabled: (enabled: boolean) => void;
  toggleFluidCursor: () => void;
  mounted: boolean;
  isMobile: boolean;
  prefersReducedMotion: boolean;
}

const FluidCursorContext = createContext<FluidCursorContextType | undefined>(undefined);

// ========== PROVIDER ==========
interface AppProviderProps {
  children: ReactNode;
  initialLanguage?: Language;
}

export const AppProvider = ({ children, initialLanguage = 'ru' }: AppProviderProps) => {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [theme, setTheme] = useState<Theme>('dark');
  const [isFluidCursorEnabled, setFluidCursorEnabled] = useState(false); // Выключен по умолчанию
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Hydration-safe client-only initialization: these setState calls run once
    // on mount to read window-only values that can't be computed during SSR.
    setMounted(true);

    const mobile = isMobileDevice();
    const reducedMotion = checkReducedMotion();
    setIsMobile(mobile);
    setPrefersReducedMotion(reducedMotion);

    // Load from localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    const savedCursor = localStorage.getItem('fluidCursor');
    if (savedTheme) setTheme(savedTheme);

    // На мобильных и при reduced motion всегда отключён
    if (mobile || reducedMotion) {
      setFluidCursorEnabled(false);
    } else if (savedCursor !== null) {
      // Загружаем сохранённое значение только если оно есть
      setFluidCursorEnabled(savedCursor === 'true');
    }
    // Если нет сохранённого значения - оставляем выключенным (дефолт)

    // Слушаем изменения prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
      if (e.matches) setFluidCursorEnabled(false);
    };
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Keep language state in sync with initialLanguage prop from route params
  useEffect(() => {
    setLanguage(initialLanguage);
  }, [initialLanguage]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('theme', theme);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
    }
  }, [theme, mounted]);

  const t = (key: TranslationKey): string => {
    return translations[language][key];
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const toggleFluidCursor = () => {
    setFluidCursorEnabled(prev => {
      const newValue = !prev;
      if (mounted) localStorage.setItem('fluidCursor', String(newValue));
      return newValue;
    });
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
        <FluidCursorContext.Provider value={{
          isFluidCursorEnabled,
          setFluidCursorEnabled,
          toggleFluidCursor,
          mounted,
          isMobile,
          prefersReducedMotion
        }}>
          {children}
        </FluidCursorContext.Provider>
      </ThemeContext.Provider>
    </LanguageContext.Provider>
  );
};

// ========== HOOKS ==========
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within AppProvider');
  return context;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within AppProvider');
  return context;
};

export const useFluidCursor = () => {
  const context = useContext(FluidCursorContext);
  if (!context) throw new Error('useFluidCursor must be used within AppProvider');
  return context;
};
