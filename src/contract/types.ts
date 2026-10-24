/**
 * Visit Ready — Shared Data Contract
 * =======================================================================
 *
 * This is the single source of truth for the normalized `Trial` and `Criterion`
 * shapes exchanged between the data pipeline and the web app.
 * Import these types wherever the normalized study shape is needed.
 *
 * SAFETY INVARIANTS encoded by this schema (see project brief §13):
 *  - There is NO eligibility verdict, match score, or "qualifies" boolean. The
 *    schema intentionally cannot represent one.
 *  - Every criterion preserves its original `sourceText` verbatim and a
 *    traceable `sourceReference`. Explanations are additive, never replacements.
 *  - Missing information is explicit (`null` / `"not_stated"`), never guessed.
 *  - Contacts, recruitment status, and language support are only ever populated
 *    from real source data; absence is represented explicitly.
 *
 * Avoid breaking changes without coordinating across the pipeline and web app.
 */

/** Schema version. Bump on breaking changes and coordinate across the project. */
export const CONTRACT_VERSION = "1.0.0" as const;

/**
 * The four conservative Verification Map categories (brief §5).
 * Internal identifiers are stable string literals used across front and back end.
 */
export type VerificationCategory =
  | "self_answer" // Category 1 — You Can Answer (e.g. age)
  | "check_records" // Category 2 — Check Existing Records (e.g. existing lab result)
  | "ask_study_team" // Category 3 — Ask the Study Team (complex/conditional/protocol)
  | "cannot_assess"; // Category 4 — Cannot Assess From Public Information

/** Section a criterion was extracted from within the registry eligibility text. */
export type CriterionSection = "inclusion" | "exclusion" | "unspecified";

/**
 * Structured reasons a criterion is uncertain or complex. These drive the
 * conservative classification and are surfaced to the user as honest flags.
 * They are NOT medical judgments.
 */
export type UncertaintyFlag =
  | "conditional_logic" // "if/unless/except/provided that" branching
  | "exception_clause" // carve-outs to a broader rule
  | "cohort_dependent" // requirement differs by arm/cohort
  | "medical_threshold" // numeric lab/measurement threshold
  | "treatment_history" // prior therapy / washout requirements
  | "institutional_reference" // "institutional upper limit", "per protocol", appendix refs
  | "ambiguous_wording" // vague/underspecified in public registry
  | "external_reference" // points to an appendix/table/URL not in the registry text
  | "unsegmentable"; // text could not be safely split; preserved whole

/**
 * A traceable pointer back to the exact origin of a criterion so the original
 * requirement always remains accessible (brief §13.9).
 */
export interface SourceReference {
  /** NCT ID of the owning study. */
  nctId: string;
  /** Module path within the ClinicalTrials.gov v2 record, e.g. "eligibilityModule.eligibilityCriteria". */
  modulePath: string;
  /** Section the text came from. */
  section: CriterionSection;
  /** Zero-based index of this criterion within its section (ordering preserved). */
  index: number;
  /** Deep link to the study's eligibility tab on ClinicalTrials.gov. */
  sourceUrl: string;
}

/**
 * A single preserved eligibility requirement plus additive, source-faithful
 * explanation and a conservative verification category.
 */
export interface Criterion {
  /** Stable id, e.g. "NCT02896335-inclusion-3". */
  id: string;
  /** ORIGINAL registry wording, preserved verbatim. Never paraphrased here. */
  sourceText: string;
  /** Which section the requirement came from. */
  section: CriterionSection;
  /**
   * Plain-language explanation in English. Additive only — it never replaces or
   * reinterprets `sourceText`. `null` when no curated explanation exists yet
   * (the UI must still show `sourceText`). Numbers/units/time windows preserved.
   */
  explanationEn: string | null;
  /**
   * Prepared Spanish explanation. `null` when unavailable (UI shows this is
   * missing, it does NOT fall back silently to English as if reviewed).
   */
  explanationEs: string | null;
  /**
   * Honest provenance of the Spanish (and any drafted) explanation.
   * `false` means machine-drafted / unreviewed and MUST be labeled as such in UI.
   */
  translationReviewed: boolean;
  /** Conservative Verification Map category. */
  category: VerificationCategory;
  /** Traceable pointer to the source. */
  sourceReference: SourceReference;
  /** Structured, honest flags explaining complexity/uncertainty. May be empty. */
  uncertaintyFlags: UncertaintyFlag[];
}

/** A study contact drawn ONLY from real source data. Never invented. */
export interface Contact {
  name: string;
  /** Raw role from the registry, e.g. "CONTACT", "PRINCIPAL_INVESTIGATOR". */
  role: string | null;
  phone: string | null;
  email: string | null;
}

/** A study location. `status` is the SITE-level recruitment status (distinct from study-wide). */
export interface TrialLocation {
  facility: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  /** SITE-level status, e.g. "RECRUITING". Distinct from Trial.recruitmentStatus. */
  status: string | null;
  contacts: Contact[];
}

/**
 * Explicit language-requirement finding (brief §6). We detect only EXPLICIT
 * stated requirements. We never infer interpreter availability or that a study
 * supports a given language.
 */
export type LanguageRequirementStatus =
  | "explicit_english_required" // registry explicitly requires English ability
  | "explicit_other" // an explicit language requirement other than English
  | "not_stated" // no language requirement found in source — show as not stated
  | "ambiguous"; // language wording present but unclear — route to study team

export interface LanguageRequirement {
  status: LanguageRequirementStatus;
  /** Verbatim source snippet(s) supporting the finding. Empty when `not_stated`. */
  evidence: string[];
  /**
   * Human-facing clarifying note. Always reinforces that a translated Visit
   * Ready interface does NOT imply the study supports that language.
   */
  note: string;
}

/** Whether the normalized record came from the live API or the cached fallback. */
export type DataSourceKind = "live" | "cache";

export interface DataSource {
  kind: DataSourceKind;
  /** ISO-8601 timestamp when the underlying raw record was fetched from the API. */
  fetchedAt: string;
  /** True when the record is older than the configured staleness threshold. */
  stale: boolean;
  /** Configured staleness threshold in days used to compute `stale`. */
  staleThresholdDays: number;
}

/** The normalized study record shared with the frontend. */
export interface Trial {
  /** Contract version this record was produced against. */
  contractVersion: string;
  nctId: string;
  title: string;
  /** Brief summary / description. `null` if the registry omitted it. */
  description: string | null;
  /** STUDY-WIDE recruitment status, e.g. "RECRUITING". */
  recruitmentStatus: string | null;
  /** ISO date (YYYY-MM-DD) the registry listing was last updated. `null` if absent. */
  lastRegistryUpdate: string | null;
  /** ISO-8601 timestamp when Visit Ready retrieved the record. */
  lastFetched: string;
  locations: TrialLocation[];
  /** Study-level central contacts drawn only from source. */
  contacts: Contact[];
  languageRequirement: LanguageRequirement;
  /** Preserved eligibility requirements with conservative categories. */
  criteria: Criterion[];
  /** Canonical ClinicalTrials.gov URL for the study. */
  sourceUrl: string;
  /** Live vs. cache provenance and freshness. */
  dataSource: DataSource;
  /**
   * Optional curated plain-language summary of the study description. Additive:
   * the original `description` is always still present and must stay visible in
   * the UI. `null` when no curated summary exists for this study.
   */
  plainLanguageSummary: PlainLanguageSummary | null;
}

/**
 * A curated, static plain-language summary of the study description (the
 * free/safe alternative to a live LLM). Additive and honestly labeled.
 */
export interface PlainLanguageSummary {
  en: string;
  es: string | null;
  /** Provenance of the summary; false = drafted/unreviewed (label it in UI). */
  reviewed: boolean;
}

/**
 * Lightweight card-level projection of a `Trial` for search-results lists.
 * Additive to the contract (v1.0.0): a `TrialSummary` is derivable from a full
 * `Trial` and carries only what a result card needs to render. It still exposes
 * no eligibility verdict or score.
 */
export interface TrialSummary {
  nctId: string;
  title: string;
  /** STUDY-WIDE recruitment status. */
  recruitmentStatus: string | null;
  /** First city/state we have a recruiting (or any) site in, for the card line. */
  primaryLocation: string | null;
  /** Count of sites located in Massachusetts (study may have many elsewhere). */
  massachusettsSiteCount: number;
  /** True when at least one Massachusetts site is itself RECRUITING. */
  hasRecruitingMaSite: boolean;
  /** Whether a study-level contact exists (card can show a "contact available" hint). */
  hasContact: boolean;
  lastRegistryUpdate: string | null;
  stale: boolean;
  /** Explicit language-requirement status for a card badge. */
  languageRequirement: LanguageRequirementStatus;
  /** Whether curated plain-language explanations exist for this study. */
  hasCuratedContent: boolean;
  sourceUrl: string;
}

/** The response shape returned by a search, for the results-list UI. */
export interface SearchResults {
  contractVersion: string;
  query: {
    condition: string;
    location: string | null;
    status: string | null;
  };
  /** ISO-8601 timestamp when the search was performed. */
  fetchedAt: string;
  totalReturned: number;
  results: TrialSummary[];
}
