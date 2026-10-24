/**
 * Mirror of the web app's `Trial` view-model (frontend/src/types/trial.ts).
 *
 * This file is OWNED BY PERSON B and lives in the backend package. It is a
 * read-only copy of the frontend's view-model types so the backend-owned live
 * adapter can produce exactly the shape the frontend consumes WITHOUT the
 * backend importing across into frontend source (which would couple the two
 * build graphs). If the web app changes frontend/src/types/trial.ts, update this
 * mirror in coordination.
 *
 * NOTE: this is the FRONTEND's shape, which intentionally differs from Person
 * B's authoritative `src/contract/types.ts` (v1.0.0). The mapping between them
 * lives in mapToFrontend.ts.
 */

export type FeRecruitmentStatus =
  | "recruiting"
  | "not_yet_recruiting"
  | "active_not_recruiting"
  | "completed"
  | "terminated"
  | "withdrawn"
  | "other"
  | "unknown";

export type FeCriterionSection = "inclusion" | "exclusion" | "unspecified";

export type FeVerificationCategory =
  | "self_answer"
  | "check_records"
  | "ask_study_team"
  | "cannot_assess";

export type FeTranslationStatus =
  | "source"
  | "machine_drafted_unreviewed"
  | "language_reviewed"
  | "clinically_reviewed"
  | "unavailable";

export type FeLanguageRequirementStatus =
  | "english_required"
  | "none_stated"
  | "ambiguous"
  | "not_listed";

export type FeDataOrigin = "live" | "cached" | "sample";

export interface FeLocation {
  city: string;
  state: string;
}

export interface FeContact {
  name: string | null;
  phone: string | null;
  email: string | null;
}

export interface FeCriterion {
  id: string;
  section: FeCriterionSection;
  sourceText: string;
  sourceRef: string;
  category: FeVerificationCategory;
  plainExplanation: { en: string | null; es: string | null };
  spanishTranslationStatus: FeTranslationStatus;
  uncertaintyNotes: string[];
}

export interface FeLocalizedText {
  en: string | null;
  es: string | null;
}

export interface FeTrial {
  nctId: string;
  title: string;
  description: FeLocalizedText;
  recruitmentStatus: FeRecruitmentStatus;
  locations: FeLocation[];
  registryUpdateDate: string | null;
  dataRetrievedAt: string;
  contacts: FeContact[];
  languageRequirement: {
    status: FeLanguageRequirementStatus;
    sourceText: string | null;
  };
  sourceUrl: string;
  criteria: FeCriterion[];
  dataOrigin: FeDataOrigin;
  /**
   * Optional curated plain-language summary of the study description. Additive;
   * the original `description` is always still present and shown. `null` when
   * no curated summary exists.
   */
  plainLanguageSummary: {
    en: string;
    es: string | null;
    /** false = drafted/unreviewed; the UI labels it accordingly. */
    reviewed: boolean;
  } | null;
}

export interface FeTrialSummary {
  nctId: string;
  title: string;
  recruitmentStatus: FeRecruitmentStatus;
  locations: FeLocation[];
  registryUpdateDate: string | null;
}

export interface FeTrialDataSource {
  searchByCondition(conditionId: string): Promise<FeTrialSummary[]>;
  getTrial(nctId: string): Promise<FeTrial | null>;
}
