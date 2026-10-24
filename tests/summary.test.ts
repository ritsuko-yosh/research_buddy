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
