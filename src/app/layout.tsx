import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/context";
import { LenisProvider } from "@/components/LenisProvider";
import { FluidCursorWrapper } from "@/components/FluidCursorWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://wwew.tech";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#050505" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "wwew.tech | Full-Stack Developer",
    template: "%s | wwew.tech",
  },
  description: "Full-stack разработка от идеи до продакшена. Создаю быстрые, масштабируемые веб-приложения с современной архитектурой. React, Next.js, Python, TypeScript.",
  keywords: [
    "full-stack developer",
    "web development",
    "React developer",
    "Next.js developer",
    "Python developer",
    "TypeScript",
    "фронтенд разработчик",
    "веб-разработка",
    "создание сайтов",
    "разработка приложений",
  ],
  authors: [{ name: "wwew.tech", url: siteUrl }],
  creator: "wwew.tech",
  publisher: "wwew.tech",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      "ru-RU": siteUrl,
      "en-US": siteUrl,
    },
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    alternateLocale: "en_US",
    url: siteUrl,
    siteName: "wwew.tech",
    title: "wwew.tech | Full-Stack Developer",
    description: "Full-stack разработка от идеи до продакшена. Создаю быстрые, масштабируемые веб-приложения с современной архитектурой.",
  },
  twitter: {
    card: "summary_large_image",
    title: "wwew.tech | Full-Stack Developer",
    description: "Full-stack разработка от идеи до продакшена. Создаю быстрые, масштабируемые веб-приложения.",
    creator: "@wwew_tech",
  },
  verification: {
    // Добавь свои верификационные коды после регистрации в этих сервисах
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
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
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "icon", url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { rel: "icon", url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // JSON-LD structured data для SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "wwew.tech",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://wwew.tech",
    jobTitle: "Full-Stack Developer",
    description: "Full-stack разработка от идеи до продакшена. Создаю быстрые, масштабируемые веб-приложения.",
    knowsAbout: ["React", "Next.js", "TypeScript", "Python", "Web Development", "Full-Stack Development"],
    sameAs: [
      "https://t.me/wwew_tech",
      "https://github.com/wwew-tech",
    ],
  };

  return (
    <html lang="ru" className="dark" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppProvider>
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
