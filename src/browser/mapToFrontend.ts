/**
 * Map Person B's authoritative `Trial` (src/contract/types.ts, v1.0.0) into the
 * frontend view-model `FeTrial` (frontendContract.ts).
 *
 * This mapping is the single reconciliation point between the two contracts.
 * It preserves every safety invariant:
 *  - No criterion is dropped; `unspecified` sections are carried through as
 *    `unspecified` (never coerced to `exclusion`).
 *  - Original `sourceText` is passed verbatim.
 *  - Missing data stays explicit (null / empty).
 *  - Language status distinguishes explicit vs not-stated vs ambiguous.
 *  - Translation review status is honest (reviewed vs machine-drafted).
 */

import type {
  Contact,
  Criterion,
  CriterionSection,
  LanguageRequirementStatus,
  Trial,
  UncertaintyFlag,
  VerificationCategory,
} from "../contract/types.js";
import type {
  FeContact,
  FeCriterion,
  FeCriterionSection,
  FeDataOrigin,
  FeLanguageRequirementStatus,
  FeLocation,
  FeTranslationStatus,
  FeTrial,
  FeVerificationCategory,
} from "./frontendContract.js";

/** Map raw registry status string -> frontend lowercase enum. Unknown -> "unknown". */
export function mapRecruitmentStatus(raw: string | null): FeTrial["recruitmentStatus"] {
  switch ((raw ?? "").toUpperCase()) {
    case "RECRUITING":
      return "recruiting";
    case "NOT_YET_RECRUITING":
      return "not_yet_recruiting";
    case "ACTIVE_NOT_RECRUITING":
      return "active_not_recruiting";
    case "COMPLETED":
      return "completed";
    case "TERMINATED":
      return "terminated";
    case "WITHDRAWN":
      return "withdrawn";
    case "":
      return "unknown";
    default:
      return "other";
  }
}

/** Section mapping is 1:1, including `unspecified` (never collapsed to exclusion). */
function mapSection(section: CriterionSection): FeCriterionSection {
  return section; // identical union; explicit for safety/intent
}

/** Category mapping is 1:1 (same four categories). */
function mapCategory(category: VerificationCategory): FeVerificationCategory {
  return category;
}

/**
 * Translation status for a criterion's Spanish text.
 *  - no Spanish explanation at all        -> "unavailable"
 *  - Spanish present, reviewed=true        -> "language_reviewed" (reviewed for
 *      language; we do NOT claim clinical review unless the backend ever asserts it)
 *  - Spanish present, reviewed=false       -> "machine_drafted_unreviewed"
 */
function mapTranslationStatus(c: Criterion): FeTranslationStatus {
  if (c.explanationEs == null) return "unavailable";
  return c.translationReviewed ? "language_reviewed" : "machine_drafted_unreviewed";
}

/** Language requirement status mapping (brief §6 semantics preserved). */
export function mapLanguageStatus(status: LanguageRequirementStatus): FeLanguageRequirementStatus {
  switch (status) {
    case "explicit_english_required":
      return "english_required";
    case "ambiguous":
      return "ambiguous";
    case "explicit_other":
      // An explicit non-English requirement is still a stated requirement the
      // user must heed; surface as ambiguous so the UI prompts them to ask.
      return "ambiguous";
    case "not_stated":
    default:
      return "none_stated";
  }
}

/**
 * Human-readable, honest notes for each structured uncertainty flag. These are
 * surfaced to the patient in English (the frontend renders uncertaintyNotes
 * with lang="en"). They describe WHY something is complex; they are not medical
 * judgments.
 */
const FLAG_NOTES: Record<UncertaintyFlag, string> = {
  conditional_logic:
    "This requirement has conditional (if/unless) wording. The study team can confirm how it applies to you.",
  exception_clause:
    "This requirement includes exceptions. Ask the study team which parts apply in your situation.",
  cohort_dependent:
    "This requirement differs by study group or cohort. The study team can tell you which applies.",
  medical_threshold:
    "This refers to a specific lab value or measurement. You may already have this in your records.",
  treatment_history:
    "This depends on your past treatments or timing. The study team can review your history.",
  institutional_reference:
    "This refers to a hospital's or protocol's own limits, which are not in the public listing.",
  ambiguous_wording:
    "The public wording here is not fully specified. Ask the study team to clarify.",
  external_reference:
    "This points to an appendix, table, or link that is not included in the public listing.",
  unsegmentable:
    "The registry text could not be safely split into separate items, so it is shown in full.",
};

function mapUncertaintyFlags(flags: UncertaintyFlag[]): string[] {
  return flags.map((f) => FLAG_NOTES[f]);
}

function mapContact(c: Contact): FeContact {
  return { name: c.name || null, phone: c.phone, email: c.email };
}

function mapCriterion(c: Criterion): FeCriterion {
  const sourceRef = `Eligibility criteria, ${c.section} item ${c.sourceReference.index + 1}`;
  return {
    id: c.id,
    section: mapSection(c.section),
    sourceText: c.sourceText,
    sourceRef,
    category: mapCategory(c.category),
    plainExplanation: { en: c.explanationEn, es: c.explanationEs },
    spanishTranslationStatus: mapTranslationStatus(c),
    uncertaintyNotes: mapUncertaintyFlags(c.uncertaintyFlags),
  };
}

/** Map a full normalized Trial into the frontend view model. */
export function mapTrialToFrontend(trial: Trial): FeTrial {
  const dataOrigin: FeDataOrigin = trial.dataSource.kind === "cache" ? "cached" : "live";

  const locations: FeLocation[] = trial.locations
    .filter((l) => l.city && l.state)
    .map((l) => ({ city: l.city as string, state: l.state as string }));

  return {
    nctId: trial.nctId,
    title: trial.title,
    // Backend has only English text today; Spanish description not provided ->
    // explicit null (frontend shows the English fallback honestly).
    description: { en: trial.description, es: null },
    recruitmentStatus: mapRecruitmentStatus(trial.recruitmentStatus),
    locations,
    registryUpdateDate: trial.lastRegistryUpdate,
    dataRetrievedAt: trial.lastFetched,
    contacts: trial.contacts.map(mapContact),
    languageRequirement: {
      status: mapLanguageStatus(trial.languageRequirement.status),
      // Preserve the first verbatim evidence snippet when present.
      sourceText: trial.languageRequirement.evidence[0] ?? null,
    },
    sourceUrl: trial.sourceUrl,
    criteria: trial.criteria.map(mapCriterion),
    dataOrigin,
    plainLanguageSummary: trial.plainLanguageSummary
      ? {
          en: trial.plainLanguageSummary.en,
          es: trial.plainLanguageSummary.es,
          reviewed: trial.plainLanguageSummary.reviewed,
        }
      : null,
  };
}
