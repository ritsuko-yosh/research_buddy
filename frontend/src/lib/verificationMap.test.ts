import { describe, expect, it } from 'vitest';
import { SAMPLE_TRIALS } from '../data/fixtures/sampleTrials';
import type { Criterion, VerificationCategory } from '../types/trial';
import { CATEGORY_ORDER, groupByCategory } from './verificationMap';

function makeCriterion(id: string, category: VerificationCategory | string): Criterion {
  return {
    id,
    section: 'inclusion',
    sourceText: `Registry text for ${id}`,
    sourceRef: `ref ${id}`,
    category: category as VerificationCategory,
    plainExplanation: { en: null, es: null },
    spanishTranslationStatus: 'unavailable',
    uncertaintyNotes: [],
  };
}

describe('groupByCategory', () => {
  it('keeps every criterion, so nothing is silently dropped', () => {
    const criteria = [
      makeCriterion('a', 'self_answer'),
      makeCriterion('b', 'check_records'),
      makeCriterion('c', 'ask_study_team'),
      makeCriterion('d', 'cannot_assess'),
      makeCriterion('e', 'self_answer'),
    ];

    const groups = groupByCategory(criteria);
    const total = CATEGORY_ORDER.reduce((sum, category) => sum + groups[category].length, 0);

    expect(total).toBe(criteria.length);
  });

  it('preserves the original order within each category', () => {
    const groups = groupByCategory([
      makeCriterion('first', 'self_answer'),
      makeCriterion('other', 'check_records'),
      makeCriterion('second', 'self_answer'),
    ]);

    expect(groups.self_answer.map((c) => c.id)).toEqual(['first', 'second']);
  });

  it('places an unrecognized category in cannot_assess instead of dropping it', () => {
    const groups = groupByCategory([makeCriterion('odd', 'some_new_category')]);

    expect(groups.cannot_assess.map((c) => c.id)).toEqual(['odd']);
  });

  it('always returns all four categories, even when empty', () => {
    const groups = groupByCategory([]);

    expect(Object.keys(groups).sort()).toEqual([...CATEGORY_ORDER].sort());
  });

  it('sample trial A exercises every verification category', () => {
    const sampleA = SAMPLE_TRIALS[0].trial;
    const groups = groupByCategory(sampleA.criteria);

    for (const category of CATEGORY_ORDER) {
      expect(groups[category].length, category).toBeGreaterThan(0);
    }
  });
});
