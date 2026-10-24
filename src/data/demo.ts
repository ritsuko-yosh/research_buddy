/**
 * Curated demonstration studies (brief §7, §B, §P2 task 18).
 *
 * The PRIMARY demo study is NCT02896335 — "Palbociclib and Pembrolizumab In
 * Central Nervous System Metastases" — a REAL study RECRUITING at Massachusetts
 * General Hospital (Boston) with a real study contact, whose eligibility
 * criteria exercise all four Verification Map categories including complex
 * conditional exclusions (e.g. previously-treated CNS lesions, cohort-dependent
 * rules) that must NOT be flattened into yes/no questions.
 *
 * A SECOND curated study, NCT04986579 — "Scalp Cooling in MBC" — is RECRUITING
 * at Brigham and Women's / Dana-Farber (Boston) with a real contact and shorter,
 * clean criteria (simple age, an exception-clause migraine exclusion, an
 * appendix-referenced grading). It demonstrates that curated content is not a
 * one-off hardcode.
 */
export const DEMO_NCT_ID = "NCT02896335" as const;

/**
 * All studies that ship with a cached record and curated EN/ES content. Five
 * real, recruiting Massachusetts studies for the demo. Each has a curated,
 * human-reviewable plain-language study summary (see curated.ts STUDY_SUMMARIES)
 * so the "About this study" section is understandable without a live LLM.
 */
export const CURATED_DEMO_NCT_IDS = [
  "NCT02896335", // Palbociclib + Pembrolizumab in CNS metastases (MGH)
  "NCT04986579", // Scalp Cooling in MBC (BWH / Dana-Farber)
  "NCT05349227", // Comprehensive Outcomes for After Cancer Health (Dana-Farber)
  "NCT06052488", // Strength After Breast Cancer (MGH IHP)
  "NCT02012699", // Integrated Cancer Repository (iCaRe2) (Holyoke)
  "NCT07728695", // Cannabinoid product for gynecologic pain (fully curated criteria)
] as const;
