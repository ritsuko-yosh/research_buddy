import { useCallback, useEffect, useRef, useState } from 'react';
import { dataSource as defaultDataSource } from './data/adapter';
import { messages, type Locale } from './i18n/strings';
import { normalizeNctId } from './lib/nctId';
import { presetTerms, type TopicIndex } from './lib/topicIndex';
import { loadTopicIndex } from './data/topicIndexSource';
import { prefersReducedMotion, readAnimationPaused, waitForMinimumLoader, writeAnimationPaused } from './lib/motion';
import type { Trial, TrialDataSource } from './types/trial';
import { SiteHeader } from './components/SiteHeader';
import { HomePage, type DoorAction } from './components/home/HomePage';
import { PreparationCard } from './components/PreparationCard';
import { ResultsList, type ResultsState } from './components/ResultsList';
import { SearchPanel, type NctFormState, type SearchTab } from './components/SearchPanel';
import { StudyDetail } from './components/StudyDetail';

type View =
  | { name: 'home' }
  | { name: 'search' }
  | { name: 'study'; trial: Trial }
  | { name: 'prepare'; trial: Trial };

/** The search dialog is open on a tab, with the condition text to show in it. */
interface DialogState {
  tab: SearchTab;
  term: string;
}

interface AppProps {
  /** Production uses the live ClinicalTrials.gov adapter. Tests inject fixtures explicitly. */
  dataSource?: TrialDataSource;
  /** Production reads the committed topic file. Tests inject a labeled test index. Pass null for the unavailable state. */
  topicIndex?: TopicIndex | null;
}

const defaultTopicIndex = loadTopicIndex();

/** Homepage section each anchor scrolls to. Each target is a heading, so focus can move there too. */
const ANCHOR_HEADINGS = {
  explore: 'garden-heading',
  how: 'how-heading',
  explainer: 'explainer-heading',
} as const;
type Anchor = keyof typeof ANCHOR_HEADINGS;

/** Scrolls to a homepage heading and focuses it. Smooth scrolling is skipped for reduced motion. */
function scrollToAnchor(anchor: Anchor) {
  const element = document.getElementById(ANCHOR_HEADINGS[anchor]);
  if (!element) {
    return;
  }
  element.scrollIntoView?.({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  element.focus({ preventScroll: true });
}

export default function App({ dataSource = defaultDataSource, topicIndex = defaultTopicIndex }: AppProps) {
  const [locale, setLocale] = useState<Locale>('en');
  const [view, setView] = useState<View>({ name: 'home' });
  const [results, setResults] = useState<ResultsState>({ status: 'idle' });
  const [nctState, setNctState] = useState<NctFormState>({ status: 'idle' });
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [animationPaused, setAnimationPaused] = useState<boolean>(readAnimationPaused);
  const mainRef = useRef<HTMLElement>(null);
  const isFirstView = useRef(true);
  const pendingAnchor = useRef<Anchor | null>(null);
  const searchCounter = useRef(0);
  const previousStatus = useRef<ResultsState['status']>('idle');
  const m = messages[locale];

  // Keep the document language in sync so screen readers pronounce content correctly.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // Remember the Pause Animation choice across visits. Storage failures are handled in motion.ts.
  useEffect(() => {
    writeAnimationPaused(animationPaused);
  }, [animationPaused]);

  // Each view starts at the top. When the view changes, focus its first heading so keyboard and screen reader users land on it.
  useEffect(() => {
    if (isFirstView.current) {
      isFirstView.current = false;
      return;
    }
    const anchor = pendingAnchor.current;
    pendingAnchor.current = null;
    if (anchor) {
      scrollToAnchor(anchor);
      return;
    }
    const heading = mainRef.current?.querySelector<HTMLElement>('h1');
    if (heading) {
      heading.focus();
    } else {
      window.scrollTo?.({ top: 0 });
      mainRef.current?.focus({ preventScroll: true });
    }
  }, [view]);

  // When a search finishes or starts on the results view, focus the results title.
  useEffect(() => {
    const previous = previousStatus.current;
    previousStatus.current = results.status;
    if (previous === results.status || view.name !== 'search') {
      return;
    }
    document.getElementById('search-title')?.focus();
  }, [results.status, view.name]);

  /** Goes to the homepage. An anchor scrolls to that section. */
  const goHome = useCallback(
    (anchor?: Anchor) => {
      if (view.name === 'home') {
        if (anchor) {
          scrollToAnchor(anchor);
        } else {
          window.scrollTo?.({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
        }
        return;
      }
      pendingAnchor.current = anchor ?? null;
      setView({ name: 'home' });
    },
    [view.name],
  );

  const openDialog = useCallback(
    (tab: SearchTab) => {
      const term = results.status === 'idle' ? '' : results.term;
      setDialog({ tab, term });
    },
    [results],
  );

  const closeDialog = useCallback(() => setDialog(null), []);

  /**
   * Runs the real condition search. A search started from the dialog stays
   * there with the loader until results arrive. A search started elsewhere
   * opens the results view straight away.
   */
  const runSearch = useCallback(
    async (term: string, navigateNow: boolean) => {
      // Only the newest search may update the results. An older response that arrives late is ignored.
      const requestId = ++searchCounter.current;
      const startedAt = Date.now();
      setResults({ status: 'loading', term });
      if (navigateNow) {
        setView({ name: 'search' });
      }
      let next: ResultsState;
      try {
        const items = await dataSource.searchByCondition(term);
        next = { status: 'ready', term, items };
      } catch {
        next = { status: 'error', term };
      }
      // The real response is shown as soon as the minimum loader time has passed. Nothing is faked.
      await waitForMinimumLoader(startedAt);
      if (requestId === searchCounter.current) {
        setResults(next);
        setDialog(null);
        setView({ name: 'search' });
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
        setDialog(null);
        setView({ name: 'study', trial });
      } catch {
        setNctState({ status: 'error' });
      }
    },
    [dataSource],
  );

  const handleDoor = (action: DoorAction) => {
    if (action === 'explainer') {
      scrollToAnchor('explainer');
    } else if (action === 'garden') {
      scrollToAnchor('explore');
    } else {
      openDialog(action === 'study-id' ? 'nct' : 'condition');
    }
  };

  const showStudy = (trial: Trial) => setView({ name: 'study', trial });

  return (
    <>
      <a className="skip-link" href="#main">
        {m.skipToContent}
      </a>

      <SiteHeader
        m={m}
        locale={locale}
        onLocale={setLocale}
        onHome={(anchor) => goHome(anchor)}
        onSearch={() => openDialog('condition')}
        hidden={dialog !== null}
      />

      <main
        id="main"
        ref={mainRef}
        tabIndex={-1}
        aria-hidden={dialog !== null ? true : undefined}
        className={[view.name === 'home' ? 'od-main-home' : 'od-main-page', animationPaused ? 'anim-paused' : '']
          .filter(Boolean)
          .join(' ')}
      >
        <p className="disclaimer no-print">{m.disclaimer}</p>
        {locale === 'es' && (
          <p className="notice warn" role="note">
            {m.esInterfaceNotice}
          </p>
        )}

        {view.name === 'home' && (
          <HomePage
            m={m}
            locale={locale}
            index={topicIndex}
            animationPaused={animationPaused}
            onToggleAnimation={() => setAnimationPaused((paused) => !paused)}
            onDoor={handleDoor}
            onSearchTerm={(term) => {
              void runSearch(term, true);
            }}
          />
        )}

        {view.name === 'search' && (
          <section className="od-results-view" aria-label={m.crumbResults}>
            <div className="od-wrap">
              <nav className="crumbs" aria-label="Breadcrumb">
                <button type="button" onClick={() => goHome()}>
                  {m.crumbHome}
                </button>
                <span aria-hidden="true">/</span>
                <span>{m.crumbResults}</span>
              </nav>

              {results.status === 'idle' ? (
                <>
                  <h1 id="search-title" tabIndex={-1}>
                    {m.crumbResults}
                  </h1>
                  <p className="od-results-prompt">{m.resultsIdlePrompt}</p>
                  <button type="button" className="button" onClick={() => openDialog('condition')}>
                    {m.navSearch}
                  </button>
                </>
              ) : (
                <>
                  <h1 id="search-title" tabIndex={-1}>
                    {m.resultsForTerm(results.term)}
                  </h1>
                  <div className="od-results-actions">
                    <button type="button" className="button secondary" onClick={() => openDialog('condition')}>
                      {m.reviseSearch}
                    </button>
                  </div>
                  <ResultsList
                    m={m}
                    locale={locale}
                    results={results}
                    onOpenStudy={(nctId) => {
                      void openStudy(nctId);
                    }}
                    onRetry={() => {
                      void runSearch(results.term, false);
                    }}
                  />
                </>
              )}
            </div>
          </section>
        )}

        {view.name === 'study' && (
          <StudyDetail
            m={m}
            locale={locale}
            trial={view.trial}
            onBack={() => setView(results.status === 'idle' ? { name: 'home' } : { name: 'search' })}
            onPrepare={() => setView({ name: 'prepare', trial: view.trial })}
          />
        )}

        {view.name === 'prepare' && (
          <PreparationCard
            m={m}
            locale={locale}
            trial={view.trial}
            onBack={() => showStudy(view.trial)}
          />
        )}
      </main>

      {dialog && (
        <SearchPanel
          m={m}
          tab={dialog.tab}
          initialTerm={dialog.term}
          nctState={nctState}
          presets={topicIndex ? presetTerms(topicIndex) : []}
          searchingTerm={results.status === 'loading' ? results.term : null}
          onClose={closeDialog}
          onSearch={(term) => {
            void runSearch(term, false);
          }}
          onSubmitNct={(rawNctId) => {
            void openStudy(rawNctId);
          }}
        />
      )}

      <footer className="no-print" aria-hidden={dialog !== null ? true : undefined}>{m.footer}</footer>
    </>
  );
}
