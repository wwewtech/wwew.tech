import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';
import { NotFoundView } from '@/components/sections/NotFoundView';
import { defaultLocale, isSupportedLocale, type Locale } from '@/i18n/locales';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wwew.tech';

/**
 * Request header carrying the resolved locale, set by the proxy in src/proxy.ts.
 */
const LOCALE_HEADER = 'x-wwew-locale';

export const metadata: Metadata = {
  // global-not-found is rendered outside of the root layout, so it needs its
  // own metadataBase — otherwise Next.js falls back to http://localhost:3000
  // when resolving social images.
  metadataBase: new URL(siteUrl),
  title: '404',
  robots: {
    index: false,
    follow: true,
  },
};

/**
 * Root-level fallback for URLs that match no route.
 *
 * In the App Router an unmatched URL is rendered by the *root* not-found,
 * outside of the locale layout. The root layout of this project intentionally
 * renders no <html>/<body> of its own (those live in [locale]/layout.tsx),
 * so this file has to provide the document shell itself — otherwise the 404
 * would be served as an unstyled fragment.
 *
 * The locale arrives via a request header set by the proxy, because this page
 * sits outside the [locale] segment and cannot read route params.
 */
export default async function GlobalNotFound() {
  const headerList = await headers();
  const headerLocale = headerList.get(LOCALE_HEADER);
  const locale: Locale = isSupportedLocale(headerLocale) ? headerLocale : defaultLocale;

  return (
    <html lang={locale} className="dark" suppressHydrationWarning>
      <head>
        {/* Theme bootstrap: применяем сохранённую тему до гидратации. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.classList.remove('dark','light');document.documentElement.classList.add(t);}}catch(e){}})();",
          }}
        />
      </head>
      <body className={`${geistSans.variable} antialiased`}>
        <NotFoundView language={locale} />
      </body>
    </html>
  );
}
