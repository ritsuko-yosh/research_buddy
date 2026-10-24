/**
 * TEST-ONLY fixture data source. Never imported by production code.
 *
 * It serves the synthetic records in sampleTrials.ts so the UI tests run
 * offline and deterministically. The production app uses the live
 * ClinicalTrials.gov adapter in data/adapter.ts. Tests inject this source
 * explicitly through the App `dataSource` prop.
 */
import { SUPPORTED_CONDITIONS } from '../conditions';
import type { Trial, TrialDataSource, TrialSummary } from '../../types/trial';
import { SAMPLE_TRIALS, type SampleEntry } from './sampleTrials';

/** Makes loading states visible during tests. */
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

/** Maps a search term to the fixture condition id, when the term is a preset. */
function conditionIdForTerm(term: string): string | null {
  const preset = SUPPORTED_CONDITIONS.find((condition) => condition.term === term);
  return preset ? preset.id : null;
}

export function createFixtureDataSource(entries: readonly SampleEntry[] = SAMPLE_TRIALS): TrialDataSource {
  return {
    async searchByCondition(term: string): Promise<TrialSummary[]> {
      await wait(SIMULATED_LATENCY_MS);
      const conditionId = conditionIdForTerm(term);
      if (conditionId === null) {
        return [];
      }
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
