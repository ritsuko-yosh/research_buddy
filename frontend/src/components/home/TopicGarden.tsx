import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Locale, Messages } from '../../i18n/strings';
import { formatRegistryDate } from '../../lib/format';
import { spawnRipple } from '../../lib/ripple';
import type { Topic, TopicIndex } from '../../lib/topicIndex';
import { GouacheFilter } from './DoorIllustration';

interface TopicGardenProps {
  m: Messages;
  locale: Locale;
  index: TopicIndex | null;
  /** Runs the existing live condition search with this registry term. */
  onSearchTerm: (term: string) => void;
  /** Page-wide Pause Animation choice. The class lives on <main>, so the loader obeys it too. */
  animationPaused: boolean;
  onToggleAnimation: () => void;
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

/** Each topic keeps its own breathing phase, so the garden never moves in lockstep. */
function motionStyle(position: number): CSSProperties {
  return {
    '--i': position,
    '--bd': `${-((position * 1.7) % 9).toFixed(2)}s`,
  } as CSSProperties;
}

export function TopicGarden({ m, locale, index, onSearchTerm, animationPaused, onToggleAnimation }: TopicGardenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<'garden' | 'list'>('garden');
  const gardenRef = useRef<HTMLDivElement>(null);
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

  // Opening a topic moves focus to its panel heading, so keyboard and screen reader users land in the details.
  useEffect(() => {
    if (selectedId !== null) {
      document.getElementById('topic-details-heading')?.focus({ preventScroll: true });
    }
  }, [selectedId]);

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

  /** Selecting a topic paints a ripple in its color, from the point it was clicked. Deselecting does not. */
  const choose = (topic: Topic, button: HTMLButtonElement) => {
    const isSelected = topic.id === selectedId;
    if (!isSelected && gardenRef.current) {
      const shape = button.querySelector<HTMLElement>('.od-blob-shape');
      const color = shape ? window.getComputedStyle(shape).backgroundColor : 'currentColor';
      const garden = gardenRef.current.getBoundingClientRect();
      const rect = button.getBoundingClientRect();
      spawnRipple(gardenRef.current, rect.left - garden.left + rect.width / 2, rect.top - garden.top + rect.height / 2, color);
    }
    setSelectedId(isSelected ? null : topic.id);
  };

  const topicButton = (topic: Topic, className: string, position: number) => {
    const label = labelFor(topic, m, locale);
    const isSelected = topic.id === selectedId;
    const isBlob = className.startsWith('od-blob');
    return (
      <button
        key={topic.id}
        id={`topic-${topic.id}`}
        type="button"
        className={className}
        style={isBlob ? motionStyle(position) : undefined}
        aria-pressed={isSelected}
        aria-expanded={isSelected}
        aria-controls={isSelected ? DETAILS_ID : undefined}
        onClick={(event) => choose(topic, event.currentTarget)}
      >
        {isBlob ? (
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
          <span className="od-garden-controls">
            <button
              type="button"
              className="od-toggle"
              aria-pressed={animationPaused}
              onClick={onToggleAnimation}
            >
              {animationPaused ? m.playAnimation : m.pauseAnimation}
            </button>
            <button
              type="button"
              className="od-toggle"
              aria-pressed={view === 'list'}
              onClick={() => setView(view === 'garden' ? 'list' : 'garden')}
            >
              {m.gardenViewList}
            </button>
          </span>
        </div>

        {view === 'garden' ? (
          <div
            ref={gardenRef}
            className={`od-garden${selected ? ' has-selection' : ''}`}
            role="group"
            aria-label={m.gardenHeading}
          >
            {topics.map((topic, position) =>
              topicButton(topic, `od-blob${relatedIds.has(topic.id) ? ' is-related' : ''}`, position),
            )}
          </div>
        ) : (
          <div className="od-list" role="group" aria-label={m.gardenHeading}>
            {topics.map((topic, position) => topicButton(topic, 'od-chip', position))}
          </div>
        )}

        {selected && (
          <section
            id={DETAILS_ID}
            className={`od-details${opening ? ' is-opening' : ''}`}
            aria-labelledby="topic-details-heading"
          >
            <button type="button" className="od-details-close" onClick={close} aria-label={m.topicClose}>
              ×
            </button>
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

          </section>
        )}
      </div>
    </section>
  );
}
