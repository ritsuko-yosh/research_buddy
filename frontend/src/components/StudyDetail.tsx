import type { Locale, Messages } from '../i18n/strings';
import { groupBySection, sectionLabel, type SectionGroup } from '../lib/sections';
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

const GROUP_ORDER: readonly SectionGroup[] = ['inclusion', 'exclusion', 'unspecified'];

export function StudyDetail({ m, locale, trial, onBack, onPrepare }: StudyDetailProps) {
  const massachusettsSites = trial.locations.filter((location) => location.state === 'Massachusetts');
  const descriptionInLocale = locale === 'es' ? trial.description.es : trial.description.en;
  const englishDescription = trial.description.en;
  const groups = groupBySection(trial.criteria);

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
            {massachusettsSites.map((site, index) => (
              // Index key: several sites can share a city, so city and state are not unique.
              <li key={index}>{site.city}, MA</li>
            ))}
          </ul>
        ) : (
          <p>{m.noMassLocations}</p>
        )}
      </section>

      <div style={{ marginTop: '1.25rem' }}>
        <LanguageNotice m={m} requirement={trial.languageRequirement} />
        <p className="notice warn" role="note" style={{ marginTop: '0.75rem' }}>
          {m.languageSupportCaveat}
        </p>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <VerificationMap m={m} locale={locale} criteria={trial.criteria} />
      </div>

      <details className="card-inner" style={{ marginTop: '1.5rem' }}>
        <summary>{m.registryCriteriaSummary(trial.criteria.length)}</summary>
        {GROUP_ORDER.map((group) =>
          groups[group].length > 0 ? (
            <section key={group}>
              <h3>{sectionLabel(group, m)}</h3>
              <ul>
                {groups[group].map((criterion) => (
                  <li key={criterion.id} lang="en">
                    {criterion.sourceText}{' '}
                    <span className="help">
                      ({m.sourceRef}: {criterion.sourceRef})
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null,
        )}
      </details>

      <div className="cta" style={{ marginTop: '1.5rem' }}>
        <button type="button" className="button" onClick={onPrepare}>
          {m.prepareButton}
        </button>
      </div>
    </article>
  );
}
