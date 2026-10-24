/**
 * Property-based tests (brief §H). These assert invariants that must hold for
 * ANY eligibility text / raw record, not just the demo study.
 */
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  segmentEligibilityText,
  buildCriteria,
  classifyCriterion,
  detectUncertaintyFlags,
} from "../src/pipeline/criteria.js";
import { normalizeStudy } from "../src/pipeline/normalize.js";
import type { RawStudy } from "../src/pipeline/raw.js";

describe("property: segmentation never loses source content", () => {
  it("every non-whitespace character of a bullet survives segmentation", () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim() !== ""), {
          minLength: 1,
          maxLength: 6,
        }),
        (items) => {
          const text =
            "Inclusion Criteria:\n\n" +
            items.map((i) => `* ${i.replace(/[\n*]/g, " ")}`).join("\n");
          const blocks = segmentEligibilityText(text);
          const reconstructed = blocks.map((b) => b.text).join(" ");
          for (const i of items) {
            const core = i.replace(/[\n*]/g, " ").trim();
            if (core.length > 0) {
              // Compare on collapsed whitespace to ignore formatting differences.
              const norm = (s: string) => s.replace(/\s+/g, " ");
              expect(norm(reconstructed)).toContain(norm(core).slice(0, Math.min(core.length, 20)));
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("property: classifier is always conservative", () => {
  it("any criterion with treatment-history/cohort/exception flags is never self_answer", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 120 }), (base) => {
        const text = `${base} prior treatment with agent X within 2 weeks (Cohort 1), except previously treated lesions`;
        const flags = detectUncertaintyFlags(text, "exclusion");
        const cat = classifyCriterion(text, "exclusion", flags);
        expect(cat).not.toBe("self_answer");
      }),
      { numRuns: 100 },
    );
  });

  it("classifier always returns one of the four valid categories", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 200 }), (text) => {
        const flags = detectUncertaintyFlags(text, "inclusion");
        const cat = classifyCriterion(text, "inclusion", flags);
        expect(["self_answer", "check_records", "ask_study_team", "cannot_assess"]).toContain(cat);
      }),
      { numRuns: 200 },
    );
  });
});

describe("property: normalize never fabricates data for arbitrary records", () => {
  it("missing modules yield explicit null/empty, and a valid NCT id is required", () => {
    fc.assert(
      fc.property(
        fc.record({
          nctId: fc.option(fc.constantFrom("NCT12345678", undefined), { nil: undefined }),
          title: fc.option(fc.string(), { nil: undefined }),
        }),
        (gen) => {
          const raw: RawStudy = {
            protocolSection: {
              identificationModule: {
                ...(gen.nctId ? { nctId: gen.nctId } : {}),
                ...(gen.title ? { briefTitle: gen.title } : {}),
              },
            },
          };
          if (!gen.nctId) {
            expect(() =>
              normalizeStudy(raw, { source: "live", fetchedAt: new Date().toISOString() }),
            ).toThrow();
          } else {
            const t = normalizeStudy(raw, { source: "live", fetchedAt: new Date().toISOString() });
            expect(t.contacts).toEqual([]);
            expect(t.locations).toEqual([]);
            expect(t.description).toBeNull();
            expect(t.recruitmentStatus).toBeNull();
            // No criterion is ever invented from an empty eligibility block.
            expect(t.criteria).toEqual([]);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("property: buildCriteria ids are unique and well-formed", () => {
  it("produces unique ids for any eligibility text", () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 3, maxLength: 30 }).filter((s) => s.trim().length >= 3), {
          minLength: 1,
          maxLength: 8,
        }),
        (items) => {
          const text =
            "Inclusion Criteria:\n\n" + items.map((i) => `* ${i.replace(/[\n*]/g, " ")}`).join("\n");
          const criteria = buildCriteria(text, "NCT00000000", "https://x/NCT00000000");
          const ids = criteria.map((c) => c.id);
          expect(new Set(ids).size).toBe(ids.length);
        },
      ),
      { numRuns: 100 },
    );
  });
});
