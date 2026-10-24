const NCT_PATTERN = /^NCT\d{8}$/;

/**
 * Returns the normalized NCT ID (trimmed, upper case) or null if the input
 * does not match the registry format of "NCT" followed by 8 digits.
 */
export function normalizeNctId(input: string): string | null {
  const candidate = input.trim().toUpperCase();
  return NCT_PATTERN.test(candidate) ? candidate : null;
}
