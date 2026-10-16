// Shared client-only device detection.
// Same heuristics as before (UA + media queries + touch), moved here so both
// AppContext and FluidCursor use one implementation.

export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || window.matchMedia('(max-width: 768px)').matches
    || 'ontouchstart' in window;
};

export const checkReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};
