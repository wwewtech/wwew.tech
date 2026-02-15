'use client';

import dynamic from 'next/dynamic';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/sections/Hero';
import { useLanguage } from '@/context/AppContext';

// Lazy load below-fold sections - код выделяется в отдельные чанки
// SSR сохраняется для SEO, но JS загружается отдельными чанками
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

const Projects = dynamic(
  () => import('@/components/sections/Projects').then(m => ({ default: m.Projects })),
  {
    loading: () => <div className="min-h-100" />,
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
      {/* Навигация (sticky, glass effect) */}
      <Navbar />

      <main className="flex flex-col gap-32 pb-20">
        
        {/* Секция 1: Hero — critical, loaded eagerly */}
        <section id="home" className="relative pt-20 px-6 max-w-7xl mx-auto w-full">
          <Hero />
        </section>

        {/* Секция 2: О себе (Философия) — без cv-auto, т.к. 3D canvas чувствителен к resize */}
        <section id="about" className="px-6 max-w-7xl mx-auto w-full">
          <Philosophy />
        </section>

        {/* Секция 3: Стек технологий (Bento Grid) — lazy loaded */}
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

        {/* Секция 4: Проекты — lazy loaded */}
        <section id="projects" className="px-6 max-w-7xl mx-auto w-full cv-auto">
          <Projects />
        </section>

        {/* Секция 5: Контакты — lazy loaded */}
        <section id="contact" className="px-6 max-w-7xl mx-auto w-full cv-auto">
          <ContactHub />
        </section>

      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
