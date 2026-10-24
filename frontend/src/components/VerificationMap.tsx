import { useState } from 'react';
import type { Locale, Messages } from '../i18n/strings';
import { CATEGORY_ORDER, groupByCategory } from '../lib/verificationMap';
import type { Criterion, VerificationCategory } from '../types/trial';
import { CriterionItem } from './CriterionItem';

/** Items shown before the patient chooses to see the rest of a group. */
const PREVIEW_COUNT = 3;

interface VerificationMapProps {
  m: Messages;
  locale: Locale;
  criteria: readonly Criterion[];
}

export function VerificationMap({ m, locale, criteria }: VerificationMapProps) {
  const groups = groupByCategory(criteria);

  return (
    <section aria-labelledby="map-heading">
      <h2 id="map-heading">{m.mapHeading}</h2>
      <p className="help">{m.mapIntro}</p>
      {CATEGORY_ORDER.map((category) => (
        <CategoryGroup key={category} m={m} locale={locale} category={category} items={groups[category]} />
      ))}
    </section>
  );
}

interface CategoryGroupProps {
  m: Messages;
  locale: Locale;
  category: VerificationCategory;
  items: Criterion[];
}

function CategoryGroup({ m, locale, category, items }: CategoryGroupProps) {
  const [expanded, setExpanded] = useState(false);
  const headingId = `map-heading-${category}`;
  const listId = `map-list-${category}`;
  const visible = expanded ? items : items.slice(0, PREVIEW_COUNT);
  const hasMore = items.length > PREVIEW_COUNT;

  return (
    <section className={`map-group cat-${category}`} aria-labelledby={headingId}>
      <h3 id={headingId}>
        {m.categoryLabels[category]} <span className="count">({items.length})</span>
      </h3>

      {items.length === 0 ? (
        <p className="help">{m.catEmpty}</p>
      ) : (
        <ul id={listId}>
          {visible.map((criterion) => (
            <li key={criterion.id}>
              <CriterionItem m={m} locale={locale} criterion={criterion} />
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <button
          type="button"
          className="link-button"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? m.showFewer : m.showAll(items.length)}
        </button>
      )}
    </section>
  );
}
