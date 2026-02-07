import { ClientHomePage } from '@/components/ClientHomePage';

// Default translations for SSR - ensures LCP content is visible immediately
const defaultTranslations = {
  stackBadge: 'Технологии',
  stackTitle: 'Мой стек',
  stackSubtitle: 'Инструменты, которые я использую для создания масштабируемых продуктов.',
};

export default function Home() {
  return (
    <ClientHomePage defaultTranslations={defaultTranslations} />
  );
}

