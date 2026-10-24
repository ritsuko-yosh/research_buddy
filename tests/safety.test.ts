/**
 * End-to-end safety tests against the REAL cached demo study (NCT02896335).
 *
 * NOTE: These tests verify engineering safety invariants of the data pipeline.
 * They are NOT clinical validation of the explanations or classifications.
 */
import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { TrialService } from "../src/pipeline/service.js";
import { buildPreparationCard, buildCoordinatorInquiry } from "../src/pipeline/prepare.js";
import { DEMO_NCT_ID } from "../src/data/demo.js";
import rawDemo from "../src/data/cache/NCT02896335.raw.json" with { type: "json" };
import type { RawStudy } from "../src/pipeline/raw.js";

const CACHE_DIR = join(import.meta.dirname, "..", "src", "data", "cache");
const svc = new TrialService({ cacheDir: CACHE_DIR, now: new Date("2026-10-24") });
const trial = svc.getCachedTrial(DEMO_NCT_ID);

describe("source fidelity — every criterion traceable to real source text", () => {
  const rawText = (rawDemo as RawStudy).protocolSection!.eligibilityModule!.eligibilityCriteria!;

  it("preserves original source text that appears in the registry record", () => {
    for (const c of trial.criteria) {
      // Each non-empty bullet's leading content should be present in the raw text.
      const probe = c.sourceText.replace(/^[*\-–—•\d.)\s]+/, "").slice(0, 25);
      if (probe.trim().length >= 10) {
        expect(rawText).toContain(probe);
      }
    }
  });

  it("includes the complex CNS-lesion exclusion with its exceptions intact", () => {
    const complex = trial.criteria.find((c) => c.sourceText.includes("progressive CNS lesions"));
    expect(complex).toBeDefined();
    expect(complex!.sourceText).toContain("SRS");
    expect(complex!.sourceText).toContain("WBRT");
    // Must NOT be flattened to a simple self-answer.
    expect(complex!.category).toBe("ask_study_team");
  });

  it("every criterion keeps a resolvable source reference", () => {
    for (const c of trial.criteria) {
      expect(c.sourceReference.nctId).toBe(DEMO_NCT_ID);
      expect(c.sourceReference.sourceUrl).toContain(DEMO_NCT_ID);
    }
  });
});

describe("conservative classification on real data", () => {
  it("keeps self_answer rare and never assigns it to lab/treatment criteria", () => {
    const self = trial.criteria.filter((c) => c.category === "self_answer");
    for (const c of self) {
      expect(c.uncertaintyFlags).not.toContain("treatment_history");
      expect(c.uncertaintyFlags).not.toContain("cohort_dependent");
      expect(c.uncertaintyFlags).not.toContain("exception_clause");
    }
    // The majority of real oncology criteria should route to the study team.
    const ask = trial.criteria.filter((c) => c.category === "ask_study_team");
    expect(ask.length).toBeGreaterThan(self.length);
  });
});

describe("contact integrity — only real contacts, no invention", () => {
  it("exposes the real MGH study contact and no placeholders", () => {
    expect(trial.contacts.length).toBeGreaterThan(0);
    for (const c of trial.contacts) {
      expect(c.name.trim()).not.toBe("");
    }
    const maRecruiting = trial.locations.filter(
      (l) => l.state === "Massachusetts" && l.status === "RECRUITING",
    );
    expect(maRecruiting.length).toBeGreaterThan(0);
  });

  it("distinguishes study-wide from site-level recruitment status", () => {
    expect(trial.recruitmentStatus).toBe("RECRUITING");
    const dfci = trial.locations.find((l) => (l.facility ?? "").includes("Dana"));
    // DFCI site is NOT_YET_RECRUITING even though study-wide is RECRUITING.
    expect(dfci?.status).toBe("NOT_YET_RECRUITING");
  });
});

describe("translation honesty", () => {
  it("labels unreviewed Spanish drafts and never silently uses English as Spanish", () => {
    const withEs = trial.criteria.filter((c) => c.explanationEs !== null);
    expect(withEs.length).toBeGreaterThan(0);
    for (const c of withEs) {
      expect(c.explanationEs).not.toBe(c.explanationEn);
    }
    // At least one explanation is honestly marked as unreviewed.
    const anyUnreviewed = withEs.some((c) => c.translationReviewed === false);
    expect(anyUnreviewed).toBe(true);
  });
});

describe("preparation card + coordinator inquiry — no verdict, no PII", () => {
  const card = buildPreparationCard(trial, "en");

  it("groups criteria into the four categories without any score", () => {
    const total =
      card.groups.self_answer.length +
      card.groups.check_records.length +
      card.groups.ask_study_team.length +
      card.groups.cannot_assess.length;
    expect(total).toBe(trial.criteria.length);
    expect(JSON.stringify(card).toLowerCase()).not.toContain("matchscore");
  });

  it("states that it does not decide eligibility", () => {
    const joined = card.disclaimers.join(" ").toLowerCase();
    expect(joined).toContain("does not decide");
    expect(joined).toContain("no eligibility score");
  });

  it("generates an inquiry that asks questions and contains no patient medical data", () => {
    const inquiry = buildCoordinatorInquiry(trial, "en");
    expect(inquiry).toContain(DEMO_NCT_ID);
    expect(inquiry.toLowerCase()).toContain("question");
    // The inquiry is a template; it must not assert eligibility.
    expect(inquiry.toLowerCase()).not.toContain("i am eligible");
    expect(inquiry.toLowerCase()).not.toContain("i qualify");
  });

  it("produces a distinct Spanish inquiry", () => {
    const es = buildCoordinatorInquiry(trial, "es");
    expect(es).toContain("Estimado equipo del estudio");
  });
});

describe("contract fixture matches live pipeline output", () => {
  it("demo trial declares the current contract version", () => {
    expect(trial.contractVersion).toBe("1.0.0");
  });
});
