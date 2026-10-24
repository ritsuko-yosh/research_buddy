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

## How We Used Kiro to Build Visit Ready

We developed Visit Ready using **Kiro IDE and Kiro Web**, with a shared GitHub repository connecting our work.

**Kiro IDE and Kiro Web**

Ritsuko used Kiro IDE for local frontend development, interface design, integration, and testing. Working directly with the application made it possible to preview changes, refine the patient journey, identify visual and functional issues, and test the website before merging changes.

Owen used Kiro Web to support development of the clinical trial data pipeline, including data retrieval, processing, and the logic behind the Verification Map.

Using both environments allowed us to work on different parts of the application while coordinating through shared data contracts, GitHub branches, and pull requests.

**Spec-Driven Development**

Instead of immediately asking Kiro to generate the entire application, we organized the work around documented requirements, technical designs, and implementation tasks.

Our `.kiro/specs/` directory contains specifications for the clinical trial data pipeline and Open Door homepage. These define the intended functionality, acceptance criteria, architecture, and safety requirements.

For example, we explicitly required the application to preserve original eligibility criteria, avoid predicting patient eligibility, and distinguish missing registry information from confirmed information.

Compared with unrestricted prompt-based development, this approach gave us clearer implementation boundaries and a consistent reference when reviewing changes or integrating separately developed components.

**Steering Documents**

We used three steering documents in `.kiro/steering/` covering patient safety, technical conventions, and design.

The most important was `safety.md`, which established non-negotiable rules: no eligibility verdicts or match scores, no fabricated study information, no unsupported medical simplifications, and no assumption that a translated interface means a study supports that language.

These rules shaped our development decisions. Rather than creating an AI system that tells patients whether they qualify, we developed a four-category Verification Map that helps them understand what they can check and what they need to ask the study team.

**Agent Hooks**

We configured two Kiro `PostFileSave` hooks:

- A frontend hook to run automated tests when frontend source files or styles change.
- A data-pipeline hook to run tests when pipeline, contract, or data files change.

These hooks support a workflow where changes are checked against existing requirements, reducing the risk that interface improvements introduce functional or safety regressions.

**Property-Based Testing**

We used the `fast-check` library alongside Vitest to test important system properties across generated inputs, rather than relying only on a small set of example cases.

For the clinical data pipeline, these properties include preserving eligibility text during segmentation, keeping classifications within the four allowed categories, and handling missing information without inventing data.

For the research-area index, we tested properties such as excluding studies without Massachusetts locations, maintaining consistent topic relationships, and producing equivalent results regardless of input order.

These tests extend our coverage beyond known example studies. They validate engineering behavior, not clinical accuracy.

**Integration and Iteration**

Kiro helped us connect the React and TypeScript frontend with a browser-safe pipeline using the public ClinicalTrials.gov API v2.

We iteratively developed the patient experience, including condition search, study-ID lookup, the Verification Map, English and Spanish interface text, and printable preparation materials.

We used GitHub pull requests and automated tests to integrate these components while preserving the approved design and existing safety rules.

Our main lesson was that effective AI-assisted development requires more than generating code. **We used Kiro to establish requirements, enforce constraints, test assumptions, and iteratively improve the product while keeping patient safety central to our decisions.**

## A note on the data and the tool

Study data is retrieved from the public ClinicalTrials.gov API v2. Visit Ready is
a preparation tool, not medical advice, and does not make eligibility decisions.
Automated tests verify application behavior and safety invariants — they are not
clinical validation.

## License

[MIT](LICENSE) © 2026 Owen Gachuhi and Ritsuko Yoshida.
