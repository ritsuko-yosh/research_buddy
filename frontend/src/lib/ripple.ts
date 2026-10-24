import { prefersReducedMotion } from './motion';

/** Length of the paint ripple. Matches --dur-ripple in open-door.css. */
export const RIPPLE_MS = 650;

/**
 * Adds a short paint ripple at (x, y) inside container, in the color of the
 * topic that was chosen. The ripple is decorative, is hidden from assistive
 * technology, removes itself, and is skipped entirely under reduced motion.
 */
export function spawnRipple(container: HTMLElement, x: number, y: number, color: string): void {
  if (prefersReducedMotion()) {
    return;
  }
  const ripple = document.createElement('span');
  ripple.className = 'od-ripple';
  ripple.setAttribute('aria-hidden', 'true');
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ripple.style.background = color;
  container.appendChild(ripple);
  window.setTimeout(() => ripple.remove(), RIPPLE_MS);
}
