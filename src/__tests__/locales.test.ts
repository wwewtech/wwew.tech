import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultLocale,
  isSupportedLocale,
  locales,
  parseAcceptLanguage,
  resolveLocale,
  resolveLocaleFromAcceptLanguage,
} from '../i18n/locales.ts';

describe('parseAcceptLanguage', () => {
  test('returns an empty list for a missing header', () => {
    assert.deepEqual(parseAcceptLanguage(null), []);
    assert.deepEqual(parseAcceptLanguage(undefined), []);
    assert.deepEqual(parseAcceptLanguage(''), []);
  });

  test('orders tags by descending quality', () => {
    assert.deepEqual(parseAcceptLanguage('ru;q=0.5,en;q=0.9'), ['en', 'ru']);
  });

  test('treats a missing q parameter as quality 1', () => {
    assert.deepEqual(parseAcceptLanguage('en'), ['en']);
    assert.deepEqual(parseAcceptLanguage('ru,en'), ['ru', 'en']);
  });

  test('ignores the wildcard entry', () => {
    assert.deepEqual(parseAcceptLanguage('*'), []);
    assert.deepEqual(parseAcceptLanguage('*;q=0.8,en;q=0.5'), ['en']);
  });

  test('lowercases tags', () => {
    assert.deepEqual(parseAcceptLanguage('EN-US'), ['en-us']);
  });

  test('skips malformed q values instead of throwing', () => {
    assert.deepEqual(parseAcceptLanguage('en;q=notanumber'), ['en']);
  });

  test('skips empty entries', () => {
    assert.deepEqual(parseAcceptLanguage('en,,ru'), ['en', 'ru']);
  });
});

describe('resolveLocaleFromAcceptLanguage', () => {
  test('picks the exact language code', () => {
    assert.equal(resolveLocaleFromAcceptLanguage('en'), 'en');
    assert.equal(resolveLocaleFromAcceptLanguage('ru'), 'ru');
  });

  test('picks the primary subtag of a regional tag', () => {
    assert.equal(resolveLocaleFromAcceptLanguage('en-US,en;q=0.9'), 'en');
    assert.equal(resolveLocaleFromAcceptLanguage('ru-RU,ru;q=0.9'), 'ru');
  });

  test('respects q-weights: a preferred Russian wins over an English fallback', () => {
    // Regression test: the old `includes('en')` check resolved this to 'en'.
    assert.equal(
      resolveLocaleFromAcceptLanguage('ru-RU,ru;q=0.9,en;q=0.8'),
      'ru'
    );
  });

  test('respects q-weights in the other direction', () => {
    assert.equal(
      resolveLocaleFromAcceptLanguage('en-US,en;q=0.9,ru;q=0.8'),
      'en'
    );
  });

  test('does not match a three-letter subtag that merely contains "en"', () => {
    // Regression test: 'ben' and 'den' both contain the letters "en".
    assert.equal(resolveLocaleFromAcceptLanguage('ben-BD,bn;q=0.9'), defaultLocale);
    assert.equal(resolveLocaleFromAcceptLanguage('den-DK,da;q=0.9'), defaultLocale);
    assert.equal(resolveLocaleFromAcceptLanguage('eng-US'), defaultLocale);
  });

  test('falls back to the default locale for unsupported languages', () => {
    assert.equal(resolveLocaleFromAcceptLanguage('de-DE,de;q=0.9'), defaultLocale);
    assert.equal(resolveLocaleFromAcceptLanguage('fr-FR,fr;q=0.9'), defaultLocale);
  });

  test('falls back to the default locale when the header is missing', () => {
    assert.equal(resolveLocaleFromAcceptLanguage(null), defaultLocale);
    assert.equal(resolveLocaleFromAcceptLanguage(''), defaultLocale);
  });

  test('skips an unsupported preferred language and uses a supported fallback', () => {
    assert.equal(
      resolveLocaleFromAcceptLanguage('fr-FR,fr;q=0.9,en;q=0.5'),
      'en'
    );
  });
});

describe('isSupportedLocale', () => {
  test('accepts every supported locale', () => {
    for (const locale of locales) {
      assert.equal(isSupportedLocale(locale), true);
    }
  });

  test('rejects unknown and non-string values', () => {
    assert.equal(isSupportedLocale('fr'), false);
    assert.equal(isSupportedLocale(''), false);
    assert.equal(isSupportedLocale(undefined), false);
    assert.equal(isSupportedLocale(null), false);
    assert.equal(isSupportedLocale(42), false);
  });
});

describe('resolveLocale', () => {
  test('an explicit cookie choice wins over Accept-Language', () => {
    assert.equal(
      resolveLocale({ cookieValue: 'en', acceptLanguage: 'ru-RU,ru;q=0.9' }),
      'en'
    );
    assert.equal(
      resolveLocale({ cookieValue: 'ru', acceptLanguage: 'en-US,en;q=0.9' }),
      'ru'
    );
  });

  test('an unsupported cookie value falls through to Accept-Language', () => {
    assert.equal(
      resolveLocale({ cookieValue: 'de', acceptLanguage: 'en-US,en;q=0.9' }),
      'en'
    );
  });

  test('uses Accept-Language when no cookie is present', () => {
    assert.equal(
      resolveLocale({ cookieValue: null, acceptLanguage: 'en-US,en;q=0.9' }),
      'en'
    );
  });

  test('falls back to the default locale when nothing is known', () => {
    assert.equal(resolveLocale({}), defaultLocale);
    assert.equal(resolveLocale({ cookieValue: null, acceptLanguage: null }), defaultLocale);
  });
});
