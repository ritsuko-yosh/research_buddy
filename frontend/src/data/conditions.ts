export interface SupportedCondition {
  /** Stable key for the preset button's pressed state. */
  id: string;
  label: { en: string; es: string };
  /** English ClinicalTrials.gov search term. Sent to the registry as-is. */
  term: string;
}

/**
 * Preset searches shown as shortcuts. They are not a restriction: any term
 * the patient types is searched too. Terms are English because the registry
 * indexes English medical wording.
 */
export const SUPPORTED_CONDITIONS: readonly SupportedCondition[] = [
  { id: 'type_2_diabetes', label: { en: 'Type 2 diabetes', es: 'Diabetes tipo 2' }, term: 'type 2 diabetes' },
  { id: 'asthma', label: { en: 'Asthma', es: 'Asma' }, term: 'asthma' },
];
