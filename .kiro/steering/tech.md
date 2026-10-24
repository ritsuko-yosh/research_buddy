---
inclusion: always
---

# Visit Ready — Tech & Conventions

- **Stack:** TypeScript (ESM, Node ≥20). Tests with Vitest + fast-check.
- **Shared contract:** `src/contract/types.ts` is the single source of truth for
  the `Trial`/`Criterion` shapes exchanged between the data pipeline (Person B)
  and the frontend (Person A). Person B owns the finalized schema; avoid breaking
  changes without coordinating. Bump `CONTRACT_VERSION` on breaking changes.
- **Data source:** ClinicalTrials.gov API v2
  (`https://clinicaltrials.gov/api/v2/studies[/{nctId}]`), no API key. Study data
  lives under `protocolSection.*` modules (`identificationModule`,
  `statusModule`, `descriptionModule`, `eligibilityModule`,
  `contactsLocationsModule`).
- **Demo study:** `NCT02896335` (recruiting at MGH Boston). Raw record cached at
  `src/data/cache/NCT02896335.raw.json`; envelope + fixture rebuilt via
  `npm run refresh-cache` / `scripts/build-fixture.ts`.
- **Fixtures for Person A:** `fixtures/trial.NCT02896335.json` (detail),
  `fixtures/preparation-card.NCT02896335.json`, the coordinator inquiry text
  files, `fixtures/search-results.json` (+ `.empty.json`) for the list UI, and
  `fixtures/trial.SPARSE-DEMO.json` for missing-data states. Card-level shape is
  `TrialSummary`/`SearchResults` in the contract; derive via `toTrialSummary`.
- **Commands:** `npm test` (vitest run), `npm run typecheck`, `npm run build`,
  `npm run refresh-cache`.
- **Division of work:** Person B owns data/API/safety/tests. Do not build or
  overwrite Person A's frontend files. Coordinate changes to the shared contract
  and `.kiro` specs.
