/**
 * Normalize a raw ClinicalTrials.gov v2 study record into the shared `Trial`
 * contract. Handles missing fields safely: absent data becomes explicit `null`
 * or empty arrays — never guessed or invented (brief §13.4, §13.8).
 */

import {
  CONTRACT_VERSION,
  type Contact,
  type DataSource,
  type Trial,
  type TrialLocation,
} from "../contract/types.js";
import { buildCriteria } from "./criteria.js";
import { detectLanguageRequirement } from "./language.js";
import type { RawContact, RawLocation, RawStudy } from "./raw.js";

export const DEFAULT_STALE_THRESHOLD_DAYS = 120;

export interface NormalizeOptions {
  /** How the raw record was obtained. */
  source: "live" | "cache";
  /** ISO-8601 timestamp when the raw record was fetched from the API. */
  fetchedAt: string;
  /** Days after which the registry listing is considered stale. */
  staleThresholdDays?: number;
  /** Reference "now" for staleness computation (defaults to Date.now). */
  now?: Date;
}

/** Trim to a non-empty string or return null. Never fabricates a value. */
function str(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

function normalizeContact(c: RawContact): Contact {
  return {
    name: str(c.name) ?? "",
    role: str(c.role),
    phone: str(c.phone),
    email: str(c.email),
  };
}

/** Keep only contacts that carry a real name — never invent placeholders. */
function normalizeContacts(list: RawContact[] | undefined): Contact[] {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeContact).filter((c) => c.name !== "");
}

function normalizeLocation(l: RawLocation): TrialLocation {
  return {
    facility: str(l.facility),
    city: str(l.city),
    state: str(l.state),
    zip: str(l.zip),
    country: str(l.country),
    status: str(l.status),
    contacts: normalizeContacts(l.contacts),
  };
}

function computeStale(
  lastRegistryUpdate: string | null,
  fetchedAt: string,
  thresholdDays: number,
  now: Date,
): boolean {
  // Prefer the registry update date; fall back to fetch time.
  const basis = lastRegistryUpdate ?? fetchedAt;
  const d = new Date(basis);
  if (Number.isNaN(d.getTime())) return false;
  const ageDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
  return ageDays > thresholdDays;
}

/**
 * Normalize a raw v2 study into a `Trial`. Throws only if the record has no
 * NCT id (an unusable record), so callers can fall back to cache.
 */
export function normalizeStudy(raw: RawStudy, opts: NormalizeOptions): Trial {
  const p = raw.protocolSection ?? {};
  const ident = p.identificationModule ?? {};
  const status = p.statusModule ?? {};
  const desc = p.descriptionModule ?? {};
  const elig = p.eligibilityModule ?? {};
  const cl = p.contactsLocationsModule ?? {};

  const nctId = str(ident.nctId);
  if (!nctId) {
    throw new Error("normalizeStudy: raw record has no NCT id; cannot normalize.");
  }

  const sourceUrl = `https://clinicaltrials.gov/study/${nctId}`;
  const title =
    str(ident.briefTitle) ?? str(ident.officialTitle) ?? "(untitled study)";
  const description = str(desc.briefSummary) ?? str(desc.detailedDescription);
  const recruitmentStatus = str(status.overallStatus);
  const lastRegistryUpdate = str(status.lastUpdatePostDateStruct?.date);

  const staleThresholdDays =
    opts.staleThresholdDays ?? DEFAULT_STALE_THRESHOLD_DAYS;
  const now = opts.now ?? new Date();

  const eligibilityText = elig.eligibilityCriteria ?? "";
  const criteria = buildCriteria(eligibilityText, nctId, sourceUrl);
  const languageRequirement = detectLanguageRequirement({
    eligibilityText,
    criteria,
  });

  const locations = Array.isArray(cl.locations)
    ? cl.locations.map(normalizeLocation)
    : [];
  const contacts = normalizeContacts(cl.centralContacts);

  const dataSource: DataSource = {
    kind: opts.source,
    fetchedAt: opts.fetchedAt,
    staleThresholdDays,
    stale: computeStale(lastRegistryUpdate, opts.fetchedAt, staleThresholdDays, now),
  };

  return {
    contractVersion: CONTRACT_VERSION,
    nctId,
    title,
    description,
    recruitmentStatus,
    lastRegistryUpdate,
    lastFetched: opts.fetchedAt,
    locations,
    contacts,
    languageRequirement,
    criteria,
    sourceUrl,
    dataSource,
  };
}
