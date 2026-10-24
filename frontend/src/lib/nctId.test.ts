import { describe, expect, it } from 'vitest';
import { normalizeNctId } from './nctId';

describe('normalizeNctId', () => {
  it('accepts a well-formed ID and normalizes case and whitespace', () => {
    expect(normalizeNctId('  nct90000001 ')).toBe('NCT90000001');
  });

  it.each(['', 'NCT', 'NCT1234567', 'NCT123456789', 'ABC90000001', 'NCT9000000X'])(
    'rejects malformed input %j',
    (input) => {
      expect(normalizeNctId(input)).toBeNull();
    },
  );
});
