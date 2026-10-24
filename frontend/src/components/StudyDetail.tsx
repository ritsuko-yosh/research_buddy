import type { Locale, Messages } from '../i18n/strings';
import type { Trial } from '../types/trial';
import { LanguageNotice, RegistryNotice } from './Notices';
import { VerificationMap } from './VerificationMap';

interface StudyDetailProps {
  m: Messages;
  locale: Locale;
  trial: Trial;
  onBack: () => void;
  onPrepare: () => void;
}

export function StudyDetail({ m, locale, trial, onBack, onPrepare }: StudyDetailProps) {
  const massachusettsSites = trial.locations.filter((location) => location.state === 'Massachusetts');
  const descriptionInLocale = locale === 'es' ? trial.description.es : trial.description.en;
  const englishDescription = trial.description.en;
  const inclusion = trial.criteria.filter((criterion) => criterion.section === 'inclusion');
  const exclusion = trial.criteria.filter((criterion) => criterion.section === 'exclusion');

  return (
    <article className="card" aria-labelledby="study-title">
      <div className="no-print">
        <button type="button" className="link-button" onClick={onBack}>
          <span aria-hidden="true">← </span>
          {m.backToResults}
        </button>
      </div>

      <p className="nct">{trial.nctId}</p>
      <h1 id="study-title" tabIndex={-1}>
        {trial.title}
      </h1>

      <RegistryNotice m={m} locale={locale} trial={trial} />

      <section aria-labelledby="about-heading" style={{ marginTop: '1.25rem' }}>
        <h2 id="about-heading">{m.aboutHeading}</h2>
        {descriptionInLocale ? (
          <p lang={locale}>{descriptionInLocale}</p>
        ) : englishDescription && locale === 'es' ? (
          <>
            <p className="unavailable-note">{m.descriptionUnavailable}</p>
            <p lang="en">{englishDescription}</p>
          </>
        ) : (
          <p>{m.noDescription}</p>
        )}

        <h3>{m.massLocationsLabel}</h3>
        {massachusettsSites.length > 0 ? (
          <ul>
            {massachusettsSites.map((site) => (
              <li key={`${site.city}-${site.state}`}>{site.city}, MA</li>
            ))}
          </ul>
        ) : (
          <p>{m.noMassLocations}</p>
        )}
      </section>

      <div style={{ marginTop: '1.25rem' }}>
        <LanguageNotice m={m} requirement={trial.languageRequirement} />
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <VerificationMap m={m} locale={locale} criteria={trial.criteria} />
      </div>

      <details className="card-inner" style={{ marginTop: '1.5rem' }}>
        <summary>{m.registryCriteriaSummary(trial.criteria.length)}</summary>
        <h3>{m.inclusion}</h3>
        <ul>
          {inclusion.map((criterion) => (
            <li key={criterion.id} lang="en">
              {criterion.sourceText}
            </li>
          ))}
        </ul>
        <h3>{m.exclusion}</h3>
        <ul>
          {exclusion.map((criterion) => (
            <li key={criterion.id} lang="en">
              {criterion.sourceText}
            </li>
          ))}
        </ul>
      </details>

      <div className="cta" style={{ marginTop: '1.5rem' }}>
        <button type="button" className="button" onClick={onPrepare}>
          {m.prepareButton}
        </button>
      </div>
    </article>
  );
}
