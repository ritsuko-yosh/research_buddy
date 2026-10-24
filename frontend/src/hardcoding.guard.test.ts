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
  // Reference-prototype leftovers. These belong to the design mock, not the product.
  { label: 'prototype label', pattern: /PROTOTYPE/ },
  { label: 'sample study title', pattern: /Scalp Cooling/ },
  { label: 'sample site name', pattern: /Dana-Farber/ },
  { label: 'sample investigator name', pattern: /Paxman/ },
  { label: 'hardcoded fetch date', pattern: /fetched 2026-10-24/ },
  // Counts must come from the data, never typed into the copy.
  { label: 'numeric example count', pattern: /\b\d+\s+(examples|ejemplos)\b/ },
];

/**
 * Colors belong in styles.css as tokens. Artwork is the exception, because
 * its colors are part of the drawing. Approved artwork is exempt:
 *  - components/art/: the explainer pictures, search loader, and Verification Map icons.
 *  - components/home/DoorIllustration.tsx: the homepage illustration.
 *  - components/BrandMark.tsx: the Visit Ready logo.
 */
const HEX_COLOR_EXEMPT_DIRECTORIES = ['components/art/'];
const HEX_COLOR_EXCEPTIONS = new Set(['components/home/DoorIllustration.tsx', 'components/BrandMark.tsx']);
const HEX_COLOR = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/;

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

  it('contains no literal hex colors outside the token file and the approved artwork', () => {
    const violations: string[] = [];
    for (const file of files) {
      const rel = relative(SRC_ROOT, file).split('\\').join('/');
      if (HEX_COLOR_EXCEPTIONS.has(rel) || HEX_COLOR_EXEMPT_DIRECTORIES.some((dir) => rel.startsWith(dir))) {
        continue;
      }
      readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, index) => {
          if (HEX_COLOR.test(line)) {
            violations.push(`${rel}:${index + 1} [literal hex color] ${line.trim()}`);
          }
        });
    }
    expect(violations).toEqual([]);
  });
});
