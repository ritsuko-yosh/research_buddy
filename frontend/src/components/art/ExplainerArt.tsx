import { GouacheFilter } from '../home/DoorIllustration';

/**
 * The three "New to clinical trials?" pictures, ported from the approved
 * Open Door reference (plant, document, people). Decorative: hidden from
 * assistive technology, and the text next to each picture carries the meaning.
 */

interface ExplainerArtProps {
  /** 1 = plant (a study is research), 2 = document (each study has requirements), 3 = people (talking it through). */
  index: 1 | 2 | 3;
}

export function ExplainerArt({ index }: ExplainerArtProps) {
  const filterId = `od-gouache-explain-${index}`;
  return (
    <svg className="od-vig" viewBox="0 0 160 110" aria-hidden="true" focusable="false">
      <defs>
        <GouacheFilter id={filterId} />
      </defs>
      {index === 1 && (
        <>
          <g filter={`url(#${filterId})`}>
            <ellipse cx="80" cy="58" rx="72" ry="48" fill="#e3ece6" />
            <path d="M52 98l6-30h40l6 30z" fill="#c98a6b" />
            <path d="M78 68c-2-18 2-30 8-40" stroke="#5f8f66" strokeWidth="5" fill="none" />
            <path d="M84 40c10-12 26-10 30-4-10 8-22 10-30 4z" fill="#7fae86" />
            <path d="M80 52c-10-10-26-8-30-2 10 8 22 8 30 2z" fill="#a9c39a" />
            <rect x="118" y="30" width="16" height="68" rx="3" fill="#f7d58e" />
          </g>
          <path
            d="M118 42h7M118 54h10M118 66h7M118 78h10M118 90h7"
            stroke="#263553"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      )}
      {index === 2 && (
        <>
          <g filter={`url(#${filterId})`}>
            <ellipse cx="80" cy="58" rx="72" ry="48" fill="#e7eef7" />
            <rect x="40" y="16" width="80" height="84" rx="10" fill="#ffffff" />
            <circle cx="54" cy="34" r="6" fill="#7fb59a" />
            <circle cx="54" cy="52" r="6" fill="#8fb0e0" />
            <circle cx="54" cy="70" r="6" fill="#e0b45a" />
            <circle cx="54" cy="88" r="6" fill="#b8bec8" />
          </g>
          <path
            d="M66 34h40M66 52h32M66 70h38M66 88h28"
            stroke="#263553"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </>
      )}
      {index === 3 && (
        <>
          <g filter={`url(#${filterId})`}>
            <ellipse cx="80" cy="58" rx="72" ry="48" fill="#f3e6e4" />
            <path d="M14 108c4-30 18-44 36-44s30 14 32 44z" fill="#5fa8a0" />
            <circle cx="48" cy="48" r="15" fill="#c98a6b" />
            <path d="M82 108c3-28 16-40 32-40s28 12 30 40z" fill="#e98d86" />
            <circle cx="114" cy="54" r="13" fill="#8a5a44" />
            <path
              d="M70 14h40a10 10 0 0 1 10 10v14a10 10 0 0 1-10 10H92l-10 9 2-9h-14a10 10 0 0 1-10-10V24a10 10 0 0 1 10-10z"
              fill="#ffffff"
            />
          </g>
          <path
            d="M85 26a5 5 0 1 1 7 4.6c-2 1-2.5 2-2.5 4M89.5 40v.5"
            stroke="#263553"
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}
