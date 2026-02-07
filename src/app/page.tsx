import { ClientHomePage } from '@/components/ClientHomePage';

// Default translations for SSR - ensures LCP content is visible immediately
const defaultTranslations = {
  stackBadge: 'Технологии',
  stackTitle: 'Мой стек',
  stackSubtitle: 'Инструменты, которые я использую для создания масштабируемых продуктов.',
};

export default function Home() {
  return (
    <>
      {/* 
        Server-rendered Hero skeleton для мгновенного LCP.
        Текст отрисовывается до загрузки JS, обеспечивая быстрый FCP/LCP.
        ClientHomePage гидратирует поверх этого контента.
        noscript fallback обеспечивает видимость без JS.
      */}
      <noscript>
        <style>{`
          .hero-ssr-skeleton { display: none !important; }
        `}</style>
      </noscript>
      <ClientHomePage defaultTranslations={defaultTranslations} />
    </>
  );
}

