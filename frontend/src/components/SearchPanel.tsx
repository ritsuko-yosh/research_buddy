import { useState } from 'react';
import type { Messages } from '../i18n/strings';
import { normalizeSearchTerm } from '../lib/searchTerm';

export type NctFormState =
  | { status: 'idle' }
  | { status: 'invalid' }
  | { status: 'unsupported' }
  | { status: 'loading' }
  | { status: 'error' };

interface SearchPanelProps {
  m: Messages;
  nctState: NctFormState;
  /** Common search terms from the topic index. Empty when the index is unavailable. */
  presets: readonly string[];
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

export function SearchPanel({ m, nctState, presets, onSearch, onSubmitNct }: SearchPanelProps) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [termInput, setTermInput] = useState('');
  const [termInvalid, setTermInvalid] = useState(false);
  const [nctInput, setNctInput] = useState('');
  const message = nctMessage(nctState, m);
  const isError = nctState.status === 'invalid' || nctState.status === 'unsupported' || nctState.status === 'error';

  return (
    <section className="card" aria-labelledby="search-heading">
      <h2 id="search-heading" tabIndex={-1}>
        {m.searchHeading}
      </h2>

      <form
        className="nct-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const term = normalizeSearchTerm(termInput);
          if (term === null) {
            setTermInvalid(true);
            return;
          }
          setTermInvalid(false);
          setSelectedPreset(null);
          onSearch(term);
        }}
      >
        <label htmlFor="condition-input">{m.conditionInputLabel}</label>
        <p id="condition-help" className="help">
          {m.conditionInputHelp}
        </p>
        <input
          id="condition-input"
          type="text"
          value={termInput}
          autoComplete="off"
          spellCheck={false}
          maxLength={100}
          aria-describedby="condition-help condition-message"
          aria-invalid={termInvalid}
          onChange={(event) => setTermInput(event.target.value)}
        />
        <div>
          <button type="submit" className="button">
            {m.conditionSearch}
          </button>
        </div>
        <p id="condition-message" role="status" aria-live="polite" className={`status-msg${termInvalid ? ' error' : ''}`}>
          {termInvalid ? m.conditionInvalid : null}
        </p>
      </form>

      {presets.length > 0 && (
      <fieldset style={{ marginTop: '1.25rem' }}>
        <legend>{m.chooseCondition}</legend>
        <p className="help">{m.conditionHelp}</p>
        <div className="chip-row">
          {presets.map((term) => (
            <button
              key={term}
              type="button"
              className="chip"
              lang="en"
              aria-pressed={selectedPreset === term}
              onClick={() => {
                setSelectedPreset(term);
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

      <form
        className="nct-form"
        noValidate
        style={{ marginTop: '1.25rem' }}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmitNct(nctInput);
        }}
      >
        <h2 className="nct-heading">{m.orEnterNct}</h2>
        <label htmlFor="nct-input">{m.nctLabel}</label>
        <p id="nct-help" className="help">
          {m.nctHelp}
        </p>
        <input
          id="nct-input"
          type="text"
          value={nctInput}
          autoComplete="off"
          spellCheck={false}
          aria-describedby="nct-help nct-message"
          aria-invalid={isError}
          onChange={(event) => setNctInput(event.target.value)}
        />
        <div>
          <button type="submit" className="button" disabled={nctState.status === 'loading'}>
            {m.openStudy}
          </button>
        </div>
        <p id="nct-message" role="status" aria-live="polite" className={`status-msg${isError ? ' error' : ''}`}>
          {message}
        </p>
      </form>
    </section>
  );
}
