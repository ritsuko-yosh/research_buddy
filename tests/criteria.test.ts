import { describe, it, expect } from "vitest";
import {
  segmentEligibilityText,
  buildCriteria,
  classifyCriterion,
  detectUncertaintyFlags,
} from "../src/pipeline/criteria.js";

const SAMPLE = `Inclusion Criteria:

* Age > 18 years.
* Participants must have platelets ≥100,000/mcL.
* Patients who have had prior WBRT and/or SRS are eligible but there needs to be unequivocal evidence of progression.

Exclusion Criteria

* Prior treatment with CDK4/6 inhibitor.
* Uncontrolled intercurrent illness including, but not limited to, ongoing or active infection.
* Leptomeningeal involvement of cancer (Cohort 1). Leptomeningeal involvement is allowed for Cohort 2.`;

describe("segmentEligibilityText — source completeness", () => {
  it("splits into ordered inclusion and exclusion blocks", () => {
    const blocks = segmentEligibilityText(SAMPLE);
    const inc = blocks.filter((b) => b.section === "inclusion");
    const exc = blocks.filter((b) => b.section === "exclusion");
    expect(inc.length).toBe(3);
    expect(exc.length).toBe(3);
  });

  it("preserves original wording verbatim (no paraphrase, no omission)", () => {
    const blocks = segmentEligibilityText(SAMPLE);
    const joined = blocks.map((b) => b.text).join("\n");
    expect(joined).toContain("Age > 18 years.");
    expect(joined).toContain("platelets ≥100,000/mcL");
    expect(joined).toContain("Leptomeningeal involvement is allowed for Cohort 2.");
  });

  it("preserves unsegmentable free text as a single whole block", () => {
    const blocks = segmentEligibilityText(
      "Patients must be healthy and willing. See protocol for full details.",
    );
    expect(blocks.length).toBe(1);
    expect(blocks[0]!.section).toBe("unspecified");
  });

  it("returns empty for empty input", () => {
    expect(segmentEligibilityText("")).toEqual([]);
    expect(segmentEligibilityText("   \n  ")).toEqual([]);
  });
});

describe("classifyCriterion — conservative classification", () => {
  it("classifies a standalone age requirement as self_answer", () => {
    const text = "Age > 18 years.";
    const flags = detectUncertaintyFlags(text, "inclusion");
    expect(classifyCriterion(text, "inclusion", flags)).toBe("self_answer");
  });

  it("classifies a lab threshold as check_records", () => {
    const text = "Participants must have platelets ≥100,000/mcL.";
    const flags = detectUncertaintyFlags(text, "inclusion");
    expect(classifyCriterion(text, "inclusion", flags)).toBe("check_records");
  });

  it("routes conditional/exception/treatment-history logic to ask_study_team", () => {
    const text =
      "Patients who have had prior WBRT and/or SRS are eligible but there needs to be unequivocal evidence of progression.";
    const flags = detectUncertaintyFlags(text, "inclusion");
    expect(classifyCriterion(text, "inclusion", flags)).toBe("ask_study_team");
  });

  it("routes cohort-dependent exclusions to ask_study_team", () => {
    const text =
      "Leptomeningeal involvement of cancer (Cohort 1). Leptomeningeal involvement is allowed for Cohort 2.";
    const flags = detectUncertaintyFlags(text, "exclusion");
    expect(classifyCriterion(text, "exclusion", flags)).toBe("ask_study_team");
  });

  it("routes ambiguous + external-reference-only wording to cannot_assess", () => {
    const text =
      "Uncontrolled intercurrent illness as described in Appendix C at the discretion of the investigator.";
    const flags = detectUncertaintyFlags(text, "exclusion");
    expect(classifyCriterion(text, "exclusion", flags)).toBe("cannot_assess");
  });

  it("never returns self_answer for treatment-history requirements", () => {
    const text = "Prior treatment with CDK4/6 inhibitor.";
    const flags = detectUncertaintyFlags(text, "exclusion");
    expect(classifyCriterion(text, "exclusion", flags)).not.toBe("self_answer");
  });

  it("defaults unknown/complex text to ask_study_team (never self_answer)", () => {
    const text = "Must meet all protocol-defined cardiac and neurologic requirements.";
    const flags = detectUncertaintyFlags(text, "inclusion");
    const cat = classifyCriterion(text, "inclusion", flags);
    expect(["ask_study_team", "cannot_assess"]).toContain(cat);
  });
});

describe("buildCriteria — ids, sections, and flags", () => {
  const criteria = buildCriteria(SAMPLE, "NCT00000000", "https://clinicaltrials.gov/study/NCT00000000");

  it("assigns stable ids and a source reference to every criterion", () => {
    for (const c of criteria) {
      expect(c.id).toMatch(/^NCT00000000-(inclusion|exclusion|unspecified)-\d+$/);
      expect(c.sourceReference.nctId).toBe("NCT00000000");
      expect(c.sourceReference.sourceUrl).toContain("NCT00000000");
      expect(c.sourceReference.modulePath).toContain("eligibilityModule");
    }
  });

  it("detects conditional and exception flags on the complex lesion criterion", () => {
    const complex = criteria.find((c) => c.sourceText.includes("WBRT"))!;
    expect(complex.uncertaintyFlags).toContain("treatment_history");
  });

  it("never emits an eligibility verdict field", () => {
    for (const c of criteria) {
      expect(c).not.toHaveProperty("eligible");
      expect(c).not.toHaveProperty("qualifies");
      expect(c).not.toHaveProperty("matchScore");
    }
  });
});
