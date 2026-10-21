'use client';

import { usePathname } from 'next/navigation';
import { translations, type Language, type TranslationKey } from '@/i18n/translations';
import { isSupportedLocale } from '@/i18n/locales';

/**
 * Derives the active language from the URL.
 *
 * The 404 page is rendered in two places: inside the locale layout (where the
 * language context is available) and at the root level (where it is not,
 * because the root layout carries no providers). Reading the locale from the
 * path keeps a single implementation that works in both places.
 */
const useLanguageFromPath = (): Language => {
  const pathname = usePathname();
  const segment = pathname.split('/')[1];
  return isSupportedLocale(segment) ? segment : 'ru';
};

interface NotFoundViewProps {
  /** Overrides the language detected from the path. */
  language?: Language;
}

/**
 * Branded 404 view, shared by the root and locale-scoped not-found pages.
 */
export const NotFoundView = ({ language }: NotFoundViewProps) => {
  const pathLanguage = useLanguageFromPath();
  const lang = language ?? pathLanguage;
  const t = (key: TranslationKey) => translations[lang][key];

  return (
    <main className="min-h-screen bg-background text-foreground font-sans flex items-center justify-center px-4">
      <div className="max-w-xl text-center">
        {/* Oversized 404 */}
        <p
          className="text-[7rem] sm:text-[10rem] font-medium leading-none tracking-tight text-gradient select-none"
          aria-hidden="true"
        >
          404
        </p>

        <h1 className="text-3xl sm:text-4xl font-medium tracking-tight mt-6 mb-4">
          {t('notFound.title')}
        </h1>

        <p className="text-(--muted) text-lg leading-relaxed mb-10">
          {t('notFound.text')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#home"
            className="flex items-center gap-2 px-8 py-4 rounded-full bg-foreground text-background font-medium hover:opacity-90 transition-all select-none"
          >
            {t('notFound.home')}
          </a>

          <a
            href="#stack"
            className="flex items-center gap-2 px-8 py-4 rounded-full bg-transparent text-foreground border border-(--border) hover:border-(--foreground)/30 hover:bg-(--border-subtle) transition-all"
          >
            {t('notFound.sections')}
          </a>
        </div>
      </div>
    </main>
  );
};
