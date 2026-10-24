/**
 * Attach curated plain-language explanations to normalized criteria.
 *
 * Explanations are matched by a substring of the ORIGINAL source text, so an
 * explanation is only ever attached to the criterion it genuinely describes.
 * Source text is never modified; explanations are additive (brief §D, §F).
 */

import type { Criterion, Trial } from "../contract/types.js";
import { CURATED, type CuratedExplanation } from "../data/curated.js";

function findExplanation(
  criterion: Criterion,
  entries: CuratedExplanation[],
): CuratedExplanation | null {
  // Normalize whitespace and the registry's escaped ">" so matching is precise
  // and we never attach an explanation to a criterion it does not describe.
  const hay = normalize(criterion.sourceText);
  for (const e of entries) {
    const needle = normalize(e.match);
    if (hay.includes(needle)) return e;
  }
  return null;
}

/** Lower-case, collapse whitespace, and strip the registry's "\>" escaping. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\\>/g, ">")
    .replace(/\\</g, "<")
    .replace(/\s+/g, " ")
    .trim();
}

/** Return a new Trial with curated explanations attached where available. */
export function enrichTrial(trial: Trial): Trial {
  const entries = CURATED[trial.nctId] ?? [];
  if (entries.length === 0) return trial;

  const criteria = trial.criteria.map((c) => {
    const e = findExplanation(c, entries);
    if (!e) return c;
    return {
      ...c,
      explanationEn: e.explanationEn,
      explanationEs: e.explanationEs,
      translationReviewed: e.translationReviewed,
    } satisfies Criterion;
  });

  return { ...trial, criteria };
}
