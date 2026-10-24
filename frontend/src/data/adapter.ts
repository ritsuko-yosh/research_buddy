import type { Trial, TrialDataSource, TrialSummary } from '../types/trial';
import { SAMPLE_TRIALS, type SampleEntry } from './fixtures/sampleTrials';

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
 * Fixture-backed data source. Used until Person B's live adapter is ready.
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

/** The single swap point. Replace with Person B's live ClinicalTrials.gov adapter. */
export const dataSource: TrialDataSource = createFixtureDataSource();
