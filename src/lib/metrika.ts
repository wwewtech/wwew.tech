export const YM_ID = 113599475;

/**
 * Loading strategy for the Yandex Metrika tag.
 *
 * The snippet used to be inlined in <head>, so the ~70 KB tag.js competed
 * with the app's own chunks for the connection during first paint. It is
 * client-side-only analytics, so it only needs to run eventually.
 *
 * The component loads it via next/script with the lazyOnload strategy,
 * which waits for the window load event: the page becomes interactive
 * first, and the tag is fetched strictly after. afterInteractive was
 * measured to be worse - it injects the tag while React is still
 * hydrating, which showed up as main-thread work on a throttled CPU.
 */
export const YM_SRC = `https://mc.yandex.ru/metrika/tag.js?id=${YM_ID}`;
