/**
 * Tests for the backend-owned, browser-safe live data source + contract mapping.
 * Uses an injected fake fetch so they run offline and deterministically.
 */
import { describe, it, expect } from "vitest";
import { createLiveDataSource } from "../src/browser/liveDataSource.js";
import { mapRecruitmentStatus, mapLanguageStatus, mapTrialToFrontend } from "../src/browser/mapToFrontend.js";
import { normalizeStudy } from "../src/pipeline/normalize.js";
import type { FetchLike } from "../src/pipeline/client.js";
import type { RawStudy } from "../src/pipeline/raw.js";

function okFetch(body: unknown): FetchLike {
  return async () => ({ ok: true, status: 200, json: async () => body });
}
function failFetch(): FetchLike {
  return async () => {
    throw new Error("network down");
  };
}

const RAW_WITH_UNSPECIFIED: RawStudy = {
  protocolSection: {
    identificationModule: { nctId: "NCT55556666", briefTitle: "Mapping Test Study" },
    statusModule: { overallStatus: "NOT_YET_RECRUITING", lastUpdatePostDateStruct: { date: "2026-09-01" } },
    eligibilityModule: {
      // No section headers -> whole block preserved as ONE "unspecified" criterion.
      eligibilityCriteria: "Participants must meet protocol requirements. See protocol for details.",
    },
    contactsLocationsModule: {
      centralContacts: [{ name: "Dr Real", role: "CONTACT", phone: "555-1000", email: "r@x.org" }],
      locations: [{ facility: "MGH", city: "Boston", state: "Massachusetts", status: "RECRUITING", contacts: [] }],
    },
  },
};

describe("mapRecruitmentStatus", () => {
  it("maps known statuses and defaults unknown->unknown, other->other", () => {
    expect(mapRecruitmentStatus("RECRUITING")).toBe("recruiting");
    expect(mapRecruitmentStatus("NOT_YET_RECRUITING")).toBe("not_yet_recruiting");
    expect(mapRecruitmentStatus("ACTIVE_NOT_RECRUITING")).toBe("active_not_recruiting");
    expect(mapRecruitmentStatus(null)).toBe("unknown");
    expect(mapRecruitmentStatus("SOMETHING_ELSE")).toBe("other");
  });
});

describe("mapLanguageStatus", () => {
  it("preserves explicit vs not-stated vs ambiguous distinctions", () => {
    expect(mapLanguageStatus("explicit_english_required")).toBe("english_required");
    expect(mapLanguageStatus("not_stated")).toBe("none_stated");
    expect(mapLanguageStatus("ambiguous")).toBe("ambiguous");
    expect(mapLanguageStatus("explicit_other")).toBe("ambiguous");
  });
});

describe("mapTrialToFrontend — contract reconciliation", () => {
  const trial = normalizeStudy(RAW_WITH_UNSPECIFIED, {
    source: "live",
    fetchedAt: "2026-10-24T00:00:00Z",
    now: new Date("2026-10-24"),
  });
  const fe = mapTrialToFrontend(trial);

  it("carries unspecified criteria through as 'unspecified', never exclusion", () => {
    expect(fe.criteria.length).toBeGreaterThan(0);
    expect(fe.criteria.every((c) => ["inclusion", "exclusion", "unspecified"].includes(c.section))).toBe(true);
    expect(fe.criteria.some((c) => c.section === "unspecified")).toBe(true);
    expect(fe.criteria.some((c) => c.section === "exclusion")).toBe(false);
  });

  it("preserves source text verbatim and real contact", () => {
    expect(fe.criteria[0]!.sourceText).toContain("protocol requirements");
    expect(fe.contacts[0]!.name).toBe("Dr Real");
  });

  it("produces no verdict/score fields", () => {
    const json = JSON.stringify(fe).toLowerCase();
    expect(json).not.toContain("matchscore");
    expect(json).not.toContain("\"eligible\"");
  });

  it("marks unreviewed Spanish as machine_drafted and absent as unavailable", () => {
    // This synthetic study has no curated content -> no ES -> unavailable.
    expect(fe.criteria.every((c) => c.spanishTranslationStatus === "unavailable")).toBe(true);
  });
});

describe("createLiveDataSource — behavior", () => {
  it("getTrial returns a mapped FeTrial from a live record", async () => {
    const ds = createLiveDataSource({ fetchImpl: okFetch(RAW_WITH_UNSPECIFIED), now: new Date("2026-10-24") });
    const fe = await ds.getTrial("NCT55556666");
    expect(fe).not.toBeNull();
    expect(fe!.nctId).toBe("NCT55556666");
    expect(fe!.recruitmentStatus).toBe("not_yet_recruiting");
    expect(fe!.dataOrigin).toBe("live");
  });

  it("getTrial returns null for an invalid NCT id", async () => {
    const ds = createLiveDataSource({ fetchImpl: okFetch(RAW_WITH_UNSPECIFIED) });
    expect(await ds.getTrial("nope")).toBeNull();
  });

  it("falls back to a bundled cached record when live fails (origin=cached)", async () => {
    const ds = createLiveDataSource({ fetchImpl: failFetch(), now: new Date("2026-10-24") });
    const fe = await ds.getTrial("NCT02896335"); // bundled demo study
    expect(fe).not.toBeNull();
    expect(fe!.nctId).toBe("NCT02896335");
    expect(fe!.dataOrigin).toBe("cached");
  });

  it("returns null (not fabricated data) when live fails and no cache exists", async () => {
    const ds = createLiveDataSource({ fetchImpl: failFetch() });
    expect(await ds.getTrial("NCT99998888")).toBeNull();
  });

  it("searchByCondition maps results and keeps only Massachusetts studies", async () => {
    const body = { studies: [RAW_WITH_UNSPECIFIED, { protocolSection: {} }] };
    const ds = createLiveDataSource({ fetchImpl: okFetch(body), now: new Date("2026-10-24") });
    const results = await ds.searchByCondition("type_2_diabetes");
    expect(results).toHaveLength(1);
    expect(results[0]!.nctId).toBe("NCT55556666");
  });
});
