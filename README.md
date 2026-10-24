# Visit Ready

**A multilingual clinical trial navigation and preparation tool.**
*Hackachusetts 2026 — Challenge track: **Healthcare & Biotech***

Visit Ready helps patients find relevant clinical trials, understand complicated
eligibility requirements, check language and recruitment details, and prepare
focused questions for the study team — **without ever predicting eligibility or
producing a match score.**

- **Team:** Owen Gachuhi, Ritsuko Yoshida
- **Repository:** https://github.com/ritsuko-yosh/research_buddy
- **Data source:** ClinicalTrials.gov API v2 (public, no API key)

---

## The problem

Finding and understanding clinical trials is hard. Listings use dense medical
language, lab thresholds, and nested inclusion/exclusion logic. Patients with
limited English face added barriers, and after finding a study it is often
unclear what to do next — which questions they can answer themselves, which to
check in their records, and which need the research team. Visit Ready bridges the
gap between **finding** a trial and **knowing what to do next**.

## What Visit Ready does

1. **Find** — search real studies by condition (focused on Massachusetts), or
   look up a study by its NCT ID.
2. **Understand** — show every original registry criterion verbatim, with
   source-linked plain-language explanations (English and prepared Spanish).
3. **Organize** — group each requirement in a conservative four-category
   **Verification Map**:
   - **You can answer** (`self_answer`)
   - **Check existing records** (`check_records`)
   - **Ask the study team** (`ask_study_team`)
   - **Cannot assess from public information** (`cannot_assess`)
4. **Check accessibility** — detect explicit language requirements, show registry
   freshness/staleness, and surface real study contacts.
5. **Prepare** — generate a printable preparation card and a ready-to-copy
   coordinator message the patient sends themselves.

## What Visit Ready deliberately does NOT do

No eligibility verdict · no match score · no diagnosis · no silent omission of
source criteria · no invented contacts/status/language support · a translated
interface never implies the study serves that language · never recommends
getting new medical tests · never sends messages automatically · missing
information stays explicitly unknown. These boundaries are a core product and
patient-safety decision — see [`.kiro/steering/safety.md`](.kiro/steering/safety.md).

---

## Architecture

A single application with two cooperating parts in one repository:

```
research_buddy/
├─ src/              Data pipeline (TypeScript/Node, ESM)
│  ├─ contract/      Shared Trial/Criterion contract (CONTRACT_VERSION 1.0.0)
│  ├─ pipeline/      API client, normalize, Verification Map classifier,
│  │                 language detection, enrichment, prep-card/inquiry builders
│  ├─ browser/       Browser-safe (fs-free) live data source + mapping the
│  │                 frontend consumes to go live
│  └─ data/          Curated EN/ES explanations + cached demo records
├─ frontend/         Patient web app (Vite + React + TypeScript)
│  └─ src/data/adapter.ts   The single data seam (live in prod, fixtures in tests)
├─ fixtures/         Normalized real-study fixtures for development
├─ .kiro/            Specs, steering rules, and a safety-test hook (see below)
└─ scripts/          Fixture builders, cache refresh, live verification
```

**Live data path (browser).** ClinicalTrials.gov API v2 is CORS-enabled and
needs no key, so the frontend calls it directly in the browser. The response is
run through the same pure pipeline the backend uses (`normalizeStudy`,
`enrichTrial`, criterion classification, language detection) via the fs-free
module in `src/browser/`, then mapped to the UI's view model. If a live lookup
fails for a bundled demo study, it falls back to a cached record and labels the
data origin as cached. The Node-only cache path (`src/pipeline/service.ts`,
which reads disk) is never imported by the browser build.

---

## Getting started

Requires **Node ≥ 20**.

### 1. Data pipeline (root package)

```bash
npm install
npm run typecheck     # tsc, no errors
npm test              # Vitest — backend unit, integration, and property tests
npm run build         # emit JS to dist/
npm run verify-live   # exercise the live adapter against the real API (network)
npm run refresh-cache # re-fetch demo studies and rebuild fixtures (network)
```

### 2. Frontend (patient web app)

```bash
cd frontend
npm install
npm run dev           # http://localhost:5173/  (live ClinicalTrials.gov data)
npm run typecheck
npm test              # Vitest + Testing Library + axe accessibility checks
npm run build         # production build -> frontend/dist/
npm run preview       # serve the production build locally
```

In development and production the app uses **live** registry data. Under the
test runner it defaults to deterministic fixtures (and any caller can inject a
data source into `<App dataSource={…} />`), so the suite runs offline.

---

## Testing

| Suite | What it covers |
|---|---|
| Backend (root) | API field mapping, normalization, conservative classification, source fidelity, missing-data handling, language detection, live↔cache fallback, the browser live adapter + contract mapping, and property-based invariants. |
| Frontend (`frontend/`) | The full patient journey (search → study → preparation), English/Spanish, honest translation labels, preservation of every registry criterion, and automated accessibility (axe) checks in both languages. |

> Automated tests are engineering checks of application behavior and safety
> invariants. They are **not** clinical validation of the explanations or
> classifications.

## Demo studies

Two real, recruiting Massachusetts studies ship with cached records and curated
English/Spanish explanations:

- **`NCT02896335`** — *Palbociclib and Pembrolizumab In CNS Metastases* —
  recruiting at MGH Boston, real contact, criteria exercising all four
  Verification Map categories (including complex conditional CNS-lesion
  exclusions with exceptions for previously-treated lesions).
- **`NCT04986579`** — *Scalp Cooling in MBC* — recruiting at Brigham & Women's /
  Dana-Farber (Boston), shorter clean criteria, and a genuinely stale registry
  listing that exercises the staleness warning.

---

## How we used Kiro

Kiro was used throughout development, and the artifacts are committed in
[`.kiro/`](.kiro/):

- **Specs** — [`/.kiro/specs/trial-data-pipeline/`](.kiro/specs/trial-data-pipeline)
  holds the requirements, design, and task breakdown that guided the data
  pipeline.
- **Steering rules** — [`/.kiro/steering/safety.md`](.kiro/steering/safety.md)
  encodes the non-negotiable patient-safety rules (no eligibility verdicts, no
  silent omission of criteria, honest translation labels, etc.) and
  [`/.kiro/steering/tech.md`](.kiro/steering/tech.md) records stack and contract
  conventions. These steered implementation and review decisions.
- **Agent hook** —
  [`/.kiro/hooks/safety-tests-on-save.json`](.kiro/hooks/safety-tests-on-save.json)
  runs the safety test suite automatically when pipeline/contract/data files are
  saved, catching classification or safety regressions early.
- **Agent-assisted implementation** — Kiro's agent helped verify the live
  ClinicalTrials.gov v2 field structure, build and test the pipeline (including
  property-based tests), reconcile the frontend/backend contract, and wire the
  frontend to the live data source.

Any documentation written after the corresponding code is labeled as
retrospective within the relevant file; specs that guided development are not
represented as having been written afterward.

## License / data

Study data is retrieved from the public ClinicalTrials.gov API v2. Visit Ready
is a preparation tool, not medical advice, and does not make eligibility
decisions.
