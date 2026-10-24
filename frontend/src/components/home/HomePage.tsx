import type { ReactNode } from 'react';
import type { Locale, Messages } from '../../i18n/strings';
import type { TopicIndex } from '../../lib/topicIndex';
import { DoorIllustration } from './DoorIllustration';
import { TopicGarden } from './TopicGarden';

interface HomePageProps {
  m: Messages;
  locale: Locale;
  index: TopicIndex | null;
  onSearchTerm: (term: string) => void;
  /** The existing search form and results. */
  children: ReactNode;
}

/** Scrolls to the target and focuses it. Smooth scrolling is skipped for reduced motion. */
function goTo(targetId: string) {
  const element = document.getElementById(targetId);
  if (!element) {
    return;
  }
  const prefersReducedMotion =
    typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  element.scrollIntoView?.({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  element.focus({ preventScroll: true });
}

export function HomePage({ m, locale, index, onSearchTerm, children }: HomePageProps) {
  const doors = [
    { id: 'start', title: m.doorStartTitle, description: m.doorStartDesc, target: 'explainer-heading' },
    { id: 'explore', title: m.doorExploreTitle, description: m.doorExploreDesc, target: 'garden-heading' },
    { id: 'condition', title: m.doorConditionTitle, description: m.doorConditionDesc, target: 'condition-input' },
    { id: 'nct', title: m.doorNctTitle, description: m.doorNctDesc, target: 'nct-input' },
  ];

  const explainer = [
    { title: m.explainer1Title, text: m.explainer1Text },
    { title: m.explainer2Title, text: m.explainer2Text },
    { title: m.explainer3Title, text: m.explainer3Text },
  ];

  const steps = [
    { title: m.how1Title, text: m.how1Text },
    { title: m.how2Title, text: m.how2Text },
    { title: m.how3Title, text: m.how3Text },
  ];

  return (
    <>
      <section className="od-hero" aria-labelledby="hero-heading">
        <div className="od-wrap od-hero-grid">
          <div className="od-hero-copy">
            <h1 id="hero-heading">
              {m.heroBefore}
              <em>{m.heroEmphasis}</em>
              {m.heroAfter}
            </h1>
            <p className="od-sub">{m.heroSub}</p>

            <p id="doors-label" className="od-quick">
              {m.doorsLabel}
            </p>
            <ul className="od-doors" aria-labelledby="doors-label">
              {doors.map((door) => (
                <li key={door.id}>
                  <button type="button" className="od-door" onClick={() => goTo(door.target)}>
                    <span className="od-door-title">{door.title}</span>
                    <span className="od-door-desc">{door.description}</span>
                  </button>
                </li>
              ))}
            </ul>

            <p className="od-quick">
              {m.quickQ}{' '}
              <button type="button" className="od-inline-link" onClick={() => goTo('condition-input')}>
                {m.quickLink}
              </button>
            </p>
          </div>

          <div className="od-illo">
            <DoorIllustration />
          </div>
        </div>
      </section>

      <section className="od-band alt" aria-labelledby="explainer-heading">
        <div className="od-wrap">
          <h2 id="explainer-heading" tabIndex={-1}>
            {m.explainerHeading}
          </h2>
          <div className="od-explain">
            {explainer.map((block) => (
              <article key={block.title}>
                <h3>{block.title}</h3>
                <p>{block.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <TopicGarden m={m} locale={locale} index={index} onSearchTerm={onSearchTerm} />

      {/* A plain container: the SearchPanel inside is the single labeled region for search. */}
      <div className="od-band alt">
        <div className="od-wrap">{children}</div>
      </div>

      <section className="od-band" aria-labelledby="how-heading">
        <div className="od-wrap">
          <h2 id="how-heading">{m.howHeading}</h2>
          <ol className="od-steps">
            {steps.map((step, position) => (
              <li key={step.title}>
                <span className="od-step-n" aria-hidden="true">
                  {position + 1}
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
