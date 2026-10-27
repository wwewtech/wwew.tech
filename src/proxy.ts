import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  LOCALE_COOKIE,
  locales,
  resolveLocale,
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

  // The path already carries a locale: this is an explicit choice, so we keep
  // it and remember it for future requests to the bare root.
  if (pathLocale) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(LOCALE_HEADER, pathLocale);

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    const stored = request.cookies.get(LOCALE_COOKIE)?.value;
    // Only write the cookie when it actually changes, so that repeat visits
    // do not add a Set-Cookie header to an otherwise cacheable response.
    if (stored !== pathLocale) {
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
