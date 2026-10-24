import type { Locale, Messages } from '../i18n/strings';
import type { Criterion } from '../types/trial';
import { TranslationBadge } from './Notices';

interface CriterionItemProps {
  m: Messages;
  locale: Locale;
  criterion: Criterion;
}

/**
 * One requirement. The original registry wording is always visible. The plain
 * explanation follows the selected language and says so when it is missing.
 */
export function CriterionItem({ m, locale, criterion }: CriterionItemProps) {
  const plain = locale === 'es' ? criterion.plainExplanation.es : criterion.plainExplanation.en;

  return (
    <article className="criterion">
      <p>
        <span className="tag">{criterion.section === 'inclusion' ? m.inclusion : m.exclusion}</span>
      </p>

      <h4>{m.plainHeading}</h4>
      {plain ? (
        <>
          <p lang={locale}>{plain}</p>
          {locale === 'es' && <TranslationBadge m={m} status={criterion.spanishTranslationStatus} />}
        </>
      ) : (
        <p className="unavailable-note">{locale === 'es' ? m.noSpanish : m.noPlain}</p>
      )}

      <div>
        <p className="help">
          {m.registryWording} ({m.sourceRef}: {criterion.sourceRef})
        </p>
        <blockquote lang="en">{criterion.sourceText}</blockquote>
      </div>

      {criterion.uncertaintyNotes.length > 0 && (
        <div>
          <h4>{m.uncertaintyHeading}</h4>
          <ul>
            {criterion.uncertaintyNotes.map((note) => (
              <li key={note} lang="en">
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="next-action">{m.categoryActions[criterion.category]}</p>
    </article>
  );
}
