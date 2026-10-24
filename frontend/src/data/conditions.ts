export interface SupportedCondition {
  id: string;
  label: { en: string; es: string };
}

/**
 * Short list of conditions offered in search. Person B owns the final list
 * and must keep each id aligned with the backend search mapping.
 */
export const SUPPORTED_CONDITIONS: readonly SupportedCondition[] = [
  { id: 'type_2_diabetes', label: { en: 'Type 2 diabetes', es: 'Diabetes tipo 2' } },
  { id: 'asthma', label: { en: 'Asthma', es: 'Asma' } },
];
