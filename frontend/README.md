# Visit Ready: Patient Frontend

The patient-facing web app for Visit Ready. It helps patients find a Massachusetts clinical trial, understand what the registry asks, sort requirements by what they can do next, and prepare a message for the study team.

Visit Ready does not decide whether anyone qualifies. Every screen says so.

## Status

This frontend runs on synthetic sample data. The live ClinicalTrials.gov adapter belongs to the backend and is not connected yet. See "What still uses synthetic data" below.

## Requirements

- Node.js and npm. Tested with Node v24.22.1 and npm 11.19.1.

## Install and run

From the `frontend/` directory:

```sh
npm install
npm run dev
```

The preview opens at **http://localhost:5173/**.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts the Vite dev server with hot reload. |
| `npm run typecheck` | Runs TypeScript without emitting files. |
| `npm run build` | Typechecks, then builds the production bundle into `dist/`. |
| `npm test` | Runs the Vitest suite once (41 tests across 4 files, including automated accessibility scans). |

## Features implemented

- Condition search with English and Spanish labels. Results show Massachusetts sites only.
- NCT ID lookup with format validation, plus unsupported-study messaging.
- Loading, empty, error, and retry states for search.
- Study detail: registry status, last update date, data-source label, Massachusetts sites, and a language requirement notice with four states.
- Verification Map with four groups: You can answer, Check existing records, Ask the study team, and Cannot assess. Original registry wording is always shown, and long groups expand on demand.
- English/Spanish switching. Missing Spanish explanations show an unavailable state with the English source. Translation status is labeled.
- Coordinator message from a fixed template. It is copy-only and never sent automatically.
- Printable preparation card with session-only checkboxes and the study contact as listed, or "Contact not listed".
- Keyboard support, skip link, focus moves to each new step, and automated axe accessibility checks.

## What still uses synthetic data

- Every study in `src/data/fixtures/sampleTrials.ts`. Its NCT IDs (`NCT9000000x`) do not correspond to real registry entries, and the plain-language text is illustrative.
- The response delay in `src/data/adapter.ts`, which simulates network latency.
- The condition list in `src/data/conditions.ts` is a frontend draft until it matches the backend search mapping.

## Key files

| File | Purpose |
|---|---|
| `src/types/trial.ts` | Shared `Trial`, `Criterion`, and `TrialDataSource` contract. Marked as a draft until Person B confirms it. |
| `src/data/adapter.ts` | The only data seam. `dataSource` is what the UI calls. Replace it with the live implementation. |
| `src/data/fixtures/sampleTrials.ts` | Synthetic data used until the live adapter exists. |
| `src/lib/inquiry.ts` | Deterministic coordinator message and the language-question rule. |
| `src/lib/verificationMap.ts` | Groups criteria by the category the backend assigns. It does not classify criteria itself. |
| `src/i18n/strings.ts` | All interface text in English and Spanish. The Spanish object is type-checked against the English one. |

## Data structures

`Trial` (summary: `TrialSummary`) and `Criterion` are defined in `src/types/trial.ts`. In short:

- `Trial`: `nctId`, `title`, `description` (en/es), `recruitmentStatus`, `locations`, `registryUpdateDate`, `dataRetrievedAt`, `contacts`, `languageRequirement` (status and source text), `sourceUrl`, `criteria`, `dataOrigin` (`live`, `cached`, or `sample`).
- `Criterion`: `id`, `section` (inclusion or exclusion), `sourceText` (exact registry wording), `sourceRef`, `category` (one of four verification categories), `plainExplanation` (en/es), `spanishTranslationStatus`, `uncertaintyNotes`.

## What the backend needs to provide

1. A live `TrialDataSource` implementation matching `searchByCondition` and `getTrial` in `src/data/adapter.ts`.
2. Criteria split into individual items, each with exact source text and a verification category.
3. Plain-language English and Spanish explanations, with an accurate translation status. Use `clinically_reviewed` only after qualified clinical review has happened.
4. Language requirement detection with one of four statuses: `english_required`, `none_stated`, `ambiguous`, or `not_listed`.
5. Study contacts exactly as listed, or an empty list. Never invented.
6. State names written in full (for example, "Massachusetts") so location filtering works.
7. Registry update date, retrieval timestamp, and data origin.
8. Agreement on the `types/trial.ts` contract before integration. Changes go through both teammates.

## Safety principles the UI enforces

- No eligibility verdicts, scores, or pre-screening language. A test checks this.
- Original registry wording stays visible for every criterion.
- Machine-drafted or unreviewed translations are labeled.
- Missing information is shown as missing, not filled in.
- Nothing is sent automatically. The coordinator message is copied by the patient.

## Spanish text

Spanish interface text was drafted for this prototype. It has not been reviewed by a qualified Spanish-speaking reviewer.
