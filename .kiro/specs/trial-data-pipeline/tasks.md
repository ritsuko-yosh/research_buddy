# Tasks — Visit Ready Trial Data Pipeline (Person B)

## P0 — Foundation
- [x] 1. Inspect repo, confirm stack (TypeScript/Node), set up tooling
  - package.json, tsconfig, vitest config, deps (vitest, fast-check, tsx)
  - _Req: all_
- [x] 2. Define shared `Trial`/`Criterion` contract (`src/contract/types.ts`)
  - _Req: 2, 3, 4, 5, 6, 7_
- [x] 3. Retrieve + cache one real MA recruiting study (NCT02896335)
  - _Req: 1_
- [x] 4. Normalize raw v2 record with safe missing-field handling
  - _Req: 1, 6_
- [x] 5. Segment + preserve eligibility criteria with source traceability
  - _Req: 2_
- [x] 6. Implement conservative four-category classifier
  - _Req: 3_
- [x] 7. Generate shared fixture for Person A (`fixtures/`)
  - _Req: 2, 3_
- [x] 8. Core safety tests (source, classification, missing data, fidelity)
  - _Req: 8_

## P1 — Discovery & language accessibility
- [x] 9. Condition-based search + Massachusetts location filtering
  - _Req: 1_
- [x] 10. Optional NCT id lookup with validation
  - _Req: 1_
- [x] 11. Registry status, locations, contacts, freshness/staleness
  - _Req: 6_
- [x] 12. Explicit language-requirement detection
  - _Req: 4_
- [x] 13. Prepared EN/ES explanations with review labels
  - _Req: 5_
- [x] 14. Preparation card + coordinator inquiry (EN/ES)
  - _Req: 7_

## P2 — Reliability & demo polish
- [x] 15. Live→cache fallback in `TrialService`
  - _Req: 1_
- [x] 16. Property-based + edge-case tests
  - _Req: 8_
- [x] 17. Cache-refresh script
  - _Req: 1_
- [ ] 18. Expand to 2–3 curated studies if time permits
  - _Req: 1, 5_ (optional)
- [ ] 19. Final frontend integration + demo rehearsal with Person A
  - _Req: all_ (joint)
