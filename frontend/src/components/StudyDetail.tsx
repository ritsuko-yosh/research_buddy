import { useEffect, useState } from 'react';
import type { Locale, Messages } from '../i18n/strings';
import { groupBySection, sectionLabel, type SectionGroup } from '../lib/sections';
import { fetchPlainLanguageSummary, isSummaryEnabled } from '../lib/summary';
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

  // Plain-language summary of the study description. Two sources, in order:
  //  1. A CURATED summary shipped with the study (free, reliable, no network) —
  //     used for the demo studies.
  //  2. Otherwise, an optional live AI summary (if an endpoint is configured).
  // Either way it is ADDITIVE: the original registry description is always still
  // shown (in a dropdown when a summary is present), and the summary is labeled
  // as drafted/unreviewed.
  const curated = trial.plainLanguageSummary ?? null;
  const curatedSummary = curated ? (locale === 'es' ? curated.es : curated.en) : null;

  const summarySource = trial.description.en; // text the live AI would summarize
  const [liveSummary, setLiveSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // The summary shown: curated wins; live AI is the fallback when no curated one.
  const summary = curatedSummary ?? liveSummary;

  useEffect(() => {
    let cancelled = false;
    setLiveSummary(null);
    setSummaryLoading(false);
    // Skip the network entirely when a curated summary is available.
    if (curatedSummary) return;
    if (!isSummaryEnabled() || !summarySource) return;
    setSummaryLoading(true);
    fetchPlainLanguageSummary(summarySource, locale)
      .then((result) => {
        if (!cancelled) setLiveSummary(result);
      })
      .finally(() => {
        if (!cancelled) setSummaryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [curatedSummary, summarySource, locale]);

  // Renders the ORIGINAL registry description with the existing locale fallback.
  function renderDescription() {
    if (descriptionInLocale) {
      return <p lang={locale}>{descriptionInLocale}</p>;
    }
    if (englishDescription && locale === 'es') {
      return (
        <>
          <p className="unavailable-note">{m.descriptionUnavailable}</p>
          <p lang="en">{englishDescription}</p>
        </>
      );
    }
    if (englishDescription) {
      return <p lang="en">{englishDescription}</p>;
    }
    return <p>{m.noDescription}</p>;
  }

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

        {/* Plain-language summary (curated or AI), additive and clearly labeled. */}
        {summaryLoading && <p className="help" role="status">{m.aiSummaryLoading}</p>}
        {summary && (
          <div className="ai-summary">
            <h3>{m.aiSummaryHeading}</h3>
            <p lang={locale}>{summary}</p>
            <p className={curated?.reviewed ? 'badge' : 'badge machine'} role="note">
              {curated
                ? curated.reviewed
                  ? m.summaryReviewedNote
                  : m.summaryDraftedDisclaimer
                : m.aiSummaryDisclaimer}
            </p>
          </div>
        )}

        {/* Original registry description — always preserved. In a dropdown when
            an AI summary is present, otherwise shown directly. */}
        {descriptionInLocale || (englishDescription && locale === 'es') || englishDescription ? (
          summary ? (
            <details className="card-inner" style={{ marginTop: '0.75rem' }}>
              <summary>{m.fullDescriptionToggle}</summary>
              {renderDescription()}
            </details>
          ) : (
            renderDescription()
          )
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
