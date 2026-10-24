import type { VerificationCategory } from '../../types/trial';
import { GouacheFilter } from '../home/DoorIllustration';

/**
 * Verification Map icons from the approved Open Door reference. Each icon is a
 * decorative shape with a line symbol. It is hidden from assistive technology
 * and never implies anyone is qualified: the text heading carries the meaning.
 */

const ICONS: Record<VerificationCategory, { fill: string; paths: string[] }> = {
  // Speech bubble: you may be able to answer this yourself.
  self_answer: {
    fill: '#bfe3cf',
    paths: ['M11 12h18a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4h-9l-6 5v-5h-3a4 4 0 0 1-4-4v-8a4 4 0 0 1 4-4z'],
  },
  // Folder: check existing records.
  check_records: {
    fill: '#c9d9f3',
    paths: ['M8 13a2 2 0 0 1 2-2h7l3 3h10a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2z', 'M8 18h24'],
  },
  // Phone: ask the study team.
  ask_study_team: {
    fill: '#f3dcb6',
    paths: [
      'M13 9l4 1 2 6-3 2c1.5 3.5 4 6 7.5 7.5l2-3 6 2 1 4c0 2-2 3.5-4 3.5C17 31 9 23 9 13c0-2 2-4 4-4z',
    ],
  },
  // Cloud with a question mark: cannot assess from public information.
  cannot_assess: {
    fill: '#dfe2e7',
    paths: [
      'M12 28a6 6 0 0 1-.5-12A8 8 0 0 1 27 14a6 6 0 0 1 1 14z',
      'M18 18.5a2.5 2.5 0 1 1 3.4 2.3c-.9.4-1.4 1-1.4 2M20 25.5v.5',
    ],
  },
};

interface VerificationIconProps {
  category: VerificationCategory;
}

export function VerificationIcon({ category }: VerificationIconProps) {
  const icon = ICONS[category];
  const filterId = `od-gouache-icon-${category}`;
  return (
    <svg className="vm-icon" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <defs>
        <GouacheFilter id={filterId} />
      </defs>
      <g filter={`url(#${filterId})`}>
        <path d="M20 2c10 0 18 7 18 17s-8 19-18 19S2 30 2 20 10 2 20 2z" fill={icon.fill} />
      </g>
      <g fill="none" stroke="#263553" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {icon.paths.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  );
}
