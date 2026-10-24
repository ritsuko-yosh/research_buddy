import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLiveTrialDataSource } from './adapter';

/**
 * Tests the live adapter's request construction, parsing, traceability, and
 * failure handling. `fetch` is stubbed with the REAL cached registry record
 * from the backend, so the parser and mapper run on real ClinicalTrials.gov
 * data shapes. No synthetic records are used here.
 */

type RawStudy = {
  protocolSection: {
    identificationModule: { nctId: string; briefTitle?: string };
    eligibilityModule?: { eligibilityCriteria?: string };
    contactsLocationsModule?: { locations?: Array<{ state?: string }> };
  };
};

// npm test runs from the frontend folder, so the backend cache sits one level up.
const RAW_PATH = resolve(process.cwd(), '../src/data/cache/NCT02896335.raw.json');
const rawStudy = JSON.parse(readFileSync(RAW_PATH, 'utf8')) as RawStudy;
const CACHED_ID = rawStudy.protocolSection.identificationModule.nctId;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function stubFetch(impl: (url: string) => Promise<Response>) {
  const mock = vi.fn((input: string | URL | Request) => impl(String(input)));
  vi.stubGlobal('fetch', mock);
  return mock;
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('live search requests', () => {
  it('sends the user-provided term as the registry condition query, with MA and recruiting filters', async () => {
    const fetchMock = stubFetch(async () => jsonResponse({ studies: [rawStudy] }));
    const source = createLiveTrialDataSource();

    await source.searchByCondition('asthma');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.origin + url.pathname).toBe('https://clinicaltrials.gov/api/v2/studies');
    expect(url.searchParams.get('query.cond')).toBe('asthma');
    expect(url.searchParams.get('query.locn')).toBe('Massachusetts');
    expect(url.searchParams.get('filter.overallStatus')).toBe('RECRUITING');
  });

  it('builds independent requests for different user-provided terms', async () => {
    const fetchMock = stubFetch(async () => jsonResponse({ studies: [] }));
    const source = createLiveTrialDataSource();

    await source.searchByCondition('asthma');
    await source.searchByCondition('breast cancer');

    const first = new URL(String(fetchMock.mock.calls[0][0]));
    const second = new URL(String(fetchMock.mock.calls[1][0]));
    expect(first.searchParams.get('query.cond')).toBe('asthma');
    expect(second.searchParams.get('query.cond')).toBe('breast cancer');
  });

  it('returns only the registry studies that have a Massachusetts site, traceable to their NCT IDs', async () => {
    stubFetch(async () => jsonResponse({ studies: [rawStudy] }));
    const results = await createLiveTrialDataSource().searchByCondition('asthma');

    expect(results.map((r) => r.nctId)).toEqual([CACHED_ID]);
    expect(results[0].title).toBe(rawStudy.protocolSection.identificationModule.briefTitle);
    expect(results[0].locations.every((l) => l.state === 'Massachusetts' || l.state !== undefined)).toBe(true);
  });

  it('omits studies without a Massachusetts site instead of inventing one', async () => {
    const withoutMa = structuredClone(rawStudy);
    for (const location of withoutMa.protocolSection.contactsLocationsModule?.locations ?? []) {
      location.state = 'Texas';
    }
    stubFetch(async () => jsonResponse({ studies: [withoutMa] }));

    const results = await createLiveTrialDataSource().searchByCondition('asthma');

    expect(results).toEqual([]);
  });

  it('rejects when the network fails, so the UI can show an error with retry', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch');
    });

    await expect(createLiveTrialDataSource().searchByCondition('asthma')).rejects.toThrow();
  });

  it('rejects on an HTTP error status', async () => {
    stubFetch(async () => jsonResponse({ error: 'server' }, 500));

    await expect(createLiveTrialDataSource().searchByCondition('asthma')).rejects.toThrow();
  });

  it('rejects when the response body is not JSON', async () => {
    stubFetch(async () => new Response('<html>not json</html>', { status: 200 }));

    await expect(createLiveTrialDataSource().searchByCondition('asthma')).rejects.toThrow();
  });
});

describe('live study lookup', () => {
  it('returns a trial whose criteria text is traceable to the registry eligibility text', async () => {
    stubFetch(async () => jsonResponse(rawStudy));
    const trial = await createLiveTrialDataSource().getTrial(CACHED_ID);

    expect(trial).not.toBeNull();
    expect(trial?.nctId).toBe(CACHED_ID);
    expect(trial?.dataOrigin).toBe('live');
    expect(trial?.criteria.length).toBeGreaterThan(0);

    const registryText = normalizeWhitespace(rawStudy.protocolSection.eligibilityModule?.eligibilityCriteria ?? '');
    for (const criterion of trial?.criteria ?? []) {
      expect(registryText, criterion.id).toContain(normalizeWhitespace(criterion.sourceText));
    }
  });

  it('returns null for a valid-format study that is neither reachable nor cached', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch');
    });

    expect(await createLiveTrialDataSource().getTrial('NCT12345678')).toBeNull();
  });

  it('marks a bundled cached record as cached when the live request fails, never as live', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch');
    });

    const trial = await createLiveTrialDataSource().getTrial(CACHED_ID);

    expect(trial?.nctId).toBe(CACHED_ID);
    expect(trial?.dataOrigin).toBe('cached');
  });

  it('returns null on a 404 for an uncached study', async () => {
    stubFetch(async () => jsonResponse({ message: 'not found' }, 404));

    expect(await createLiveTrialDataSource().getTrial('NCT12345678')).toBeNull();
  });

  it('returns null for a malformed record without a protocol section', async () => {
    stubFetch(async () => jsonResponse({ unexpected: true }));

    expect(await createLiveTrialDataSource().getTrial('NCT12345678')).toBeNull();
  });

  it('does not call the network for an invalid NCT ID', async () => {
    const fetchMock = stubFetch(async () => jsonResponse(rawStudy));

    expect(await createLiveTrialDataSource().getTrial('not-an-id')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
