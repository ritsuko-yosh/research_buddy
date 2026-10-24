import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';
import { createFixtureDataSource } from './data/adapter';
import { SAMPLE_TRIALS } from './data/fixtures/sampleTrials';
import { messages } from './i18n/strings';
import { findNewTestSuggestions } from './test/wording';
import type { Criterion, Trial, TrialDataSource } from './types/trial';

const en = messages.en;
const es = messages.es;

const UNSPECIFIED_TEXT = 'Any other requirement not labeled as inclusion or exclusion in the registry.';

/** Sample study A plus one criterion whose section the registry does not state. */
function sampleWithUnspecifiedCriterion(): Trial {
  const base = SAMPLE_TRIALS[0].trial;
  const extra: Criterion = {
    id: 'S1-U1',
    section: 'unspecified',
    sourceText: UNSPECIFIED_TEXT,
    sourceRef: 'Eligibility criteria, item 10',
    category: 'cannot_assess',
    plainExplanation: { en: null, es: null },
    spanishTranslationStatus: 'unavailable',
    uncertaintyNotes: [],
  };
  return { ...base, criteria: [...base.criteria, extra] };
}

function sourceReturning(trial: Trial): TrialDataSource {
  const real = createFixtureDataSource();
  return { searchByCondition: real.searchByCondition, getTrial: async () => trial };
}

/** Opens a study through the NCT ID field, which works for any record. */
async function openStudy(user: ReturnType<typeof userEvent.setup>, dataSource?: TrialDataSource) {
  render(dataSource ? <App dataSource={dataSource} /> : <App />);
  await user.type(screen.getByLabelText(en.nctLabel), 'NCT90000001');
  await user.click(screen.getByRole('button', { name: en.openStudy }));
  // Wait for the study heading specifically. The search page also has a level-1 heading.
  await screen.findByRole('heading', { level: 1, name: SAMPLE_TRIALS[0].trial.title });
}

/** Removes registry text, which is quoted verbatim, before scanning patient-facing wording. */
function patientFacingText(trial: Trial): string {
  let text = document.body.textContent ?? '';
  for (const criterion of trial.criteria) {
    text = text.split(criterion.sourceText).join('');
  }
  return text;
}

describe('unspecified criteria', () => {
  it('shows an unspecified criterion in the full registry list with a "not stated" heading', async () => {
    const user = userEvent.setup();
    const trial = sampleWithUnspecifiedCriterion();
    await openStudy(user, sourceReturning(trial));

    const details = document.querySelector('details') as HTMLElement;
    expect(within(details).getByRole('heading', { name: en.sectionUnspecified })).toBeInTheDocument();
    expect(within(details).getByText(UNSPECIFIED_TEXT, { exact: false })).toBeInTheDocument();
    expect(within(details).getAllByRole('listitem')).toHaveLength(trial.criteria.length);
  });

  it('labels the unspecified criterion correctly in the Verification Map, never as an exclusion', async () => {
    const user = userEvent.setup();
    await openStudy(user, sourceReturning(sampleWithUnspecifiedCriterion()));

    const article = Array.from(document.querySelectorAll<HTMLElement>('article.criterion')).find((node) =>
      node.textContent?.includes(UNSPECIFIED_TEXT),
    );
    expect(article).toBeDefined();
    expect(within(article as HTMLElement).getByText(en.sectionUnspecified)).toBeInTheDocument();
    expect(within(article as HTMLElement).queryByText(en.exclusion)).not.toBeInTheDocument();
    expect(within(article as HTMLElement).queryByText(en.inclusion)).not.toBeInTheDocument();
  });

  it('keeps real exclusions labeled as exclusions', async () => {
    const user = userEvent.setup();
    await openStudy(user, sourceReturning(sampleWithUnspecifiedCriterion()));

    const article = Array.from(document.querySelectorAll<HTMLElement>('article.criterion')).find((node) =>
      node.textContent?.includes('Currently using insulin'),
    );
    expect(article).toBeDefined();
    expect(within(article as HTMLElement).getByText(en.exclusion)).toBeInTheDocument();
    expect(within(article as HTMLElement).queryByText(en.sectionUnspecified)).not.toBeInTheDocument();
  });

  it('lists every original registry criterion, with source references, in the details section', async () => {
    const user = userEvent.setup();
    const trial = SAMPLE_TRIALS[0].trial;
    await openStudy(user);

    const details = document.querySelector('details') as HTMLElement;
    for (const criterion of trial.criteria) {
      expect(within(details).getByText(criterion.sourceText, { exact: false }), criterion.id).toBeInTheDocument();
      expect(within(details).getByText(criterion.sourceRef, { exact: false }), criterion.id).toBeInTheDocument();
    }
    expect(within(details).getAllByRole('listitem')).toHaveLength(trial.criteria.length);
  });
});

describe('language support caveat', () => {
  it('appears on the English and Spanish study pages', async () => {
    const user = userEvent.setup();
    await openStudy(user);

    expect(screen.getByText(en.languageSupportCaveat)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Español' }));
    expect(screen.getByText(es.languageSupportCaveat)).toBeInTheDocument();
  });

  it('appears on the preparation card in both languages', async () => {
    const user = userEvent.setup();
    await openStudy(user);
    await user.click(screen.getByRole('button', { name: en.prepareButton }));
    expect(screen.getByText(en.languageSupportCaveat)).toBeInTheDocument();
  });
});

describe('translation honesty', () => {
  it('states that the Spanish interface is machine-drafted, only in Spanish mode', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.queryByText(es.esInterfaceNotice)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Español' }));
    expect(screen.getByText(es.esInterfaceNotice)).toBeInTheDocument();
  });

  it('labels Spanish explanations as machine-drafted and marks English-only uncertainty notes', async () => {
    const user = userEvent.setup();
    await openStudy(user);
    await user.click(screen.getByRole('button', { name: 'Español' }));

    expect(screen.getAllByText(es.translationLabels.machine_drafted_unreviewed).length).toBeGreaterThan(0);
    expect(screen.getAllByText(`${es.uncertaintyHeading} ${es.uncertaintyEnglishOnly}`).length).toBeGreaterThan(0);
    expect(screen.queryByText(es.translationLabels.clinically_reviewed)).not.toBeInTheDocument();
  });
});

describe('patient-facing wording', () => {
  it.each(['en', 'es'] as const)('study and preparation pages suggest no new medical tests (%s)', async (locale) => {
    const user = userEvent.setup();
    const trial = SAMPLE_TRIALS[0].trial;
    await openStudy(user);
    if (locale === 'es') {
      await user.click(screen.getByRole('button', { name: 'Español' }));
    }

    expect(findNewTestSuggestions(patientFacingText(trial))).toEqual([]);

    await user.click(screen.getByRole('button', { name: locale === 'es' ? es.prepareButton : en.prepareButton }));
    expect(findNewTestSuggestions(patientFacingText(trial))).toEqual([]);
  });
});
