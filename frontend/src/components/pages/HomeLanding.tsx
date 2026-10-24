import type { Messages } from '../../i18n/strings';

interface HomeLandingProps {
  m: Messages;
  onStart: () => void;
}

/** The Home tab: a welcome, the three-step overview, and a call to action. */
export function HomeLanding({ m, onStart }: HomeLandingProps) {
  return (
    <article className="card home-landing" aria-labelledby="home-heading">
      <h1 id="home-heading" tabIndex={-1}>
        {m.homeHeading}
      </h1>
      <p className="lead">{m.homeLead}</p>

      <ol className="home-steps">
        <li>
          <h2>{m.homeStep1Title}</h2>
          <p>{m.homeStep1Desc}</p>
        </li>
        <li>
          <h2>{m.homeStep2Title}</h2>
          <p>{m.homeStep2Desc}</p>
        </li>
        <li>
          <h2>{m.homeStep3Title}</h2>
          <p>{m.homeStep3Desc}</p>
        </li>
      </ol>

      <div className="cta">
        <button type="button" className="button" onClick={onStart}>
          {m.homeCta}
        </button>
      </div>
    </article>
  );
}
