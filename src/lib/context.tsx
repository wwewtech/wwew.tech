'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// ========== LANGUAGE CONTEXT ==========
type Language = 'ru' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ru: {
    // Navbar
    'nav.about': 'Обо мне',
    'nav.stack': 'Стек',
    'nav.work': 'Работы',
    'nav.contact': 'Контакты',
    'nav.contactBtn': 'Связаться',
    
    // Hero
    'hero.available': 'Открыт для проектов',
    'hero.title1': 'Создаю',
    'hero.title2': 'Цифровые',
    'hero.title3': 'Продукты',
    'hero.subtitle': 'Full-stack разработка от идеи до продакшена. Создаю быстрые, масштабируемые приложения с современной архитектурой.',
    'hero.cta1': 'Начать проект',
    'hero.cta2': 'Смотреть работы',
    
    // Philosophy
    'philosophy.badge': 'Философия',
    'philosophy.title1': 'Код решает',
    'philosophy.title2': 'Проблемы',
    'philosophy.text1': 'Мой путь — не о запоминании синтаксиса, а о создании решений. От фриланса до co-founding Open-Space, я понял, что',
    'philosophy.highlight1': 'код — это инструмент, а не цель.',
    'philosophy.text2': 'Сегодня я объединяю мощь',
    'philosophy.backend': 'Python/FastAPI',
    'philosophy.text3': 'бэкенда с магией',
    'philosophy.frontend': 'React/Next.js',
    'philosophy.text4': 'фронтенда. Создаю продукты, которые работают, масштабируются и имеют значение.',
    'philosophy.stat1': 'Проектов',
    'philosophy.stat2': 'Года',
    'philosophy.stat3': 'Идей',
    
    // Stack
    'stack.badge': 'Технологии',
    'stack.title': 'Мой арсенал',
    'stack.subtitle': 'Инструменты, которые я использую для создания масштабируемых продуктов.',
    
    // Projects
    'projects.badge': 'Портфолио',
    'projects.title': 'Избранные работы',
    'projects.subtitle': 'Проекты, которые демонстрируют мой подход к разработке.',
    'projects.viewProject': 'Открыть',
    'projects.viewCode': 'Код',
    
    // Contact
    'contact.badge': 'Контакты',
    'contact.title1': 'Давайте',
    'contact.title2': 'Работать',
    'contact.subtitle': 'Готов обсудить ваш проект. Свяжитесь любым удобным способом.',
    'contact.telegram': 'Написать в Telegram',
    'contact.email': 'Отправить Email',
    'contact.response': 'Обычно отвечаю в течение 24 часов',
    
    // Footer
    'footer.description': 'Создаю цифровые продукты, которые работают быстро и масштабируются эффективно.',
    'footer.built': 'Сделано с точностью',
  },
  en: {
    // Navbar
    'nav.about': 'About',
    'nav.stack': 'Stack',
    'nav.work': 'Work',
    'nav.contact': 'Contact',
    'nav.contactBtn': 'Contact',
    
    // Hero
    'hero.available': 'Available for Projects',
    'hero.title1': 'Build',
    'hero.title2': 'Digital',
    'hero.title3': 'Products',
    'hero.subtitle': 'Full-stack development from concept to production. Building fast, scalable applications with modern architecture.',
    'hero.cta1': 'Start a Project',
    'hero.cta2': 'View Work',
    
    // Philosophy
    'philosophy.badge': 'Philosophy',
    'philosophy.title1': 'Code Solves',
    'philosophy.title2': 'Problems',
    'philosophy.text1': "My journey isn't about memorizing syntax—it's about building solutions. From scrappy freelancing to co-founding Open-Space, I've learned that",
    'philosophy.highlight1': 'code is a tool, not the goal.',
    'philosophy.text2': 'Today I combine',
    'philosophy.backend': 'Python/FastAPI',
    'philosophy.text3': 'backend power with',
    'philosophy.frontend': 'React/Next.js',
    'philosophy.text4': 'frontend magic. Building products that work, scale, and matter.',
    'philosophy.stat1': 'Projects',
    'philosophy.stat2': 'Years',
    'philosophy.stat3': 'Ideas',
    
    // Stack
    'stack.badge': 'Technologies',
    'stack.title': 'My Arsenal',
    'stack.subtitle': 'Tools I use to build scalable products.',
    
    // Projects
    'projects.badge': 'Portfolio',
    'projects.title': 'Selected Works',
    'projects.subtitle': 'Projects that showcase my approach to development.',
    'projects.viewProject': 'View',
    'projects.viewCode': 'Code',
    
    // Contact
    'contact.badge': 'Contact',
    'contact.title1': "Let's",
    'contact.title2': 'Work',
    'contact.subtitle': 'Ready to discuss your project. Reach out any way you prefer.',
    'contact.telegram': 'Message on Telegram',
    'contact.email': 'Send Email',
    'contact.response': 'Usually respond within 24 hours',
    
    // Footer
    'footer.description': 'Building digital products that work fast and scale efficiently.',
    'footer.built': 'Built with precision',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// ========== THEME CONTEXT ==========
type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ========== PROVIDER ==========
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [language, setLanguage] = useState<Language>('ru');
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load from localStorage
    const savedLang = localStorage.getItem('language') as Language;
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedLang) setLanguage(savedLang);
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('language', language);
    }
  }, [language, mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('theme', theme);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
    }
  }, [theme, mounted]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
        {children}
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
