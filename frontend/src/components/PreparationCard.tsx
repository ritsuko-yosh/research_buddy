import { useState } from 'react';
import type { Locale, Messages } from '../i18n/strings';
import { buildCoordinatorInquiry, needsLanguageQuestion } from '../lib/inquiry';
import { groupByCategory } from '../lib/verificationMap';
import type { Criterion, Trial } from '../types/trial';
import { LanguageNotice } from './Notices';

interface PreparationCardProps {
  m: Messages;
  locale: Locale;
  trial: Trial;
  onBack: () => void;
}

interface PrepItemProps {
  m: Messages;
  locale: Locale;
  criterion: Criterion;
  checkLabel: string;
  checked: boolean;
  onToggle: () => void;
}

function PrepItem({ m, locale, criterion, checkLabel, checked, onToggle }: PrepItemProps) {
  const plain = locale === 'es' ? criterion.plainExplanation.es : criterion.plainExplanation.en;
  const itemText = plain ?? criterion.sourceText;
  return (
    <li>
      {plain && <p lang={locale}>{plain}</p>}
      <p className="help" lang="en">
        {m.registryWording}: {criterion.sourceText}
      </p>
      <label className="check-row">
        <input type="checkbox" checked={checked} onChange={onToggle} aria-label={`${checkLabel}: ${itemText}`} />
        <span>{checkLabel}</span>
      </label>
    </li>
  );
}

/** Printable, copyable preparation card. Shows only what the registry and patient supplied. */
export function PreparationCard({ m, locale, trial, onBack }: PreparationCardProps) {
  const [copyStatus, setCopyStatus] = useState('');
  // Checkbox state lives only in this session. Nothing is saved or sent.
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setChecked((previous) => ({ ...previous, [id]: !previous[id] }));
  const groups = groupByCategory(trial.criteria);
  const gather = [...groups.self_answer, ...groups.check_records];
  const ask = [...groups.ask_study_team, ...groups.cannot_assess];
  const askLanguage = needsLanguageQuestion(trial.languageRequirement.status, locale);
  const inquiry = buildCoordinatorInquiry(locale, trial);

  const copyInquiry = async () => {
    try {
      await navigator.clipboard.writeText(inquiry);
      setCopyStatus(m.copied);
    } catch {
      setCopyStatus(m.copyFailed);
    }
  };

  return (
    <article className="card" aria-labelledby="prep-heading">
      <div className="no-print">
        <button type="button" className="link-button" onClick={onBack}>
          <span aria-hidden="true">← </span>
          {m.backToStudy}
        </button>
      </div>

      <h1 id="prep-heading" tabIndex={-1}>
        {m.prepHeading}
      </h1>
      <p className="help">{m.prepIntro}</p>
      <p>
        <strong>{m.prepStudyLabel}:</strong> {trial.title} <span className="nct">({trial.nctId})</span>
      </p>

      <section className="prep-section" aria-labelledby="prep-gather">
        <h2 id="prep-gather">{m.prepGatherHeading}</h2>
        {gather.length === 0 ? (
          <p>{m.prepNone}</p>
        ) : (
          <ul>
            {gather.map((criterion) => (
              <PrepItem
                key={criterion.id}
                m={m}
                locale={locale}
                criterion={criterion}
                checkLabel={m.markGathered}
                checked={!!checked[criterion.id]}
                onToggle={() => toggle(criterion.id)}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="prep-section" aria-labelledby="prep-ask">
        <h2 id="prep-ask">{m.prepAskHeading}</h2>
        {ask.length === 0 ? (
          <p>{m.prepNone}</p>
        ) : (
          <ul>
            {ask.map((criterion) => (
              <PrepItem
                key={criterion.id}
                m={m}
                locale={locale}
                criterion={criterion}
                checkLabel={m.markAsked}
                checked={!!checked[criterion.id]}
                onToggle={() => toggle(criterion.id)}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="prep-section" aria-labelledby="prep-language">
        <h2 id="prep-language">{m.prepLanguageHeading}</h2>
        <LanguageNotice m={m} requirement={trial.languageRequirement} />
        <p className="notice warn" role="note" style={{ marginTop: '0.75rem' }}>
          {m.languageSupportCaveat}
        </p>
        {askLanguage && (
          <ul>
            <li>{m.languageQuestion}</li>
          </ul>
        )}
      </section>

      <section className="prep-section" aria-labelledby="prep-contact">
        <h2 id="prep-contact">{m.prepContactHeading}</h2>
        {trial.contacts.length === 0 ? (
          <p>{m.contactNotListed}</p>
        ) : (
          <ul>
            {trial.contacts.map((contact, index) => {
              const details = [contact.name, contact.phone, contact.email].filter(Boolean).join(' · ');
              return <li key={index}>{details}</li>;
            })}
          </ul>
        )}
        <p>
          <a href={trial.sourceUrl} target="_blank" rel="noopener noreferrer">
            {m.viewRegistry}
          </a>
        </p>
      </section>

      <section className="prep-section" aria-labelledby="prep-inquiry">
        <h2 id="prep-inquiry">{m.inquiryHeading}</h2>
        <p className="help">{m.inquiryHint}</p>
        <textarea
          id="prep-inquiry-text"
          className="inquiry"
          readOnly
          rows={6}
          value={inquiry}
          aria-label={m.inquiryHeading}
        />
        <div className="actions no-print">
          <button type="button" className="button" onClick={copyInquiry}>
            {m.copyInquiry}
          </button>
          <button type="button" className="button secondary" onClick={() => window.print()}>
            {m.printCard}
          </button>
        </div>
        <p role="status" aria-live="polite" className="status-msg">
          {copyStatus}
        </p>
      </section>

      <p className="notice warn" style={{ marginTop: '1.25rem' }}>
        {m.prepReminder}
      </p>
    </article>
  );
}
