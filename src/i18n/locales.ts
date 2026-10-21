// Locale routing logic, kept separate from src/proxy.ts so it can be unit
// tested without spinning up a Next.js server.
//
// The previous implementation matched the `accept-language` header with
// `String.prototype.includes('en')`, which had two defects:
//   1. q-weights were ignored, so `ru-RU,ru;q=0.9,en;q=0.8` resolved to `en`
//      even though Russian was the preferred language;
//   2. three-letter subtags containing the letters "en" (e.g. `ben`, `den`,
//      `eng`) matched the English branch by accident.
//
// This module parses the header properly and compares exact language codes.

export const locales = ['ru', 'en'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ru';

export const LOCALE_COOKIE = 'locale';

/**
 * True when `value` is one of the supported locales.
 */
export const isSupportedLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (locales as readonly string[]).includes(value);

/**
 * Parses an `Accept-Language` header into a list of language tags ordered by
 * descending quality (q). Malformed entries are skipped rather than throwing.
 *
 * Example: `ru-RU,ru;q=0.9,en;q=0.8` -> `['ru-RU', 'ru', 'en']`
 */
export const parseAcceptLanguage = (header: string | null | undefined): string[] => {
  if (!header) return [];

  return header
    .split(',')
    .map((part) => {
      const [tagPart, ...params] = part.trim().split(';');
      const tag = tagPart.trim().toLowerCase();
      if (!tag || tag === '*') return null;

      // Default quality per RFC 9110 is 1.0 when the q parameter is absent.
      let quality = 1;
      for (const param of params) {
        const [key, value] = param.split('=').map((s) => s.trim().toLowerCase());
        if (key === 'q') {
          const parsed = Number.parseFloat(value);
          // Ignore malformed q values and keep the default of 1.
          quality = Number.isFinite(parsed) ? parsed : 1;
        }
      }

      return { tag, quality };
    })
    .filter((entry): entry is { tag: string; quality: number } => entry !== null)
    .sort((a, b) => b.quality - a.quality)
    .map((entry) => entry.tag);
};

/**
 * Resolves the primary subtag of a language tag (`en-US` -> `en`).
 */
const primarySubtag = (tag: string): string => tag.split('-')[0];

/**
 * Picks the best supported locale for an `Accept-Language` header.
 *
 * The header is walked in descending q-order and the first tag whose primary
 * subtag matches a supported locale wins. A tag that only *contains* a
 * supported code (`ben`, `den`) never matches, because only the primary
 * subtag is compared.
 *
 * Falls back to `defaultLocale` when nothing matches.
 */
export const resolveLocaleFromAcceptLanguage = (
  header: string | null | undefined
): Locale => {
  for (const tag of parseAcceptLanguage(header)) {
    const subtag = primarySubtag(tag);
    if (isSupportedLocale(subtag)) return subtag;
  }
  return defaultLocale;
};

/**
 * Resolves the locale for an incoming request.
 *
 * Priority:
 *   1. An explicit user choice stored in the `locale` cookie.
 *   2. The browser's `Accept-Language` header.
 *   3. `defaultLocale`.
 */
export const resolveLocale = (options: {
  cookieValue?: string | null;
  acceptLanguage?: string | null;
}): Locale => {
  if (isSupportedLocale(options.cookieValue)) return options.cookieValue;
  return resolveLocaleFromAcceptLanguage(options.acceptLanguage);
};
