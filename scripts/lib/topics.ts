/**
 * Pure, fs-free topic builder. No network access and no file access here, so
 * this module can be tested in isolation and moved later without changes.
 *
 * Output type and validation come from the frontend's shared guard
 * (frontend/src/lib/topicIndex.ts). The script and the app therefore agree on
 * the shape.
 */
import type { Topic, TopicIndex } from '../../frontend/src/lib/topicIndex';

export interface TopicStudy {
  nctId: string;
  /** Location states as the registry lists them, for example "Massachusetts". */
  states: string[];
  /** MeSH condition terms. */
  meshes: string[];
  /** MeSH ancestor terms, nearest first. */
  ancestors: string[];
}

export interface TopicConfig {
  categories: readonly string[];
  excludedBranches: readonly string[];
  maxConditionsPerTopic: number;
  maxSharedTerms: number;
  query: string;
  generatedAt: string;
  categoryListVersion: string;
}

export interface BuildReport {
  totalMassachusettsStudies: number;
  areas: Array<{ id: string; registryName: string; studyCount: number }>;
  /** Categories that matched no Massachusetts study. */
  unmatchedCategories: string[];
  /** Categories removed by the exclusion list. */
  excludedCategories: string[];
  otherCount: number;
}

export interface BuildResult {
  index: TopicIndex;
  report: BuildReport;
}

/** Converts one raw API study into the fields the builder needs. Returns null when there is no NCT ID. */
export function toTopicStudy(raw: unknown): TopicStudy | null {
  const record = raw as {
    protocolSection?: {
      identificationModule?: { nctId?: unknown };
      contactsLocationsModule?: { locations?: Array<{ state?: unknown }> };
    };
    derivedSection?: {
      conditionBrowseModule?: {
        meshes?: Array<{ term?: unknown }>;
        ancestors?: Array<{ term?: unknown }>;
      };
    };
  };
  const nctId = record.protocolSection?.identificationModule?.nctId;
  if (typeof nctId !== 'string' || nctId.length === 0) {
    return null;
  }
  const strings = (items: Array<{ term?: unknown }> | undefined) =>
    (items ?? []).map((item) => item.term).filter((term): term is string => typeof term === 'string');
  const states = (record.protocolSection?.contactsLocationsModule?.locations ?? [])
    .map((location) => location.state)
    .filter((state): state is string => typeof state === 'string');
  const browse = record.derivedSection?.conditionBrowseModule;
  return {
    nctId,
    states,
    meshes: strings(browse?.meshes),
    ancestors: strings(browse?.ancestors),
  };
}

/** Stable, URL-safe id from a registry name: "Neoplasms" -> "neoplasms". */
export function topicId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function compareCounts(a: { studyCount: number; id: string }, b: { studyCount: number; id: string }): number {
  return b.studyCount - a.studyCount || a.id.localeCompare(b.id);
}

/**
 * Builds the topic index.
 *
 * Rules:
 * - Only studies with a Massachusetts location count. Each study is counted once.
 * - A study joins every category whose name appears in its ancestors.
 * - Studies that match no category join "Other".
 * - Excluded branches are removed from the category list and never appear.
 * - Each area's studyCount is its distinct-study count.
 * - topConditions are MeSH terms ranked by distinct-study count within the area.
 * - sharedWith links two areas when they share at least one MeSH term (symmetric).
 * - Areas are sorted by studyCount descending, then id, so input order does not matter.
 */
export function buildTopicIndex(studies: readonly TopicStudy[], config: TopicConfig): BuildResult {
  const byId = new Map<string, TopicStudy>();
  for (const study of studies) {
    if (study.states.includes('Massachusetts') && !byId.has(study.nctId)) {
      byId.set(study.nctId, study);
    }
  }
  const massachusetts = [...byId.values()].sort((a, b) => a.nctId.localeCompare(b.nctId));

  const excluded = new Set(config.excludedBranches);
  const excludedCategories = config.categories.filter((category) => excluded.has(category));
  const categories = config.categories.filter((category) => !excluded.has(category));

  const groups = categories.map((name) => ({
    name,
    id: topicId(name),
    members: massachusetts.filter((study) => study.ancestors.includes(name)),
  }));

  const unmatched = massachusetts.filter(
    (study) => !categories.some((name) => study.ancestors.includes(name)),
  );

  const built: Array<{ topic: Topic; termSet: Set<string> }> = [];
  for (const group of groups.filter((g) => g.members.length > 0)) {
    built.push({ topic: buildTopic(group.id, group.name, group.members, config), termSet: termsOf(group.members) });
  }
  if (unmatched.length > 0) {
    built.push({ topic: buildTopic('other', 'Other', unmatched, config), termSet: termsOf(unmatched) });
  }

  // Relations between real areas only. "Other" is a catch-all, so it does not share terms.
  const relationsById = new Map<string, Topic['sharedWith']>();
  for (const entry of built) {
    relationsById.set(entry.topic.id, []);
  }
  for (let i = 0; i < built.length; i++) {
    for (let j = i + 1; j < built.length; j++) {
      const a = built[i];
      const b = built[j];
      if (!a || !b || a.topic.id === 'other' || b.topic.id === 'other') {
        continue;
      }
      const shared = [...a.termSet].filter((term) => b.termSet.has(term)).sort().slice(0, config.maxSharedTerms);
      if (shared.length > 0) {
        relationsById.get(a.topic.id)?.push({ topicId: b.topic.id, sharedTerms: shared });
        relationsById.get(b.topic.id)?.push({ topicId: a.topic.id, sharedTerms: shared });
      }
    }
  }

  const topics = built
    .map((entry) => ({
      ...entry.topic,
      sharedWith: (relationsById.get(entry.topic.id) ?? []).sort((x, y) => x.topicId.localeCompare(y.topicId)),
    }))
    .sort(compareCounts);

  const index: TopicIndex = {
    generatedAt: config.generatedAt,
    query: config.query,
    totalStudies: massachusetts.length,
    groupingSource: 'meshAncestors',
    categoryListVersion: config.categoryListVersion,
    topics,
  };

  return {
    index,
    report: {
      totalMassachusettsStudies: massachusetts.length,
      areas: topics.map((topic) => ({ id: topic.id, registryName: topic.registryName, studyCount: topic.studyCount })),
      unmatchedCategories: groups.filter((g) => g.members.length === 0).map((g) => g.name),
      excludedCategories,
      otherCount: unmatched.length,
    },
  };
}

function termsOf(members: readonly TopicStudy[]): Set<string> {
  const terms = new Set<string>();
  for (const study of members) {
    for (const term of study.meshes) {
      terms.add(term);
    }
  }
  return terms;
}

function buildTopic(id: string, registryName: string, members: readonly TopicStudy[], config: TopicConfig): Topic {
  const counts = new Map<string, number>();
  for (const study of members) {
    for (const term of new Set(study.meshes)) {
      counts.set(term, (counts.get(term) ?? 0) + 1);
    }
  }
  const topConditions = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, config.maxConditionsPerTopic)
    .map(([term, studyCount]) => ({ term, studyCount }));
  return {
    id,
    registryName,
    studyCount: members.length,
    topConditions,
    sharedWith: [],
  };
}
