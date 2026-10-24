/**
 * Visit Ready data pipeline — public API barrel (Person B).
 * Person A imports from here.
 */

export * from "./contract/types.js";
export { TrialService } from "./pipeline/service.js";
export type { GetTrialResult, ServiceOptions, CacheEnvelope } from "./pipeline/service.js";
export { loadCache } from "./pipeline/service.js";
export {
  searchStudies,
  lookupStudy,
  isValidNctId,
  ApiError,
} from "./pipeline/client.js";
export type { SearchParams, ClientOptions, FetchLike } from "./pipeline/client.js";
export { normalizeStudy, DEFAULT_STALE_THRESHOLD_DAYS } from "./pipeline/normalize.js";
export type { NormalizeOptions } from "./pipeline/normalize.js";
export {
  buildCriteria,
  segmentEligibilityText,
  classifyCriterion,
  detectUncertaintyFlags,
} from "./pipeline/criteria.js";
export { detectLanguageRequirement } from "./pipeline/language.js";
export { enrichTrial } from "./pipeline/enrich.js";
export {
  buildPreparationCard,
  buildCoordinatorInquiry,
} from "./pipeline/prepare.js";
export type { PreparationCard, Lang } from "./pipeline/prepare.js";
export { DEMO_NCT_ID } from "./data/demo.js";
