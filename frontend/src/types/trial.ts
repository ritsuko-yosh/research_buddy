/**
 * TEMPORARY SHARED CONTRACT (Person A draft).
 *
 * Person B must confirm or amend this before integration. Once both sides
 * agree, change it only through a coordinated edit. Components should depend
 * on these types, never on raw ClinicalTrials.gov JSON.
 */

export type RecruitmentStatus =
  | 'recruiting'
  | 'not_yet_recruiting'
  | 'active_not_recruiting'
  | 'completed'
  | 'terminated'
  | 'withdrawn'
  | 'other'
  | 'unknown';

export type CriterionSection = 'inclusion' | 'exclusion';

/** Grouping for the Verification Map. Assigned by the backend, not by the UI. */
export type VerificationCategory =
  | 'self_answer'
  | 'check_records'
  | 'ask_study_team'
  | 'cannot_assess';

export type TranslationStatus =
  | 'source' // original English registry text
  | 'machine_drafted_unreviewed'
  | 'language_reviewed' // reviewed for language only
  | 'clinically_reviewed' // only after qualified clinical review has actually happened
  | 'unavailable';

export type LanguageRequirementStatus =
  | 'english_required'
  | 'none_stated'
  | 'ambiguous'
  | 'not_listed';

/** Where the data came from. Shown to patients so they know what they are looking at. */
export type DataOrigin = 'live' | 'cached' | 'sample';

export interface Location {
  city: string;
  /** Full state name, for example "Massachusetts". */
  state: string;
}

export interface Contact {
  name: string | null;
  phone: string | null;
  email: string | null;
}

export interface Criterion {
  id: string;
  section: CriterionSection;
  /** Exact registry wording. Always displayed, never replaced. */
  sourceText: string;
  /** Human-readable pointer back into the registry record. */
  sourceRef: string;
  category: VerificationCategory;
  plainExplanation: { en: string | null; es: string | null };
  spanishTranslationStatus: TranslationStatus;
  uncertaintyNotes: string[];
}

export interface LocalizedText {
  en: string | null;
  es: string | null;
}

export interface Trial {
  nctId: string;
  title: string;
  description: LocalizedText;
  recruitmentStatus: RecruitmentStatus;
  locations: Location[];
  /** Registry "last updated" date, YYYY-MM-DD. */
  registryUpdateDate: string | null;
  /** When our system fetched the record, ISO 8601. */
  dataRetrievedAt: string;
  contacts: Contact[];
  languageRequirement: {
    status: LanguageRequirementStatus;
    sourceText: string | null;
  };
  sourceUrl: string;
  criteria: Criterion[];
  dataOrigin: DataOrigin;
}

export interface TrialSummary {
  nctId: string;
  title: string;
  recruitmentStatus: RecruitmentStatus;
  locations: Location[];
  registryUpdateDate: string | null;
}

/** The only seam between the UI and data. Swap the implementation to go live. */
export interface TrialDataSource {
  searchByCondition(conditionId: string): Promise<TrialSummary[]>;
  getTrial(nctId: string): Promise<Trial | null>;
}
