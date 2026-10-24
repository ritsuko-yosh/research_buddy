/**
 * Curated plain-language explanations (English + prepared Spanish) for selected
 * demonstration studies (brief §D, §F).
 *
 * SAFETY:
 *  - Explanations are ADDITIVE and never replace the original `sourceText`.
 *  - They preserve numbers, units and time windows and do not infer eligibility.
 *  - Spanish entries are prepared translations. `translationReviewed` records
 *    honestly whether a bilingual human reviewed them; unreviewed drafts MUST be
 *    labeled in the UI.
 *  - Keyed by a stable fragment of the original source text so we only attach an
 *    explanation when it genuinely matches the preserved criterion.
 */

export interface CuratedExplanation {
  /** Lower-cased substring that must appear in the criterion's sourceText. */
  match: string;
  explanationEn: string;
  explanationEs: string | null;
  /** True only if a bilingual human reviewed the Spanish text. */
  translationReviewed: boolean;
}

/** nctId -> list of curated explanations (matched by substring). */
export const CURATED: Record<string, CuratedExplanation[]> = {
  NCT02896335: [
    {
      match: "age \\> 18 years",
      explanationEn:
        "You must be older than 18 years of age to take part. This is something you can confirm yourself.",
      explanationEs:
        "Debe tener más de 18 años para participar. Esto es algo que usted mismo puede confirmar.",
      translationReviewed: true,
    },
    {
      match: "measurable disease in the cns",
      explanationEn:
        "The study requires at least one brain/spinal (CNS) lesion that can be measured, at least 10 mm in one dimension. Whether a lesion meets this is determined from your imaging by the study team — not something to self-assess.",
      explanationEs:
        "El estudio requiere al menos una lesión en el cerebro o la médula (SNC) que se pueda medir, de al menos 10 mm en una dimensión. Si una lesión cumple esto lo determina el equipo del estudio a partir de sus imágenes; no es algo que usted deba evaluar por su cuenta.",
      translationReviewed: true,
    },
    {
      match: "progressive cns lesions",
      explanationEn:
        "There are several ways a lesion can count as 'progressive', including lesions already treated by radiation (SRS/WBRT) or surgery under specific conditions. This has exceptions and is decided by the study team from your records.",
      explanationEs:
        "Hay varias formas en que una lesión puede considerarse 'progresiva', incluidas lesiones ya tratadas con radiación (SRS/WBRT) o cirugía bajo condiciones específicas. Esto tiene excepciones y lo decide el equipo del estudio a partir de sus registros.",
      // Prepared but NOT yet reviewed by a bilingual clinician — must be labeled.
      translationReviewed: false,
    },
    {
      match: "normal organ and marrow function",
      explanationEn:
        "The study lists specific blood and organ lab values (for example platelets ≥100,000/mcL, hemoglobin ≥9 g/dL, creatinine clearance ≥60 or ≥30 mL/min depending on cohort). These are results that may already be in your medical records. Do not get new tests just to check this — bring existing results and ask the study team.",
      explanationEs:
        "El estudio enumera valores específicos de laboratorio de sangre y órganos (por ejemplo, plaquetas ≥100.000/mcL, hemoglobina ≥9 g/dL, aclaramiento de creatinina ≥60 o ≥30 mL/min según el grupo). Estos resultados pueden estar ya en sus registros médicos. No se haga pruebas nuevas solo para verificar esto; lleve los resultados existentes y pregunte al equipo del estudio.",
      translationReviewed: false,
    },
    {
      match: "prior treatment with cdk4/6 inhibitor",
      explanationEn:
        "If you have previously received a CDK4/6 inhibitor medication, that affects eligibility. Whether a past medication counts is a treatment-history question for the study team.",
      explanationEs:
        "Si anteriormente recibió un medicamento inhibidor de CDK4/6, eso afecta la elegibilidad. Si un medicamento anterior cuenta es una pregunta sobre el historial de tratamiento para el equipo del estudio.",
      translationReviewed: false,
    },
    {
      match: "willingness to sign a written informed consent",
      explanationEn:
        "You need to be able to understand and willingly sign the written consent document. You can confirm your willingness yourself.",
      explanationEs:
        "Debe poder entender y firmar voluntariamente el documento de consentimiento por escrito. Usted mismo puede confirmar su disposición.",
      translationReviewed: true,
    },
  ],

  NCT04986579: [
    {
      match: "participant is ≥ 18 years old",
      explanationEn:
        "You must be 18 years or older to take part. This is something you can confirm yourself.",
      explanationEs:
        "Debe tener 18 años o más para participar. Esto es algo que usted mismo puede confirmar.",
      translationReviewed: true,
    },
    {
      match: "hair present at baseline",
      explanationEn:
        "You need to have hair at the start of the study (this trial studies scalp cooling to reduce hair loss). You can confirm this yourself.",
      explanationEs:
        "Debe tener cabello al inicio del estudio (este ensayo estudia el enfriamiento del cuero cabelludo para reducir la caída del cabello). Usted mismo puede confirmarlo.",
      translationReviewed: true,
    },
    {
      match: "one of the following full dose chemotherapy regimens",
      explanationEn:
        "One of several specific chemotherapy regimens (for example sacituzumab govitecan, trastuzumab deruxtecan, or eribulin) must be planned for at least 4 cycles. Your planned treatment is decided with your oncology team — ask the study team whether your regimen fits.",
      explanationEs:
        "Debe estar planificado uno de varios regímenes de quimioterapia específicos (por ejemplo, sacituzumab govitecan, trastuzumab deruxtecan o eribulina) durante al menos 4 ciclos. Su tratamiento planificado se decide con su equipo de oncología; pregunte al equipo del estudio si su régimen corresponde.",
      translationReviewed: false,
    },
    {
      match: "baseline alopecia",
      explanationEn:
        "Existing hair loss at the start (graded using CTCAE 5.0, see Appendix B) affects eligibility. The exact grading isn't in the public listing (it points to an appendix), so this is best confirmed with the study team.",
      explanationEs:
        "La caída de cabello ya presente al inicio (clasificada con CTCAE 5.0, ver Apéndice B) afecta la elegibilidad. La clasificación exacta no está en la ficha pública (remite a un apéndice), por lo que es mejor confirmarlo con el equipo del estudio.",
      translationReviewed: false,
    },
    {
      match: "personal history of migraines",
      explanationEn:
        "A diagnosed history of migraines or tension/cluster headaches affects eligibility, but there is an exception if a past problem is now resolved — decided at the Principal Investigator's discretion. This is a judgment for the study team, not a simple yes/no.",
      explanationEs:
        "Un historial diagnosticado de migrañas o cefaleas tensionales o en racimo afecta la elegibilidad, pero hay una excepción si un problema pasado ya está resuelto, a criterio del Investigador Principal. Esto es un juicio para el equipo del estudio, no un simple sí/no.",
      translationReviewed: false,
    },
  ],
};
