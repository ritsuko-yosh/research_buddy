/**
 * Eligibility criteria extraction + conservative Verification Map classification.
 *
 * SAFETY PRINCIPLES (brief §5, §13):
 *  - Original wording is preserved verbatim in `sourceText`. We never rewrite it.
 *  - We segment the registry's free-text eligibility block into inclusion/exclusion
 *    bullets. When segmentation is NOT safe (no recognizable structure), we preserve
 *    the whole block as a single criterion flagged `unsegmentable`.
 *  - Classification is CONSERVATIVE: when in doubt we escalate toward
 *    `ask_study_team` / `cannot_assess`, never toward `self_answer`.
 *  - We never emit a yes/no question or an eligibility verdict.
 */

import type {
  Criterion,
  CriterionSection,
  UncertaintyFlag,
  VerificationCategory,
} from "../contract/types.js";

export interface RawCriterionBlock {
  section: CriterionSection;
  index: number;
  text: string;
}

const INCLUSION_HEADER = /^\s*(key\s+)?inclusion\s+criteria\s*:?\s*$/i;
const EXCLUSION_HEADER = /^\s*(key\s+)?exclusion\s+criteria\s*:?\s*$/i;

/**
 * Split the registry eligibility free-text into ordered criterion blocks,
 * preserving section context and original wording.
 *
 * Returns a single `unsegmentable` block when the text has no recognizable
 * bullet/section structure, so no requirement is ever silently dropped.
 */
export function segmentEligibilityText(raw: string): RawCriterionBlock[] {
  const text = (raw ?? "").replace(/\r\n/g, "\n");
  if (text.trim() === "") return [];

  const lines = text.split("\n");
  let currentSection: CriterionSection = "unspecified";
  let sawHeader = false;

  // Grouped bullet accumulation: a bullet plus its indented sub-lines stay together
  // so nested exceptions are never severed from their parent requirement.
  interface Acc {
    section: CriterionSection;
    lines: string[];
  }
  const groups: Acc[] = [];
  let current: Acc | null = null;

  const bulletRe = /^(\s*)([*\-–—•]|\d+[.)])\s+(.*)$/;

  const flush = () => {
    if (current && current.lines.join("\n").trim() !== "") groups.push(current);
    current = null;
  };

  for (const line of lines) {
    if (INCLUSION_HEADER.test(line)) {
      flush();
      currentSection = "inclusion";
      sawHeader = true;
      continue;
    }
    if (EXCLUSION_HEADER.test(line)) {
      flush();
      currentSection = "exclusion";
      sawHeader = true;
      continue;
    }

    const m = bulletRe.exec(line);
    const leadingWs = /^(\s*)/.exec(line)?.[1]?.length ?? 0;

    if (m) {
      const indent = m[1]?.length ?? 0;
      if (indent === 0) {
        // Top-level bullet starts a new criterion group.
        flush();
        current = { section: currentSection, lines: [line] };
      } else if (current) {
        // Indented sub-bullet belongs to the current criterion (exception/detail).
        current.lines.push(line);
      } else {
        current = { section: currentSection, lines: [line] };
      }
    } else if (line.trim() === "") {
      // Blank line: keep within a group (handles paragraph-style exclusions).
      if (current) current.lines.push(line);
    } else if (current && leadingWs > 0) {
      // Continuation / wrapped line of the current bullet.
      current.lines.push(line);
    } else if (current) {
      // Non-bulleted paragraph line directly after a bullet: keep attached.
      current.lines.push(line);
    } else {
      // Free paragraph before any bullet — start a group to preserve it.
      current = { section: currentSection, lines: [line] };
    }
  }
  flush();

  // If we never found headers or bullets, preserve the whole thing intact.
  if (!sawHeader && groups.length <= 1) {
    return [{ section: "unspecified", index: 0, text: text.trim() }];
  }

  const blocks: RawCriterionBlock[] = [];
  const perSectionIndex: Record<string, number> = {};
  for (const g of groups) {
    const t = g.lines.join("\n").replace(/\s+$/g, "").replace(/^\n+/, "");
    if (t.trim() === "") continue;
    const idx = (perSectionIndex[g.section] ?? 0);
    perSectionIndex[g.section] = idx + 1;
    blocks.push({ section: g.section, index: idx, text: t.trim() });
  }
  return blocks;
}

// --- Signal detectors (lexical heuristics, NOT medical judgments) ---

const CONDITIONAL_RE = /\b(if|unless|provided that|as long as|only if|in the event)\b/i;
const EXCEPTION_RE = /\b(except|exception|other than|aside from|but not|allowed if|eligible if|unless)\b/i;
const COHORT_RE = /\b(cohort|arm|group)\s*\d|\b(cohort|arm)\b/i;
const TREATMENT_HISTORY_RE =
  /\b(prior|previous|previously|history of|within \d+\s*(day|week|month|year)|washout|pre-?treated|treated with|no prior)\b/i;
const INSTITUTIONAL_RE =
  /\b(institutional (upper|lower)? ?limit|upper limit of normal|uln|per protocol|per institution|local guidelines)\b/i;
const EXTERNAL_REF_RE = /\b(appendix|section \d|see table|https?:\/\/|refer to|as described in section)\b/i;
const THRESHOLD_RE =
  /(≥|≤|<|>|<=|>=)\s*\d|\b\d+(\.\d+)?\s*(mg|mcg|ml|mcl|g\/dl|mm|msec|ms|years?|months?|weeks?|days?|mcl|cells|%|ng\/ml|mmhg)\b|\b\d{2,}(,\d{3})+\b/i;
const AMBIGUOUS_RE =
  /\b(adequate|appropriate|significant|clinically|uncontrolled|unstable|as needed|at the discretion|in the opinion of|satisfactory|acceptable)\b/i;

// Simple self-answerable facts: age / sex. Kept deliberately narrow.
const SIMPLE_AGE_RE = /\bage[sd]?\b|\byears? old\b|\baged\b/i;
// A standalone age requirement (e.g. "Age > 18 years", "Participant is ≥ 18
// years old"), with no lab/records context. This is the canonical self_answer
// example (brief §5 Category 1).
const STANDALONE_AGE_RE =
  /(\bage\b[^.]{0,40}\b\d{1,3}\s*years?\b|\b(≥|>=|>|at least)\s*\d{1,3}\s*years?\s*old\b|\b\d{1,3}\s*years?\s*(old|of age)\b)/i;
const SIMPLE_SEX_RE = /\b(male|female|men|women)\b/i;
const CONSENT_RE = /\b(informed consent|willing(ness)? to sign|ability to understand)\b/i;

// Lab / records markers: things a portal/record would contain.
const RECORDS_RE =
  /\b(leukocytes|neutrophil|platelets|hemoglobin|bilirubin|ast|alt|sgot|sgpt|creatinine|egfr|clearance|qtc|ecog|karnofsky|ejection fraction|viral load|hbsag|hcv|hbv|biopsy|histolog|cytolog|measurable disease|lesion)\b/i;

/** Detect the honest uncertainty/complexity flags present in a criterion. */
export function detectUncertaintyFlags(
  text: string,
  _section: CriterionSection,
): UncertaintyFlag[] {
  const flags = new Set<UncertaintyFlag>();
  if (CONDITIONAL_RE.test(text)) flags.add("conditional_logic");
  if (EXCEPTION_RE.test(text)) flags.add("exception_clause");
  if (COHORT_RE.test(text)) flags.add("cohort_dependent");
  if (TREATMENT_HISTORY_RE.test(text)) flags.add("treatment_history");
  if (INSTITUTIONAL_RE.test(text)) flags.add("institutional_reference");
  if (EXTERNAL_REF_RE.test(text)) flags.add("external_reference");
  if (THRESHOLD_RE.test(text)) flags.add("medical_threshold");
  if (AMBIGUOUS_RE.test(text)) flags.add("ambiguous_wording");
  return [...flags];
}

/**
 * Conservative classifier. Order of precedence is deliberately safety-first:
 *
 *  1. If the requirement is ambiguous/underspecified or only points to external
 *     material we don't have -> `cannot_assess`.
 *  2. If it carries conditional/exception/cohort/treatment-history complexity, or
 *     is a protocol-specific medical requirement -> `ask_study_team`.
 *  3. If it references lab values / measurements that live in a medical record,
 *     and is not otherwise complex -> `check_records`.
 *  4. Only truly simple self-knowable facts (age, sex, consent) with NO other
 *     complexity signals -> `self_answer`.
 *  5. Anything we cannot confidently place -> `ask_study_team` (never `self_answer`).
 */
export function classifyCriterion(
  text: string,
  _section: CriterionSection,
  flags: UncertaintyFlag[],
): VerificationCategory {
  const f = new Set(flags);

  // Unsegmentable preserved blocks are inherently too coarse to self-assess.
  if (f.has("unsegmentable")) return "ask_study_team";

  // 1. Cannot assess: ambiguous, or depends on material not in the public record.
  const onlyExternalOrAmbiguous =
    (f.has("ambiguous_wording") || f.has("external_reference")) &&
    !RECORDS_RE.test(text);
  if (onlyExternalOrAmbiguous) return "cannot_assess";

  // 2. Ask the study team: any complex/conditional/cohort/treatment logic.
  if (
    f.has("conditional_logic") ||
    f.has("exception_clause") ||
    f.has("cohort_dependent") ||
    f.has("treatment_history") ||
    f.has("external_reference")
  ) {
    return "ask_study_team";
  }

  // 3a. Standalone age requirement is self-answerable even though it contains a
  //     number. Only when there is NO records/lab context and no other complex
  //     signals beyond the age threshold itself.
  const onlyThresholdFlag =
    [...f].every((x) => x === "medical_threshold");
  if (
    STANDALONE_AGE_RE.test(text) &&
    !RECORDS_RE.test(text) &&
    onlyThresholdFlag
  ) {
    return "self_answer";
  }

  // 3. Check records: lab/measurement data a patient portal would hold.
  if ((f.has("medical_threshold") || RECORDS_RE.test(text)) && !f.has("ambiguous_wording")) {
    return "check_records";
  }

  // 4. Self answer: ONLY narrow, self-knowable facts with no other signals.
  const isSimpleSelf =
    (SIMPLE_AGE_RE.test(text) || SIMPLE_SEX_RE.test(text) || CONSENT_RE.test(text)) &&
    !RECORDS_RE.test(text) &&
    f.size === 0;
  if (isSimpleSelf) return "self_answer";

  // 5. Default conservative fallback.
  return "ask_study_team";
}

/**
 * Build fully-classified `Criterion` objects from raw eligibility text.
 *
 * @param rawText  The registry `eligibilityCriteria` free text.
 * @param nctId    Owning study NCT id.
 * @param sourceUrl Deep link to the study record.
 */
export function buildCriteria(
  rawText: string,
  nctId: string,
  sourceUrl: string,
): Criterion[] {
  const blocks = segmentEligibilityText(rawText);
  const eligibilityUrl = `${sourceUrl}#eligibility`;

  return blocks.map((b) => {
    const flags = detectUncertaintyFlags(b.text, b.section);
    // A single preserved whole-text block is marked unsegmentable.
    if (blocks.length === 1 && b.section === "unspecified") {
      flags.push("unsegmentable");
    }
    const category = classifyCriterion(b.text, b.section, flags);
    return {
      id: `${nctId}-${b.section}-${b.index}`,
      sourceText: b.text,
      section: b.section,
      explanationEn: null,
      explanationEs: null,
      translationReviewed: false,
      category,
      sourceReference: {
        nctId,
        modulePath: "protocolSection.eligibilityModule.eligibilityCriteria",
        section: b.section,
        index: b.index,
        sourceUrl: eligibilityUrl,
      },
      uncertaintyFlags: flags,
    };
  });
}
