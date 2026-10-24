---
inclusion: always
---

# Visit Ready — Non-Negotiable Safety Rules

These rules apply to ALL code in this repository. They encode product and safety
decisions made during concept evaluation (we deliberately moved from "eligibility
prediction" to "action-oriented trial preparation"). Do not reintroduce
eligibility prediction.

1. **No eligibility verdict or match score.** Never add a field, function, or UI
   element that outputs "eligible", "qualifies", a match percentage, or a
   yes/no eligibility answer. The `Trial`/`Criterion` contract must not be able
   to represent one.
2. **No unsupported simplification.** Never flatten complex/conditional/
   cohort-dependent medical criteria into a simple yes/no question. When in
   doubt, preserve the source text and route to `ask_study_team` or
   `cannot_assess`.
3. **No silent omission of source criteria.** Every original requirement must be
   preserved verbatim in `sourceText` and remain traceable via `sourceReference`.
4. **Never invent data.** Study contacts, recruitment status, locations, and
   language support come ONLY from real source records. Absent data is explicit
   `null` / empty / `"not_stated"` — never guessed.
5. **Translated UI ≠ language support.** A Spanish interface never implies the
   study serves Spanish-speaking participants. Always surface the universal
   language caveat.
6. **No new medical tests.** Never recommend obtaining new tests solely to use
   Visit Ready. `check_records` means "check records you already have".
7. **No automatic sharing of patient medical info.** The coordinator inquiry is a
   template the patient fills and sends themselves; it contains no patient data.
8. **Missing info stays explicitly unknown.** Prefer `null` / `not_stated` over a
   plausible-looking default.
9. **Source text and references stay accessible** in every derived artifact
   (criteria, preparation card, inquiry).
10. **Tests are engineering checks, not clinical validation.** Never describe
    automated tests as validating clinical accuracy.

## Classification precedence (conservative-first)
`cannot_assess` (ambiguous/external-only) → `ask_study_team`
(conditional/exception/cohort/treatment-history) → `check_records`
(lab/measurement data) → `self_answer` (only narrow self-knowable facts:
standalone age, sex, consent). Unknown/complex defaults to `ask_study_team`,
never `self_answer`.

## Translation honesty
Prepared Spanish explanations carry `translationReviewed`. Unreviewed drafts
MUST be labeled. Never let Spanish silently fall back to English as if reviewed.
