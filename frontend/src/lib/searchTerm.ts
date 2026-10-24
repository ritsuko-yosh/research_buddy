const MIN_LENGTH = 2;
const MAX_LENGTH = 100;

/** Letters, numbers, spaces, and basic punctuation used in medical terms and names. */
const ALLOWED_CHARACTERS = /^[\p{L}\p{N} '\-,()/&.]+$/u;

/**
 * Returns the cleaned condition search term, or null when the input can't be
 * a reasonable search. The term is trimmed, whitespace is collapsed, and the
 * length and characters are checked. The registry query itself is URL-encoded
 * by the backend client.
 */
export function normalizeSearchTerm(input: string): string | null {
  const collapsed = input.trim().replace(/\s+/g, ' ');
  if (collapsed.length < MIN_LENGTH || collapsed.length > MAX_LENGTH) {
    return null;
  }
  if (!ALLOWED_CHARACTERS.test(collapsed)) {
    return null;
  }
  return collapsed;
}
