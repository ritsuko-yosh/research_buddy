// The backend owns the staleness threshold. Reuse its constant rather than
// defining a second value in the UI.
import { DEFAULT_STALE_THRESHOLD_DAYS } from '@backend/pipeline/normalize';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Whether the registry listing is older than the backend threshold.
 * Returns null when the update date is missing or unreadable, so the UI never
 * claims freshness or staleness it can't support.
 */
export function isRegistryListingStale(registryUpdateDate: string | null, now: Date = new Date()): boolean | null {
  if (!registryUpdateDate) {
    return null;
  }
  const updated = new Date(`${registryUpdateDate.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(updated.getTime())) {
    return null;
  }
  const ageDays = (now.getTime() - updated.getTime()) / MS_PER_DAY;
  return ageDays > DEFAULT_STALE_THRESHOLD_DAYS;
}

export { DEFAULT_STALE_THRESHOLD_DAYS };
