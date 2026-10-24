# Visit Ready — Data Pipeline (Person B)

**Visit Ready** is a multilingual clinical trial navigation and preparation tool
(Hackachusetts 2026). It helps patients find relevant studies, understand
complex eligibility requirements, and prepare focused questions for study
coordinators — **without ever predicting eligibility or producing a match score.**

This package is the **data/backend foundation** (Person B). Person A builds the
frontend and imports the shared contract and fixtures from here.

## What this does

1. **Find** — search ClinicalTrials.gov API v2 by condition + Massachusetts
   location, or look up a study by NCT id.
2. **Understand** — preserve original eligibility criteria verbatim with
   source-linked, plain-language explanations (English + prepared Spanish).
3. **Organize** — a conservative four-category **Verification Map**:
   `self_answer` · `check_records` · `ask_study_team` · `cannot_assess`.
4. **Check accessibility** — explicit language-requirement detection and registry
   freshness / staleness.
5. **Prepare** — a preparation card and a ready-to-copy coordinator inquiry.

## Safety boundaries (non-negotiable)

No eligibility verdict · no match score · no silent omission of source criteria ·
no invented contacts/status/language support · translated UI ≠ language support ·
no recommendation to get new tests · missing info stays explicitly unknown.
See [`.kiro/steering/safety.md`](.kiro/steering/safety.md).

## Shared contract (Person A ↔ Person B)

`src/contract/types.ts` is the single source of truth for `Trial` and
`Criterion`. Import it directly. Bump `CONTRACT_VERSION` on breaking changes and
coordinate. A ready fixture is committed so Person A can build immediately:

- `fixtures/trial.NCT02896335.json` — a normalized real study (detail view).
- `fixtures/preparation-card.NCT02896335.json`
- `fixtures/coordinator-inquiry.NCT02896335.{en,es}.txt`
- `fixtures/search-results.json` — real MA studies as `TrialSummary` cards (demo
  study pinned first) for the results-list UI.
- `fixtures/search-results.empty.json` — zero-result empty state.
- `fixtures/trial.SPARSE-DEMO.json` — an intentionally sparse study (no contacts/
  locations, `not_stated` language, `unsegmentable` criterion, stale listing) for
  designing missing-data / empty states.

Rebuild the list/sparse fixtures with `npx tsx scripts/build-search-fixtures.ts`.

## Usage

```ts
import { TrialService, buildPreparationCard, buildCoordinatorInquiry } from "visit-ready";

const svc = new TrialService();

// Live lookup with automatic cache fallback for demo reliability
const { trial, usedCache } = await svc.getTrialByNct("NCT02896335");

// Condition + location search
const results = await svc.searchTrials({
  condition: "breast cancer",
  location: "Massachusetts",
  status: "RECRUITING",
});

// Offline demo path (uses the bundled cached record)
const demo = svc.getCachedTrial("NCT02896335");
const card = buildPreparationCard(demo, "en");
const inquiry = buildCoordinatorInquiry(demo, "es");
```

## Demo studies

Two real, recruiting Massachusetts studies ship with cached records and curated
EN/ES explanations (`CURATED_DEMO_NCT_IDS`):

- **`NCT02896335`** — *Palbociclib and Pembrolizumab In CNS Metastases* —
  **recruiting at MGH Boston**, real contact, criteria exercising all four
  Verification Map categories (including complex conditional CNS-lesion
  exclusions with exceptions for previously-treated lesions).
- **`NCT04986579`** — *Scalp Cooling in MBC* — **recruiting at Brigham &
  Women's / Dana-Farber (Boston)**, real contact, shorter clean criteria, and a
  genuinely **stale** registry listing — useful for demonstrating the staleness
  warning. Proves curated content is not a one-off hardcode.

## Commands

```bash
npm install
npm test            # vitest (49 tests)
npm run typecheck
npm run build
npm run refresh-cache   # re-fetch the demo study and rebuild fixtures
```

## Data source

ClinicalTrials.gov API v2 (`https://clinicaltrials.gov/api/v2/studies`), no API
key. Field mapping verified against live responses.

> Automated tests here are engineering checks of pipeline behavior and safety
> invariants. They are **not** clinical validation.
