# Visit Ready — Web App

The patient-facing web app for Visit Ready. It helps patients find a
Massachusetts clinical trial, understand what the registry asks in plain
language, sort requirements by what they can do next, and prepare a message for
the study team.

Visit Ready does not decide whether anyone qualifies. Every screen says so.

For the project overview, see the [root README](../README.md).

## Requirements

- Node.js ≥ 20 and npm.

## Install and run

From the `frontend/` directory:

```sh
npm install
npm run dev        # http://localhost:5173/
```

The app uses live ClinicalTrials.gov data in development and production, and
deterministic fixtures under the test runner.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts the Vite dev server with hot reload. |
| `npm run typecheck` | Runs TypeScript without emitting files. |
| `npm run build` | Typechecks, then builds the production bundle into `dist/`. |
| `npm test` | Runs the Vitest suite (component, journey, and automated accessibility scans). |

## Features

- Condition search (English/Spanish labels) and NCT ID lookup with validation.
- Loading, empty, error, and retry states.
- Study detail: recruitment status, last registry update, data-source and
  freshness indicators, Massachusetts sites, and a language-requirement notice.
- **Verification Map** — four groups (*You can answer*, *Check existing records*,
  *Ask the study team*, *Cannot assess*). Original registry wording is always
  shown; long groups expand on demand.
- Plain-language study summary with the full registry description preserved in a
  dropdown; AI-generated summaries are labeled as unreviewed.
- English/Spanish switching. Missing Spanish explanations show the English source
  and a translation-status label.
- Coordinator message from a fixed template — copy-only, never sent
  automatically.
- Printable preparation card with session-only checkboxes and the study contact
  exactly as listed (or "Contact not listed").
- Keyboard support, skip link, managed focus, and automated axe accessibility
  checks.

## How data flows

The UI depends only on a small `TrialDataSource` seam (`src/data/adapter.ts`).
In development and production that seam is backed by the project's browser-safe
pipeline, which calls the ClinicalTrials.gov API directly and runs the response
through the shared criteria classifier and language detection. Under tests it is
backed by deterministic fixtures. Components never touch raw registry JSON.

## Key files

| File | Purpose |
|---|---|
| `src/App.tsx` | App shell, navigation, and the search → study → prepare flow. |
| `src/data/adapter.ts` | The single data seam the UI calls (live in prod, fixtures in tests). |
| `src/components/` | Study detail, Verification Map, preparation card, search, notices. |
| `src/i18n/strings.ts` | All interface text in English and Spanish, type-checked for parity. |
| `src/lib/verificationMap.ts` | Groups criteria by the category assigned upstream (never classifies them here). |

## Safety principles the UI enforces

- No eligibility verdicts, scores, or pre-screening language (a test checks this).
- Original registry wording stays visible for every criterion.
- Machine-drafted or unreviewed translations are labeled.
- Missing information is shown as missing, not filled in.
- Nothing is sent automatically — the coordinator message is copied by the
  patient.

## Spanish text

Spanish interface and curated text was drafted for this prototype and is labeled
as unreviewed where it has not been checked by a qualified Spanish reviewer.
