/**
 * Build card-level fixtures for Person A's search-results UI:
 *
 *   fixtures/search-results.json        — real MA studies as TrialSummary cards,
 *                                          demo study (NCT02896335) pinned first.
 *   fixtures/trial.SPARSE-DEMO.json     — an intentionally sparse Trial exercising
 *                                          missing/empty/"not_stated" states.
 *   fixtures/search-results.empty.json  — a zero-result search (empty-state UI).
 *
 * The search fixture is fetched LIVE so the cards reflect real registry data.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

import { CONTRACT_VERSION, type SearchResults, type Trial } from "../src/contract/types.js";
import { searchStudies, lookupStudy } from "../src/pipeline/client.js";
import { normalizeStudy } from "../src/pipeline/normalize.js";
import { enrichTrial } from "../src/pipeline/enrich.js";
import { toTrialSummary } from "../src/pipeline/summary.js";
import { CURATED_DEMO_NCT_IDS } from "../src/data/demo.js";

const root = join(import.meta.dirname, "..");
const fixturesDir = join(root, "fixtures");
mkdirSync(fixturesDir, { recursive: true });

// Deterministic timestamps/clock so committed fixtures are stable in git.
const FIXED_FETCHED_AT = "2026-10-24T00:00:00.000Z";
const FIXED_NOW = new Date(FIXED_FETCHED_AT);

async function main() {
  const condition = "breast cancer";
  const location = "Massachusetts";
  const status = "RECRUITING";

  const rawStudies = await searchStudies({ condition, location, status, pageSize: 12 });

  const trials: Trial[] = [];
  for (const raw of rawStudies) {
    try {
      trials.push(
        enrichTrial(
          normalizeStudy(raw, { source: "live", fetchedAt: FIXED_FETCHED_AT, now: FIXED_NOW }),
        ),
      );
    } catch {
      /* skip unusable records */
    }
  }

  // Ensure BOTH curated studies are present (fetch any missing from the page),
  // pinned first, so the list -> detail demo works for every curated study.
  const byId = new Map(trials.map((t) => [t.nctId, t]));
  for (const id of CURATED_DEMO_NCT_IDS) {
    if (!byId.has(id)) {
      const raw = await lookupStudy(id);
      byId.set(
        id,
        enrichTrial(normalizeStudy(raw, { source: "live", fetchedAt: FIXED_FETCHED_AT, now: FIXED_NOW })),
      );
    }
  }
  const curatedFirst = CURATED_DEMO_NCT_IDS.map((id) => byId.get(id)!).filter(Boolean);
  const rest = [...byId.values()]
    .filter((t) => !CURATED_DEMO_NCT_IDS.includes(t.nctId as (typeof CURATED_DEMO_NCT_IDS)[number]))
    .slice(0, 4);
  const ordered = [...curatedFirst, ...rest];

  const results = ordered.map(toTrialSummary);
  const searchResults: SearchResults = {
    contractVersion: CONTRACT_VERSION,
    query: { condition, location, status },
    fetchedAt: FIXED_FETCHED_AT,
    totalReturned: results.length,
    results,
  };
  writeFileSync(join(fixturesDir, "search-results.json"), JSON.stringify(searchResults, null, 2));

  // Empty-state fixture.
  const empty: SearchResults = {
    contractVersion: CONTRACT_VERSION,
    query: { condition: "a-condition-with-no-matches", location, status },
    fetchedAt: FIXED_FETCHED_AT,
    totalReturned: 0,
    results: [],
  };
  writeFileSync(join(fixturesDir, "search-results.empty.json"), JSON.stringify(empty, null, 2));

  // Intentionally SPARSE trial: no contacts, no MA site, no description,
  // language not stated, one unsegmentable criterion, a stale listing.
  const sparse: Trial = enrichTrial(
    normalizeStudy(
      {
        protocolSection: {
          identificationModule: { nctId: "NCT00000000", briefTitle: "Sparse Demo Study (missing-data showcase)" },
          statusModule: {
            overallStatus: "RECRUITING",
            lastUpdatePostDateStruct: { date: "2023-01-01" }, // old -> stale
          },
          // no descriptionModule (description -> null)
          eligibilityModule: {
            // No headers / bullets -> preserved whole as one unsegmentable block.
            eligibilityCriteria:
              "Participants must meet all protocol-defined requirements. See the full protocol for details.",
          },
          contactsLocationsModule: {
            centralContacts: [], // no contacts
            locations: [], // no locations
          },
        },
      },
      { source: "cache", fetchedAt: FIXED_FETCHED_AT, now: FIXED_NOW, staleThresholdDays: 120 },
    ),
  );
  writeFileSync(join(fixturesDir, "trial.SPARSE-DEMO.json"), JSON.stringify(sparse, null, 2));

  console.log("search-results.json cards:", results.length);
  for (const r of results) {
    console.log(
      `  ${r.nctId} | MA-rec:${r.hasRecruitingMaSite} | contact:${r.hasContact} | curated:${r.hasCuratedContent} | ${r.title.slice(0, 45)}`,
    );
  }
  console.log("sparse trial: contacts", sparse.contacts.length, "| locations", sparse.locations.length, "| stale", sparse.dataSource.stale, "| lang", sparse.languageRequirement.status, "| criteria", sparse.criteria.length, "| flags", sparse.criteria[0]?.uncertaintyFlags, "| category", sparse.criteria[0]?.category);
}

main().catch((err) => {
  console.error("Failed to build search fixtures:", err?.message ?? err);
  process.exit(1);
});
