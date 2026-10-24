/**
 * Explicit language-requirement detection (brief §6, §13.5).
 *
 * We detect ONLY explicit stated language requirements in the eligibility text.
 * We NEVER infer interpreter availability or that a study supports a given
 * language. Absence of a requirement is reported as `not_stated`, never as
 * "Spanish supported".
 */

import type {
  Criterion,
  LanguageRequirement,
  LanguageRequirementStatus,
} from "../contract/types.js";

const UNIVERSAL_NOTE =
  "A translated Visit Ready interface does NOT mean this study can serve participants in that language. " +
  "Confirm available languages and interpreter support directly with the study team.";

// Explicit English ability requirements (inclusion-style phrasing).
const ENGLISH_REQUIRED_RE =
  /\b(english[-\s]?speaking|able to (read|speak|understand|communicate in) english|fluent in english|english (language )?(proficiency|fluency|literacy)|must (read|speak|understand) english|comprehension of (the )?english|english[-\s]?language consent)\b/i;

// Explicit requirement for some other named language.
const OTHER_LANGUAGE_RE =
  /\b(able to (read|speak|understand) (spanish|french|mandarin|chinese|portuguese|german)|(spanish|french|mandarin|chinese|portuguese|german)[-\s]?speaking required)\b/i;

// Language is mentioned but not clearly a hard requirement (route to study team).
const AMBIGUOUS_LANG_RE =
  /\b(language|interpreter|translation|non[-\s]?english|limited english|english proficiency)\b/i;

export interface LanguageScanSource {
  /** Raw eligibility text. */
  eligibilityText: string;
  /** Classified criteria (used to attach verbatim evidence snippets). */
  criteria: Criterion[];
}

/**
 * Detect the explicit language requirement for a study from its eligibility
 * text. Preserves verbatim evidence snippets.
 */
export function detectLanguageRequirement(
  src: LanguageScanSource,
): LanguageRequirement {
  const text = src.eligibilityText ?? "";

  const evidenceFor = (re: RegExp): string[] => {
    const hits: string[] = [];
    for (const c of src.criteria) {
      if (re.test(c.sourceText)) hits.push(c.sourceText);
    }
    // Fall back to scanning the raw text if criteria didn't capture it.
    if (hits.length === 0 && re.test(text)) {
      const sentence = text
        .split(/\n+/)
        .find((l) => re.test(l));
      if (sentence) hits.push(sentence.trim());
    }
    return hits;
  };

  let status: LanguageRequirementStatus;
  let evidence: string[] = [];

  if (ENGLISH_REQUIRED_RE.test(text)) {
    status = "explicit_english_required";
    evidence = evidenceFor(ENGLISH_REQUIRED_RE);
  } else if (OTHER_LANGUAGE_RE.test(text)) {
    status = "explicit_other";
    evidence = evidenceFor(OTHER_LANGUAGE_RE);
  } else if (AMBIGUOUS_LANG_RE.test(text)) {
    status = "ambiguous";
    evidence = evidenceFor(AMBIGUOUS_LANG_RE);
  } else {
    status = "not_stated";
    evidence = [];
  }

  const note =
    status === "not_stated"
      ? `No explicit language requirement was found in the public registry listing. This is shown as "not stated" — it does not indicate whether any particular language is supported. ${UNIVERSAL_NOTE}`
      : status === "ambiguous"
        ? `Language-related wording was found but it is not clearly a hard requirement. Ask the study team to clarify. ${UNIVERSAL_NOTE}`
        : `An explicit language requirement was found in the listing (see evidence). ${UNIVERSAL_NOTE}`;

  return { status, evidence, note };
}
