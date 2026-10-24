/**
 * Top-level MeSH disease categories. This is standard medical vocabulary (the
 * MeSH tree's top disease branches), not study data. A study joins every group
 * whose name appears in its registry `ancestors` list. Studies that match none
 * go to "Other".
 */
export const CATEGORY_LIST_VERSION = 'mesh-top-level-disease-v1';

export const DISEASE_CATEGORIES: readonly string[] = [
  'Bacterial Infections and Mycoses',
  'Virus Diseases',
  'Parasitic Diseases',
  'Neoplasms',
  'Musculoskeletal Diseases',
  'Digestive System Diseases',
  'Stomatognathic Diseases',
  'Respiratory Tract Diseases',
  'Otorhinolaryngologic Diseases',
  'Nervous System Diseases',
  'Eye Diseases',
  'Urogenital Diseases',
  'Pregnancy Complications',
  'Skin and Connective Tissue Diseases',
  'Cardiovascular Diseases',
  'Hemic and Lymphatic Diseases',
  'Congenital, Hereditary, and Neonatal Diseases and Abnormalities',
  'Endocrine System Diseases',
  'Nutritional and Metabolic Diseases',
  'Immune System Diseases',
  'Mental Disorders',
  'Wounds and Injuries',
  'Occupational Diseases',
  'Chemically-Induced Disorders',
];

/**
 * Branches Visit Ready does not browse by. Symptom categories are excluded because
 * the app does not offer symptom-based browsing. A study that matches only an
 * excluded branch is treated as unmatched.
 */
export const EXCLUDED_BRANCHES: readonly string[] = [
  // Symptoms are not used for browsing.
  'Symptoms and General Pathology',
  // Signs and symptoms are not used for browsing.
  'Pathological Conditions, Signs and Symptoms',
];

/** Patient-facing condition terms shown per area. */
export const MAX_CONDITIONS_PER_TOPIC = 6;

/** Shared MeSH terms listed per relation between two areas. */
export const MAX_SHARED_TERMS = 5;
