'use client';

import dynamic from 'next/dynamic';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/sections/Hero';
import { useLanguage } from '@/context/AppContext';

// Lazy load below-fold sections - code is split into chunks
// SSR is preserved for SEO, JS is loaded dynamically
const Philosophy = dynamic(
  () => import('@/components/sections/Philosophy').then(m => ({ default: m.Philosophy })),
  {
    loading: () => (
      <div className="min-h-150 flex items-center justify-center">
        <div className="w-32 h-32 rounded-full border border-(--border) opacity-10 animate-pulse" />
      </div>
    ),
  }
);

const ContactHub = dynamic(
  () => import('@/components/sections/ContactHub').then(m => ({ default: m.ContactHub })),
  {
    loading: () => <div className="min-h-100" />,
  }
);

const StackGrid = dynamic(
  () => import('@/components/ui/StackGrid').then(m => ({ default: m.StackGrid })),
  {
    loading: () => <div className="min-h-75" />,
  }
);

interface ClientHomePageProps {
  /** Default translations for SSR - will be hydrated with client state */
  defaultTranslations: {
    stackBadge: string;
    stackTitle: string;
    stackSubtitle: string;
  };
}

export function ClientHomePage({ defaultTranslations }: ClientHomePageProps) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
      {/* Navigation (sticky, glass effect) */}
      <Navbar />

      <main className="flex flex-col gap-32 pb-20">
        
        {/* Section 1: Hero - critical, loaded eagerly */}
        <div id="home" className="relative w-full">
          <Hero />
        </div>

        {/* Section 2: About (Philosophy) - no cv-auto, 3D canvas is sensitive to resize */}
        <section id="about" className="px-6 max-w-7xl mx-auto w-full">
          <Philosophy />
        </section>

        {/* Section 3: Tech Stack (Bento Grid) - lazy loaded */}
        <section id="stack" className="px-6 max-w-7xl mx-auto w-full cv-auto">
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
              {t('stack.title') || defaultTranslations.stackTitle}
            </h2>
            <p className="text-(--muted) max-w-xl">
              {t('stack.subtitle') || defaultTranslations.stackSubtitle}
            </p>
          </div>
          <StackGrid />
        </section>

        {/* Section 4: Contacts - lazy loaded */}
        <section id="contact" className="px-6 max-w-7xl mx-auto w-full cv-auto">
          <ContactHub />
        </section>

      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
