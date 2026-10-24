/**
 * Topic index: research areas built from ClinicalTrials.gov data by the
 * build:topics script and committed as a generated file. The app never calls
 * the topic API directly, and never hand-writes topic lists.
 */

export interface TopicCondition {
  term: string;
  studyCount: number;
}

export interface TopicRelation {
  topicId: string;
  sharedTerms: string[];
}

export interface Topic {
  id: string;
  registryName: string;
  studyCount: number;
  topConditions: TopicCondition[];
  sharedWith: TopicRelation[];
}

export interface TopicIndex {
  generatedAt: string;
  query: string;
  totalStudies: number;
  groupingSource: 'meshAncestors';
  categoryListVersion: string;
  topics: Topic[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isTopicCondition(value: unknown): value is TopicCondition {
  return isRecord(value) && typeof value.term === 'string' && value.term.length > 0 && isCount(value.studyCount);
}

function isTopicRelation(value: unknown): value is TopicRelation {
  return (
    isRecord(value) &&
    typeof value.topicId === 'string' &&
    Array.isArray(value.sharedTerms) &&
    value.sharedTerms.every((term) => typeof term === 'string')
  );
}

function isTopic(value: unknown): value is Topic {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.registryName === 'string' &&
    isCount(value.studyCount) &&
    Array.isArray(value.topConditions) &&
    value.topConditions.every(isTopicCondition) &&
    Array.isArray(value.sharedWith) &&
    value.sharedWith.every(isTopicRelation)
  );
}

/**
 * Runtime guard for the generated file. Rejects missing or wrongly typed fields,
 * and rejects internal inconsistencies:
 *  - a condition count larger than its topic's study count
 *  - a relation that points at a topic not in the index
 * The homepage uses the file only when this returns true.
 */
export function isTopicIndex(value: unknown): value is TopicIndex {
  if (!isRecord(value)) {
    return false;
  }
  if (
    typeof value.generatedAt !== 'string' ||
    typeof value.query !== 'string' ||
    !isCount(value.totalStudies) ||
    value.groupingSource !== 'meshAncestors' ||
    typeof value.categoryListVersion !== 'string' ||
    !Array.isArray(value.topics) ||
    !value.topics.every(isTopic)
  ) {
    return false;
  }

  const topics = value.topics as Topic[];
  const ids = new Set(topics.map((topic) => topic.id));
  if (ids.size !== topics.length) {
    return false;
  }
  return topics.every(
    (topic) =>
      topic.topConditions.every((condition) => condition.studyCount <= topic.studyCount) &&
      topic.sharedWith.every((relation) => ids.has(relation.topicId)),
  );
}

/**
 * Overall most common condition terms across topics, most frequent first.
 * Used for the search shortcuts. Each term is counted once per topic it appears in.
 */
export function presetTerms(index: TopicIndex, max = 6): string[] {
  const totals = new Map<string, number>();
  for (const topic of index.topics) {
    for (const condition of topic.topConditions) {
      totals.set(condition.term, (totals.get(condition.term) ?? 0) + condition.studyCount);
    }
  }
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, max)
    .map(([term]) => term);
}
