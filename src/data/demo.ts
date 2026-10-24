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

/** All studies that ship with a cached record and curated EN/ES explanations. */
export const CURATED_DEMO_NCT_IDS = ["NCT02896335", "NCT04986579"] as const;
