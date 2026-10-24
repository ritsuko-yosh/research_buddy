import { useCallback, useEffect, useRef, useState } from 'react';
import { dataSource as defaultDataSource } from './data/adapter';
import { messages, type Locale } from './i18n/strings';
import { normalizeNctId } from './lib/nctId';
import { presetTerms, type TopicIndex } from './lib/topicIndex';
import { loadTopicIndex } from './data/topicIndexSource';
import type { Trial, TrialDataSource } from './types/trial';
import { BrandMark } from './components/BrandMark';
import { HomePage } from './components/home/HomePage';
import { LanguageToggle } from './components/LanguageToggle';
import { NavBar, type Page } from './components/NavBar';
import { HomeHero, type SearchTarget } from './components/home/HomeHero';
import { AboutPage } from './components/pages/AboutPage';
import { PreparationCard } from './components/PreparationCard';
import { ResultsList, type ResultsState } from './components/ResultsList';
import { SearchPanel, type NctFormState } from './components/SearchPanel';
import { StudyDetail } from './components/StudyDetail';

type View =
  | { name: 'search' }
  | { name: 'study'; trial: Trial }
  | { name: 'prepare'; trial: Trial };

const PAGES: readonly Page[] = ['home', 'search', 'about'];

/**
 * Read the current page from the URL hash (#/home, #/search, #/about).
 * With no (or unknown) hash we default to 'home' — the landing page — so first
 * visits get the welcome and overview. Search/About are reachable via the nav
 * and their own hashes.
 */
function pageFromHash(): Page {
  const raw = (window.location.hash || '').replace(/^#\/?/, '').toLowerCase();
  return (PAGES as readonly string[]).includes(raw) ? (raw as Page) : 'home';
}

interface AppProps {
  /** Production uses the live ClinicalTrials.gov adapter. Tests inject fixtures explicitly. */
  dataSource?: TrialDataSource;
  /** Production reads the committed topic file. Tests inject a labeled test index. Pass null for the unavailable state. */
  topicIndex?: TopicIndex | null;
}

const defaultTopicIndex = loadTopicIndex();

export default function App({ dataSource = defaultDataSource, topicIndex = defaultTopicIndex }: AppProps) {
  const [locale, setLocale] = useState<Locale>('en');
  const [page, setPage] = useState<Page>(() =>
    typeof window !== 'undefined' ? pageFromHash() : 'home',
  );
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

  // Keep page state in sync with the URL hash (back/forward, deep links).
  useEffect(() => {
    const onHashChange = () => setPage(pageFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Navigate to a top-level page and reflect it in the hash.
  const navigate = useCallback((next: Page) => {
    setPage(next);
    if (next === 'search') setView({ name: 'search' });
    if (window.location.hash !== `#/${next}`) window.location.hash = `#/${next}`;
    window.scrollTo?.(0, 0);
  }, []);

  // From the Home hero doors: go to the Search page, then focus/scroll to the
  // hinted area (condition field, NCT field, or the browse garden) once it renders.
  const goToSearch = useCallback(
    (target?: SearchTarget) => {
      navigate('search');
      const targetId =
        target === 'condition'
          ? 'condition-input'
          : target === 'nct'
            ? 'nct-input'
            : target === 'garden'
              ? 'garden-heading'
              : null;
      if (targetId) {
        window.setTimeout(() => {
          const el = document.getElementById(targetId);
          el?.scrollIntoView?.({ block: 'center' });
          el?.focus?.({ preventScroll: true });
        }, 0);
      }
    },
    [navigate],
  );

  // Move focus to the new step's heading so keyboard and screen reader users land in the right place.
  useEffect(() => {
    if (isFirstView.current) {
      isFirstView.current = false;
      return;
    }
    const heading = mainRef.current?.querySelector<HTMLElement>('h1');
    (heading ?? mainRef.current)?.focus();
  }, [view, page]);

  const runSearch = useCallback(
    async (term: string) => {
      setResults({ status: 'loading', term });
      try {
        const items = await dataSource.searchByCondition(term);
        setResults({ status: 'ready', term, items });
      } catch {
        setResults({ status: 'error', term });
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
        <div className="brand">
          <BrandMark />
          <div>
            <p className="app-name">{m.appName}</p>
            <p className="brand-subtitle">{m.brandSubtitle}</p>
          </div>
        </div>
        <LanguageToggle locale={locale} label={m.languageLabel} onChange={setLocale} />
      </header>

      <NavBar m={m} current={page} onNavigate={navigate} />

      <main
        id="main"
        ref={mainRef}
        tabIndex={-1}
        className={page === 'search' && view.name === 'search' ? 'od-main-home' : undefined}
      >
        <p className="disclaimer no-print">{m.disclaimer}</p>
        {locale === 'es' && (
          <p className="notice warn" role="note">
            {m.esInterfaceNotice}
          </p>
        )}

        {page === 'home' && <HomeHero m={m} onGoToSearch={goToSearch} />}

        {page === 'about' && <AboutPage m={m} />}

        {page === 'search' && view.name === 'search' && (
          <HomePage
            m={m}
            locale={locale}
            index={topicIndex}
            onSearchTerm={(term) => {
              void runSearch(term);
              // Move the reader from the garden to the results once they render.
              window.setTimeout(() => {
                document.getElementById('results-heading')?.scrollIntoView?.({ block: 'start' });
              }, 0);
            }}
          >
            <SearchPanel
              m={m}
              nctState={nctState}
              presets={topicIndex ? presetTerms(topicIndex) : []}
              onSearch={(term) => {
                void runSearch(term);
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
                  void runSearch(results.term);
                }
              }}
            />
          </HomePage>
        )}

        {page === 'search' && view.name === 'study' && (
          <StudyDetail
            m={m}
            locale={locale}
            trial={view.trial}
            onBack={() => setView({ name: 'search' })}
            onPrepare={() => setView({ name: 'prepare', trial: view.trial })}
          />
        )}

        {page === 'search' && view.name === 'prepare' && (
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
