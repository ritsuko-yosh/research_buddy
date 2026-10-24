import type { Trial } from '../../types/trial';

/**
 * SAMPLE DATA FOR DEVELOPMENT ONLY.
 *
 * These records are invented to exercise the interface. They are not real
 * clinical trials, their NCT IDs do not correspond to registry entries, and
 * their plain-language text is illustrative. The live data source replaces
 * this file through the adapter in data/adapter.ts.
 */

export interface SampleEntry {
  conditionId: string;
  trial: Trial;
}

// Points to the registry home page, not to a made-up study page.
const SAMPLE_SOURCE_URL = 'https://clinicaltrials.gov/';
const SAMPLE_RETRIEVED_AT = '2026-10-24T09:00:00Z';

const sampleA: SampleEntry = {
  conditionId: 'type_2_diabetes',
  trial: {
    nctId: 'NCT90000001',
    title: '[SAMPLE A] Adult Type 2 Diabetes Follow-Up Study',
    description: {
      en: 'Sample description: a study of adults with type 2 diabetes at Massachusetts sites. Invented for interface testing.',
      es: 'Descripción de ejemplo: un estudio de adultos con diabetes tipo 2 en sitios de Massachusetts. Creada solo para pruebas de la interfaz.',
    },
    recruitmentStatus: 'recruiting',
    locations: [
      { city: 'Boston', state: 'Massachusetts' },
      { city: 'Worcester', state: 'Massachusetts' },
    ],
    registryUpdateDate: '2026-06-15',
    dataRetrievedAt: SAMPLE_RETRIEVED_AT,
    contacts: [
      {
        name: 'Sample study coordinator',
        phone: '555-0100',
        email: 'coordinator@example.org',
      },
    ],
    languageRequirement: {
      status: 'english_required',
      sourceText: 'Participants must be able to complete study questionnaires in English.',
    },
    sourceUrl: SAMPLE_SOURCE_URL,
    dataOrigin: 'sample',
    criteria: [
      {
        id: 'S1-C1',
        section: 'inclusion',
        sourceText: 'Age 18 years or older at screening.',
        sourceRef: 'Eligibility criteria, inclusion item 1',
        category: 'self_answer',
        plainExplanation: {
          en: 'You must be 18 or older.',
          es: 'Debe tener 18 años o más.',
        },
        spanishTranslationStatus: 'machine_drafted_unreviewed',
        uncertaintyNotes: [],
      },
      {
        id: 'S1-C2',
        section: 'inclusion',
        sourceText: 'Able to attend scheduled study visits in person.',
        sourceRef: 'Eligibility criteria, inclusion item 2',
        category: 'self_answer',
        plainExplanation: {
          en: 'You would need to attend study visits in person.',
          es: 'Necesitaría asistir en persona a las visitas programadas del estudio.',
        },
        spanishTranslationStatus: 'machine_drafted_unreviewed',
        uncertaintyNotes: ['The visit schedule and locations should be confirmed with the study team.'],
      },
      {
        id: 'S1-C3',
        section: 'inclusion',
        sourceText: 'Hemoglobin A1c between 7.0% and 10.5% within 90 days before enrollment.',
        sourceRef: 'Eligibility criteria, inclusion item 3',
        category: 'check_records',
        plainExplanation: {
          en: 'If you already have a recent blood sugar result (HbA1c), the study team may ask about it.',
          es: 'Si ya tiene un resultado reciente de azúcar en sangre (HbA1c), el equipo del estudio puede preguntar por él.',
        },
        spanishTranslationStatus: 'machine_drafted_unreviewed',
        uncertaintyNotes: ['The number, unit, and timing window must be confirmed by the study team.'],
      },
      {
        id: 'S1-C4',
        section: 'inclusion',
        sourceText: 'Estimated glomerular filtration rate (eGFR) of 60 or higher from a test within the past 6 months.',
        sourceRef: 'Eligibility criteria, inclusion item 4',
        category: 'check_records',
        plainExplanation: {
          en: 'If you already have a kidney function result (eGFR) from the past 6 months, the study team may ask about it.',
          es: 'Si ya tiene un resultado de función renal (eGFR) de los últimos 6 meses, el equipo del estudio puede preguntar por él.',
        },
        spanishTranslationStatus: 'machine_drafted_unreviewed',
        uncertaintyNotes: [],
      },
      {
        id: 'S1-C5',
        section: 'inclusion',
        sourceText: 'Blood pressure below 160/100 mm Hg at screening.',
        sourceRef: 'Eligibility criteria, inclusion item 5',
        category: 'check_records',
        plainExplanation: {
          en: 'If you already have a recent blood pressure reading, the study team may ask whether it is below a set limit.',
          es: 'Si ya tiene una lectura reciente de presión arterial, el equipo del estudio puede preguntar si está por debajo de un límite establecido.',
        },
        spanishTranslationStatus: 'machine_drafted_unreviewed',
        uncertaintyNotes: ['A reading taken at the study visit may be used instead of a past record.'],
      },
      {
        id: 'S1-C6',
        section: 'inclusion',
        sourceText: 'Liver enzyme levels (ALT and AST) below 3 times the upper limit of normal within the past 3 months.',
        sourceRef: 'Eligibility criteria, inclusion item 6',
        category: 'check_records',
        plainExplanation: {
          en: 'If you already have a recent liver blood test result, the study team may ask whether its levels are within a set limit.',
          es: 'Si ya tiene un resultado reciente de un análisis de sangre del hígado, el equipo del estudio puede preguntar si sus niveles están dentro de un límite establecido.',
        },
        spanishTranslationStatus: 'machine_drafted_unreviewed',
        uncertaintyNotes: [],
      },
      {
        id: 'S1-C7',
        section: 'exclusion',
        sourceText: 'Currently using insulin, or insulin use within the past 12 months.',
        sourceRef: 'Eligibility criteria, exclusion item 1',
        category: 'ask_study_team',
        plainExplanation: {
          en: 'Recent insulin use may affect who can take part. Talk with the study team about your history.',
          es: 'El uso reciente de insulina puede afectar quién puede participar. Hable de su historial con el equipo del estudio.',
        },
        spanishTranslationStatus: 'machine_drafted_unreviewed',
        uncertaintyNotes: [],
      },
      {
        id: 'S1-C8',
        section: 'exclusion',
        sourceText: 'History of pancreatitis.',
        sourceRef: 'Eligibility criteria, exclusion item 2',
        category: 'ask_study_team',
        plainExplanation: {
          en: 'A history of pancreatitis may affect participation. The study team needs to review this with you.',
          es: 'Un historial de pancreatitis puede afectar la participación. El equipo del estudio debe revisarlo con usted.',
        },
        spanishTranslationStatus: 'machine_drafted_unreviewed',
        uncertaintyNotes: ['Your own doctor can explain your medical history.'],
      },
      {
        id: 'S1-C9',
        section: 'exclusion',
        sourceText:
          "Any clinically significant condition that, in the investigator's opinion, would interfere with participation.",
        sourceRef: 'Eligibility criteria, exclusion item 3',
        category: 'cannot_assess',
        plainExplanation: { en: null, es: null },
        spanishTranslationStatus: 'unavailable',
        uncertaintyNotes: ['Terms such as "clinically significant" are decided by the study team.'],
      },
    ],
  },
};

const sampleB: SampleEntry = {
  conditionId: 'asthma',
  trial: {
    nctId: 'NCT90000002',
    title: '[SAMPLE B] Adult Asthma Symptom Study',
    description: {
      en: 'Sample description: a study of adults with asthma at Massachusetts sites. Invented for interface testing.',
      es: null,
    },
    recruitmentStatus: 'recruiting',
    locations: [
      { city: 'Springfield', state: 'Massachusetts' },
      { city: 'Cambridge', state: 'Massachusetts' },
    ],
    registryUpdateDate: '2026-03-02',
    dataRetrievedAt: SAMPLE_RETRIEVED_AT,
    // Deliberately empty: exercises the "Contact not listed" path.
    contacts: [],
    languageRequirement: { status: 'none_stated', sourceText: null },
    sourceUrl: SAMPLE_SOURCE_URL,
    dataOrigin: 'sample',
    criteria: [
      {
        id: 'S2-C1',
        section: 'inclusion',
        sourceText: 'Age 12 to 65 years.',
        sourceRef: 'Eligibility criteria, inclusion item 1',
        category: 'self_answer',
        plainExplanation: { en: 'You must be between 12 and 65.', es: null },
        spanishTranslationStatus: 'unavailable',
        uncertaintyNotes: [],
      },
      {
        id: 'S2-C2',
        section: 'inclusion',
        sourceText: 'Spirometry (FEV1) result recorded within 12 months.',
        sourceRef: 'Eligibility criteria, inclusion item 2',
        category: 'check_records',
        plainExplanation: {
          en: 'If you already have a breathing test (spirometry) result from the past year, the study team may ask about it.',
          es: 'Si ya tiene un resultado de una prueba de respiración (espirometría) del último año, el equipo del estudio puede preguntar por él.',
        },
        spanishTranslationStatus: 'language_reviewed',
        uncertaintyNotes: [],
      },
      {
        id: 'S2-C3',
        section: 'exclusion',
        sourceText: 'Use of systemic corticosteroids within 4 weeks before screening.',
        sourceRef: 'Eligibility criteria, exclusion item 1',
        category: 'ask_study_team',
        plainExplanation: {
          en: 'Recent steroid medicine use may affect participation. Ask the study team how this applies to you.',
          es: 'El uso reciente de medicamentos con esteroides puede afectar la participación. Pregunte al equipo del estudio cómo le aplica esto.',
        },
        spanishTranslationStatus: 'machine_drafted_unreviewed',
        uncertaintyNotes: [],
      },
      {
        id: 'S2-C4',
        section: 'inclusion',
        sourceText: 'Stable asthma control, as judged by the investigator.',
        sourceRef: 'Eligibility criteria, inclusion item 3',
        category: 'cannot_assess',
        plainExplanation: { en: null, es: null },
        spanishTranslationStatus: 'unavailable',
        uncertaintyNotes: ['"Stable" is not defined in the registry text.'],
      },
    ],
  },
};

const sampleC: SampleEntry = {
  conditionId: 'type_2_diabetes',
  trial: {
    nctId: 'NCT90000003',
    title: '[SAMPLE C] Diabetes Study With Texas Sites Only',
    description: { en: null, es: null },
    recruitmentStatus: 'not_yet_recruiting',
    locations: [{ city: 'Dallas', state: 'Texas' }],
    registryUpdateDate: '2026-09-01',
    dataRetrievedAt: SAMPLE_RETRIEVED_AT,
    contacts: [{ name: null, phone: null, email: 'contact@example.org' }],
    languageRequirement: {
      status: 'ambiguous',
      sourceText: 'Study materials in Spanish may be discussed on request.',
    },
    sourceUrl: SAMPLE_SOURCE_URL,
    dataOrigin: 'sample',
    criteria: [
      {
        id: 'S3-C1',
        section: 'inclusion',
        sourceText: 'Adults aged 40 to 75 years.',
        sourceRef: 'Eligibility criteria, inclusion item 1',
        category: 'self_answer',
        plainExplanation: {
          en: 'You must be between 40 and 75.',
          es: 'Debe tener entre 40 y 75 años.',
        },
        spanishTranslationStatus: 'machine_drafted_unreviewed',
        uncertaintyNotes: [],
      },
    ],
  },
};

/** Used by the sample adapter. Sample C has only Texas sites, so it is hidden from Massachusetts search. */
export const SAMPLE_TRIALS: readonly SampleEntry[] = [sampleA, sampleB, sampleC];
