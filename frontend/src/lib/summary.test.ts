import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// The module reads import.meta.env.VITE_SUMMARY_ENDPOINT at load time, so stub
// it before importing the module under test.
vi.stubEnv('VITE_SUMMARY_ENDPOINT', 'https://example.test/api/summarize');

import { fetchPlainLanguageSummary, isSummaryEnabled, clearSummaryCache } from './summary';

const TEXT = 'A clinical study of a treatment in adults with a specific condition and measurable disease.';

describe('summary client — session cache (protects API spend)', () => {
  beforeEach(() => {
    clearSummaryCache();
    vi.restoreAllMocks();
  });
  afterEach(() => {
    clearSummaryCache();
  });

  it('is enabled when an endpoint is configured', () => {
    expect(isSummaryEnabled()).toBe(true);
  });

  it('calls the endpoint only once per (text, lang) across repeat requests', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ summary: 'Plain summary.' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

    const a = await fetchPlainLanguageSummary(TEXT, 'en');
    const b = await fetchPlainLanguageSummary(TEXT, 'en');
    const c = await fetchPlainLanguageSummary(TEXT, 'en');

    expect(a).toBe('Plain summary.');
    expect(b).toBe('Plain summary.');
    expect(c).toBe('Plain summary.');
    expect(fetchMock).toHaveBeenCalledTimes(1); // cached after first call
  });

  it('de-duplicates concurrent in-flight requests into one call', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve(
                new Response(JSON.stringify({ summary: 'Once.' }), {
                  status: 200,
                  headers: { 'Content-Type': 'application/json' },
                }),
              ),
            10,
          ),
        ),
    );

    const [a, b] = await Promise.all([
      fetchPlainLanguageSummary(TEXT, 'es'),
      fetchPlainLanguageSummary(TEXT, 'es'),
    ]);

    expect(a).toBe('Once.');
    expect(b).toBe('Once.');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does NOT cache failures, so a later call can retry', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('err', { status: 502 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ summary: 'Recovered.' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

    const first = await fetchPlainLanguageSummary(TEXT, 'en');
    const second = await fetchPlainLanguageSummary(TEXT, 'en');

    expect(first).toBeNull(); // failure, not cached
    expect(second).toBe('Recovered.'); // retried and succeeded
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('returns null without calling fetch for too-short text', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const r = await fetchPlainLanguageSummary('short', 'en');
    expect(r).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
