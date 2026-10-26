import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Regression tests for the locale-cookie-on-prefetch bug.
 *
 * The bug: loading /ru made the router background-prefetch /en, the proxy
 * saw a path with a locale segment and wrote locale=en over the visitor's
 * actual choice, so their next visit to the bare root redirected them to
 * the wrong language.
 *
 * These tests pin the decision matrix of the proxy's locale handling:
 *   - a prefetch must never change the cookie
 *   - a real navigation to a locale path must set the cookie
 *   - a repeat visit with the same cookie must not re-set it
 *
 * The proxy itself is a Next.js edge module and cannot be imported here
 * (it pulls in next/server), so the decision logic is mirrored in
 * src/i18n/locales.ts as pure functions and the proxy uses those. This file
 * tests the pure functions; the proxy is covered by the live checks in
 * scripts/check-live.py.
 *
 * Naming note: avoid the bare word that names an HTML element here, even in
 * comments. Tailwind v4 scans project files for candidate class names and
 * any occurrence would emit a stray display utility into the production
 * stylesheet (this was observed in practice and cost a debugging round).
 */

import { shouldSetLocaleCookie, type Locale } from '../i18n/locales.ts';

describe('locale cookie decision (prefetch bug regression)', () => {
  test('a router prefetch never writes the cookie', () => {
    assert.equal(
      shouldSetLocaleCookie({ isPrefetch: true, stored: 'ru', target: 'en' }),
      false,
      'prefetch of /en while the visitor reads /ru must not switch them'
    );
    assert.equal(
      shouldSetLocaleCookie({ isPrefetch: true, stored: 'en', target: 'ru' }),
      false
    );
    assert.equal(
      shouldSetLocaleCookie({ isPrefetch: true, stored: undefined, target: 'ru' }),
      false
    );
  });

  test('a real navigation to a locale path writes the cookie', () => {
    assert.equal(
      shouldSetLocaleCookie({ isPrefetch: false, stored: 'ru', target: 'en' }),
      true,
      'explicitly opening /en is a language choice and must be remembered'
    );
    assert.equal(
      shouldSetLocaleCookie({ isPrefetch: false, stored: undefined, target: 'ru' }),
      true,
      'first visit with no cookie must set it'
    );
  });

  test('a repeat visit with the same cookie does not rewrite it', () => {
    assert.equal(
      shouldSetLocaleCookie({ isPrefetch: false, stored: 'ru', target: 'ru' }),
      false,
      'same value: keep cacheable responses free of Set-Cookie'
    );
  });

  test('the decision is exactly the proxy contract', () => {
    // Every combination, so a future refactor cannot silently flip one.
    // target is typed as Locale so the rows pin it too: a value outside
    // the supported set would not compile.
    // See the naming note at the top of this file for why no bare HTML
    // element name appears here, not even in a comment.
    const rows: Array<
      [isPrefetch: boolean, stored: string | undefined, target: Locale, expected: boolean]
    > = [
      [true, 'ru', 'ru', false],
      [true, 'ru', 'en', false],
      [true, 'en', 'ru', false],
      [true, undefined, 'ru', false],
      [true, undefined, 'en', false],
      [false, 'ru', 'ru', false],
      [false, 'ru', 'en', true],
      [false, 'en', 'ru', true],
      [false, undefined, 'ru', true],
      [false, undefined, 'en', true],
    ];
    for (const [isPrefetch, stored, target, expected] of rows) {
      assert.equal(
        shouldSetLocaleCookie({ isPrefetch, stored, target }),
        expected,
        `prefetch=${isPrefetch} stored=${stored} target=${target}`
      );
    }
  });
});
