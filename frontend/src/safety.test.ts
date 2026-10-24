import { describe, expect, it } from 'vitest';
import { SAMPLE_TRIALS } from './data/fixtures/sampleTrials';
import { messages, type Locale } from './i18n/strings';
import { groupBySection, sectionGroup, sectionLabel } from './lib/sections';
import type { Criterion } from './types/trial';
import { collectStrings, findNewTestSuggestions } from './test/wording';

const LOCALES: Locale[] = ['en', 'es'];

function makeCriterion(id: string, section: string): Criterion {
  return {
    id,
    section: section as Criterion['section'],
    sourceText: `Registry text ${id}`,
    sourceRef: `ref ${id}`,
    category: 'cannot_assess',
    plainExplanation: { en: null, es: null },
    spanishTranslationStatus: 'unavailable',
    uncertaintyNotes: [],
  };
}

describe('section handling', () => {
  it.each([
    ['inclusion', 'inclusion'],
    ['exclusion', 'exclusion'],
    ['unspecified', 'unspecified'],
    ['some_future_value', 'unspecified'],
    ['', 'unspecified'],
  ])('maps section %j to group %s', (section, expected) => {
    expect(sectionGroup(section)).toBe(expected);
  });

  it.each(LOCALES)('never labels an unspecified or unknown section as an exclusion (%s)', (locale) => {
    const m = messages[locale];
    for (const section of ['unspecified', 'some_future_value', '']) {
      expect(sectionLabel(section, m)).toBe(m.sectionUnspecified);
      expect(sectionLabel(section, m)).not.toBe(m.exclusion);
    }
  });

  it('keeps every criterion, including unspecified ones, in exactly one group', () => {
    const criteria = [
      makeCriterion('a', 'inclusion'),
      makeCriterion('b', 'exclusion'),
      makeCriterion('c', 'unspecified'),
      makeCriterion('d', 'unknown_value'),
      makeCriterion('e', 'exclusion'),
    ];

    const groups = groupBySection(criteria);
    const ids = [...groups.inclusion, ...groups.exclusion, ...groups.unspecified].map((c) => c.id).sort();

    expect(ids).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(groups.unspecified.map((c) => c.id).sort()).toEqual(['c', 'd']);
  });

  it('sample trial A keeps every criterion when grouped', () => {
    const trial = SAMPLE_TRIALS[0].trial;
    const groups = groupBySection(trial.criteria);
    const total = groups.inclusion.length + groups.exclusion.length + groups.unspecified.length;

    expect(total).toBe(trial.criteria.length);
  });
});

describe('new-test wording rules', () => {
  it('detects known problem phrasing, so the check is not vacuous', () => {
    expect(findNewTestSuggestions('A breathing test result from the past year may be needed.')).not.toEqual([]);
    expect(findNewTestSuggestions('A recent blood pressure reading may need to be below a limit.')).not.toEqual([]);
    expect(findNewTestSuggestions('Please get a new test before you ask.')).not.toEqual([]);
    expect(findNewTestSuggestions('Puede que se necesite una prueba de función renal.')).not.toEqual([]);
    expect(findNewTestSuggestions('Obtener una nueva prueba de laboratorio.')).not.toEqual([]);
  });

  it('accepts wording that asks about results the patient already has', () => {
    expect(
      findNewTestSuggestions('If you already have a recent blood sugar result, the study team may ask about it.'),
    ).toEqual([]);
    expect(
      findNewTestSuggestions('Si ya tiene un resultado reciente de azúcar en sangre, el equipo del estudio puede preguntar.'),
    ).toEqual([]);
  });

  it.each(LOCALES)('interface text in %s never suggests a new test', (locale) => {
    const strings = collectStrings(messages[locale]);
    const hits = strings.flatMap((text) => findNewTestSuggestions(text));
    expect(hits).toEqual([]);
  });

  it('sample plain-language explanations never suggest a new test', () => {
    for (const entry of SAMPLE_TRIALS) {
      for (const criterion of entry.trial.criteria) {
        for (const text of [criterion.plainExplanation.en, criterion.plainExplanation.es]) {
          if (text) {
            expect(findNewTestSuggestions(text), `${entry.trial.nctId} ${criterion.id}`).toEqual([]);
          }
        }
      }
    }
  });
});

describe('language support caveat', () => {
  it('states that a Spanish interface does not mean study support, in both languages', () => {
    expect(messages.en.languageSupportCaveat).toMatch(/does not mean/i);
    expect(messages.en.languageSupportCaveat).toMatch(/Spanish-language participation/);
    expect(messages.es.languageSupportCaveat).toMatch(/no significa/i);
    expect(messages.es.languageSupportCaveat).toMatch(/participación en español/);
  });

  it('marks the Spanish interface as machine-drafted and unreviewed', () => {
    expect(messages.es.esInterfaceNotice).toMatch(/máquina/);
    expect(messages.es.esInterfaceNotice).toMatch(/no ha sido revisado/);
  });
});
