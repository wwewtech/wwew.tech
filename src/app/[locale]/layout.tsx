import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "../globals.css";
import { AppProvider } from "@/context/AppContext";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { FluidCursorWrapper } from "@/components/providers/FluidCursorWrapper";
import YandexMetrika from "@/components/YandexMetrika";
import { metaCopy } from "@/i18n/content";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://wwew.tech";

// Полностью статический контент — пререндерим обе локали (SSG вместо SSR)
export function generateStaticParams() {
  return [{ locale: 'ru' }, { locale: 'en' }];
}

// Неизвестные локали отдают 404 вместо рендера произвольного сегмента
export const dynamicParams = false;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#050505" },
  ],
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === 'en';

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: metaCopy.title,
      template: "%s | wwew.tech",
    },
    description: isEn
      ? metaCopy.description.long.en
      : metaCopy.description.long.ru,
    keywords: [
      "full-stack developer", "web development", "React developer", "Next.js developer",
      "Python developer", "TypeScript", "фронтенд разработчик", "веб-разработка",
      "создание сайтов", "разработка приложений",
    ],
    authors: [{ name: "wwew.tech", url: siteUrl }],
    creator: "wwew.tech",
    publisher: "wwew.tech",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true, follow: true,
        "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1,
      },
    },
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: {
        "ru": `${siteUrl}/ru`,
        "en": `${siteUrl}/en`,
        "x-default": `${siteUrl}/ru`,
      },
    },
    openGraph: {
      type: "website",
      locale: isEn ? "en_US" : "ru_RU",
      alternateLocale: isEn ? ["ru_RU"] : ["en_US"],
      url: `${siteUrl}/${locale}`,
      images: [
        {
          url: `${siteUrl}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: isEn ? "wwew.tech | Full-Stack Developer" : "wwew.tech | Full-Stack разработка",
        },
      ],
      siteName: "wwew.tech",
      title: metaCopy.title,
      description: isEn
        ? metaCopy.description.short.en
        : metaCopy.description.short.ru,
    },
    twitter: {
      card: "summary_large_image",
      site: "@wwewtech",
      images: [`${siteUrl}/twitter-image`],
      title: metaCopy.title,
      description: isEn
        ? metaCopy.description.shorter.en
        : metaCopy.description.shorter.ru,
      creator: "@wwewtech",
    },
    category: "technology",
    manifest: "/manifest.json",
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/icon.svg", type: "image/svg+xml" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
      other: [
        { rel: "icon", url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { rel: "icon", url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  
  // JSON-LD structured data для SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${process.env.NEXT_PUBLIC_SITE_URL || "https://wwew.tech"}/#person`,
        name: "wwew.tech",
        url: process.env.NEXT_PUBLIC_SITE_URL || "https://wwew.tech",
        jobTitle: "Full-Stack Developer",
        description: locale === 'en'
          ? metaCopy.jsonLd.personDescription.en
          : metaCopy.jsonLd.personDescription.ru,
        knowsAbout: ["React", "Next.js", "TypeScript", "Python", "Web Development", "Full-Stack Development", "Frontend", "Backend"],
        sameAs: [
          "https://t.me/wwewtech",
          "https://github.com/wwewtech",
        ]
      },
      {
        "@type": "WebSite",
        "@id": `${process.env.NEXT_PUBLIC_SITE_URL || "https://wwew.tech"}/#website`,
        url: process.env.NEXT_PUBLIC_SITE_URL || "https://wwew.tech",
        name: "wwew.tech | Full-Stack Developer",
        description: locale === 'en'
          ? metaCopy.jsonLd.personDescription.en
          : metaCopy.jsonLd.personDescription.ru,
        publisher: {
          "@id": `${process.env.NEXT_PUBLIC_SITE_URL || "https://wwew.tech"}/#person`
        },
        inLanguage: locale === 'en' ? "en-US" : "ru-RU"
      },
      {
        "@type": "ProfessionalService",
        "@id": `${process.env.NEXT_PUBLIC_SITE_URL || "https://wwew.tech"}/#service`,
        name: "wwew.tech Development Services",
        image: `${process.env.NEXT_PUBLIC_SITE_URL || "https://wwew.tech"}/icon-512.png`,
        url: process.env.NEXT_PUBLIC_SITE_URL || "https://wwew.tech",
        telephone: "",
        priceRange: "$$",
        address: {
          "@type": "PostalAddress",
          addressCountry: locale === 'en' ? "WorldWide" : "WorldWide"
        },
        description: locale === 'en' 
          ? metaCopy.jsonLd.serviceDescription.en
          : metaCopy.jsonLd.serviceDescription.ru,
        offers: {
          "@type": "Offer",
          name: locale === 'en' ? metaCopy.jsonLd.offerName.en : metaCopy.jsonLd.offerName.ru,
          description: locale === 'en' 
            ? metaCopy.jsonLd.offerDescription.en
            : metaCopy.jsonLd.offerDescription.ru,
        }
      }
    ]
  };

  return (
    <html lang={locale} className="dark" suppressHydrationWarning>
      <head>
        {/* Theme bootstrap: применяем сохранённую тему до гидратации, чтобы не было вспышки */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.classList.remove('dark','light');document.documentElement.classList.add(t);}}catch(e){}})();",
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} antialiased`}
      >
        <YandexMetrika />
        <AppProvider initialLanguage={locale as 'ru' | 'en'}>
          {/* FluidCursor загружается отложенно для лучшей производительности */}
          <FluidCursorWrapper />
          <LenisProvider>
            {children}
          </LenisProvider>
        </AppProvider>
      </body>
    </html>
  );
}
