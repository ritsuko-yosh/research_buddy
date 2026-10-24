import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { TrialService } from "../src/pipeline/service.js";
import { ApiError, type FetchLike } from "../src/pipeline/client.js";
import { DEMO_NCT_ID } from "../src/data/demo.js";

const CACHE_DIR = join(import.meta.dirname, "..", "src", "data", "cache");

function okFetch(body: unknown): FetchLike {
  return async () => ({ ok: true, status: 200, json: async () => body });
}
function failFetch(): FetchLike {
  return async () => {
    throw new Error("network down");
  };
}

const MINIMAL_RAW = {
  protocolSection: {
    identificationModule: { nctId: "NCT99999999", briefTitle: "Live Study" },
    statusModule: { overallStatus: "RECRUITING", lastUpdatePostDateStruct: { date: "2026-10-01" } },
    eligibilityModule: { eligibilityCriteria: "Inclusion Criteria:\n\n* Age > 18 years." },
    contactsLocationsModule: { centralContacts: [], locations: [] },
  },
};

describe("TrialService.getTrialByNct — live path", () => {
  it("returns a normalized live trial", async () => {
    const svc = new TrialService({ fetchImpl: okFetch(MINIMAL_RAW), now: new Date("2026-10-24") });
    const res = await svc.getTrialByNct("NCT99999999");
    expect(res.usedCache).toBe(false);
    expect(res.trial.nctId).toBe("NCT99999999");
    expect(res.trial.dataSource.kind).toBe("live");
  });

  it("rejects an invalid NCT id", async () => {
    const svc = new TrialService({ fetchImpl: okFetch(MINIMAL_RAW) });
    await expect(svc.getTrialByNct("not-an-id")).rejects.toBeInstanceOf(ApiError);
  });
});

describe("TrialService — cache fallback (demo reliability)", () => {
  it("falls back to the cached demo record when the API fails", async () => {
    const svc = new TrialService({
      fetchImpl: failFetch(),
      cacheDir: CACHE_DIR,
      now: new Date("2026-10-24"),
    });
    const res = await svc.getTrialByNct(DEMO_NCT_ID);
    expect(res.usedCache).toBe(true);
    expect(res.liveError).toBeDefined();
    expect(res.trial.nctId).toBe(DEMO_NCT_ID);
    expect(res.trial.dataSource.kind).toBe("cache");
  });

  it("rethrows when the API fails and no cache exists", async () => {
    const svc = new TrialService({ fetchImpl: failFetch(), cacheDir: CACHE_DIR });
    await expect(svc.getTrialByNct("NCT10000001")).rejects.toThrow();
  });

  it("loads the cached demo trial directly (offline path)", () => {
    const svc = new TrialService({ cacheDir: CACHE_DIR, now: new Date("2026-10-24") });
    const trial = svc.getCachedTrial(DEMO_NCT_ID);
    expect(trial.nctId).toBe(DEMO_NCT_ID);
    expect(trial.criteria.length).toBeGreaterThan(10);
  });
});

describe("TrialService.searchTrials", () => {
  it("normalizes search results and skips unusable records", async () => {
    const body = { studies: [MINIMAL_RAW, { protocolSection: {} }] };
    const svc = new TrialService({ fetchImpl: okFetch(body), now: new Date("2026-10-24") });
    const results = await svc.searchTrials({ condition: "breast cancer", location: "Massachusetts" });
    expect(results).toHaveLength(1);
    expect(results[0]!.nctId).toBe("NCT99999999");
  });
});
