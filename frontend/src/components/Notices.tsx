import type { Locale, Messages } from '../i18n/strings';
import { formatRegistryDate } from '../lib/format';
import type { LanguageRequirementStatus, Trial, TranslationStatus } from '../types/trial';

interface RegistryNoticeProps {
  m: Messages;
  locale: Locale;
  trial: Trial;
}

/** Recruitment status, registry update date, and where the data came from. */
export function RegistryNotice({ m, locale, trial }: RegistryNoticeProps) {
  const originText =
    trial.dataOrigin === 'live' ? m.originLive : trial.dataOrigin === 'cached' ? m.originCached : m.originSample;

  return (
    <section
      className={`notice ${trial.dataOrigin === 'sample' ? 'warn' : 'info'}`}
      aria-labelledby="registry-heading"
    >
      <h2 id="registry-heading">{m.registryHeading}</h2>
      <dl>
        <dt>{m.statusLabel}</dt>
        <dd>{m.statusLabels[trial.recruitmentStatus]}</dd>
        <dt>{m.lastUpdatedLabel}</dt>
        <dd>{formatRegistryDate(trial.registryUpdateDate, locale, m.dateNotListed)}</dd>
        <dt>{m.retrievedLabel}</dt>
        <dd>{formatRegistryDate(trial.dataRetrievedAt, locale, m.dateNotListed)}</dd>
        <dt>{m.originLabel}</dt>
        <dd>{originText}</dd>
      </dl>
      <p>{m.statusNote}</p>
    </section>
  );
}

interface LanguageNoticeProps {
  m: Messages;
  requirement: Trial['languageRequirement'];
}

function languageText(m: Messages, status: LanguageRequirementStatus): string {
  const texts: Record<LanguageRequirementStatus, string> = {
    english_required: m.langEnglishRequired,
    none_stated: m.langNoneStated,
    ambiguous: m.langAmbiguous,
    not_listed: m.langNotListed,
  };
  return texts[status];
}

/**
 * Describes what the registry says about language. It never implies that
 * Spanish-language participation is available.
 */
export function LanguageNotice({ m, requirement }: LanguageNoticeProps) {
  const needsAttention = requirement.status === 'english_required' || requirement.status === 'ambiguous';

  return (
    <section className={`notice ${needsAttention ? 'warn' : 'info'}`} aria-labelledby="language-heading">
      <h2 id="language-heading">{m.languageHeading}</h2>
      <p>{languageText(m, requirement.status)}</p>
      {requirement.sourceText && (
        <>
          <p className="help">{m.registryWording}</p>
          <blockquote lang="en">{requirement.sourceText}</blockquote>
        </>
      )}
    </section>
  );
}

interface TranslationBadgeProps {
  m: Messages;
  status: TranslationStatus;
}

/** Labels translated text honestly. "Clinically reviewed" appears only when the backend says so. */
export function TranslationBadge({ m, status }: TranslationBadgeProps) {
  if (status === 'source') {
    return null;
  }

  const variant: Record<Exclude<TranslationStatus, 'source'>, string> = {
    machine_drafted_unreviewed: 'machine',
    language_reviewed: 'language',
    clinically_reviewed: 'clinical',
    unavailable: 'unavailable',
  };

  return <p className={`badge ${variant[status]}`}>{m.translationLabels[status]}</p>;
}
