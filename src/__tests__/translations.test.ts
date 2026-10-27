import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ru, translations, type TranslationKey } from '../i18n/translations.ts';

describe('translation dictionaries', () => {
  test('the English dictionary covers every Russian key', () => {
    const ruKeys = Object.keys(ru).sort();
    const enKeys = Object.keys(translations.en).sort();
    assert.deepEqual(enKeys, ruKeys);
  });

  test('no translation value is empty', () => {
    for (const language of ['ru', 'en'] as const) {
      for (const [key, value] of Object.entries(translations[language])) {
        assert.ok(
          typeof value === 'string' && value.trim().length > 0,
          `empty translation for "${key}" in "${language}"`
        );
      }
    }
  });

  test('Russian and English values are never identical', () => {
    // An identical pair usually means one side was forgotten and copied.
    for (const key of Object.keys(ru) as TranslationKey[]) {
      assert.notEqual(
        translations.ru[key],
        translations.en[key],
        `"${key}" has the same value in both languages`
      );
    }
  });

  test('the ru dictionary is the source of truth for the key union', () => {
    // `TranslationKey` is derived from `ru`, so the type and the dictionary
    // cannot drift apart at compile time. This assertion documents that.
    const keys: TranslationKey[] = Object.keys(ru) as TranslationKey[];
    assert.ok(keys.length > 0);
  });
});
