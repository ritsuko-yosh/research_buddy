import type { Trial, TrialDataSource, TrialSummary } from '../types/trial';
import { SAMPLE_TRIALS, type SampleEntry } from './fixtures/sampleTrials';
// Backend-owned, browser-safe live ClinicalTrials.gov data source (Person B).
// Resolved via the "@backend" alias (see vite.config.ts / tsconfig.json).
import { createLiveDataSource } from '@backend/browser/index';
import type { FeTrial, FeTrialSummary } from '@backend/browser/frontendContract';

/** Makes loading states visible during development. Set to 0 in tests if needed. */
const SIMULATED_LATENCY_MS = 150;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function hasMassachusettsSite(trial: Trial): boolean {
  return trial.locations.some((location) => location.state === 'Massachusetts');
}

function toSummary(trial: Trial): TrialSummary {
  return {
    nctId: trial.nctId,
    title: trial.title,
    recruitmentStatus: trial.recruitmentStatus,
    locations: trial.locations,
    registryUpdateDate: trial.registryUpdateDate,
  };
}

/**
 * Fixture-backed data source. Kept for tests and offline development.
 * Returns only Massachusetts studies for condition search, but NCT lookup
 * can open any record, so the UI shows the correct states for both paths.
 */
export function createFixtureDataSource(entries: readonly SampleEntry[] = SAMPLE_TRIALS): TrialDataSource {
  return {
    async searchByCondition(conditionId: string): Promise<TrialSummary[]> {
      await wait(SIMULATED_LATENCY_MS);
      return entries
        .filter((entry) => entry.conditionId === conditionId && hasMassachusettsSite(entry.trial))
        .map((entry) => toSummary(entry.trial));
    },

    async getTrial(nctId: string): Promise<Trial | null> {
      await wait(SIMULATED_LATENCY_MS);
      const match = entries.find((entry) => entry.trial.nctId === nctId);
      return match ? match.trial : null;
    },
  };
}

/**
 * Live ClinicalTrials.gov data source. Wraps Person B's browser-safe pipeline.
 *
 * The backend returns `FeTrial`/`FeTrialSummary`, which are structurally
 * identical to this app's `Trial`/`TrialSummary` (same fields and unions). The
 * wrapper below makes that correspondence explicit and keeps the UI depending
 * only on the frontend types.
 */
export function createLiveTrialDataSource(): TrialDataSource {
  const live = createLiveDataSource();
  return {
    async searchByCondition(conditionId: string): Promise<TrialSummary[]> {
      const results: FeTrialSummary[] = await live.searchByCondition(conditionId);
      return results as TrialSummary[];
    },
    async getTrial(nctId: string): Promise<Trial | null> {
      const trial: FeTrial | null = await live.getTrial(nctId);
      return trial as Trial | null;
    },
  };
}

/**
 * The single swap point.
 *
 * Production and local dev use the LIVE ClinicalTrials.gov pipeline so the app
 * shows real studies. Under the test runner (Vitest sets import.meta.env.MODE
 * to "test") we default to the deterministic fixture source so the existing
 * suite runs offline and without network flakiness. Any caller may still inject
 * an explicit data source via the `App` prop.
 */
const isTestEnv = import.meta.env?.MODE === 'test';

export const dataSource: TrialDataSource = isTestEnv
  ? createFixtureDataSource()
  : createLiveTrialDataSource();
