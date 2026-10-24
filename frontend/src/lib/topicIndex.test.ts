import { describe, expect, it } from 'vitest';
import { TEST_TOPIC_INDEX } from '../test/topicIndex.fixture';
import { isTopicIndex, presetTerms } from './topicIndex';
import { loadTopicIndex } from '../data/topicIndexSource';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe('isTopicIndex', () => {
  it('accepts a well-formed index', () => {
    expect(isTopicIndex(TEST_TOPIC_INDEX)).toBe(true);
  });

  it.each([
    ['missing generatedAt', (v: Record<string, unknown>) => delete v.generatedAt],
    ['wrong groupingSource', (v: Record<string, unknown>) => (v.groupingSource = 'browseBranches')],
    ['negative totalStudies', (v: Record<string, unknown>) => (v.totalStudies = -1)],
    ['non-integer studyCount', (v: Record<string, unknown>) => ((v.topics as Array<Record<string, unknown>>)[0].studyCount = 2.5)],
    ['topics not an array', (v: Record<string, unknown>) => (v.topics = {})],
    ['condition count above topic count', (v: Record<string, unknown>) => {
      (v.topics as Array<{ topConditions: Array<{ studyCount: number }> }>)[0].topConditions[0].studyCount = 99;
    }],
    ['relation to unknown topic', (v: Record<string, unknown>) => {
      (v.topics as Array<{ sharedWith: Array<{ topicId: string; sharedTerms: string[] }> }>)[0].sharedWith.push({ topicId: 'nope', sharedTerms: [] });
    }],
    ['duplicate topic ids', (v: Record<string, unknown>) => {
      const topics = v.topics as Array<Record<string, unknown>>;
      topics.push({ ...topics[0] });
    }],
  ])('rejects %s', (_label, mutate) => {
    const bad = clone(TEST_TOPIC_INDEX) as unknown as Record<string, unknown>;
    mutate(bad);
    expect(isTopicIndex(bad)).toBe(false);
  });

  it('rejects null and primitives', () => {
    expect(isTopicIndex(null)).toBe(false);
    expect(isTopicIndex('index')).toBe(false);
    expect(isTopicIndex(42)).toBe(false);
  });
});

describe('presetTerms', () => {
  it('ranks terms by total studies and caps the list', () => {
    const terms = presetTerms(TEST_TOPIC_INDEX, 6);
    expect(terms[0]).toBe('type 2 diabetes');
    expect(terms).toContain('asthma');
    expect(terms.length).toBeLessThanOrEqual(6);
    expect(new Set(terms).size).toBe(terms.length);
  });

  it('respects a smaller cap', () => {
    expect(presetTerms(TEST_TOPIC_INDEX, 2)).toHaveLength(2);
  });
});

describe('loadTopicIndex', () => {
  it('returns either null or a valid index, never an unchecked object', () => {
    const loaded = loadTopicIndex();
    expect(loaded === null || isTopicIndex(loaded)).toBe(true);
  });
});
