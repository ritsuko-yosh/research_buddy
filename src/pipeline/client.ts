/**
 * ClinicalTrials.gov API v2 client with safe failure handling and a cached
 * fallback for demo reliability (brief §B, §15).
 *
 * Endpoints (verified live):
 *   GET https://clinicaltrials.gov/api/v2/studies            (search)
 *   GET https://clinicaltrials.gov/api/v2/studies/{nctId}    (lookup)
 *
 * No API key required. We never invent study data: on failure we surface an
 * explicit error and the caller decides whether to fall back to cache.
 */

import type { RawSearchResponse, RawStudy } from "./raw.js";

const API_BASE = "https://clinicaltrials.gov/api/v2";
const DEFAULT_TIMEOUT_MS = 15_000;
const NCT_RE = /^NCT\d{8}$/i;

export class ApiError extends Error {
  readonly status?: number;
  constructor(message: string, status?: number, cause?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    // Assign cause directly so this compiles under both ES2020 and ES2022 libs
    // (the 2-arg Error constructor is not in the ES2020 lib).
    if (cause !== undefined) (this as { cause?: unknown }).cause = cause;
  }
}

/** Injectable fetch so tests can run without network. */
export type FetchLike = (
  url: string,
  init?: { signal?: AbortSignal },
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

export interface ClientOptions {
  fetchImpl?: FetchLike;
  timeoutMs?: number;
}

export interface SearchParams {
  /** Medical condition / disease term. */
  condition: string;
  /** Location term, e.g. "Massachusetts". */
  location?: string;
  /** Overall recruitment status filter, e.g. "RECRUITING". */
  status?: string;
  pageSize?: number;
}

export function isValidNctId(id: string): boolean {
  return NCT_RE.test(id.trim());
}

async function doFetch(
  url: string,
  opts: ClientOptions,
): Promise<unknown> {
  const fetchImpl = (opts.fetchImpl ?? (globalThis.fetch as unknown as FetchLike));
  if (!fetchImpl) {
    throw new ApiError("No fetch implementation available in this environment.");
  }
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, { signal: controller.signal });
    if (!res.ok) {
      throw new ApiError(`ClinicalTrials.gov returned HTTP ${res.status}`, res.status);
    }
    return await res.json();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      `ClinicalTrials.gov request failed: ${(err as Error)?.message ?? "unknown error"}`,
      undefined,
      err,
    );
  } finally {
    clearTimeout(timer);
  }
}

/** Search studies by condition, optionally filtered by location and status. */
export async function searchStudies(
  params: SearchParams,
  opts: ClientOptions = {},
): Promise<RawStudy[]> {
  const q = new URLSearchParams();
  q.set("query.cond", params.condition);
  if (params.location) q.set("query.locn", params.location);
  if (params.status) q.set("filter.overallStatus", params.status);
  q.set("pageSize", String(params.pageSize ?? 20));
  const url = `${API_BASE}/studies?${q.toString()}`;
  const data = (await doFetch(url, opts)) as RawSearchResponse;
  return Array.isArray(data.studies) ? data.studies : [];
}

/** Look up a single study by NCT id. Validates the id format first. */
export async function lookupStudy(
  nctId: string,
  opts: ClientOptions = {},
): Promise<RawStudy> {
  const id = nctId.trim().toUpperCase();
  if (!isValidNctId(id)) {
    throw new ApiError(`Invalid NCT id format: "${nctId}" (expected NCT followed by 8 digits).`);
  }
  const url = `${API_BASE}/studies/${id}`;
  const data = (await doFetch(url, opts)) as RawStudy;
  if (!data || !data.protocolSection) {
    throw new ApiError(`No study record returned for ${id}.`);
  }
  return data;
}
