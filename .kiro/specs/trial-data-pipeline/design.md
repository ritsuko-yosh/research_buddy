# Design — Visit Ready Trial Data Pipeline (Person B)

## Overview
A small, dependency-light TypeScript library that transforms raw
ClinicalTrials.gov v2 records into the shared `Trial` contract and derives a
preparation card / coordinator inquiry. All logic is pure and testable; the only
side effect is HTTP fetch (injectable for tests) and reading the demo cache.

## Architecture

```
ClinicalTrials.gov v2 API ──┐
                            ▼
                      client.ts  (searchStudies / lookupStudy, timeout, errors)
                            │ RawStudy
                            ▼
   cache (src/data/cache) ─► service.ts (live→cache fallback, façade)
                            │ RawStudy + source + fetchedAt
                            ▼
                     normalize.ts ──► criteria.ts (segment + classify)
                            │              └► language.ts (requirement detect)
                            │ Trial
                            ▼
                      enrich.ts (attach curated EN/ES explanations)
                            │ Trial (enriched)
                            ▼
                      prepare.ts (preparation card + coordinator inquiry)
```

## Components & interfaces

- **`contract/types.ts`** — shared `Trial`, `Criterion`, enums,
  `CONTRACT_VERSION`. Single source of truth for Person A.
- **`pipeline/raw.ts`** — structural typing of the v2 record (all optional).
- **`pipeline/client.ts`** — `searchStudies`, `lookupStudy`, `isValidNctId`,
  `ApiError`; injectable `FetchLike`; abort-based timeout.
- **`pipeline/criteria.ts`** — `segmentEligibilityText` (grouped-bullet
  segmentation keeping nested exceptions attached), `detectUncertaintyFlags`,
  `classifyCriterion` (conservative precedence), `buildCriteria`.
- **`pipeline/language.ts`** — `detectLanguageRequirement` (explicit-only).
- **`pipeline/normalize.ts`** — `normalizeStudy` with safe null handling and
  staleness computation.
- **`pipeline/enrich.ts`** — precise substring matching of curated explanations.
- **`pipeline/service.ts`** — `TrialService`: `getTrialByNct`, `getCachedTrial`,
  `searchTrials`; live→cache fallback.
- **`pipeline/prepare.ts`** — `buildPreparationCard`, `buildCoordinatorInquiry`
  (EN/ES).

## Key decisions
- **Grouped segmentation:** top-level bullets start a criterion; indented
  sub-bullets/continuations stay attached so exception clauses are never severed.
- **Conservative precedence:** cannot_assess → ask_study_team → check_records →
  self_answer; unknown defaults to ask_study_team.
- **Standalone age exception:** age-with-a-number is `self_answer` only when it
  has no records/lab context and no non-threshold flags.
- **Injectable fetch** enables offline unit tests; real network covered by the
  live smoke script and the cached demo record.

## Error handling
- Invalid NCT id → `ApiError` before any network call.
- Non-2xx / network error → `ApiError`; service falls back to cache when present.
- Record missing NCT id → `normalizeStudy` throws; `searchTrials` skips it.

## Testing strategy
Vitest unit + integration tests against the real cached demo record, plus
fast-check property tests for segmentation integrity, conservative
classification, unique ids, and no-fabrication invariants. These are engineering
checks, NOT clinical validation.
