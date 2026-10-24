import { describe, it, expect } from "vitest";
import { detectLanguageRequirement } from "../src/pipeline/language.js";
import { buildCriteria } from "../src/pipeline/criteria.js";

function scan(text: string) {
  const criteria = buildCriteria(text, "NCT00000000", "https://clinicaltrials.gov/study/NCT00000000");
  return detectLanguageRequirement({ eligibilityText: text, criteria });
}

describe("language requirement detection", () => {
  it("detects an explicit English requirement with verbatim evidence", () => {
    const r = scan("Inclusion Criteria:\n\n* English-speaking participants able to read English.");
    expect(r.status).toBe("explicit_english_required");
    expect(r.evidence.length).toBeGreaterThan(0);
    expect(r.evidence[0]!.toLowerCase()).toContain("english");
  });

  it("reports not_stated when no language requirement exists (never claims support)", () => {
    const r = scan("Inclusion Criteria:\n\n* Age > 18 years.\n* Platelets ≥100,000/mcL.");
    expect(r.status).toBe("not_stated");
    expect(r.evidence).toEqual([]);
    expect(r.note.toLowerCase()).toContain("not");
  });

  it("flags ambiguous language wording rather than guessing", () => {
    const r = scan("Inclusion Criteria:\n\n* Interpreter services may be discussed with the team.");
    expect(r.status).toBe("ambiguous");
  });

  it("never infers Spanish support or interpreter availability", () => {
    const r = scan("Inclusion Criteria:\n\n* Age > 18 years.");
    expect(r.note.toLowerCase()).toContain("does not mean");
    expect(JSON.stringify(r).toLowerCase()).not.toContain("spanish supported");
  });
});
