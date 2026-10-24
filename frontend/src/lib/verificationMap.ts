import type { Criterion, VerificationCategory } from '../types/trial';

/** Display order for the Verification Map. */
export const CATEGORY_ORDER: readonly VerificationCategory[] = [
  'self_answer',
  'check_records',
  'ask_study_team',
  'cannot_assess',
];

export type GroupedCriteria = Record<VerificationCategory, Criterion[]>;

/**
 * Groups criteria by the category assigned upstream. This function does not
 * interpret eligibility. Any criterion with an unrecognized category is placed
 * in cannot_assess, so nothing is silently dropped.
 */
export function groupByCategory(criteria: readonly Criterion[]): GroupedCriteria {
  const groups: GroupedCriteria = {
    self_answer: [],
    check_records: [],
    ask_study_team: [],
    cannot_assess: [],
  };

  for (const criterion of criteria) {
    const known = (CATEGORY_ORDER as readonly string[]).includes(criterion.category);
    groups[known ? criterion.category : 'cannot_assess'].push(criterion);
  }

  return groups;
}
