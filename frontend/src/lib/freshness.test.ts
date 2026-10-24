import { describe, expect, it } from 'vitest';
import { DEFAULT_STALE_THRESHOLD_DAYS, isRegistryListingStale } from './freshness';

const NOW = new Date('2026-10-24T12:00:00Z');

describe('isRegistryListingStale', () => {
  it('uses the backend threshold rather than a UI-only value', () => {
    expect(DEFAULT_STALE_THRESHOLD_DAYS).toBe(120);
  });

  it('is false for a recent registry update', () => {
    expect(isRegistryListingStale('2026-09-01', NOW)).toBe(false);
  });

  it('is true for an update older than the threshold', () => {
    expect(isRegistryListingStale('2026-03-01', NOW)).toBe(true);
  });

  it('returns null when the update date is missing, so no staleness is claimed', () => {
    expect(isRegistryListingStale(null, NOW)).toBeNull();
  });

  it('returns null for an unreadable date', () => {
    expect(isRegistryListingStale('not-a-date', NOW)).toBeNull();
  });
});
