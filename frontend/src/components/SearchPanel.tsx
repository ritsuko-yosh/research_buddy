import { useState } from 'react';
import { SUPPORTED_CONDITIONS } from '../data/conditions';
import type { Locale, Messages } from '../i18n/strings';

export type NctFormState =
  | { status: 'idle' }
  | { status: 'invalid' }
  | { status: 'unsupported' }
  | { status: 'loading' }
  | { status: 'error' };

interface SearchPanelProps {
  m: Messages;
  locale: Locale;
  nctState: NctFormState;
  onSelectCondition: (conditionId: string) => void;
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

export function SearchPanel({ m, locale, nctState, onSelectCondition, onSubmitNct }: SearchPanelProps) {
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [nctInput, setNctInput] = useState('');
  const message = nctMessage(nctState, m);
  const isError = nctState.status === 'invalid' || nctState.status === 'unsupported' || nctState.status === 'error';

  return (
    <section className="card" aria-labelledby="search-heading">
      <h1 id="search-heading" tabIndex={-1}>
        {m.searchHeading}
      </h1>

      <fieldset>
        <legend>{m.chooseCondition}</legend>
        <p className="help">{m.conditionHelp}</p>
        <div className="chip-row">
          {SUPPORTED_CONDITIONS.map((condition) => (
            <button
              key={condition.id}
              type="button"
              className="chip"
              aria-pressed={selectedCondition === condition.id}
              onClick={() => {
                setSelectedCondition(condition.id);
                onSelectCondition(condition.id);
              }}
            >
              {condition.label[locale]}
            </button>
          ))}
        </div>
      </fieldset>

      <form
        className="nct-form"
        noValidate
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
