import { describe, expect, it } from 'vitest';
import type { LanguageRequirementStatus } from '../types/trial';
import { buildCoordinatorInquiry, needsLanguageQuestion } from './inquiry';
import type { Locale } from '../i18n/strings';

const STATUSES: LanguageRequirementStatus[] = ['english_required', 'none_stated', 'ambiguous', 'not_listed'];
const LOCALES: Locale[] = ['en', 'es'];

// Phrases that would present the patient as qualified, pre-screened, or scored.
const FORBIDDEN_PATTERN = /eligib|elegib|qualif|calific|pre-?screen|preselecc|you match|score/i;

function inquiryFor(locale: Locale, status: LanguageRequirementStatus): string {
  return buildCoordinatorInquiry(locale, {
    nctId: 'NCT90000001',
    languageRequirement: { status, sourceText: null },
  });
}

describe('buildCoordinatorInquiry', () => {
  it.each(LOCALES)('includes the NCT ID and never claims eligibility (%s)', (locale) => {
    for (const status of STATUSES) {
      const text = inquiryFor(locale, status);
      expect(text).toContain('NCT90000001');
      expect(text).not.toMatch(FORBIDDEN_PATTERN);
    }
  });

  it('asks about language support when the registry states an English requirement', () => {
    expect(inquiryFor('en', 'english_required')).toContain('language support');
  });

  it('omits the language question for English when the registry is silent and the patient did not choose Spanish', () => {
    expect(inquiryFor('en', 'none_stated')).not.toContain('language support');
  });

  it('asks about translated materials for Spanish-speaking patients even when the registry is silent', () => {
    expect(inquiryFor('es', 'none_stated')).toContain('intérpretes');
  });
});

describe('needsLanguageQuestion', () => {
  it('does not ask when the registry is silent and the locale is English', () => {
    expect(needsLanguageQuestion('none_stated', 'en')).toBe(false);
  });

  it('asks when the registry is ambiguous', () => {
    expect(needsLanguageQuestion('ambiguous', 'en')).toBe(true);
  });
});
