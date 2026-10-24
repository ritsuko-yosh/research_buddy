import type { Locale, Messages } from '../../i18n/strings';
import type { TopicIndex } from '../../lib/topicIndex';
import { ExplainerArt } from '../art/ExplainerArt';
import { DoorIllustration } from './DoorIllustration';
import { TopicGarden } from './TopicGarden';

/** What each guided entry point does. Search opens the dialog on the matching tab. */
export type DoorAction = 'explainer' | 'garden' | 'condition' | 'study-id';

interface HomePageProps {
  m: Messages;
  locale: Locale;
  index: TopicIndex | null;
  onSearchTerm: (term: string) => void;
  /** Page-wide Pause Animation choice, shared with the search loader. */
  animationPaused: boolean;
  onToggleAnimation: () => void;
  onDoor: (action: DoorAction) => void;
}

export function HomePage({
  m,
  locale,
  index,
  onSearchTerm,
  animationPaused,
  onToggleAnimation,
  onDoor,
}: HomePageProps) {
  const doors: Array<{ id: string; title: string; description: string; action: DoorAction }> = [
    { id: 'start', title: m.doorStartTitle, description: m.doorStartDesc, action: 'explainer' },
    { id: 'explore', title: m.doorExploreTitle, description: m.doorExploreDesc, action: 'garden' },
    { id: 'cond', title: m.doorConditionTitle, description: m.doorConditionDesc, action: 'condition' },
    { id: 'nct', title: m.doorNctTitle, description: m.doorNctDesc, action: 'study-id' },
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
                  <button type="button" className="od-door" onClick={() => onDoor(door.action)}>
                    <span className="od-door-title">{door.title}</span>
                    <span className="od-door-desc">{door.description}</span>
                  </button>
                </li>
              ))}
            </ul>

            <p className="od-quick">
              {m.quickQ}{' '}
              <button type="button" className="od-inline-link" onClick={() => onDoor('condition')}>
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
            {explainer.map((block, position) => (
              <article key={block.title}>
                <div className="od-explain-art">
                  <ExplainerArt index={(position + 1) as 1 | 2 | 3} />
                </div>
                <h3>{block.title}</h3>
                <p>{block.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div id="explore">
        <TopicGarden
          m={m}
          locale={locale}
          index={index}
          onSearchTerm={onSearchTerm}
          animationPaused={animationPaused}
          onToggleAnimation={onToggleAnimation}
        />
      </div>

      <section id="how" className="od-band alt" aria-labelledby="how-heading">
        <div className="od-wrap">
          <h2 id="how-heading" tabIndex={-1}>
            {m.howHeading}
          </h2>
          <ol className="od-steps" role="list">
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

