import { isTopicIndex, type TopicIndex } from '../lib/topicIndex';

/**
 * The committed, generated topic file. `import.meta.glob` returns no entries when
 * the file is absent, so the homepage shows its unavailable message instead of
 * failing the build. The guard decides whether the content is used.
 */
const generatedModules = import.meta.glob('./generated/topic-index.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

export function loadTopicIndex(): TopicIndex | null {
  for (const candidate of Object.values(generatedModules)) {
    return isTopicIndex(candidate) ? candidate : null;
  }
  return null;
}
