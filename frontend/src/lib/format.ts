import type { Locale } from '../i18n/strings';

/**
 * Formats a registry date (YYYY-MM-DD, or an ISO timestamp, using its date part)
 * for display. Returns the supplied "not listed" text when the date is missing.
 */
export function formatRegistryDate(isoDate: string | null, locale: Locale, notListed: string): string {
  if (!isoDate) {
    return notListed;
  }

  const parsed = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return notListed;
  }

  return new Intl.DateTimeFormat(locale === 'es' ? 'es-US' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}
