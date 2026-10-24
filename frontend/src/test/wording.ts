/**
 * Wording rules for patient-facing text. These are engineering checks on
 * phrasing, not clinical validation.
 *
 * Patient text must not suggest that someone get a new test. Registry wording
 * is excluded from these checks, because it is quoted verbatim.
 */

/** Up to three descriptive words, such as "a new" or "a recent blood", before the noun. */
const ENGLISH_MODIFIERS = String.raw`(?:(?:a|an|the|new|another|medical|blood|lab|kidney|liver|recent)\s+){0,3}`;
const ENGLISH_TEST_NOUN = String.raw`(?:tests?|labs?|scans?)\b`;

const ENGLISH_NEW_TEST_SUGGESTIONS: readonly RegExp[] = [
  /\bmay (?:be )?needed\b/i,
  /\bmay need to\b/i,
  new RegExp(String.raw`\b(?:get|take|order|schedule|book)\s+${ENGLISH_MODIFIERS}${ENGLISH_TEST_NOUN}`, 'i'),
  new RegExp(String.raw`\bneed\s+(?:a|an|another|new)\s+${ENGLISH_MODIFIERS}${ENGLISH_TEST_NOUN}`, 'i'),
];

/** Up to two descriptive words before the noun, such as "una nueva". */
const SPANISH_MODIFIERS = String.raw`(?:(?:una|un|nueva|nuevo|otra|otro)\s+){0,2}`;
const SPANISH_TEST_NOUN = String.raw`(?:prueba|análisis|examen)s?\b`;

const SPANISH_NEW_TEST_SUGGESTIONS: readonly RegExp[] = [
  new RegExp(String.raw`\bnecesit\w*\s+${SPANISH_MODIFIERS}${SPANISH_TEST_NOUN}`, 'i'),
  new RegExp(String.raw`\bobtener\s+${SPANISH_MODIFIERS}${SPANISH_TEST_NOUN}`, 'i'),
  new RegExp(String.raw`\b(?:hacerse|hacer)\s+${SPANISH_MODIFIERS}${SPANISH_TEST_NOUN}`, 'i'),
];

const NEW_TEST_SUGGESTIONS: readonly RegExp[] = [
  ...ENGLISH_NEW_TEST_SUGGESTIONS,
  ...SPANISH_NEW_TEST_SUGGESTIONS,
];

/** Returns every phrase in `text` that could encourage a new medical test. */
export function findNewTestSuggestions(text: string): string[] {
  const hits: string[] = [];
  for (const pattern of NEW_TEST_SUGGESTIONS) {
    const match = text.match(pattern);
    if (match) {
      hits.push(match[0]);
    }
  }
  return hits;
}

/** Collects every string value from a nested object, such as the message catalog. */
export function collectStrings(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value];
  }
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap((child) => collectStrings(child));
  }
  return [];
}

export { NEW_TEST_SUGGESTIONS };
