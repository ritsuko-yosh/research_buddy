# Visit Ready

**A multilingual clinical trial navigation and preparation tool.**
*Hackachusetts 2026 — Challenge track: Healthcare & Biotech*

**▶ Live demo: https://ritsuko-yosh.github.io/research_buddy/**

Visit Ready helps patients find relevant clinical trials, understand complicated
eligibility requirements in plain language, check language and recruitment
details, and prepare focused questions for the study team — **without ever
predicting eligibility or producing a match score.**

- **Team:** Owen Gachuhi, Ritsuko Yoshida
- **Data source:** ClinicalTrials.gov API v2 (public, no API key)

---

## The problem

Clinical trials can offer patients access to research, but finding and
understanding them is hard. Listings use dense medical terminology, lab
thresholds, and nested inclusion/exclusion logic. Patients with limited English
face added barriers, and after finding a study it is often unclear what to do
next. Visit Ready bridges the gap between **finding** a trial and **knowing what
to do next.**

## The patient journey

1. **Find** — search real studies by condition (focused on Massachusetts), or
   look up a study by its NCT ID.
2. **Understand** — every original registry requirement is preserved verbatim,
   with plain-language explanations in English and Spanish.
3. **Organize** — each requirement is sorted into a conservative four-category
   **Verification Map**:
   - *You can answer* · *Check existing records* · *Ask the study team* ·
     *Cannot assess from public information*
4. **Check accessibility** — explicit language-requirement detection, registry
   freshness/staleness, and real study contacts.
5. **Prepare** — a printable preparation card and a ready-to-copy message the
   patient sends to the study team themselves.

## What Visit Ready deliberately does NOT do

No eligibility verdict · no match score · no diagnosis · no silent omission of
source criteria · no invented contacts, status, or language support · a
translated interface never implies the study serves that language · never
recommends new medical tests · never sends messages automatically · missing
information stays explicitly unknown.

These boundaries are a core product and patient-safety decision. See
[`.kiro/steering/safety.md`](.kiro/steering/safety.md).

---

## Try it

**Online:** open the [live demo](https://ritsuko-yosh.github.io/research_buddy/),
search a condition (e.g. *breast cancer*) or enter an NCT ID
(e.g. `NCT02896335`), open a study, and switch between English and Spanish.

**Locally:**

```sh
cd frontend
npm install
npm run dev        # http://localhost:5173/
```

The app uses live ClinicalTrials.gov data in development and production, and
deterministic fixtures under the test runner.

---

## How it works

Visit Ready is one application with two parts:

- **The web app** (`frontend/`) — Vite + React + TypeScript. The patient-facing
  interface.
- **The data pipeline** (`src/`) — TypeScript modules that fetch studies from
  ClinicalTrials.gov, preserve and classify eligibility criteria, detect language
  requirements, and build the preparation card and coordinator message. The app
  calls this pipeline directly in the browser (the API is CORS-enabled, no key),
  so the whole thing runs as a static site.

```
research_buddy/
├─ frontend/        Patient web app (Vite + React + TypeScript)
├─ src/             Data pipeline: API client, criteria classifier,
│                   language detection, preparation/inquiry builders
│  └─ browser/      Browser-safe entry the app uses to go live
├─ api/             Optional serverless function for AI study summaries
├─ fixtures/        Normalized real-study fixtures for development/tests
├─ scripts/         Fixture builders, cache refresh, live verification
├─ docs/            Setup notes (e.g. optional AI summary)
└─ .kiro/           Specs, steering rules, and automation hooks
```

## Repository layout

| Path | What's inside |
|---|---|
| `frontend/` | The web app. Components, pages, i18n (EN/ES), styles, and tests. See [`frontend/README.md`](frontend/README.md). |
| `src/contract/` | The shared `Trial` / `Criterion` data types. |
| `src/pipeline/` | API client, normalization, the four-category classifier, language detection, and the preparation-card / coordinator-inquiry builders. |
| `src/browser/` | The browser-safe adapter the web app imports to use live data. |
| `src/data/` | Curated plain-language explanations and cached demo records. |
| `fixtures/` | Normalized real studies used in development and tests. |
| `.kiro/` | Requirements, design, and task specs; safety and tech steering rules; and automation hooks. |

## Development

```sh
# Web app (frontend/)
cd frontend
npm install
npm run typecheck
npm test            # Vitest + Testing Library + axe accessibility checks
npm run build       # production build -> frontend/dist/

# Data pipeline (repo root)
npm install
npm run typecheck
npm test            # Vitest: API mapping, classification, safety, property tests
npm run verify-live # exercise the live adapter against the real API (network)
```

## Demo studies

Six real, recruiting studies ship with cached records and curated English/Spanish
plain-language content, including:

- `NCT02896335` — Palbociclib + Pembrolizumab in CNS metastases (MGH, Boston)
- `NCT04986579` — Scalp Cooling in metastatic breast cancer (Boston)
- `NCT07728695` — A cannabinoid product for gynecologic pain (endometriosis,
  adenomyosis, chronic PID)

Any other study a user looks up still works — it shows the preserved registry
text and the Verification Map, without curated plain-language content.

---

## How we used Kiro

Kiro was used throughout development; the artifacts are committed in
[`.kiro/`](.kiro/):

- **Specs** ([`.kiro/specs/`](.kiro/specs/)) — requirements, design, and task
  breakdowns for the data pipeline and the homepage.
- **Steering rules** ([`.kiro/steering/`](.kiro/steering/)) — the non-negotiable
  patient-safety rules, plus tech and design conventions that guided
  implementation and review.
- **Automation hooks** ([`.kiro/hooks/`](.kiro/hooks/)) — run the safety/test
  suites automatically when pipeline or frontend files change, catching
  regressions early.
- **Agent-assisted implementation** — Kiro's agent helped verify the live
  ClinicalTrials.gov v2 field structure, build and test the pipeline (including
  property-based tests), wire the app to live data, and ship the interface.

Documentation written after the corresponding code is labeled as such; specs
that guided development are not represented as written afterward.

## A note on the data and the tool

Study data is retrieved from the public ClinicalTrials.gov API v2. Visit Ready is
a preparation tool, not medical advice, and does not make eligibility decisions.
Automated tests verify application behavior and safety invariants — they are not
clinical validation.

## License

[MIT](LICENSE) © 2026 Owen Gachuhi and Ritsuko Yoshida.
