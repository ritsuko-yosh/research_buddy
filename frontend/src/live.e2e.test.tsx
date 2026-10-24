import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import App from './App';
import { messages } from './i18n/strings';

/**
 * LIVE end-to-end test against the real ClinicalTrials.gov API v2.
 *
 * Skipped unless RUN_LIVE_API=1, so the default test run stays offline and
 * deterministic. Run it with:  RUN_LIVE_API=1 npx vitest run live.e2e
 *
 * It uses the production App with the production (live) data source. Nothing
 * is injected. jsdom does not enforce browser CORS, so the browser path is
 * verified separately with a real browser.
 */

const en = messages.en;
const LIVE = process.env.RUN_LIVE_API === '1';

async function collectResultIds(): Promise<string[]> {
  await waitFor(() => {
    const ready =
      document.querySelectorAll('.study-card').length > 0 ||
      screen.queryByText(en.resultsEmpty) !== null ||
      screen.queryByText(en.resultsError, { exact: false }) !== null;
    expect(ready).toBe(true);
  }, { timeout: 60000 });

  return Array.from(document.querySelectorAll('.study-card .nct')).map((node) => node.textContent ?? '');
}

describe.runIf(LIVE)('live ClinicalTrials.gov end to end (RUN_LIVE_API=1)', () => {
  beforeAll(() => {
    // jsdom's AbortSignal is rejected by Node's fetch, which is a test-environment
    // limitation. Strip the signal for this test only. Real browsers use their
    // native AbortController, and that path is verified in a real browser.
    const nodeFetch = globalThis.fetch;
    vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) =>
      nodeFetch(input, { ...init, signal: undefined }),
    );
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it('searches two different terms against the real API and opens a real study', async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByLabelText(en.conditionInputLabel);

    await user.type(input, 'asthma');
    await user.click(screen.getByRole('button', { name: en.conditionSearch }));
    const asthmaIds = await collectResultIds();

    await user.clear(input);
    await user.type(input, 'breast cancer');
    await user.click(screen.getByRole('button', { name: en.conditionSearch }));
    const cancerIds = await collectResultIds();

    expect(asthmaIds.length, 'asthma results').toBeGreaterThan(0);
    expect(cancerIds.length, 'breast cancer results').toBeGreaterThan(0);
    expect(cancerIds).not.toEqual(asthmaIds);
    for (const id of [...asthmaIds, ...cancerIds]) {
      expect(id).toMatch(/^NCT\d{8}$/);
    }

    await user.click(screen.getAllByRole('button', { name: new RegExp(`^${en.viewStudy}:`) })[0]);
    expect(await screen.findByRole('heading', { name: en.mapHeading })).toBeInTheDocument();
    expect(screen.getByText(en.originLive)).toBeInTheDocument();
    expect(document.body.textContent ?? '').not.toContain('[SAMPLE');
  }, 180000);
});
