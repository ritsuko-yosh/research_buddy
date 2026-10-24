import type { TopicIndex } from '../lib/topicIndex';

/**
 * TEST DATA ONLY. Clearly synthetic. Never shown to patients and never imported
 * by production code. It exists so the homepage tests run offline and
 * deterministically. The production page uses the generated topic file, and
 * shows the unavailable message until that file is committed.
 */
export const TEST_TOPIC_INDEX: TopicIndex = {
  generatedAt: '2026-10-24T12:00:00Z',
  query: 'query.locn=Massachusetts&filter.overallStatus=RECRUITING (TEST FIXTURE)',
  totalStudies: 9,
  groupingSource: 'meshAncestors',
  categoryListVersion: 'test-1',
  topics: [
    {
      id: 'metabolic_diseases',
      registryName: 'Nutritional and Metabolic Diseases',
      studyCount: 5,
      topConditions: [
        { term: 'type 2 diabetes', studyCount: 5 },
        { term: 'obesity', studyCount: 1 },
      ],
      sharedWith: [{ topicId: 'neoplasms', sharedTerms: ['obesity'] }],
    },
    {
      id: 'respiratory_tract_diseases',
      registryName: 'Respiratory Tract Diseases',
      studyCount: 4,
      topConditions: [{ term: 'asthma', studyCount: 4 }],
      sharedWith: [],
    },
    {
      id: 'neoplasms',
      registryName: 'Neoplasms',
      studyCount: 3,
      topConditions: [
        { term: 'breast cancer', studyCount: 3 },
        { term: 'obesity', studyCount: 1 },
      ],
      sharedWith: [{ topicId: 'metabolic_diseases', sharedTerms: ['obesity'] }],
    },
    {
      id: 'other',
      registryName: 'Other',
      studyCount: 2,
      topConditions: [{ term: 'rare syndrome', studyCount: 2 }],
      sharedWith: [],
    },
  ],
};
