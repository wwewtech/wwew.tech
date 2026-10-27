// Bilingual marketing copy used by generateMetadata and JSON-LD.
// Kept next to the UI dictionary (src/i18n/translations.ts) so RU/EN strings
// live in one place instead of being duplicated inline in layout.tsx.

export const metaCopy = {
  title: 'wwew.tech | Full-Stack Developer',
  description: {
    long: {
      en: 'Full-stack development from concept to production. Building fast, scalable web applications with modern architecture. React, Next.js, Python, TypeScript.',
      ru: 'Full-stack разработка от идеи до продакшена. Создаю быстрые, масштабируемые веб-приложения с современной архитектурой. React, Next.js, Python, TypeScript.',
    },
    short: {
      en: 'Full-stack development from concept to production. Building fast, scalable web applications with modern architecture.',
      ru: 'Full-stack разработка от идеи до продакшена. Создаю быстрые, масштабируемые веб-приложения с современной архитектурой.',
    },
    shorter: {
      en: 'Full-stack development from concept to production. Building fast, scalable web applications.',
      ru: 'Full-stack разработка от идеи до продакшена. Создаю быстрые, масштабируемые веб-приложения.',
    },
  },
  jsonLd: {
    personDescription: {
      en: 'Full-stack development from concept to production. Building fast, scalable web applications.',
      ru: 'Full-stack разработка от идеи до продакшена. Создаю быстрые, масштабируемые веб-приложения.',
    },
    serviceDescription: {
      en: 'Professional full-stack web development services, specialized in React, Next.js, and Python.',
      ru: 'Профессиональные услуги full-stack веб-разработки, специализация на React, Next.js и Python.',
    },
    offerName: {
      en: 'Web Development',
      ru: 'Веб-разработка',
    },
    offerDescription: {
      en: 'Custom web application development from scratch.',
      ru: 'Разработка кастомных веб-приложений с нуля.',
    },
  },
} as const;
