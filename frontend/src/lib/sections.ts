import type { Messages } from '../i18n/strings';
import type { Criterion } from '../types/trial';

export type SectionGroup = 'inclusion' | 'exclusion' | 'unspecified';

/**
 * Maps any section value to a display group. Only an explicit "inclusion" or
 * "exclusion" is used as-is. Anything else is "unspecified", so it is never
 * shown as an exclusion and never dropped.
 */
export function sectionGroup(section: string): SectionGroup {
  if (section === 'inclusion' || section === 'exclusion') {
    return section;
  }
  return 'unspecified';
}

/** Display label for a section. Unspecified and unknown values get the "not stated" label. */
export function sectionLabel(section: string, m: Messages): string {
  switch (sectionGroup(section)) {
    case 'inclusion':
      return m.inclusion;
    case 'exclusion':
      return m.exclusion;
    case 'unspecified':
      return m.sectionUnspecified;
  }
}

/** Splits criteria into the three groups. Every input criterion appears in exactly one group. */
export function groupBySection(criteria: readonly Criterion[]): Record<SectionGroup, Criterion[]> {
  const groups: Record<SectionGroup, Criterion[]> = {
    inclusion: [],
    exclusion: [],
    unspecified: [],
  };
  for (const criterion of criteria) {
    groups[sectionGroup(criterion.section)].push(criterion);
  }
  return groups;
}
