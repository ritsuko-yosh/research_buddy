/**
 * Browser-safe entry point (Person B, backend-owned).
 *
 * Everything exported here is free of Node-only APIs (no `fs`/`path`/`url`) and
 * safe to bundle into a Vite/browser app. Person A imports from here to go live:
 *
 *   import { createLiveDataSource } from "visit-ready/browser";
 *   export const dataSource = createLiveDataSource();
 */

export { createLiveDataSource } from "./liveDataSource.js";
export type { LiveDataSourceOptions } from "./liveDataSource.js";
export { mapTrialToFrontend, mapRecruitmentStatus, mapLanguageStatus } from "./mapToFrontend.js";
export type {
  FeTrial,
  FeTrialSummary,
  FeTrialDataSource,
  FeCriterion,
  FeContact,
  FeLocation,
  FeRecruitmentStatus,
  FeCriterionSection,
  FeVerificationCategory,
  FeTranslationStatus,
  FeLanguageRequirementStatus,
  FeDataOrigin,
} from "./frontendContract.js";
