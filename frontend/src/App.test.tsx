import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import { TEST_TOPIC_INDEX } from './test/topicIndex.fixture';
import { createFixtureDataSource } from './data/fixtures/fixtureDataSource';
import { messages } from './i18n/strings';
import type { TrialDataSource } from './types/trial';

// Tests use the synthetic fixture source explicitly. Production uses the live adapter.
const fixtureSource = createFixtureDataSource();

const en = messages.en;
const es = messages.es;

// Wording that would present the patient as qualified or pre-screened.
const VERDICT_PATTERN = /you (are|'re) eligible|you qualify|you match|pre-?screen|match score/i;

async function openStudy(user: ReturnType<typeof userEvent.setup>, conditionLabel: string, sampleTag: string) {
  await user.click(screen.getByRole('button', { name: conditionLabel }));
  const viewButton = await screen.findByRole('button', { name: new RegExp(`View study: \\[${sampleTag}\\]`) });
  await user.click(viewButton);
  return screen.findByRole('heading', { level: 1, name: new RegExp(`\\[${sampleTag}\\]`) });
}

/** Counts top-level criterion items in a group, excluding nested uncertainty notes. */
function criterionCount(group: HTMLElement): number {
  const list = group.querySelector('ul');
  return list ? list.children.length : 0;
}

describe('Visit Ready patient journey (sample data)', () => {
  it('shows only Massachusetts studies for a selected condition', async () => {
    const user = userEvent.setup();
    render(<App dataSource={fixtureSource} topicIndex={TEST_TOPIC_INDEX} />);

    await user.click(screen.getByRole('button', { name: 'Type 2 diabetes' }));

    expect(await screen.findByRole('heading', { name: /\[SAMPLE A\]/ })).toBeInTheDocument();
    expect(screen.queryByText('NCT90000003')).not.toBeInTheDocument();
  });

  it('shows the four verification categories with original registry wording', async () => {
    const user = userEvent.setup();
    render(<App dataSource={fixtureSource} topicIndex={TEST_TOPIC_INDEX} />);
    await openStudy(user, 'Type 2 diabetes', 'SAMPLE A');

    for (const label of Object.values(en.categoryLabels)) {
      expect(screen.getByRole('region', { name: new RegExp(label) })).toBeInTheDocument();
    }
    expect(screen.getAllByText('Age 18 years or older at screening.').length).toBeGreaterThan(0);
  });

  it('expands a long group with the keyboard and keeps every item', async () => {
    const user = userEvent.setup();
    render(<App dataSource={fixtureSource} topicIndex={TEST_TOPIC_INDEX} />);
    await openStudy(user, 'Type 2 diabetes', 'SAMPLE A');

    const group = screen.getByRole('region', { name: new RegExp(en.categoryLabels.check_records) });
    expect(criterionCount(group)).toBe(3);

    const toggle = within(group).getByRole('button', { name: en.showAll(4) });
    toggle.focus();
    await user.keyboard('{Enter}');

    expect(criterionCount(group)).toBe(4);
    expect(within(group).getByRole('button', { name: en.showFewer })).toBeInTheDocument();
  });

  it('switches to Spanish and labels missing Spanish explanations', async () => {
    const user = userEvent.setup();
    render(<App dataSource={fixtureSource} topicIndex={TEST_TOPIC_INDEX} />);
    await user.click(screen.getByRole('button', { name: 'Asthma' }));
    await user.click(await screen.findByRole('button', { name: /View study: \[SAMPLE B\]/ }));
    await screen.findByRole('heading', { level: 1, name: /\[SAMPLE B\]/ });

    await user.click(screen.getByRole('button', { name: 'Español' }));

    expect(document.documentElement.lang).toBe('es');
    expect(screen.getByRole('heading', { name: es.mapHeading })).toBeInTheDocument();
    expect(screen.getAllByText(es.noSpanish).length).toBeGreaterThan(0);
  });

  it('marks machine-drafted Spanish explanations as unreviewed', async () => {
    const user = userEvent.setup();
    render(<App dataSource={fixtureSource} topicIndex={TEST_TOPIC_INDEX} />);
    await openStudy(user, 'Type 2 diabetes', 'SAMPLE A');
    await user.click(screen.getByRole('button', { name: 'Español' }));

    expect(screen.getAllByText(es.translationLabels.machine_drafted_unreviewed).length).toBeGreaterThan(0);
    expect(screen.queryByText(es.translationLabels.clinically_reviewed)).not.toBeInTheDocument();
  });

  it('shows an explicit English-language requirement notice', async () => {
    const user = userEvent.setup();
    render(<App dataSource={fixtureSource} topicIndex={TEST_TOPIC_INDEX} />);
    await openStudy(user, 'Type 2 diabetes', 'SAMPLE A');

    expect(screen.getByText(en.langEnglishRequired)).toBeInTheDocument();
  });

  it('rejects malformed NCT IDs and reports unsupported studies', async () => {
    const user = userEvent.setup();
    render(<App dataSource={fixtureSource} topicIndex={TEST_TOPIC_INDEX} />);
    const input = screen.getByLabelText(en.nctLabel);

    await user.type(input, 'abc');
    await user.click(screen.getByRole('button', { name: en.openStudy }));
    expect(await screen.findByText(en.nctInvalid)).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, 'NCT99999999');
    await user.click(screen.getByRole('button', { name: en.openStudy }));
    expect(await screen.findByText(en.nctUnsupported)).toBeInTheDocument();
  });

  it('shows "Contact not listed" when the registry has no contacts', async () => {
    const user = userEvent.setup();
    render(<App dataSource={fixtureSource} topicIndex={TEST_TOPIC_INDEX} />);
    await openStudy(user, 'Asthma', 'SAMPLE B');
    await user.click(screen.getByRole('button', { name: en.prepareButton }));

    expect(screen.getByText(en.contactNotListed)).toBeInTheDocument();
  });

  it('builds a coordinator message that asks about language support when the registry states English', async () => {
    const user = userEvent.setup();
    render(<App dataSource={fixtureSource} topicIndex={TEST_TOPIC_INDEX} />);
    await openStudy(user, 'Type 2 diabetes', 'SAMPLE A');
    await user.click(screen.getByRole('button', { name: en.prepareButton }));

    const message = screen.getByRole('textbox', { name: en.inquiryHeading }) as HTMLTextAreaElement;
    expect(message.value).toContain('NCT90000001');
    expect(message.value).toContain('language support');
    expect(message.value).not.toMatch(VERDICT_PATTERN);
  });

  it('copies the coordinator message to the clipboard', async () => {
    const user = userEvent.setup();
    // Spy after setup: user-event installs its own clipboard stub during setup.
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    render(<App dataSource={fixtureSource} topicIndex={TEST_TOPIC_INDEX} />);
    await openStudy(user, 'Type 2 diabetes', 'SAMPLE A');
    await user.click(screen.getByRole('button', { name: en.prepareButton }));
    await user.click(screen.getByRole('button', { name: en.copyInquiry }));

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('NCT90000001'));
    expect(await screen.findByText(en.copied)).toBeInTheDocument();
  });

  it('shows a manual-copy fallback when copying fails', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('clipboard denied'));
    render(<App dataSource={fixtureSource} topicIndex={TEST_TOPIC_INDEX} />);
    await openStudy(user, 'Type 2 diabetes', 'SAMPLE A');
    await user.click(screen.getByRole('button', { name: en.prepareButton }));
    await user.click(screen.getByRole('button', { name: en.copyInquiry }));

    expect(await screen.findByText(en.copyFailed)).toBeInTheDocument();
  });

  it('never presents a verdict on the study or the patient', async () => {
    const user = userEvent.setup();
    render(<App dataSource={fixtureSource} topicIndex={TEST_TOPIC_INDEX} />);
    await openStudy(user, 'Type 2 diabetes', 'SAMPLE A');
    await waitFor(() => expect(screen.getByRole('heading', { name: en.mapHeading })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: en.prepareButton }));

    // The disclaimers say "does not decide whether you qualify". Remove them
    // so the check catches only affirmative verdict wording.
    const disclaimers = [en.disclaimer, en.prepIntro];
    let text = document.body.textContent ?? '';
    for (const disclaimer of disclaimers) {
      text = text.replace(disclaimer, '');
    }

    expect(text).not.toMatch(VERDICT_PATTERN);
  });
});

describe('Visit Ready states, preparation actions, and accessibility', () => {
  it('shows registry freshness and the sample-data notice', async () => {
    const user = userEvent.setup();
    render(<App dataSource={fixtureSource} topicIndex={TEST_TOPIC_INDEX} />);
    await openStudy(user, 'Type 2 diabetes', 'SAMPLE A');

    expect(screen.getByText(en.lastUpdatedLabel)).toBeInTheDocument();
    expect(screen.getByText('June 15, 2026')).toBeInTheDocument();
    expect(screen.getByText(en.originSample)).toBeInTheDocument();
    expect(screen.getByText(en.statusNote)).toBeInTheDocument();
  });

  it('shows the empty state when no Massachusetts studies are returned', async () => {
    const user = userEvent.setup();
    const empty: TrialDataSource = {
      searchByCondition: async () => [],
      getTrial: async () => null,
    };
    render(<App dataSource={empty} topicIndex={TEST_TOPIC_INDEX} />);
    await user.click(screen.getByRole('button', { name: 'Asthma' }));

    expect(await screen.findByText(en.resultsEmpty)).toBeInTheDocument();
  });

  it('shows an error with a retry action, then recovers', async () => {
    const user = userEvent.setup();
    const real = createFixtureDataSource();
    let attempts = 0;
    const flaky: TrialDataSource = {
      getTrial: real.getTrial,
      searchByCondition: async (conditionId) => {
        attempts += 1;
        if (attempts === 1) {
          throw new Error('network unavailable');
        }
        return real.searchByCondition(conditionId);
      },
    };
    render(<App dataSource={flaky} topicIndex={TEST_TOPIC_INDEX} />);
    await user.click(screen.getByRole('button', { name: 'Type 2 diabetes' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(en.resultsError);
    await user.click(screen.getByRole('button', { name: en.retry }));

    expect(await screen.findByRole('button', { name: /View study: \[SAMPLE A\]/ })).toBeInTheDocument();
  });

  it('lets the patient mark preparation items without saving them', async () => {
    const user = userEvent.setup();
    render(<App dataSource={fixtureSource} topicIndex={TEST_TOPIC_INDEX} />);
    await openStudy(user, 'Type 2 diabetes', 'SAMPLE A');
    await user.click(screen.getByRole('button', { name: en.prepareButton }));

    const checkbox = screen.getByRole('checkbox', {
      name: new RegExp(`^${en.markGathered}: You must be 18 or older`),
    });
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('moves focus to the new step heading after navigation', async () => {
    const user = userEvent.setup();
    render(<App dataSource={fixtureSource} topicIndex={TEST_TOPIC_INDEX} />);
    await openStudy(user, 'Type 2 diabetes', 'SAMPLE A');

    expect(screen.getByRole('heading', { level: 1, name: /\[SAMPLE A\]/ })).toHaveFocus();
  });

  it.each([
    ['search', 'en'],
    ['study', 'en'],
    ['study', 'es'],
    ['preparation', 'en'],
    ['preparation', 'es'],
  ] as const)('has no detectable accessibility violations: %s (%s)', async (step, locale) => {
    const user = userEvent.setup();
    render(<App dataSource={fixtureSource} topicIndex={TEST_TOPIC_INDEX} />);

    if (step !== 'search') {
      await openStudy(user, 'Type 2 diabetes', 'SAMPLE A');
    }
    if (step === 'preparation') {
      await user.click(screen.getByRole('button', { name: en.prepareButton }));
    }
    if (locale === 'es') {
      await user.click(screen.getByRole('button', { name: 'Español' }));
    }

    // Color contrast cannot be computed in jsdom, so it is disabled here and
    // must be checked visually in the browser.
    const results = await axe.run(document, {
      rules: { 'color-contrast': { enabled: false } },
    });
    const summary = results.violations.map((violation) => `${violation.id}: ${violation.help}`);
    expect(summary, summary.join('\n')).toEqual([]);
  });
});
