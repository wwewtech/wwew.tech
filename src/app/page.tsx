'use client';

import { 
  Navbar, 
  Hero, 
  Philosophy, 
  StackGrid, 
  Projects,
  ContactHub,
  Footer 
} from '@/components';
import { useLanguage } from '@/lib/context';

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans transition-colors duration-300">
      {/* Навигация (sticky, glass effect) */}
      <Navbar />

      <main className="flex flex-col gap-32 pb-20">
        
        {/* Секция 1: Hero */}
        <section id="home" className="relative pt-20 px-6 max-w-7xl mx-auto w-full">
          <Hero />
        </section>

        {/* Секция 2: О себе (Философия) */}
        <section id="about" className="px-6 max-w-7xl mx-auto w-full">
          <Philosophy />
        </section>

        {/* Секция 3: Стек технологий (Bento Grid) */}
        <section id="stack" className="px-6 max-w-7xl mx-auto w-full">
          <div className="mb-12">
            <span className="text-sm font-medium tracking-wider uppercase mb-4 block text-transparent bg-clip-text bg-gradient-to-r from-[var(--foreground)] via-[var(--muted)] to-[var(--foreground)] animate-shimmer bg-[length:200%_100%]">
              {t('stack.badge')}
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-[var(--foreground)]">
              {t('stack.title')}
            </h2>
            <p className="text-[var(--muted)] max-w-xl">
              {t('stack.subtitle')}
            </p>
          </div>
          <StackGrid />
        </section>

        {/* Секция 4: Проекты */}
        <section id="projects" className="px-6 max-w-7xl mx-auto w-full">
          <Projects />
        </section>

        {/* Секция 5: Контакты */}
        <section id="contact" className="px-6 max-w-7xl mx-auto w-full">
          <ContactHub />
        </section>

      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

