import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Automated guard against hardcoded production data. It scans every non-test
 * source file and fails if any of these appear:
 *   - an import from the test-only fixtures folder or the sample records
 *   - a literal registry NCT ID (NCT followed by 8 digits)
 * Test files, the test helpers, and the fixtures folder are excluded.
 * This guard checks the source code only. It does not replace the live
 * verification in live.e2e.test.tsx.
 */

// npm test runs from the frontend folder, so the source root is ./src.
const SRC_ROOT = resolve(process.cwd(), 'src');

const EXCLUDED_DIRECTORIES = new Set(['test', 'fixtures']);
const FORBIDDEN_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: 'fixtures import', pattern: /from ['"][^'"]*fixtures\// },
  { label: 'sample records identifier', pattern: /\bSAMPLE_TRIALS\b/ },
  { label: 'literal NCT ID', pattern: /NCT\d{8}/ },
];

function productionSourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (!EXCLUDED_DIRECTORIES.has(entry)) {
        files.push(...productionSourceFiles(full));
      }
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry) && !/\.test\.(ts|tsx)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

describe('hardcoding guard (production source)', () => {
  const files = productionSourceFiles(SRC_ROOT);

  it('scans a non-empty set of production files', () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it('contains no fixture imports, sample records, or literal NCT IDs', () => {
    const violations: string[] = [];
    for (const file of files) {
      const lines = readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, index) => {
        for (const { label, pattern } of FORBIDDEN_PATTERNS) {
          if (pattern.test(line)) {
            violations.push(`${relative(SRC_ROOT, file)}:${index + 1} [${label}] ${line.trim()}`);
          }
        }
      });
    }
    expect(violations).toEqual([]);
  });
});
