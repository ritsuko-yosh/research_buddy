# Tasks: Open Door homepage

Status: spec drafted, awaiting review. No code written yet.

- [x] 0. Spec written (requirements, design, this file).
- [x] 1a. Live API shape checked (see design.md, "Grouping source").
- [ ] 1b. `src/pipeline/topics.ts`: buildTopicIndex, category list, exclusion config. Waiting for Person B.
- [ ] 1c. `scripts/build-topic-index.ts` (paged, validated, atomic write), `build:topics` script, run once and commit the generated file. Waiting for Person B.
- [x] 1d. `deploy.yml`: SKIPPED for this iteration (decision).
- [x] 1e. `isTopicIndex` runtime guard in the frontend.
- [ ] 2. Homepage: doors, explainer, step list, illustration, presets from the index.
- [ ] 3. Topic garden: shapes, details, list view, states, update date.
- [ ] 4. Tokens, fonts, contrast checks.
- [ ] 5. Motion inside reduced-motion query.
- [ ] 6. Restyle downstream screens (styling only).
- [ ] 7. Tests: property tests (7 properties), frontend tests, axe, reduced-motion, hardcoding guard for hex colors.
- [ ] 8. Kiro extras: steering/design.md, hooks/frontend-guard-on-save.json.

Tests affected by removing the hardcoded chips: 22 references to 'Type 2 diabetes' and 'Asthma' in App.test.tsx, search.app.test.tsx, and conditions.ts. These will be updated intentionally and listed in the report.
