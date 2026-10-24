import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { TrialService } from "../src/pipeline/service.js";
import { toTrialSummary } from "../src/pipeline/summary.js";
import { DEMO_NCT_ID } from "../src/data/demo.js";
import searchResults from "../fixtures/search-results.json" with { type: "json" };
import sparseTrial from "../fixtures/trial.SPARSE-DEMO.json" with { type: "json" };
import type { SearchResults, Trial } from "../src/contract/types.js";

const CACHE_DIR = join(import.meta.dirname, "..", "src", "data", "cache");
const svc = new TrialService({ cacheDir: CACHE_DIR, now: new Date("2026-10-24") });

describe("toTrialSummary — card projection", () => {
  const trial = svc.getCachedTrial(DEMO_NCT_ID);
  const s = toTrialSummary(trial);

  it("derives card fields from the demo study without inventing data", () => {
    expect(s.nctId).toBe(DEMO_NCT_ID);
    expect(s.recruitmentStatus).toBe("RECRUITING");
    expect(s.hasRecruitingMaSite).toBe(true);
    expect(s.massachusettsSiteCount).toBeGreaterThan(0);
    expect(s.hasContact).toBe(true);
    expect(s.hasCuratedContent).toBe(true);
    expect(s.primaryLocation).toContain("Boston");
  });

  it("carries no eligibility verdict or score", () => {
    expect(JSON.stringify(s).toLowerCase()).not.toContain("matchscore");
    expect(s).not.toHaveProperty("eligible");
  });
});

describe("search-results fixture (Person A list UI)", () => {
  const data = searchResults as unknown as SearchResults;

  it("is on-contract and pins the curated demo study first", () => {
    expect(data.contractVersion).toBe("1.0.0");
    expect(data.results.length).toBeGreaterThan(1);
    expect(data.results[0]!.nctId).toBe(DEMO_NCT_ID);
    expect(data.results[0]!.hasCuratedContent).toBe(true);
  });

  it("includes variety so both badge states can be styled", () => {
    const withMaRecruiting = data.results.filter((r) => r.hasRecruitingMaSite);
    const withoutMaRecruiting = data.results.filter((r) => !r.hasRecruitingMaSite);
    expect(withMaRecruiting.length).toBeGreaterThan(0);
    expect(withoutMaRecruiting.length).toBeGreaterThan(0);
  });
});

describe("sparse fixture (missing-data states)", () => {
  const t = sparseTrial as unknown as Trial;

  it("represents every missing field explicitly, never guessed", () => {
    expect(t.description).toBeNull();
    expect(t.contacts).toEqual([]);
    expect(t.locations).toEqual([]);
    expect(t.dataSource.stale).toBe(true);
    expect(t.languageRequirement.status).toBe("not_stated");
  });

  it("preserves an unsegmentable criterion routed conservatively", () => {
    expect(t.criteria).toHaveLength(1);
    expect(t.criteria[0]!.uncertaintyFlags).toContain("unsegmentable");
    expect(t.criteria[0]!.category).toBe("ask_study_team");
  });
});

describe("second curated study + uncurated safety", () => {
  it("curates NCT04986579 (age -> self_answer, bilingual explanations present)", () => {
    const t = svc.getCachedTrial("NCT04986579");
    const age = t.criteria.find((c) => /18 years old/i.test(c.sourceText))!;
    expect(age.category).toBe("self_answer");
    const curated = t.criteria.filter((c) => c.explanationEn);
    expect(curated.length).toBeGreaterThanOrEqual(4);
    expect(curated.some((c) => c.explanationEs !== null)).toBe(true);
  });

  it("an uncurated study still renders safely: source text + category, null explanations", () => {
    // Simulate an uncurated study via normalize+enrich (no CURATED entry).
    const raw = {
      protocolSection: {
        identificationModule: { nctId: "NCT11112222", briefTitle: "Uncurated Study" },
        statusModule: { overallStatus: "RECRUITING", lastUpdatePostDateStruct: { date: "2026-10-01" } },
        eligibilityModule: {
          eligibilityCriteria: "Inclusion Criteria:\n\n* Age > 18 years.\n* Prior chemotherapy within 2 weeks.",
        },
        contactsLocationsModule: { centralContacts: [], locations: [] },
      },
    };
    const trial = enrichUncurated(raw);
    for (const c of trial.criteria) {
      expect(c.sourceText.length).toBeGreaterThan(0);
      expect(["self_answer", "check_records", "ask_study_team", "cannot_assess"]).toContain(c.category);
      // No curated content -> explanations are explicitly null, not fabricated.
      expect(c.explanationEn).toBeNull();
      expect(c.explanationEs).toBeNull();
      expect(c.translationReviewed).toBe(false);
    }
  });
});

// Helper that mirrors the service's normalize+enrich for an arbitrary record.
import { normalizeStudy as _normalize } from "../src/pipeline/normalize.js";
import { enrichTrial as _enrich } from "../src/pipeline/enrich.js";
import type { RawStudy } from "../src/pipeline/raw.js";
function enrichUncurated(raw: RawStudy): Trial {
  return _enrich(_normalize(raw, { source: "live", fetchedAt: new Date().toISOString(), now: new Date("2026-10-24") }));
}
