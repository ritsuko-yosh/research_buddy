import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Spy on the live summary client to prove it is NOT called when a curated
// summary is present (no network, protects any spend).
const fetchSpy = vi.fn(async () => 'LIVE SUMMARY SHOULD NOT APPEAR');
vi.mock('./lib/summary', () => ({
  isSummaryEnabled: () => true,
  fetchPlainLanguageSummary: (...args: unknown[]) => fetchSpy(...(args as [])),
}));

import { StudyDetail } from './components/StudyDetail';
import { messages } from './i18n/strings';
import type { Trial } from './types/trial';

const baseTrial: Trial = {
  nctId: 'NCT02896335',
  title: 'Example Study',
  description: {
    en: 'This is the original, technical registry description with specific clinical terms.',
    es: null,
  },
  recruitmentStatus: 'recruiting',
  locations: [{ city: 'Boston', state: 'Massachusetts' }],
  registryUpdateDate: '2026-07-21',
  dataRetrievedAt: '2026-10-24T00:00:00Z',
  contacts: [],
  languageRequirement: { status: 'none_stated', sourceText: null },
  sourceUrl: 'https://clinicaltrials.gov/study/NCT02896335',
  criteria: [],
  dataOrigin: 'live',
  plainLanguageSummary: {
    en: 'In plain terms: this study tests two drugs for cancer that spread to the brain.',
    es: 'En términos sencillos: este estudio evalúa dos medicamentos.',
    reviewed: false,
  },
};

describe('About this study — curated plain-language summary (Option C)', () => {
  beforeEach(() => fetchSpy.mockClear());

  it('shows the curated summary and does NOT call the live summary API', async () => {
    const m = messages.en;
    render(<StudyDetail m={m} locale="en" trial={baseTrial} onBack={() => {}} onPrepare={() => {}} />);

    expect(screen.getByText(/In plain terms: this study tests two drugs/)).toBeInTheDocument();
    // Unreviewed curated summary shows the drafted/unreviewed disclaimer.
    expect(screen.getByText(/has not been reviewed/i)).toBeInTheDocument();
    // Crucially, no network/LLM call was made.
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('keeps the full original registry description in a dropdown', async () => {
    const m = messages.en;
    render(<StudyDetail m={m} locale="en" trial={baseTrial} onBack={() => {}} onPrepare={() => {}} />);
    const toggle = screen.getByText(m.fullDescriptionToggle);
    await userEvent.click(toggle);
    expect(screen.getByText(/original, technical registry description/i)).toBeInTheDocument();
  });

  it('shows the Spanish curated summary when locale is Spanish', () => {
    const m = messages.es;
    render(<StudyDetail m={m} locale="es" trial={baseTrial} onBack={() => {}} onPrepare={() => {}} />);
    expect(screen.getByText(/En términos sencillos/)).toBeInTheDocument();
  });

  it('labels a REVIEWED curated summary without the unreviewed warning', () => {
    const m = messages.en;
    const reviewed: Trial = {
      ...baseTrial,
      plainLanguageSummary: { en: 'Reviewed summary text.', es: null, reviewed: true },
    };
    render(<StudyDetail m={m} locale="en" trial={reviewed} onBack={() => {}} onPrepare={() => {}} />);
    expect(screen.getByText(/Reviewed summary text\./)).toBeInTheDocument();
    expect(screen.queryByText(/has not been reviewed/i)).not.toBeInTheDocument();
  });
});
