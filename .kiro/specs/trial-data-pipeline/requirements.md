# Requirements — Visit Ready Trial Data Pipeline (Person B)

## Introduction

The data pipeline retrieves real clinical trial information from
ClinicalTrials.gov API v2, normalizes it into a shared `Trial`/`Criterion`
contract, applies a conservative four-category Verification Map, and produces a
preparation card and coordinator inquiry — without ever predicting eligibility.

## Requirements

### Requirement 1 — Real study retrieval with reliable fallback
**User story:** As a patient, I want to look up a real study by NCT id or find
one by condition and location, so that I see accurate registry information.

#### Acceptance criteria
1. WHEN a valid NCT id is provided THEN the system SHALL fetch the live v2 record
   and normalize it.
2. WHEN the live API fails AND a cached record exists THEN the system SHALL fall
   back to cache and mark `dataSource.kind = "cache"` with the original
   `fetchedAt`.
3. WHEN the API fails AND no cache exists THEN the system SHALL surface an
   explicit error (never fabricate data).
4. WHEN searching THEN the system SHALL support condition + Massachusetts
   location + recruitment-status filtering.

### Requirement 2 — Source-faithful criteria preservation
1. The system SHALL preserve every original eligibility requirement verbatim in
   `sourceText` with a traceable `sourceReference`.
2. WHEN safe segmentation is impossible THEN the system SHALL preserve the whole
   block and flag it `unsegmentable`.
3. The system SHALL NEVER omit a source requirement silently.

### Requirement 3 — Conservative Verification Map
1. The system SHALL assign each criterion exactly one of `self_answer`,
   `check_records`, `ask_study_team`, `cannot_assess`.
2. WHEN a criterion contains conditional/exception/cohort/treatment-history
   logic THEN it SHALL be `ask_study_team`.
3. WHEN a criterion is ambiguous or references material absent from the public
   record THEN it SHALL be `cannot_assess`.
4. The system SHALL NEVER assign `self_answer` to lab/treatment/complex criteria.
5. The system SHALL NEVER emit an eligibility verdict or match score.

### Requirement 4 — Language requirement honesty
1. The system SHALL detect only EXPLICIT stated language requirements.
2. WHEN none is stated THEN the system SHALL report `not_stated` (not "supported").
3. The system SHALL NEVER infer interpreter availability or language support.

### Requirement 5 — Plain-language & prepared translations
1. Explanations SHALL be additive and preserve numbers/units/time windows.
2. Spanish explanations SHALL carry `translationReviewed`; unreviewed drafts
   SHALL be labeled and SHALL NOT silently reuse English.

### Requirement 6 — Registry freshness & real contacts
1. The system SHALL extract `lastRegistryUpdate` and compute a configurable
   staleness flag.
2. The system SHALL extract real study/site contacts only; absent → empty.
3. The system SHALL distinguish study-wide from site-level recruitment status.

### Requirement 7 — Preparation card & coordinator inquiry
1. The card SHALL group preserved criteria by category with no score.
2. The inquiry SHALL be a copyable template containing no patient medical data
   and no eligibility assertion.

### Requirement 8 — Safety tests
1. The system SHALL have automated tests for source completeness, conservative
   classification, missing-data handling, language handling, source fidelity,
   contact integrity, API/cache fallback, and property-based invariants.
2. Tests SHALL NOT be described as clinical validation.
