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

/**
 * Curated, static plain-language SUMMARY of a study's public registry
 * description ("About this study"). This is the free, safe alternative to a
 * live LLM: the summary is written ahead of time, faithfully condenses the
 * registry `briefSummary`, and adds no new facts or eligibility claims.
 *
 * SAFETY:
 *  - Additive only: the ORIGINAL registry description is always still shown
 *    (the UI keeps it available alongside/below this summary).
 *  - `reviewed` records honestly whether a human has verified the summary.
 *    Until then the UI labels it as drafted/unreviewed.
 */
export interface StudySummary {
  summaryEn: string;
  summaryEs: string | null;
  /** True only after a human has reviewed the summary for accuracy. */
  reviewed: boolean;
}

/**
 * nctId -> plain-language study summary. Faithful condensations of each study's
 * real ClinicalTrials.gov brief summary. Marked unreviewed until a teammate
 * verifies them; the UI labels unreviewed summaries accordingly.
 */
export const STUDY_SUMMARIES: Record<string, StudySummary> = {
  NCT02896335: {
    summaryEn:
      "This study is testing two drugs — palbociclib and pembrolizumab — as a possible treatment for cancer that has spread to the brain or spinal cord (central nervous system). It focuses on people whose CNS lesions have grown or returned, including some who have had prior radiation or surgery. The study team decides who fits based on your scans and medical history.",
    summaryEs:
      "Este estudio evalúa dos medicamentos — palbociclib y pembrolizumab — como posible tratamiento para el cáncer que se ha diseminado al cerebro o la médula espinal (sistema nervioso central). Se centra en personas cuyas lesiones del SNC han crecido o reaparecido, incluidas algunas que han recibido radiación o cirugía previa. El equipo del estudio decide quién cumple los requisitos según sus imágenes e historial médico.",
    reviewed: false,
  },
  NCT04986579: {
    summaryEn:
      "This study looks at scalp cooling — using the Paxman Scalp Cooling System — to see whether it can reduce hair loss in people with metastatic breast cancer who are starting certain chemotherapy regimens. Participants choose whether to use scalp cooling, and the study follows how their hair responds.",
    summaryEs:
      "Este estudio evalúa el enfriamiento del cuero cabelludo — con el sistema Paxman — para ver si puede reducir la caída del cabello en personas con cáncer de mama metastásico que comienzan ciertos regímenes de quimioterapia. Los participantes eligen si usar el enfriamiento, y el estudio observa cómo responde su cabello.",
    reviewed: false,
  },
  NCT05349227: {
    summaryEn:
      "This study explores whether a digital health coaching program can help people who have finished their main cancer treatment. About 625 people with different cancer types take part. One group gets 6 months of digital coaching first, then 6 months of monitoring; the other group is monitored first, then coached. Both groups share questionnaires, clinical data, wearable-device data, and stool (microbiome) samples. The goal is to see if digital coaching can improve how people do after treatment.",
    summaryEs:
      "Este estudio explora si un programa digital de asesoría de salud puede ayudar a las personas que terminaron su tratamiento principal contra el cáncer. Participan unas 625 personas con distintos tipos de cáncer. Un grupo recibe primero 6 meses de asesoría digital y luego 6 meses de seguimiento; el otro grupo se monitorea primero y recibe asesoría después. Ambos grupos comparten cuestionarios, datos clínicos, datos de dispositivos portátiles y muestras de microbioma (heces). El objetivo es ver si la asesoría digital puede mejorar la evolución tras el tratamiento.",
    reviewed: false,
  },
  NCT06052488: {
    summaryEn:
      "This study tests whether a group exercise program called 'Strength After Breast Cancer' can be run in an outpatient physical therapy clinic to improve physical function for women after breast cancer treatment. It looks at whether the program is practical to deliver and what would help offer it at other clinics. Participants fill out questionnaires before and after the program and take part in interviews afterward.",
    summaryEs:
      "Este estudio evalúa si un programa de ejercicio en grupo llamado 'Strength After Breast Cancer' puede ofrecerse en una clínica ambulatoria de fisioterapia para mejorar la función física de mujeres tras el tratamiento del cáncer de mama. Analiza si el programa es práctico de implementar y qué ayudaría a ofrecerlo en otras clínicas. Las participantes completan cuestionarios antes y después del programa y participan en entrevistas al finalizar.",
    reviewed: false,
  },
  NCT02012699: {
    summaryEn:
      "This is a research repository (called iCaRe2), not a treatment study. It collects and manages standardized health information and biological samples from consenting adults — cancer patients, high-risk individuals, and healthy controls — including many from small and rural hospitals. Researchers use it as a shared resource to study what causes cancer and to develop better prevention, screening, early detection, and treatment.",
    summaryEs:
      "Este es un repositorio de investigación (llamado iCaRe2), no un estudio de tratamiento. Recopila y gestiona información de salud estandarizada y muestras biológicas de adultos que dan su consentimiento — pacientes con cáncer, personas de alto riesgo y controles sanos — incluidos muchos de hospitales pequeños y rurales. Los investigadores lo usan como recurso compartido para estudiar las causas del cáncer y desarrollar mejor prevención, detección temprana y tratamiento.",
    reviewed: false,
  },
};

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
