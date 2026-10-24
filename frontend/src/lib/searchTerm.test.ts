import { describe, expect, it } from 'vitest';
import { normalizeSearchTerm } from './searchTerm';

describe('normalizeSearchTerm', () => {
  it.each([
    ['asthma', 'asthma'],
    ['  breast   cancer  ', 'breast cancer'],
    ["Crohn's disease", "Crohn's disease"],
    ['Type 2 diabetes (adults)', 'Type 2 diabetes (adults)'],
    ['COVID-19, long', 'COVID-19, long'],
  ])('accepts %j as %j', (input, expected) => {
    expect(normalizeSearchTerm(input)).toBe(expected);
  });

  it.each([
    ['empty input', ''],
    ['whitespace only', '   '],
    ['single character', 'a'],
    ['over 100 characters', 'x'.repeat(101)],
    ['markup', '<script>alert(1)</script>'],
    ['query operators', 'asthma OR 1=1'],
    ['semicolon injection', 'asthma; drop'],
  ])('rejects %s', (_label, input) => {
    expect(normalizeSearchTerm(input)).toBeNull();
  });
});
