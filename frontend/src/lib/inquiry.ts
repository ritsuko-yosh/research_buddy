import { messages, type Locale } from '../i18n/strings';
import type { LanguageRequirementStatus, Trial } from '../types/trial';

/**
 * Whether the coordinator message should include a language question.
 * Asked when the registry states a requirement, is unclear, or is silent,
 * and always for Spanish-speaking patients, since silence does not confirm support.
 */
export function needsLanguageQuestion(status: LanguageRequirementStatus, locale: Locale): boolean {
  return locale === 'es' || status !== 'none_stated';
}

/**
 * Deterministic coordinator message. It contains no medical details, makes no
 * claim that the patient is eligible or pre-screened, and is never sent automatically.
 */
export function buildCoordinatorInquiry(
  locale: Locale,
  trial: Pick<Trial, 'nctId' | 'languageRequirement'>,
): string {
  const m = messages[locale];
  const languageSentence = needsLanguageQuestion(trial.languageRequirement.status, locale)
    ? m.inquiryLanguageSentence
    : '';

  return m.inquiryBody({ nctId: trial.nctId, languageSentence });
}
