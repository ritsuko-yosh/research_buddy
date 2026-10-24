import type { Messages } from '../../i18n/strings';

interface AboutPageProps {
  m: Messages;
}

/** The About tab: project description, track, and the safety boundaries. */
export function AboutPage({ m }: AboutPageProps) {
  return (
    <article className="card about-page" aria-labelledby="about-page-heading">
      <h1 id="about-page-heading" tabIndex={-1}>
        {m.aboutPageHeading}
      </h1>
      <p className="track">{m.aboutTrack}</p>
      <p className="lead">{m.aboutWhat}</p>

      <section aria-labelledby="about-does">
        <h2 id="about-does">{m.aboutDoesHeading}</h2>
        <ul>
          <li>{m.aboutDoes1}</li>
          <li>{m.aboutDoes2}</li>
          <li>{m.aboutDoes3}</li>
          <li>{m.aboutDoes4}</li>
          <li>{m.aboutDoes5}</li>
        </ul>
      </section>

      <section aria-labelledby="about-not">
        <h2 id="about-not">{m.aboutNotHeading}</h2>
        <ul>
          <li>{m.aboutNot1}</li>
          <li>{m.aboutNot2}</li>
          <li>{m.aboutNot3}</li>
          <li>{m.aboutNot4}</li>
        </ul>
      </section>

      <p className="notice info" role="note">
        {m.aboutSourceNote}
      </p>
    </article>
  );
}
