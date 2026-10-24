/**
 * TrialService — the façade Person A's frontend consumes.
 *
 * Responsibilities:
 *  - getTrialByNct: live lookup -> normalize -> enrich, with cache fallback.
 *  - searchTrials: condition/location search returning normalized summaries.
 *  - Reads the cached raw record bundled for the demo study so the demo is
 *    reliable even offline (brief §B, §15, §P2).
 *
 * The service never invents data. On total failure it throws; callers can show
 * an explicit error state.
 */

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import type { SearchResults, Trial, TrialSummary } from "../contract/types.js";
import { CONTRACT_VERSION } from "../contract/types.js";
import {
  ApiError,
  isValidNctId,
  lookupStudy,
  searchStudies,
  type ClientOptions,
  type SearchParams,
} from "./client.js";
import { enrichTrial } from "./enrich.js";
import { normalizeStudy, type NormalizeOptions } from "./normalize.js";
import type { RawStudy } from "./raw.js";
import { toTrialSummary } from "./summary.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dirname, "..", "data", "cache");

export interface ServiceOptions extends ClientOptions {
  /** Days after which a listing is flagged stale. */
  staleThresholdDays?: number;
  /** Override cache directory (tests). */
  cacheDir?: string;
  /** Reference clock (tests). */
  now?: Date;
}

export interface CacheEnvelope {
  raw: RawStudy;
  fetchedAt: string;
}

/** Load a cached raw record saved as `{nctId}.cache.json` (envelope form). */
export function loadCache(nctId: string, cacheDir = CACHE_DIR): CacheEnvelope | null {
  const envelopePath = join(cacheDir, `${nctId}.cache.json`);
  if (existsSync(envelopePath)) {
    const parsed = JSON.parse(readFileSync(envelopePath, "utf8")) as CacheEnvelope;
    return parsed;
  }
  // Fall back to a bare raw dump (no envelope) if present.
  const rawPath = join(cacheDir, `${nctId}.raw.json`);
  if (existsSync(rawPath)) {
    const raw = JSON.parse(readFileSync(rawPath, "utf8")) as RawStudy;
    return { raw, fetchedAt: new Date(0).toISOString() };
  }
  return null;
}

export interface GetTrialResult {
  trial: Trial;
  /** Whether live fetch succeeded or we fell back to cache. */
  usedCache: boolean;
  /** Present when live fetch failed but cache was used. */
  liveError?: string;
}

export class TrialService {
  constructor(private readonly opts: ServiceOptions = {}) {}

  private normalizeOpts(source: "live" | "cache", fetchedAt: string): NormalizeOptions {
    return {
      source,
      fetchedAt,
      staleThresholdDays: this.opts.staleThresholdDays,
      now: this.opts.now,
    };
  }

  /**
   * Look up a study by NCT id. Tries live first; on any API failure falls back
   * to a cached raw record if one exists, otherwise rethrows.
   */
  async getTrialByNct(nctId: string): Promise<GetTrialResult> {
    const id = nctId.trim().toUpperCase();
    if (!isValidNctId(id)) {
      throw new ApiError(`Invalid NCT id: "${nctId}".`);
    }

    try {
      const raw = await lookupStudy(id, this.opts);
      const trial = enrichTrial(
        normalizeStudy(raw, this.normalizeOpts("live", new Date().toISOString())),
      );
      return { trial, usedCache: false };
    } catch (err) {
      const cache = loadCache(id, this.opts.cacheDir);
      if (!cache) throw err;
      const trial = enrichTrial(
        normalizeStudy(cache.raw, this.normalizeOpts("cache", cache.fetchedAt)),
      );
      return {
        trial,
        usedCache: true,
        liveError: (err as Error).message,
      };
    }
  }

  /** Load a trial directly from cache (used for the offline demo path). */
  getCachedTrial(nctId: string): Trial {
    const cache = loadCache(nctId.trim().toUpperCase(), this.opts.cacheDir);
    if (!cache) throw new ApiError(`No cached record for ${nctId}.`);
    return enrichTrial(
      normalizeStudy(cache.raw, this.normalizeOpts("cache", cache.fetchedAt)),
    );
  }

  /** Search studies by condition (+ optional location/status). */
  async searchTrials(params: SearchParams): Promise<Trial[]> {
    const studies = await searchStudies(params, this.opts);
    const out: Trial[] = [];
    for (const raw of studies) {
      try {
        out.push(
          enrichTrial(
            normalizeStudy(raw, this.normalizeOpts("live", new Date().toISOString())),
          ),
        );
      } catch {
        // Skip unusable records (e.g. missing NCT id) rather than fabricate data.
      }
    }
    return out;
  }

  /**
   * Search and return card-level summaries plus query echo, shaped for the
   * results-list UI (`SearchResults`).
   */
  async searchTrialSummaries(params: SearchParams): Promise<SearchResults> {
    const trials = await this.searchTrials(params);
    const results: TrialSummary[] = trials.map(toTrialSummary);
    return {
      contractVersion: CONTRACT_VERSION,
      query: {
        condition: params.condition,
        location: params.location ?? null,
        status: params.status ?? null,
      },
      fetchedAt: new Date().toISOString(),
      totalReturned: results.length,
      results,
    };
  }
}
