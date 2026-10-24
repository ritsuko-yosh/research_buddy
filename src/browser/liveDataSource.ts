/**
 * Browser-safe live ClinicalTrials.gov data source for the web app.
 *
 * Implements the frontend's `FeTrialDataSource` interface using ONLY fs-free
 * pipeline modules + the browser's global `fetch`. ClinicalTrials.gov API v2 is
 * CORS-enabled and needs no key, so this runs directly in the browser (and in
 * Node). It never reads from disk.
 *
 * Reliability (brief §5, §15): if the live API fails for a lookup, it falls
 * back to a BUNDLED cached record (imported as JSON, not read via fs) when one
 * exists for that study, and marks the origin as "cached".
 *
 * The web app wires this in via frontend/src/data/adapter.ts:
 *     import { createLiveDataSource } from 'visit-ready/browser';
 *     export const dataSource = createLiveDataSource();
 */

import { lookupStudy, searchStudies, isValidNctId } from "../pipeline/client.js";
import { normalizeStudy } from "../pipeline/normalize.js";
import { enrichTrial } from "../pipeline/enrich.js";
import type { ClientOptions } from "../pipeline/client.js";
import type { RawStudy } from "../pipeline/raw.js";
import type { FeTrial, FeTrialDataSource, FeTrialSummary } from "./frontendContract.js";
import { mapTrialToFrontend, mapRecruitmentStatus } from "./mapToFrontend.js";

// Bundled cached records for demo reliability. Imported as JSON modules so this
// stays browser-safe (no fs). Add more entries as curated studies grow.
import demoCache1 from "../data/cache/NCT02896335.raw.json" with { type: "json" };
import demoCache2 from "../data/cache/NCT04986579.raw.json" with { type: "json" };

const BUNDLED_CACHE: Record<string, RawStudy> = {
  NCT02896335: demoCache1 as RawStudy,
  NCT04986579: demoCache2 as RawStudy,
};

/**
 * Map the frontend's condition ids to ClinicalTrials.gov condition query terms.
 * Keep ids aligned with the web app's condition list.
 */
const CONDITION_TERMS: Record<string, string> = {
  type_2_diabetes: "type 2 diabetes",
  asthma: "asthma",
  // Curated demo conditions (present in bundled cache) also searchable:
  breast_cancer: "breast cancer",
};

export interface LiveDataSourceOptions extends ClientOptions {
  /** Location filter for condition search. Defaults to Massachusetts. */
  location?: string;
  /** Page size for condition search. */
  pageSize?: number;
  /** Staleness threshold (days) passed through to normalization. */
  staleThresholdDays?: number;
  /** Reference clock (tests). */
  now?: Date;
}

function toSummary(fe: FeTrial): FeTrialSummary {
  return {
    nctId: fe.nctId,
    title: fe.title,
    recruitmentStatus: fe.recruitmentStatus,
    locations: fe.locations,
    registryUpdateDate: fe.registryUpdateDate,
  };
}

export function createLiveDataSource(opts: LiveDataSourceOptions = {}): FeTrialDataSource {
  const location = opts.location ?? "Massachusetts";

  const normalizeOpts = (source: "live" | "cache", fetchedAt: string) => ({
    source,
    fetchedAt,
    staleThresholdDays: opts.staleThresholdDays,
    now: opts.now,
  });

  return {
    async searchByCondition(conditionId: string): Promise<FeTrialSummary[]> {
      const condition = CONDITION_TERMS[conditionId] ?? conditionId.replace(/_/g, " ");
      const raws = await searchStudies(
        { condition, location, status: "RECRUITING", pageSize: opts.pageSize ?? 20 },
        opts,
      );
      const summaries: FeTrialSummary[] = [];
      for (const raw of raws) {
        try {
          const fe = mapTrialToFrontend(
            enrichTrial(normalizeStudy(raw, normalizeOpts("live", new Date().toISOString()))),
          );
          // Only surface studies with a Massachusetts site (matches UI intent).
          if (fe.locations.some((l) => l.state === "Massachusetts")) {
            summaries.push(toSummary(fe));
          }
        } catch {
          // Skip unusable records rather than fabricate data.
        }
      }
      return summaries;
    },

    async getTrial(nctId: string): Promise<FeTrial | null> {
      const id = nctId.trim().toUpperCase();
      if (!isValidNctId(id)) return null;

      try {
        const raw = await lookupStudy(id, opts);
        return mapTrialToFrontend(
          enrichTrial(normalizeStudy(raw, normalizeOpts("live", new Date().toISOString()))),
        );
      } catch (err) {
        // Live failed: fall back to a bundled cached record if we have one.
        const cached = BUNDLED_CACHE[id];
        if (!cached) return null; // unknown study -> honest "not available"
        return mapTrialToFrontend(
          enrichTrial(normalizeStudy(cached, normalizeOpts("cache", new Date(0).toISOString()))),
        );
      }
    },
  };
}

export { mapTrialToFrontend, mapRecruitmentStatus };
