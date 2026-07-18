import { ClientHomePage } from '@/components/ClientHomePage';

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Default translations for SSR - ensures LCP content is visible immediately
  const defaultTranslations = {
    stackBadge: locale === 'en' ? 'Technologies' : 'Технологии',
    stackTitle: locale === 'en' ? 'My stack' : 'Мой стек',
    stackSubtitle: locale === 'en' 
      ? 'Tools I use to build scalable products.' 
      : 'Инструменты, которые я использую для создания масштабируемых продуктов.',
  };

  return (
    <>
      <noscript>
        <style>{`
          .hero-ssr-skeleton { display: none !important; }
        `}</style>
      </noscript>
      <ClientHomePage defaultTranslations={defaultTranslations} />
    </>
  );
}

