'use client';

import { createContext, useContext, useEffect, useSyncExternalStore, ReactNode } from 'react';

// ========== LANGUAGE CONTEXT ==========
type Language = 'ru' | 'en';

interface LanguageContextType {
  language: Language;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ru: {
    // Navbar
    'nav.about': 'Обо мне',
    'nav.stack': 'Стек',
    'nav.contact': 'Контакты',
    'nav.contactBtn': 'Связаться',
    'nav.cursorOn': 'Эффект вкл',
    'nav.cursorOff': 'Эффект выкл',
    
    // Hero
    'hero.available': 'Открыт для проектов',
    'hero.title1': 'Разработка',
    'hero.title2': 'Цифровых',
    'hero.title3': 'Продуктов',
    'hero.subtitle': 'Full-stack разработка от идеи до продакшена. Создаю быстрые, масштабируемые решения с современной архитектурой.',
    'hero.cta1': 'Начать проект',
    'hero.cta2': 'Смотреть стек',
    
    // Philosophy
    'philosophy.badge': 'Философия',
    'philosophy.title1': 'Цифровой',
    'philosophy.title2': 'Стиль',
    'philosophy.text1': 'Разработка — это процесс поиска баланса между функциональностью и формой. Хороший продукт должен быть незаметным, интуитивным и надежным,',
    'philosophy.highlight1': 'решая задачи без лишнего шума.',
    'philosophy.text2': 'Современные приложения строятся на фундаменте',
    'philosophy.backend': 'стабильной логики',
    'philosophy.text3': 'и',
    'philosophy.frontend': 'визуальной гармонии.',
    'philosophy.text4': 'Любые цифровые решения должны служить людям, а технологии — расширять возможности, не усложняя взаимодействия.',
    'philosophy.stat1': 'Проектов',
    'philosophy.stat2': 'Года',
    'philosophy.stat3': 'Идей',
    
    // Stack
    'stack.badge': 'Технологии',
    'stack.title': 'Мой стек',
    'stack.subtitle': 'Инструменты, которые я использую для создания масштабируемых продуктов.',
    
    // Contact
    'contact.badge': 'Контакты',
    'contact.title1': 'Давайте',
    'contact.title2': 'Работать',
    'contact.subtitle': 'Готов обсудить ваш проект. Свяжитесь любым удобным способом.',
    'contact.subtitleTeam': 'Команда OpenSpace — комплексная веб-разработка, AI-решения и масштабируемые проекты под ключ.',
    'contact.tabPersonal': 'Со мной',
    'contact.tabTeam': 'С командой',
    'contact.telegram': 'Написать в Telegram',
    'contact.email': 'Отправить Email',
    'contact.response': 'Обычно отвечаю в течение 24 часов',
    'contact.teamWebsite': 'Перейти на openspacedev.ru',
    
    // Footer
    'footer.description': 'Создаю цифровые продукты, которые работают быстро и масштабируются эффективно.',
    'footer.built': 'Сделано с точностью',
  },
  en: {
    // Navbar
    'nav.about': 'About',
    'nav.stack': 'Stack',
    'nav.contact': 'Contact',
    'nav.contactBtn': 'Contact',
    'nav.cursorOn': 'Effect on',
    'nav.cursorOff': 'Effect off',
    
    // Hero
    'hero.available': 'Available for Projects',
    'hero.title1': 'Build',
    'hero.title2': 'Digital',
    'hero.title3': 'Products',
    'hero.subtitle': 'Full-stack development from concept to production. Building fast, scalable applications with modern architecture.',
    'hero.cta1': 'Start a Project',
    'hero.cta2': 'View Stack',
    
    // Philosophy
    'philosophy.badge': 'Philosophy',
    'philosophy.title1': 'Digital',
    'philosophy.title2': 'Aesthetics',
    'philosophy.text1': 'Development is the process of finding balance between function and form. A great product should be invisible, intuitive, and reliable,',
    'philosophy.highlight1': 'solving problems without noise.',
    'philosophy.text2': 'Modern applications are built on a foundation of',
    'philosophy.backend': 'stable logic',
    'philosophy.text3': 'and',
    'philosophy.frontend': 'visual harmony.',
    'philosophy.text4': 'Digital spaces should serve people, while technology extends capabilities without complicating interactions.',
    'philosophy.stat1': 'Projects',
    'philosophy.stat2': 'Years',
    'philosophy.stat3': 'Ideas',
    
    // Stack
    'stack.badge': 'Technologies',
    'stack.title': 'My stack',
    'stack.subtitle': 'Tools I use to build scalable products.',
    
    // Contact
    'contact.badge': 'Contact',
    'contact.title1': "Let's",
    'contact.title2': 'Work',
    'contact.subtitle': 'Ready to discuss your project. Reach out any way you prefer.',
    'contact.subtitleTeam': 'OpenSpace team — full-cycle web development, AI solutions, and scalable projects.',
    'contact.tabPersonal': 'With Me',
    'contact.tabTeam': 'With Team',
    'contact.telegram': 'Message on Telegram',
    'contact.email': 'Send Email',
    'contact.response': 'Usually respond within 24 hours',
    'contact.teamWebsite': 'Visit openspacedev.ru',
    
    // Footer
    'footer.description': 'Building digital products that work fast and scale efficiently.',
    'footer.built': 'Built with precision',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// ========== THEME CONTEXT ==========
type Theme = 'dark' | 'light';

const THEME_STORAGE_KEY = 'theme';
const themeListeners = new Set<() => void>();

const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark';
  return localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark';
};

const subscribeToTheme = (onStoreChange: () => void) => {
  themeListeners.add(onStoreChange);
  window.addEventListener('storage', onStoreChange);
  return () => {
    themeListeners.delete(onStoreChange);
    window.removeEventListener('storage', onStoreChange);
  };
};

const writeTheme = (theme: Theme) => {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  themeListeners.forEach((listener) => listener());
};

const CURSOR_STORAGE_KEY = 'fluidCursor';
const cursorListeners = new Set<() => void>();

const getStoredCursor = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(CURSOR_STORAGE_KEY) === 'true';
};

const subscribeToCursor = (onStoreChange: () => void) => {
  cursorListeners.add(onStoreChange);
  window.addEventListener('storage', onStoreChange);
  return () => {
    cursorListeners.delete(onStoreChange);
    window.removeEventListener('storage', onStoreChange);
  };
};

const writeCursor = (enabled: boolean) => {
  localStorage.setItem(CURSOR_STORAGE_KEY, String(enabled));
  cursorListeners.forEach((listener) => listener());
};

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

// Определение мобильного устройства
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
    || window.matchMedia('(max-width: 768px)').matches
    || 'ontouchstart' in window;
};

// Проверка prefers-reduced-motion
const checkReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const subscribeToNothing = () => () => {};

const subscribeToMobile = (onStoreChange: () => void) => {
  const mediaQuery = window.matchMedia('(max-width: 768px)');
  mediaQuery.addEventListener('change', onStoreChange);
  window.addEventListener('resize', onStoreChange);
  return () => {
    mediaQuery.removeEventListener('change', onStoreChange);
    window.removeEventListener('resize', onStoreChange);
  };
};

const subscribeToReducedMotion = (onStoreChange: () => void) => {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  mediaQuery.addEventListener('change', onStoreChange);
  return () => mediaQuery.removeEventListener('change', onStoreChange);
};

// ========== PROVIDER ==========
interface AppProviderProps {
  children: ReactNode;
  initialLanguage?: Language;
}

export const AppProvider = ({ children, initialLanguage = 'ru' }: AppProviderProps) => {
  const language = initialLanguage;
  const theme = useSyncExternalStore(subscribeToTheme, getStoredTheme, () => 'dark' as Theme);
  const setTheme = writeTheme;
  const mounted = useSyncExternalStore(subscribeToNothing, () => true, () => false);
  const isMobile = useSyncExternalStore(subscribeToMobile, isMobileDevice, () => false);
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    checkReducedMotion,
    () => false,
  );
  const storedCursor = useSyncExternalStore(subscribeToCursor, getStoredCursor, () => false);
  const isFluidCursorEnabled = storedCursor && !isMobile && !prefersReducedMotion;
  const setFluidCursorEnabled = writeCursor;

  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
    }
  }, [theme, mounted]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const toggleTheme = () => {
    writeTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const toggleFluidCursor = () => {
    writeCursor(!storedCursor);
  };

  return (
    <LanguageContext.Provider value={{ language, t }}>
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
