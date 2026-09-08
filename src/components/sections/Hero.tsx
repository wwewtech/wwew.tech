'use client';

import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/AppContext';
import { ShinyText } from '@/components/ui/ShinyText';
import { HeroBackground } from '@/components/sections/HeroBackground';

export const Hero = () => {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-16 pb-16 overflow-hidden">
      {/* Permanent Prism Background (#13) */}
      <HeroBackground />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Main Title - NO animation for proper LCP detection */}
        <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-medium tracking-tight mb-8 leading-[1.05]">
          <span className="block pb-1">
            <ShinyText text={t('hero.title1')} />
          </span>
          <span className="block pb-1">
            <ShinyText text={t('hero.title2')} />
          </span>
          <span className="block pb-1">
            <ShinyText text={t('hero.title3')} />
          </span>
        </h1>

        {/* Subtitle - CSS animation */}
        <p className="text-(--muted) text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-6 animate-hero-fade-in [animation-delay:200ms]">
          {t('hero.subtitle')}
        </p>

        {/* CTA Buttons - CSS animation */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-hero-fade-in [animation-delay:300ms]">
          <a
            href="#contact"
            className="group flex items-center gap-2 px-8 py-4 rounded-full bg-foreground text-background font-medium hover:opacity-90 transition-all select-none"
          >
            {t('hero.cta1')}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </a>

          <a
            href="#stack"
            className="flex items-center gap-2 px-8 py-4 rounded-full bg-transparent text-foreground border border-(--border) hover:border-(--foreground)/30 hover:bg-(--border-subtle) hover:opacity-90 transition-all"
          >
            {t('hero.cta2')}
          </a>
        </div>
      </div>


    </section>
  );
};
