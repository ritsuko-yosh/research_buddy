import { useEffect, useRef, useState } from 'react';
import type { Locale, Messages } from '../../i18n/strings';
import { formatRegistryDate } from '../../lib/format';
import type { Topic, TopicIndex } from '../../lib/topicIndex';
import { GouacheFilter } from './DoorIllustration';

interface TopicGardenProps {
  m: Messages;
  locale: Locale;
  index: TopicIndex | null;
  /** Runs the existing live condition search with this registry term. */
  onSearchTerm: (term: string) => void;
}

const DETAILS_ID = 'od-topic-details';

function displayTerm(term: string): string {
  return term.charAt(0).toUpperCase() + term.slice(1);
}

/** Patient-friendly label when we have one. Otherwise the registry name, marked as English. */
function labelFor(topic: Topic, m: Messages, locale: Locale): { text: string; lang: Locale | 'en' } {
  const label = m.topicLabels[topic.id];
  return label ? { text: label, lang: locale } : { text: topic.registryName, lang: 'en' };
}

export function TopicGarden({ m, locale, index, onSearchTerm }: TopicGardenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<'garden' | 'list'>('garden');
  const wasOpen = useRef(false);

  // Escape closes the open topic from anywhere on the page and returns focus to its topic.
  useEffect(() => {
    if (selectedId === null) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedId(null);
        document.getElementById(`topic-${selectedId}`)?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [selectedId]);

  // Remember whether details were open, so the slide-in plays only on first open, not on switching.
  useEffect(() => {
    wasOpen.current = selectedId !== null;
  });

  const topics = index?.topics ?? [];
  if (!index || topics.length === 0) {
    return (
      <section className="od-band" aria-labelledby="garden-heading">
        <div className="od-wrap">
          <h2 id="garden-heading" tabIndex={-1}>
            {m.gardenHeading}
          </h2>
          <p role="status">{m.topicsUnavailable}</p>
        </div>
      </section>
    );
  }

  const selected = topics.find((topic) => topic.id === selectedId) ?? null;
  const relatedIds = new Set(selected?.sharedWith.map((relation) => relation.topicId) ?? []);
  const opening = selected !== null && !wasOpen.current;

  /** Closes the details and returns focus to the topic that opened them. */
  const close = () => {
    const previous = selectedId;
    setSelectedId(null);
    if (previous) {
      document.getElementById(`topic-${previous}`)?.focus();
    }
  };

  const topicButton = (topic: Topic, className: string) => {
    const label = labelFor(topic, m, locale);
    const isSelected = topic.id === selectedId;
    return (
      <button
        key={topic.id}
        id={`topic-${topic.id}`}
        type="button"
        className={className}
        aria-pressed={isSelected}
        aria-expanded={isSelected}
        aria-controls={isSelected ? DETAILS_ID : undefined}
        onClick={() => setSelectedId(isSelected ? null : topic.id)}
      >
        {className.startsWith('od-blob') ? (
          <>
            <span className="od-blob-shape" aria-hidden="true" />
            <span className="od-blob-label">
              <span lang={label.lang}>{label.text}</span>
              <small>{m.topicStudies(topic.studyCount)}</small>
            </span>
          </>
        ) : (
          <>
            <span lang={label.lang}>{label.text}</span> <small>{m.topicStudies(topic.studyCount)}</small>
          </>
        )}
      </button>
    );
  };

  return (
    <section className="od-band" aria-labelledby="garden-heading">
      <div className="od-wrap">
        <h2 id="garden-heading" tabIndex={-1}>
          {m.gardenHeading}
        </h2>
        <p className="od-intro">{m.gardenIntro}</p>
        <p className="od-intro">{m.gardenMultiNote}</p>

        {/* Hidden copy of the texture filter, so the topic shapes keep their texture when the illustration is hidden. */}
        <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
          <defs>
            <GouacheFilter id="od-gouache-blob" />
          </defs>
        </svg>

        <div className="od-garden-meta">
          <span>{m.gardenUpdated(formatRegistryDate(index.generatedAt, locale, m.dateNotListed))}</span>
          <button
            type="button"
            className="od-toggle"
            aria-pressed={view === 'list'}
            onClick={() => setView(view === 'garden' ? 'list' : 'garden')}
          >
            {m.gardenViewList}
          </button>
        </div>

        {view === 'garden' ? (
          <div
            className={`od-garden${selected ? ' has-selection' : ''}`}
            role="group"
            aria-label={m.gardenHeading}
          >
            {topics.map((topic) =>
              topicButton(topic, `od-blob${relatedIds.has(topic.id) ? ' is-related' : ''}`),
            )}
          </div>
        ) : (
          <div className="od-list" role="group" aria-label={m.gardenHeading}>
            {topics.map((topic) => topicButton(topic, 'od-chip'))}
          </div>
        )}

        {selected && (
          <section
            id={DETAILS_ID}
            className={`od-details${opening ? ' is-opening' : ''}`}
            aria-labelledby="topic-details-heading"
          >
            <p className="od-eyebrow">
              {m.topicRegistryCategory} <span lang="en">{selected.registryName}</span>
            </p>
            <h3 id="topic-details-heading" tabIndex={-1}>
              <span lang={labelFor(selected, m, locale).lang}>{labelFor(selected, m, locale).text}</span>
            </h3>
            <p>{m.topicStudies(selected.studyCount)}</p>

            {selected.topConditions.length > 0 && (
              <>
                <h4>{m.topicConditionsHeading}</h4>
                <div className="od-chips">
                  {selected.topConditions.map((condition) => (
                    <button
                      key={condition.term}
                      type="button"
                      className="od-chip"
                      lang="en"
                      onClick={() => onSearchTerm(condition.term)}
                    >
                      {displayTerm(condition.term)}
                    </button>
                  ))}
                </div>
              </>
            )}

            {selected.sharedWith.length > 0 && (
              <>
                <h4>{m.topicSharesWith}</h4>
                <div className="od-chips">
                  {selected.sharedWith.map((relation) => {
                    const other = topics.find((topic) => topic.id === relation.topicId);
                    if (!other) {
                      return null;
                    }
                    const otherLabel = labelFor(other, m, locale);
                    return (
                      <button
                        key={relation.topicId}
                        type="button"
                        className="od-related"
                        onClick={() => setSelectedId(other.id)}
                      >
                        <span lang={otherLabel.lang}>{otherLabel.text}</span>{' '}
                        <span lang="en">({relation.sharedTerms.join(', ')})</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <div>
              <button type="button" className="od-chip" onClick={close}>
                {m.topicClose}
              </button>
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
