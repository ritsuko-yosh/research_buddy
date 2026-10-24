import { useCallback, useEffect, useRef, useState } from 'react';
import { dataSource as defaultDataSource } from './data/adapter';
import { messages, type Locale } from './i18n/strings';
import { normalizeNctId } from './lib/nctId';
import type { Trial, TrialDataSource } from './types/trial';
import { LanguageToggle } from './components/LanguageToggle';
import { PreparationCard } from './components/PreparationCard';
import { ResultsList, type ResultsState } from './components/ResultsList';
import { SearchPanel, type NctFormState } from './components/SearchPanel';
import { StudyDetail } from './components/StudyDetail';

type View =
  | { name: 'search' }
  | { name: 'study'; trial: Trial }
  | { name: 'prepare'; trial: Trial };

interface AppProps {
  dataSource?: TrialDataSource;
}

export default function App({ dataSource = defaultDataSource }: AppProps) {
  const [locale, setLocale] = useState<Locale>('en');
  const [view, setView] = useState<View>({ name: 'search' });
  const [results, setResults] = useState<ResultsState>({ status: 'idle' });
  const [nctState, setNctState] = useState<NctFormState>({ status: 'idle' });
  const mainRef = useRef<HTMLElement>(null);
  const isFirstView = useRef(true);
  const m = messages[locale];

  // Keep the document language in sync so screen readers pronounce content correctly.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // Move focus to the new step's heading so keyboard and screen reader users land in the right place.
  useEffect(() => {
    if (isFirstView.current) {
      isFirstView.current = false;
      return;
    }
    const heading = mainRef.current?.querySelector<HTMLElement>('h1');
    (heading ?? mainRef.current)?.focus();
  }, [view]);

  const runSearch = useCallback(
    async (conditionId: string) => {
      setResults({ status: 'loading', conditionId });
      try {
        const items = await dataSource.searchByCondition(conditionId);
        setResults({ status: 'ready', conditionId, items });
      } catch {
        setResults({ status: 'error', conditionId });
      }
    },
    [dataSource],
  );

  const openStudy = useCallback(
    async (rawNctId: string) => {
      const nctId = normalizeNctId(rawNctId);
      if (!nctId) {
        setNctState({ status: 'invalid' });
        return;
      }

      setNctState({ status: 'loading' });
      try {
        const trial = await dataSource.getTrial(nctId);
        if (!trial) {
          setNctState({ status: 'unsupported' });
          return;
        }
        setNctState({ status: 'idle' });
        setView({ name: 'study', trial });
      } catch {
        setNctState({ status: 'error' });
      }
    },
    [dataSource],
  );

  return (
    <>
      <a className="skip-link" href="#main">
        {m.skipToContent}
      </a>

      <header className="site-header no-print">
        <div>
          <p className="app-name">{m.appName}</p>
          <p className="tagline">{m.tagline}</p>
        </div>
        <LanguageToggle locale={locale} label={m.languageLabel} onChange={setLocale} />
      </header>

      <main id="main" ref={mainRef} tabIndex={-1}>
        <p className="disclaimer no-print">{m.disclaimer}</p>

        {view.name === 'search' && (
          <>
            <SearchPanel
              m={m}
              locale={locale}
              nctState={nctState}
              onSelectCondition={(conditionId) => {
                void runSearch(conditionId);
              }}
              onSubmitNct={(rawNctId) => {
                void openStudy(rawNctId);
              }}
            />
            <ResultsList
              m={m}
              locale={locale}
              results={results}
              onOpenStudy={(nctId) => {
                void openStudy(nctId);
              }}
              onRetry={() => {
                if (results.status !== 'idle') {
                  void runSearch(results.conditionId);
                }
              }}
            />
          </>
        )}

        {view.name === 'study' && (
          <StudyDetail
            m={m}
            locale={locale}
            trial={view.trial}
            onBack={() => setView({ name: 'search' })}
            onPrepare={() => setView({ name: 'prepare', trial: view.trial })}
          />
        )}

        {view.name === 'prepare' && (
          <PreparationCard
            m={m}
            locale={locale}
            trial={view.trial}
            onBack={() => setView({ name: 'study', trial: view.trial })}
          />
        )}
      </main>

      <footer className="no-print">{m.footer}</footer>
    </>
  );
}
