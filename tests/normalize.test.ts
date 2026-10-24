import { describe, it, expect } from "vitest";
import { normalizeStudy } from "../src/pipeline/normalize.js";
import type { RawStudy } from "../src/pipeline/raw.js";

const NOW = new Date("2026-10-24T00:00:00Z");

function baseRaw(): RawStudy {
  return {
    protocolSection: {
      identificationModule: { nctId: "NCT12345678", briefTitle: "Test Study" },
      statusModule: {
        overallStatus: "RECRUITING",
        lastUpdatePostDateStruct: { date: "2026-10-01", type: "ACTUAL" },
      },
      descriptionModule: { briefSummary: "A summary." },
      eligibilityModule: { eligibilityCriteria: "Inclusion Criteria:\n\n* Age > 18 years." },
      contactsLocationsModule: {
        centralContacts: [{ name: "Dr Real", role: "CONTACT", phone: "555-1212", email: "r@x.org" }],
        locations: [
          { facility: "MGH", city: "Boston", state: "Massachusetts", status: "RECRUITING", contacts: [] },
        ],
      },
    },
  };
}

describe("normalizeStudy — missing-data handling (never invent)", () => {
  it("maps a complete record faithfully", () => {
    const t = normalizeStudy(baseRaw(), { source: "live", fetchedAt: NOW.toISOString(), now: NOW });
    expect(t.nctId).toBe("NCT12345678");
    expect(t.title).toBe("Test Study");
    expect(t.recruitmentStatus).toBe("RECRUITING");
    expect(t.lastRegistryUpdate).toBe("2026-10-01");
    expect(t.contacts).toHaveLength(1);
    expect(t.contacts[0]!.name).toBe("Dr Real");
    expect(t.locations[0]!.state).toBe("Massachusetts");
  });

  it("represents absent fields as explicit null / empty, never guesses", () => {
    const raw: RawStudy = { protocolSection: { identificationModule: { nctId: "NCT00000001" } } };
    const t = normalizeStudy(raw, { source: "live", fetchedAt: NOW.toISOString(), now: NOW });
    expect(t.description).toBeNull();
    expect(t.recruitmentStatus).toBeNull();
    expect(t.lastRegistryUpdate).toBeNull();
    expect(t.contacts).toEqual([]);
    expect(t.locations).toEqual([]);
    expect(t.title).toBe("(untitled study)");
  });

  it("throws on an unusable record with no NCT id (does not fabricate one)", () => {
    expect(() =>
      normalizeStudy({ protocolSection: {} }, { source: "live", fetchedAt: NOW.toISOString(), now: NOW }),
    ).toThrow();
  });

  it("drops contacts without a real name (no placeholder contacts)", () => {
    const raw = baseRaw();
    raw.protocolSection!.contactsLocationsModule!.centralContacts = [
      { role: "CONTACT" },
      { name: "  ", phone: "x" },
      { name: "Real Person" },
    ];
    const t = normalizeStudy(raw, { source: "live", fetchedAt: NOW.toISOString(), now: NOW });
    expect(t.contacts).toHaveLength(1);
    expect(t.contacts[0]!.name).toBe("Real Person");
  });
});

describe("normalizeStudy — freshness / staleness", () => {
  it("flags a listing older than the threshold as stale", () => {
    const raw = baseRaw();
    raw.protocolSection!.statusModule!.lastUpdatePostDateStruct = { date: "2024-01-01" };
    const t = normalizeStudy(raw, {
      source: "live",
      fetchedAt: NOW.toISOString(),
      now: NOW,
      staleThresholdDays: 120,
    });
    expect(t.dataSource.stale).toBe(true);
  });

  it("does not flag a recently-updated listing as stale", () => {
    const t = normalizeStudy(baseRaw(), {
      source: "live",
      fetchedAt: NOW.toISOString(),
      now: NOW,
      staleThresholdDays: 120,
    });
    expect(t.dataSource.stale).toBe(false);
  });

  it("records live vs cache provenance", () => {
    const live = normalizeStudy(baseRaw(), { source: "live", fetchedAt: NOW.toISOString(), now: NOW });
    const cache = normalizeStudy(baseRaw(), { source: "cache", fetchedAt: NOW.toISOString(), now: NOW });
    expect(live.dataSource.kind).toBe("live");
    expect(cache.dataSource.kind).toBe("cache");
  });
});

describe("normalizeStudy — no eligibility verdict anywhere", () => {
  it("the Trial object contains no verdict/score fields", () => {
    const t = normalizeStudy(baseRaw(), { source: "live", fetchedAt: NOW.toISOString(), now: NOW });
    const json = JSON.stringify(t).toLowerCase();
    expect(json).not.toContain("matchscore");
    expect(json).not.toContain("\"eligible\"");
    expect(json).not.toContain("qualifies");
  });
});
