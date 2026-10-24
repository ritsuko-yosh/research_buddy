import { GouacheFilter } from '../home/DoorIllustration';

/**
 * Search loader picture, ported from the approved Open Door reference. The
 * line draws and the three dots bob only while motion is allowed. Under
 * reduced motion or Pause Animation, the CSS removes the movement and the
 * picture stays still.
 */
export function SearchLoaderArt() {
  return (
    <svg className="od-loader-art" viewBox="0 0 240 110" aria-hidden="true" focusable="false">
      <defs>
        <GouacheFilter id="od-gouache-loader" />
      </defs>
      <g filter="url(#od-gouache-loader)">
        <path
          d="M30 60c0-30 40-48 90-48s92 16 92 46-38 46-92 46S30 90 30 60z"
          fill="#d7ebe7"
        />
        <circle className="ld-dot d1" cx="74" cy="86" r="7" fill="#e98d86" />
        <circle className="ld-dot d2" cx="120" cy="92" r="7" fill="#e0b45a" />
        <circle className="ld-dot d3" cx="166" cy="86" r="7" fill="#9cc3e4" />
      </g>
      <path
        className="ld-line"
        d="M24 56h52l10-22 14 46 14-58 12 46 8-12h82"
        fill="none"
        stroke="#263553"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
      />
    </svg>
  );
}
