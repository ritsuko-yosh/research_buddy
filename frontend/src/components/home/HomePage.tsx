import type { ReactNode } from 'react';
import type { Locale, Messages } from '../../i18n/strings';
import type { TopicIndex } from '../../lib/topicIndex';
import { TopicGarden } from './TopicGarden';

interface HomePageProps {
  m: Messages;
  locale: Locale;
  index: TopicIndex | null;
  onSearchTerm: (term: string) => void;
  /** The existing search form and results. */
  children: ReactNode;
}

/**
 * The Search page body: browse-by-topic garden, the search form + results
 * (passed as children), and the "how it works" steps. The landing hero and the
 * "New to clinical trials?" explainer now live on the Home page (HomeHero).
 */
export function HomePage({ m, locale, index, onSearchTerm, children }: HomePageProps) {
  const steps = [
    { title: m.how1Title, text: m.how1Text },
    { title: m.how2Title, text: m.how2Text },
    { title: m.how3Title, text: m.how3Text },
  ];

  return (
    <>
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
