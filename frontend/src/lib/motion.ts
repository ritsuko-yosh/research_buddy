/**
 * Motion helpers for the Open Door visuals.
 *
 * Decorative motion is short and never loops by default. Reduced motion
 * removes decorative animation in CSS and skips scripted effects here.
 * Search results are never faked: the loader only waits so the state is
 * readable, and the real request is still the only source of results.
 */

/** Minimum time the search loader stays on screen, so a fast response does not flicker. */
export const MIN_LOADER_MS = 400;

/** localStorage key for the page-wide Pause Animation choice. */
export const PAUSE_STORAGE_KEY = 'od-animation-paused';

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

/** Reads the saved pause choice. Storage can be blocked (private mode, policy), so failures fall back to playing. */
export function readAnimationPaused(): boolean {
  try {
    return window.localStorage.getItem(PAUSE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/** Saves the pause choice. If storage is unavailable, the choice lasts for this page view only. */
export function writeAnimationPaused(paused: boolean): void {
  try {
    window.localStorage.setItem(PAUSE_STORAGE_KEY, paused ? '1' : '0');
  } catch {
    // Storage unavailable: nothing else to do.
  }
}

/** Resolves once MIN_LOADER_MS has passed since startedAt. Resolves immediately if it already has. */
export function waitForMinimumLoader(startedAt: number): Promise<void> {
  const remaining = MIN_LOADER_MS - (Date.now() - startedAt);
  if (remaining <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => window.setTimeout(resolve, remaining));
}
