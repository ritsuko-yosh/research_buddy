import { afterEach, describe, expect, it, vi } from 'vitest';
import { dataSource } from './adapter';

/**
 * Proves the production data source is the live adapter. If production were
 * still wired to fixtures, no network request would be made.
 */
describe('production data source wiring', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('issues a real registry request for a condition search', async () => {
    const fetchMock = vi.fn(async (_input: string | URL | Request) => new Response(JSON.stringify({ studies: [] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await dataSource.searchByCondition('asthma');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain('https://clinicaltrials.gov/api/v2/studies?');
  });

  it('issues a real registry request for a study lookup', async () => {
    const fetchMock = vi.fn(async (_input: string | URL | Request) => new Response(JSON.stringify({ unexpected: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await dataSource.getTrial('NCT12345678');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe('https://clinicaltrials.gov/api/v2/studies/NCT12345678');
  });
});
