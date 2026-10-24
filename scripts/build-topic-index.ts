/**
 * Builds frontend/src/data/generated/topic-index.json from ClinicalTrials.gov API v2.
 *
 *   npm run build:topics   (run from the repo root)
 *
 * Fails without writing anything when the API fails or the result does not pass
 * the frontend guard. The committed file is only replaced by a complete, valid run.
 */
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isTopicIndex } from '../frontend/src/lib/topicIndex';
import {
  CATEGORY_LIST_VERSION,
  DISEASE_CATEGORIES,
  EXCLUDED_BRANCHES,
  MAX_CONDITIONS_PER_TOPIC,
  MAX_SHARED_TERMS,
} from './lib/meshCategories';
import { buildTopicIndex, toTopicStudy, type TopicStudy } from './lib/topics';

const API_URL = 'https://clinicaltrials.gov/api/v2/studies';
const QUERY = 'query.locn=Massachusetts&filter.overallStatus=RECRUITING';
const FIELDS = [
  'protocolSection.identificationModule.nctId',
  'protocolSection.contactsLocationsModule.locations',
  'derivedSection.conditionBrowseModule',
].join(',');
const PAGE_SIZE = 1000;
const REQUEST_TIMEOUT_MS = 30_000;
const OUTPUT_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '../frontend/src/data/generated/topic-index.json');

async function fetchPage(pageToken: string | undefined): Promise<Record<string, unknown>> {
  const params = new URLSearchParams({ pageSize: String(PAGE_SIZE), countTotal: 'true', fields: FIELDS });
  if (pageToken) {
    params.set('pageToken', pageToken);
  }
  const url = `${API_URL}?${QUERY}&${params.toString()}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`ClinicalTrials.gov returned HTTP ${response.status}`);
  }
  const body: unknown = await response.json().catch(() => {
    throw new Error('ClinicalTrials.gov returned a response that is not JSON');
  });
  if (typeof body !== 'object' || body === null || !Array.isArray((body as { studies?: unknown }).studies)) {
    throw new Error('ClinicalTrials.gov response has no studies list');
  }
  return body as Record<string, unknown>;
}

async function fetchAllStudies(): Promise<{ studies: TopicStudy[]; totalCount: number; pages: number; rawCount: number }> {
  const studies: TopicStudy[] = [];
  let pageToken: string | undefined;
  let pages = 0;
  let totalCount = 0;
  let rawCount = 0;
  do {
    const body = await fetchPage(pageToken);
    pages += 1;
    if (typeof body.totalCount === 'number') {
      totalCount = body.totalCount;
    }
    const raw = body.studies as unknown[];
    rawCount += raw.length;
    for (const record of raw) {
      const study = toTopicStudy(record);
      if (study) {
        studies.push(study);
      }
    }
    pageToken = typeof body.nextPageToken === 'string' ? body.nextPageToken : undefined;
  } while (pageToken);
  return { studies, totalCount, pages, rawCount };
}

async function main() {
  const generatedAt = new Date().toISOString();
  const url = `${API_URL}?${QUERY}`;
  console.log(`Query: ${url}`);

  const fetched = await fetchAllStudies();
  console.log(`Pages: ${fetched.pages}; records received: ${fetched.rawCount}; registry totalCount: ${fetched.totalCount}`);

  const { index, report } = buildTopicIndex(fetched.studies, {
    categories: DISEASE_CATEGORIES,
    excludedBranches: EXCLUDED_BRANCHES,
    maxConditionsPerTopic: MAX_CONDITIONS_PER_TOPIC,
    maxSharedTerms: MAX_SHARED_TERMS,
    query: url,
    generatedAt,
    categoryListVersion: CATEGORY_LIST_VERSION,
  });

  if (!isTopicIndex(index)) {
    throw new Error('Built index failed validation; nothing was written');
  }

  console.log('\nResearch areas (distinct Massachusetts studies per area):');
  for (const area of report.areas) {
    console.log(`  ${String(area.studyCount).padStart(5)}  ${area.registryName}  [${area.id}]`);
  }
  console.log(`\nMassachusetts studies: ${report.totalMassachusettsStudies}`);
  console.log(`"Other" (matched no category): ${report.otherCount}`);
  console.log(`Excluded by config (removed before matching): ${report.excludedCategories.join('; ') || 'none'}`);
  console.log(`Categories that never matched (dropped): ${report.unmatchedCategories.join('; ') || 'none'}`);
  const memberships = report.areas.filter((a) => a.id !== 'other').reduce((sum, a) => sum + a.studyCount, 0);
  console.log(`Memberships across areas: ${memberships} (a study with several conditions counts once per area)`);

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  const temporary = `${OUTPUT_PATH}.tmp`;
  await writeFile(temporary, `${JSON.stringify(index, null, 2)}\n`, 'utf8');
  await rename(temporary, OUTPUT_PATH);
  console.log(`\nWrote ${OUTPUT_PATH}`);
}

main().catch((error: unknown) => {
  console.error(`build:topics failed: ${error instanceof Error ? error.message : String(error)}`);
  console.error('The existing topic file was left unchanged.');
  process.exitCode = 1;
});
