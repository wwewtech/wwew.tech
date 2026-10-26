import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  LOCALE_COOKIE,
  locales,
  resolveLocale,
  shouldSetLocaleCookie,
  type Locale,
} from '@/i18n/locales';

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Request header carrying the resolved locale.
 *
 * The root 404 (global-not-found) is rendered outside of the [locale] layout,
 * so it cannot read the locale from the route params. The proxy passes it
 * through this header instead, which lets the page render the correct
 * language and `lang` attribute on the server.
 */
const LOCALE_HEADER = 'x-wwew-locale';

/**
 * Detects the locale segment of a pathname.
 * Returns null when the path has no locale prefix.
 */
function getPathLocale(pathname: string): Locale | null {
  for (const locale of locales) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return locale;
    }
  }
  return null;
}

/**
 * True for the background prefetch requests the router issues for <Link>s.
 *
 * NOTE: in Next 16 the proxy receives a sanitised request. Verified
 * empirically with debug headers on a live prefetch: the ?_rsc query
 * parameter, request.nextUrl.search, request.url, and the
 * RSC / Next-Router-Prefetch headers are ALL stripped before the proxy
 * runs. There is currently no way to detect a prefetch from the proxy.
 *
 * The function is kept anyway (checking every marker that exists) so that
 * the fix starts working automatically if a future Next version exposes
 * any of them again. The practical protection today comes from the other
 * half of the fix: prefetch={false} on the language switcher means the
 * router no longer issues these requests at all.
 *
 * Why this matters: prefetch requests must NOT write the locale cookie.
 * The visitor has not navigated anywhere - they are still reading the page
 * they are on. Writing the cookie on prefetch was a real bug: loading /ru
 * made the browser prefetch /en, which set locale=en, so the visitor's
 * next visit to the bare root redirected them to the wrong language
 * without them ever choosing it. Reproduced before the fix, regression
 * tests added with it.
 */
const isRouterPrefetch = (request: NextRequest): boolean => {
  if (request.url.includes('_rsc=')) return true;
  if (request.nextUrl.searchParams.has('_rsc')) return true;
  const h = request.headers;
  return (
    h.get('rsc') === '1' &&
    (h.get('next-router-prefetch') === '1' ||
      h.get('next-router-segment-prefetch') === '1')
  );
};

export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith('/_next') ||
    pathname.includes('/api/') ||
    pathname.includes('.') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return;
  }

  const pathLocale = getPathLocale(pathname);
  const prefetch = isRouterPrefetch(request);

  // The path already carries a locale: this is an explicit choice, so we keep
  // it and remember it for future requests to the bare root - but only for
  // real navigations, never for background prefetches.
  if (pathLocale) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(LOCALE_HEADER, pathLocale);

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    // The decision lives in i18n/locales.ts as a pure function so it is
    // unit-tested; see shouldSetLocaleCookie for why prefetches are excluded.
    const stored = request.cookies.get(LOCALE_COOKIE)?.value;
    if (shouldSetLocaleCookie({ isPrefetch: prefetch, stored, target: pathLocale })) {
      response.cookies.set(LOCALE_COOKIE, pathLocale, {
        path: '/',
        maxAge: ONE_YEAR,
        sameSite: 'lax',
      });
    }
    return response;
  }

  // No locale in the path — decide which one to send the visitor to.
  // A previously stored choice wins over the browser's Accept-Language.
  const storedLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = resolveLocale({
    cookieValue: storedLocale,
    acceptLanguage: request.headers.get('accept-language'),
  });

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;

  // 307, not 308: the target now depends on the visitor (cookie or
  // Accept-Language), so the mapping is not permanent and must not be
  // cached as such by the browser.
  const response = NextResponse.redirect(redirectUrl, 307);
  if (storedLocale !== locale) {
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: '/',
      maxAge: ONE_YEAR,
      sameSite: 'lax',
    });
  }
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icon.*|apple-icon.*|opengraph-image|twitter-image).*)'],
};
