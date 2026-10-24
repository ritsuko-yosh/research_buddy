import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import type { Messages } from '../i18n/strings';
import { normalizeSearchTerm } from '../lib/searchTerm';
import { SearchLoaderArt } from './art/SearchLoaderArt';

export type NctFormState =
  | { status: 'idle' }
  | { status: 'invalid' }
  | { status: 'unsupported' }
  | { status: 'loading' }
  | { status: 'error' };

export type SearchTab = 'condition' | 'nct';

interface SearchPanelProps {
  m: Messages;
  /** Which tab to show when the dialog opens. */
  tab: SearchTab;
  /** Prefilled condition text, so a patient can revise the last search. */
  initialTerm: string;
  nctState: NctFormState;
  /** Common search terms from the topic index. Empty when the index is unavailable. */
  presets: readonly string[];
  /** The term of the search in flight, or null. While set, the button is busy and the loader shows. */
  searchingTerm: string | null;
  onClose: () => void;
  /** Receives a validated, user-provided or preset search term. */
  onSearch: (term: string) => void;
  onSubmitNct: (rawNctId: string) => void;
}

function nctMessage(state: NctFormState, m: Messages): string | null {
  switch (state.status) {
    case 'invalid':
      return m.nctInvalid;
    case 'unsupported':
      return m.nctUnsupported;
    case 'loading':
      return m.nctLoading;
    case 'error':
      return m.nctError;
    case 'idle':
      return null;
  }
}

/**
 * The search dialog. It is mounted only while open, so each opening starts
 * fresh. Escape and the close button dismiss it. Focus moves into the dialog
 * on open, is kept inside it with Tab, and returns to the control that opened it.
 */
export function SearchPanel({
  m,
  tab: initialTab,
  initialTerm,
  nctState,
  presets,
  searchingTerm,
  onClose,
  onSearch,
  onSubmitNct,
}: SearchPanelProps) {
  const [tab, setTab] = useState<SearchTab>(initialTab);
  const [termInput, setTermInput] = useState(initialTerm);
  const [termInvalid, setTermInvalid] = useState(false);
  const [nctInput, setNctInput] = useState('');
  const sheetRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const idBase = useId();
  const searching = searchingTerm !== null;
  const message = nctMessage(nctState, m);
  const isError = nctState.status === 'invalid' || nctState.status === 'unsupported' || nctState.status === 'error';

  // Remember what had focus before the dialog, and give it back when the dialog closes.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    // Focus the field for the door or control that opened the dialog. Fall back to the heading.
    const field = document.getElementById(initialTab === 'condition' ? 'condition-input' : 'nct-input');
    (field ?? headingRef.current)?.focus();
    return () => {
      if (previous && previous.isConnected) {
        previous.focus();
      }
    };
  }, []);

  // While a search runs, keep focus inside the dialog, because the submit button is disabled.
  useEffect(() => {
    if (searching) {
      headingRef.current?.focus();
    }
  }, [searching]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !sheetRef.current) {
      return;
    }
    // Keep Tab and Shift+Tab inside the dialog.
    const focusable = Array.from(
      sheetRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ),
    );
    if (focusable.length === 0) {
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const tabId = (name: SearchTab) => `${idBase}-tab-${name}`;
  const panelId = (name: SearchTab) => `${idBase}-panel-${name}`;

  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
      return;
    }
    event.preventDefault();
    const next: SearchTab = tab === 'condition' ? 'nct' : 'condition';
    setTab(next);
    document.getElementById(tabId(next))?.focus();
  };

  return (
    <div
      className="scrim"
      onMouseDown={(event) => {
        // A click on the dimmed area, outside the dialog, closes it.
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={sheetRef}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${idBase}-heading`}
        onKeyDown={onKeyDown}
      >
        <button type="button" className="xbtn" onClick={onClose} aria-label={m.closeLabel}>
          ×
        </button>
        <h2 id={`${idBase}-heading`} ref={headingRef} tabIndex={-1}>
          {m.searchHeading}
        </h2>

        <div className="tabs" role="tablist" aria-label={m.searchHeading}>
          <button
            type="button"
            role="tab"
            id={tabId('condition')}
            aria-selected={tab === 'condition'}
            aria-controls={panelId('condition')}
            tabIndex={tab === 'condition' ? 0 : -1}
            onClick={() => setTab('condition')}
            onKeyDown={onTabKey}
          >
            {m.tabCondition}
          </button>
          <button
            type="button"
            role="tab"
            id={tabId('nct')}
            aria-selected={tab === 'nct'}
            aria-controls={panelId('nct')}
            tabIndex={tab === 'nct' ? 0 : -1}
            onClick={() => setTab('nct')}
            onKeyDown={onTabKey}
          >
            {m.tabNct}
          </button>
        </div>

        {tab === 'condition' && (
          <div role="tabpanel" id={panelId('condition')} aria-labelledby={tabId('condition')} className="field">
            <form
              className="nct-form"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                if (searching) {
                  return;
                }
                const term = normalizeSearchTerm(termInput);
                if (term === null) {
                  setTermInvalid(true);
                  return;
                }
                setTermInvalid(false);
                onSearch(term);
              }}
            >
              <label htmlFor="condition-input">{m.conditionInputLabel}</label>
              <p id={`${idBase}-condition-help`} className="help">
                {m.conditionInputHelp}
              </p>
              <input
                id="condition-input"
                type="text"
                value={termInput}
                autoComplete="off"
                spellCheck={false}
                maxLength={100}
                aria-describedby={`${idBase}-condition-help ${idBase}-condition-message`}
                aria-invalid={termInvalid}
                onChange={(event) => setTermInput(event.target.value)}
              />
              <div>
                <button type="submit" className="button" disabled={searching} aria-busy={searching}>
                  {searching ? m.conditionSearching : m.conditionSearch}
                </button>
              </div>
              <p
                id={`${idBase}-condition-message`}
                role="status"
                aria-live="polite"
                className={`status-msg${termInvalid ? ' error' : ''}`}
              >
                {termInvalid ? m.conditionInvalid : null}
              </p>
            </form>

            {searchingTerm !== null && (
              <div className="od-loader" aria-busy="true">
                <SearchLoaderArt />
                <p className="od-loader-text">{m.searchingFor(searchingTerm)}</p>
                <p role="status" className="sr-only">
                  {m.resultsLoading}
                </p>
              </div>
            )}

            {presets.length > 0 && (
              <fieldset className="od-presets">
                <legend>{m.chooseCondition}</legend>
                <p className="help">{m.conditionHelp}</p>
                <div className="chip-row">
                  {presets.map((term) => (
                    <button
                      key={term}
                      type="button"
                      className="chip"
                      lang="en"
                      disabled={searching}
                      onClick={() => {
                        setTermInvalid(false);
                        setTermInput(term);
                        onSearch(term);
                      }}
                    >
                      {term.charAt(0).toUpperCase() + term.slice(1)}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
          </div>
        )}

        {tab === 'nct' && (
          <div role="tabpanel" id={panelId('nct')} aria-labelledby={tabId('nct')} className="field">
            <form
              className="nct-form"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                onSubmitNct(nctInput);
              }}
            >
              <label htmlFor="nct-input">{m.nctLabel}</label>
              <p id={`${idBase}-nct-help`} className="help">
                {m.nctHelp}
              </p>
              <input
                id="nct-input"
                type="text"
                value={nctInput}
                autoComplete="off"
                spellCheck={false}
                aria-describedby={`${idBase}-nct-help ${idBase}-nct-message`}
                aria-invalid={isError}
                onChange={(event) => setNctInput(event.target.value)}
              />
              <div>
                <button type="submit" className="button" disabled={nctState.status === 'loading'}>
                  {m.openStudy}
                </button>
              </div>
              <p
                id={`${idBase}-nct-message`}
                role="status"
                aria-live="polite"
                className={`status-msg${isError ? ' error' : ''}`}
              >
                {message}
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
