import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { isTopicIndex, type TopicIndex } from '../frontend/src/lib/topicIndex';
import { buildTopicIndex, type TopicConfig, type TopicStudy } from '../scripts/lib/topics';

/**
 * Property tests for the topic builder, adapted to the MeSH-ancestor rule:
 * a study joins every category whose name appears in its ancestors, and
 * studies that match none go to "Other".
 *
 * These are engineering checks on the builder's invariants, not clinical validation.
 */

const CATEGORIES = ['Neoplasms', 'Mental Disorders', 'Cardiovascular Diseases', 'Virus Diseases'];
const EXCLUDED = ['Symptoms and General Pathology'];
const ANCESTOR_POOL = [...CATEGORIES, ...EXCLUDED, 'Some Unlisted Branch'];
const MESH_POOL = ['breast cancer', 'asthma', 'obesity', 'anxiety', 'rare syndrome'];

const config: TopicConfig = {
  categories: [...CATEGORIES, ...EXCLUDED],
  excludedBranches: EXCLUDED,
  maxConditionsPerTopic: 6,
  maxSharedTerms: 5,
  query: 'test-query',
  generatedAt: '2026-01-01T00:00:00Z',
  categoryListVersion: 'test-v1',
};

/** Study without an identifier. The identifier is assigned by position in each property, so no duplicates occur. */
const studyShape = fc.record({
  states: fc.subarray(['Massachusetts', 'Texas', 'New York'], { minLength: 0, maxLength: 2 }),
  meshes: fc.uniqueArray(fc.constantFrom(...MESH_POOL), { maxLength: 3 }),
  ancestors: fc.uniqueArray(fc.constantFrom(...ANCESTOR_POOL), { maxLength: 4 }),
});

const studiesArb = fc.array(studyShape, { maxLength: 25 }).map((shapes) =>
  shapes.map((shape, position): TopicStudy => ({
    nctId: `NCT${String(position + 1).padStart(8, '0')}`,
    ...shape,
  })),
);

function isMassachusetts(study: TopicStudy): boolean {
  return study.states.includes('Massachusetts');
}

describe('topic builder properties (MeSH-ancestor rule)', () => {
  it('1. studyCount equals the number of distinct Massachusetts studies in each area', () => {
    fc.assert(
      fc.property(studiesArb, (studies) => {
        const { index } = buildTopicIndex(studies, config);
        for (const topic of index.topics.filter((t) => t.id !== 'other')) {
          const expected = studies.filter(
            (s) => isMassachusetts(s) && s.ancestors.includes(topic.registryName),
          ).length;
          expect(topic.studyCount).toBe(expected);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('2. every topCondition count is at most its area studyCount', () => {
    fc.assert(
      fc.property(studiesArb, (studies) => {
        const { index } = buildTopicIndex(studies, config);
        for (const topic of index.topics) {
          for (const condition of topic.topConditions) {
            expect(condition.studyCount).toBeLessThanOrEqual(topic.studyCount);
          }
        }
      }),
      { numRuns: 200 },
    );
  });

  it('3. sharedWith is symmetric: A lists B with the same terms if and only if B lists A', () => {
    fc.assert(
      fc.property(studiesArb, (studies) => {
        const { index } = buildTopicIndex(studies, config);
        const byId = new Map(index.topics.map((t) => [t.id, t]));
        for (const topic of index.topics) {
          for (const relation of topic.sharedWith) {
            const other = byId.get(relation.topicId);
            expect(other, `${topic.id} -> ${relation.topicId}`).toBeDefined();
            const back = other?.sharedWith.find((r) => r.topicId === topic.id);
            expect(back?.sharedTerms).toEqual(relation.sharedTerms);
          }
        }
      }),
      { numRuns: 200 },
    );
  });

  it('4. a study with no Massachusetts location is never counted', () => {
    fc.assert(
      fc.property(studiesArb, (studies) => {
        const withOutsiders = buildTopicIndex(studies, config).index;
        const onlyMassachusetts = buildTopicIndex(studies.filter(isMassachusetts), config).index;
        expect(withOutsiders.totalStudies).toBe(studies.filter(isMassachusetts).length);
        expect(withOutsiders.topics).toEqual(onlyMassachusetts.topics);
      }),
      { numRuns: 200 },
    );
  });

  it('5. shuffling the input studies gives the same output', () => {
    fc.assert(
      fc.property(
        studiesArb.chain((studies) =>
          fc.tuple(fc.constant(studies), fc.shuffledSubarray(studies, { minLength: studies.length, maxLength: studies.length })),
        ),
        ([studies, shuffled]) => {
          expect(buildTopicIndex(shuffled, config).index).toEqual(buildTopicIndex(studies, config).index);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('6. no excluded or catch-all branch appears in the output', () => {
    fc.assert(
      fc.property(studiesArb, (studies) => {
        const { index } = buildTopicIndex(studies, config);
        const names = index.topics.map((t) => t.registryName);
        for (const excluded of EXCLUDED) {
          expect(names).not.toContain(excluded);
        }
        const ids = index.topics.map((t) => t.id);
        expect(ids).not.toContain('symptoms_and_general_pathology');
      }),
      { numRuns: 200 },
    );
  });

  it('7. the frontend guard accepts every built index and rejects corrupted ones', () => {
    fc.assert(
      fc.property(studiesArb, fc.integer({ min: 0, max: 3 }), (studies, corruption) => {
        const { index } = buildTopicIndex(studies, config);
        expect(isTopicIndex(index)).toBe(true);

        const bad = JSON.parse(JSON.stringify(index)) as Record<string, unknown>;
        if (corruption === 0) {
          bad.groupingSource = 'browseBranches';
        } else if (corruption === 1) {
          delete bad.generatedAt;
        } else if (corruption === 2) {
          bad.totalStudies = -1;
        } else {
          (bad as unknown as TopicIndex).topics = [
            ...(index.topics as unknown[]),
            { id: 'bad', registryName: 'bad' },
          ] as never;
        }
        expect(isTopicIndex(bad)).toBe(false);
      }),
      { numRuns: 200 },
    );
  });
});
