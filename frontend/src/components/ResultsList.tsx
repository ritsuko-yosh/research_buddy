import type { CSSProperties } from 'react';
import type { Locale, Messages } from '../i18n/strings';
import { formatRegistryDate } from '../lib/format';
import type { TrialSummary } from '../types/trial';
import { SearchLoaderArt } from './art/SearchLoaderArt';

export type ResultsState =
  | { status: 'idle' }
  | { status: 'loading'; term: string }
  | { status: 'error'; term: string }
  | { status: 'ready'; term: string; items: TrialSummary[] };

interface ResultsListProps {
  m: Messages;
  locale: Locale;
  results: ResultsState;
  onOpenStudy: (nctId: string) => void;
  onRetry: () => void;
}

export function ResultsList({ m, locale, results, onOpenStudy, onRetry }: ResultsListProps) {
  if (results.status === 'idle') {
    return null;
  }

  return (
    <section id="search-results" className="card" aria-labelledby="results-heading">
      <h2 id="results-heading" tabIndex={-1}>
        {m.resultsHeading}
      </h2>

      {results.status === 'loading' && (
        <div className="od-loader" aria-busy="true">
          <SearchLoaderArt />
          <p className="od-loader-text">{m.searchingFor(results.term)}</p>
          {/* Announces the state once for screen reader users. The picture above is decorative. */}
          <p role="status" className="sr-only">
            {m.resultsLoading}
          </p>
        </div>
      )}

      {results.status === 'error' && (
        <p role="alert">
          {m.resultsError}{' '}
          <button type="button" className="link-button" onClick={onRetry}>
            {m.retry}
          </button>
        </p>
      )}

      {results.status === 'ready' && results.items.length === 0 && <p role="status">{m.resultsEmpty}</p>}

      {results.status === 'ready' && results.items.length > 0 && (
        <>
          <p role="status" className="sr-only">
            {m.resultsFound(results.items.length)}
          </p>
          <p className="help" role="note">
            {m.resultsLiveNote}
          </p>
          <ul className="study-grid">
            {results.items.map((item, position) => {
              const massachusettsSites = item.locations
                .filter((location) => location.state === 'Massachusetts')
                .map((location) => location.city);

              return (
                <li key={item.nctId} style={{ '--i': position } as CSSProperties}>
                  <article className="study-card" aria-labelledby={`title-${item.nctId}`}>
                    <p className="nct">{item.nctId}</p>
                    <h3 id={`title-${item.nctId}`}>{item.title}</h3>
                    <dl>
                      <dt>{m.statusLabel}</dt>
                      <dd>{m.statusLabels[item.recruitmentStatus]}</dd>
                      <dt>{m.massLocationsLabel}</dt>
                      <dd>{massachusettsSites.length > 0 ? massachusettsSites.join(', ') : m.noMassLocations}</dd>
                      <dt>{m.lastUpdatedLabel}</dt>
                      <dd>{formatRegistryDate(item.registryUpdateDate, locale, m.dateNotListed)}</dd>
                    </dl>
                    <div>
                      <button
                        type="button"
                        className="button secondary"
                        aria-label={`${m.viewStudy}: ${item.title}`}
                        onClick={() => onOpenStudy(item.nctId)}
                      >
                        {m.viewStudy}
                      </button>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
