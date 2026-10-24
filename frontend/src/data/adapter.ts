import type { TrialDataSource } from '../types/trial';
// Backend-owned, browser-safe live ClinicalTrials.gov data source (Person B).
// Resolved via the "@backend" alias (see vite.config.ts and tsconfig.json).
import { createLiveDataSource } from '@backend/browser/index';

/**
 * Live ClinicalTrials.gov data source.
 *
 * Assigning the backend source to `TrialDataSource` is a compile-time check:
 * if the backend view model drifts from the frontend types, the typecheck fails.
 */
export function createLiveTrialDataSource(): TrialDataSource {
  return createLiveDataSource();
}

/**
 * The production data source. The app always uses the live pipeline.
 * Fixture data is never used here. Tests inject it explicitly.
 */
export const dataSource: TrialDataSource = createLiveTrialDataSource();
