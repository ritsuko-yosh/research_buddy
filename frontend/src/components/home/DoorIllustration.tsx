/**
 * Original illustration for the homepage hero. It is artwork, not UI, so its
 * colors are kept inside this file. The hardcoding guard lists this file as the
 * only exception to the "no literal hex colors" rule (approved artwork).
 *
 * Decorative: the copy beside it says the same thing, so it is hidden from
 * assistive technology.
 */

/** The gouache texture filter. Each id must be unique in the page. */
export function GouacheFilter({ id }: { id: string }) {
  return (
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={3} seed={7} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={14} xChannelSelector="R" yChannelSelector="G" result="d" />
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={3} result="g" />
      <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .22 0" result="ga" />
      <feComposite in="ga" in2="d" operator="in" result="gi" />
      <feMerge>
        <feMergeNode in="d" />
        <feMergeNode in="gi" />
      </feMerge>
    </filter>
  );
}

export function DoorIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 520 480"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <GouacheFilter id="od-gouache" />
      </defs>
      <g filter="url(#od-gouache)">
        <rect x="20" y="30" width="480" height="420" rx="40" fill="#e3ece6" />
        <path d="M300 450V150a90 90 0 0 1 180 0v300z" fill="#263553" />
        <path d="M318 450V158a72 72 0 0 1 144 0v292z" fill="#f7d58e" />
        <path d="M318 450V158a72 72 0 0 1 72-72v364z" fill="#fbe7b8" />
        <circle cx="140" cy="120" r="52" fill="#9cc3e4" />
        <circle cx="150" cy="110" r="22" fill="#f7d58e" />
        <path d="M60 450c10-90 60-140 120-140s80 60 85 140z" fill="#5fa8a0" />
        <circle cx="170" cy="262" r="34" fill="#c98a6b" />
        <path d="M150 248c10-30 50-30 58 0-10-8-40-12-58 0z" fill="#263553" />
        <path d="M215 450c4-70 40-112 84-112s50 50 52 112z" fill="#e98d86" />
        <circle cx="292" cy="300" r="28" fill="#8a5a44" />
        <path d="M270 292c4-26 44-30 50 2-14-14-36-12-50-2z" fill="#3a2a2a" />
        <path d="M440 450c-6-40 0-70 14-90 10 30 8 60-2 90z" fill="#a9c39a" />
        <path d="M455 450c4-50 24-80 44-92-2 40-14 70-34 92z" fill="#7fae86" />
        <rect x="40" y="430" width="440" height="20" rx="8" fill="#c9b48a" />
      </g>
      <g fill="none" stroke="#263553" strokeWidth={2.4} strokeLinecap="round">
        <path d="M232 380c18-6 30-6 44 2" />
        <path d="M196 300c8 10 20 14 32 12" />
        <path d="M86 70h16M94 62v16" />
        <path d="M470 60h14M477 53v14" />
      </g>
      <path
        d="M348 214l14 14 26-30"
        fill="none"
        stroke="#b45309"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
