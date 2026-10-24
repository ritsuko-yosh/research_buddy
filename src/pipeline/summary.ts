/**
 * Project a full normalized `Trial` down to a card-level `TrialSummary` for the
 * search-results list. Additive helper — derives only, never fabricates.
 */

import type { Trial, TrialSummary } from "../contract/types.js";
import { CURATED } from "../data/curated.js";

export function toTrialSummary(trial: Trial): TrialSummary {
  const maSites = trial.locations.filter((l) => l.state === "Massachusetts");
  const hasRecruitingMaSite = maSites.some((l) => l.status === "RECRUITING");

  // Prefer a recruiting site for the card line; fall back to the first site.
  const preferred =
    trial.locations.find((l) => l.status === "RECRUITING") ?? trial.locations[0];
  const primaryLocation = preferred
    ? [preferred.city, preferred.state].filter(Boolean).join(", ") || null
    : null;

  return {
    nctId: trial.nctId,
    title: trial.title,
    recruitmentStatus: trial.recruitmentStatus,
    primaryLocation,
    massachusettsSiteCount: maSites.length,
    hasRecruitingMaSite,
    hasContact: trial.contacts.length > 0,
    lastRegistryUpdate: trial.lastRegistryUpdate,
    stale: trial.dataSource.stale,
    languageRequirement: trial.languageRequirement.status,
    hasCuratedContent: (CURATED[trial.nctId] ?? []).length > 0,
    sourceUrl: trial.sourceUrl,
  };
}
