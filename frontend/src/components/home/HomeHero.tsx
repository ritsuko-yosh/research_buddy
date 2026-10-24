import type { Messages } from '../../i18n/strings';
import { DoorIllustration } from './DoorIllustration';

export type SearchTarget = 'explainer' | 'garden' | 'condition' | 'nct';

interface HomeHeroProps {
  m: Messages;
  /**
   * Navigate to the Search page. An optional target hints which area to focus
   * once Search renders (condition field, NCT field, browse garden, etc.).
   */
  onGoToSearch: (target?: SearchTarget) => void;
}

/**
 * The Home landing hero: the "Clinical trials, explained" headline, the four
 * "Where would you like to start?" doors + illustration, and the
 * "New to clinical trials? Start here" explainer. The doors route to the Search
 * page (they no longer scroll within the search page).
 */
export function HomeHero({ m, onGoToSearch }: HomeHeroProps) {
  const doors: Array<{ id: string; title: string; description: string; target: SearchTarget }> = [
    { id: 'start', title: m.doorStartTitle, description: m.doorStartDesc, target: 'explainer' },
    { id: 'explore', title: m.doorExploreTitle, description: m.doorExploreDesc, target: 'garden' },
    { id: 'condition', title: m.doorConditionTitle, description: m.doorConditionDesc, target: 'condition' },
    { id: 'nct', title: m.doorNctTitle, description: m.doorNctDesc, target: 'nct' },
  ];

  const explainer = [
    { title: m.explainer1Title, text: m.explainer1Text },
    { title: m.explainer2Title, text: m.explainer2Text },
    { title: m.explainer3Title, text: m.explainer3Text },
  ];

  return (
    <>
      <section className="od-hero" aria-labelledby="hero-heading">
        <div className="od-wrap od-hero-grid">
          <div className="od-hero-copy">
            <h1 id="hero-heading" tabIndex={-1}>
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
                  <button type="button" className="od-door" onClick={() => onGoToSearch(door.target)}>
                    <span className="od-door-title">{door.title}</span>
                    <span className="od-door-desc">{door.description}</span>
                  </button>
                </li>
              ))}
            </ul>

            <p className="od-quick">
              {m.quickQ}{' '}
              <button type="button" className="od-inline-link" onClick={() => onGoToSearch('condition')}>
                {m.quickLink}
              </button>
            </p>
          </div>

          <div className="od-illo">
            <DoorIllustration />
          </div>
        </div>
      </section>

      <section className="od-band alt" aria-labelledby="home-explainer-heading">
        <div className="od-wrap">
          <h2 id="home-explainer-heading">{m.explainerHeading}</h2>
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
    </>
  );
}
