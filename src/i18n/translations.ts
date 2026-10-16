// RU/EN UI copy. Extracted from AppContext so the dictionary, the Language
// type and the key union live in one place. The `en` dictionary is typed as
// Record<TranslationKey, string>, so a key present in `ru` but missing in `en`
// is a compile error.

export const ru = {
  // Navbar
  'nav.about': 'Обо мне',
  'nav.stack': 'Стек',
  'nav.contact': 'Контакты',
  'nav.contactBtn': 'Связаться',
  'nav.cursorOn': 'Эффект вкл',
  'nav.cursorOff': 'Эффект выкл',

  // Hero
  'hero.title1': 'Разработка',
  'hero.title2': 'Цифровых',
  'hero.title3': 'Продуктов',
  'hero.subtitle': 'Full-stack разработка от идеи до продакшена. Создаю быстрые, масштабируемые решения с современной архитектурой.',
  'hero.cta1': 'Начать проект',
  'hero.cta2': 'Смотреть стек',

  // Philosophy
  'philosophy.title1': 'Цифровой',
  'philosophy.title2': 'Стиль',
  'philosophy.text1': 'Разработка — это процесс поиска баланса между функциональностью и формой. Хороший продукт должен быть незаметным, интуитивным и надежным,',
  'philosophy.highlight1': 'решая задачи без лишнего шума.',
  'philosophy.text2': 'Современные приложения строятся на фундаменте',
  'philosophy.backend': 'стабильной логики',
  'philosophy.text3': 'и',
  'philosophy.frontend': 'визуальной гармонии.',
  'philosophy.text4': 'Любые цифровые решения должны служить людям, а технологии — расширять возможности, не усложняя взаимодействия.',
  'philosophy.stat1': 'Проектов',
  'philosophy.stat2': 'Года',
  'philosophy.stat3': 'Идей',

  // Stack
  'stack.title': 'Мой стек',
  'stack.subtitle': 'Инструменты, которые я использую для создания масштабируемых продуктов.',

  // Contact
  'contact.title1': 'Давайте',
  'contact.title2': 'Работать',
  'contact.subtitle': 'Готов обсудить ваш проект. Свяжитесь любым удобным способом.',
  'contact.subtitleTeam': 'Команда OpenSpace — комплексная веб-разработка, AI-решения и масштабируемые проекты под ключ.',
  'contact.tabPersonal': 'Со мной',
  'contact.tabTeam': 'С командой',
  'contact.telegram': 'Написать в Telegram',
  'contact.teamWebsite': 'Перейти на openspacedev.ru',
} as const;

export type TranslationKey = keyof typeof ru;

export type Language = 'ru' | 'en';

export const translations: Record<Language, Record<TranslationKey, string>> = {
  ru,
  en: {
    // Navbar
    'nav.about': 'About',
    'nav.stack': 'Stack',
    'nav.contact': 'Contact',
    'nav.contactBtn': 'Contact',
    'nav.cursorOn': 'Effect on',
    'nav.cursorOff': 'Effect off',

    // Hero
    'hero.title1': 'Build',
    'hero.title2': 'Digital',
    'hero.title3': 'Products',
    'hero.subtitle': 'Full-stack development from concept to production. Building fast, scalable applications with modern architecture.',
    'hero.cta1': 'Start a Project',
    'hero.cta2': 'View Stack',

    // Philosophy
    'philosophy.title1': 'Digital',
    'philosophy.title2': 'Aesthetics',
    'philosophy.text1': 'Development is the process of finding balance between function and form. A great product should be invisible, intuitive, and reliable,',
    'philosophy.highlight1': 'solving problems without noise.',
    'philosophy.text2': 'Modern applications are built on a foundation of',
    'philosophy.backend': 'stable logic',
    'philosophy.text3': 'and',
    'philosophy.frontend': 'visual harmony.',
    'philosophy.text4': 'Digital spaces should serve people, while technology extends capabilities without complicating interactions.',
    'philosophy.stat1': 'Projects',
    'philosophy.stat2': 'Years',
    'philosophy.stat3': 'Ideas',

    // Stack
    'stack.title': 'My stack',
    'stack.subtitle': 'Tools I use to build scalable products.',

    // Contact
    'contact.title1': "Let's",
    'contact.title2': 'Work',
    'contact.subtitle': 'Ready to discuss your project. Reach out any way you prefer.',
    'contact.subtitleTeam': 'OpenSpace team — full-cycle web development, AI solutions, and scalable projects.',
    'contact.tabPersonal': 'With Me',
    'contact.tabTeam': 'With Team',
    'contact.telegram': 'Message on Telegram',
    'contact.teamWebsite': 'Visit openspacedev.ru',
  },
};
