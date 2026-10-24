import { useId } from 'react';

/**
 * Visit Ready header mark: a line-drawn dog in a lab coat, holding a check,
 * in front of a soft globe. Decorative here because the app name sits next to it.
 * The globe colors follow the page language (see --blob-a and --blob-b in styles.css).
 */
export function BrandMark() {
  const uid = useId().replace(/:/g, '');
  const gradientId = `vr-blob-${uid}`;
  const clipId = `vr-blob-clip-${uid}`;

  return (
    <svg className="vr-logo" viewBox="22 22 156 156" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--blob-a, #9fdcd2)' }} />
          <stop offset="1" style={{ stopColor: 'var(--blob-b, #b9cff5)' }} />
        </linearGradient>
        <clipPath id={clipId}>
          <path d="M118 40c26 2 46 24 44 52-2 25-18 44-42 48-27 5-52-10-56-36-4-28 20-66 54-64z" />
        </clipPath>
      </defs>
      <path
        d="M118 40c26 2 46 24 44 52-2 25-18 44-42 48-27 5-52-10-56-36-4-28 20-66 54-64z"
        fill={`url(#${gradientId})`}
      />
      <g clipPath={`url(#${clipId})`} fill="none" stroke="#fff" strokeWidth="1.4" opacity=".7">
        <ellipse cx="114" cy="90" rx="22" ry="52" />
        <path d="M50 90h120M54 62h112M54 118h112" />
      </g>
      <circle cx="100" cy="100" r="74" fill="#fff" fillOpacity="0" stroke="#2b3445" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
      <g transform="translate(56 42) scale(.68)">
        <path d="M95 130l7 6c14-11 15-30 6-41" fill="none" stroke="#2b3445" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <path d="M22 136V46c0-6 1-11 3-16l6-17c1-3 3-3 5-1l12 20h24l12-21c2-3 4-2 5 1 4 14 7 30 7 46v78c0 10-7 16-16 16H38c-9 0-16-6-16-16z" fill="#fffdf9" fillOpacity=".55" stroke="#2b3445" strokeWidth="1.4" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <path d="M31 25c0-2 3-3 4-1 1-2 4-1 4 1 0 3-4 5-4 6 0-1-4-3-4-6zM83 24c0-2 3-3 4-1 1-2 4-1 4 1 0 3-4 5-4 6 0-1-4-3-4-6z" fill="#e8798f" />
        <path d="M22 84c12-6 26-4 37 12 11-16 25-18 37-12M38 80l21 32 21-32M59 112v40" fill="none" stroke="#2b3445" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <rect x="69" y="124" width="15" height="11" rx="2" fill="none" stroke="#2b3445" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <path d="M48 53h4M66 53h4M59 64v5" fill="none" stroke="#2b3445" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <path d="M49 64a10 7 0 1 0 20 0a10 7 0 1 0-20 0" fill="none" stroke="#2b3445" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <path d="M55 60h8l-4 4z" fill="#2b3445" stroke="#2b3445" strokeWidth="1.4" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <path className="vr-check" d="M45 86l11 11 19-24" fill="none" stroke="#b45309" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" pathLength="1" />
        <path d="M44 100c0-4 3-6.5 7-6.5s7 2.5 7 6.5M59 100c0-4 3-6.5 7-6.5s7 2.5 7 6.5M48 101v2M51 101.5v2M54 101v2M63 101v2M66 101.5v2M69 101v2" fill="none" stroke="#2b3445" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  );
}
