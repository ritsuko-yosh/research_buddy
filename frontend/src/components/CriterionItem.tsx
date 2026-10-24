import type { Locale, Messages } from '../i18n/strings';
import { sectionLabel } from '../lib/sections';
import type { Criterion } from '../types/trial';
import { TranslationBadge } from './Notices';

interface CriterionItemProps {
  m: Messages;
  locale: Locale;
  criterion: Criterion;
}

/**
 * One requirement. The original registry wording is always visible. The plain
 * explanation follows the selected language. Spanish explanations carry their
 * review label, and missing Spanish is stated rather than silently replaced.
 */
export function CriterionItem({ m, locale, criterion }: CriterionItemProps) {
  const isSpanish = locale === 'es';
  const plain = isSpanish ? criterion.plainExplanation.es : criterion.plainExplanation.en;

  return (
    <article className="criterion">
      <p>
        <span className="tag">{sectionLabel(criterion.section, m)}</span>
      </p>

      <h4>{m.plainHeading}</h4>
      {plain ? (
        <>
          {isSpanish && <TranslationBadge m={m} status={criterion.spanishTranslationStatus} />}
          <p lang={locale}>{plain}</p>
        </>
      ) : (
        <p className="unavailable-note">{isSpanish ? m.noSpanish : m.noPlain}</p>
      )}

      <div>
        <p className="help">
          {m.registryWording} ({m.sourceRef}: {criterion.sourceRef})
        </p>
        <blockquote lang="en">{criterion.sourceText}</blockquote>
      </div>

      {criterion.uncertaintyNotes.length > 0 && (
        <div>
          <h4>{isSpanish ? `${m.uncertaintyHeading} ${m.uncertaintyEnglishOnly}` : m.uncertaintyHeading}</h4>
          <ul>
            {criterion.uncertaintyNotes.map((note, index) => (
              <li key={index} lang="en">
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
