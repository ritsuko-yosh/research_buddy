/**
 * Minimal structural typing of the ClinicalTrials.gov API v2 study record.
 *
 * Verified against live responses from
 *   https://clinicaltrials.gov/api/v2/studies/{nctId}
 *   https://clinicaltrials.gov/api/v2/studies?query.cond=...&query.locn=...
 *
 * Only the fields Visit Ready consumes are typed; everything is optional because
 * the registry omits fields freely and the normalizer must handle that safely.
 */

export interface RawDateStruct {
  date?: string;
  type?: string;
}

export interface RawContact {
  name?: string;
  role?: string;
  phone?: string;
  email?: string;
}

export interface RawLocation {
  facility?: string;
  status?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  contacts?: RawContact[];
  geoPoint?: { lat?: number; lon?: number };
}

export interface RawProtocolSection {
  identificationModule?: {
    nctId?: string;
    briefTitle?: string;
    officialTitle?: string;
    acronym?: string;
  };
  statusModule?: {
    overallStatus?: string;
    statusVerifiedDate?: string;
    lastUpdatePostDateStruct?: RawDateStruct;
    studyFirstPostDateStruct?: RawDateStruct;
  };
  descriptionModule?: {
    briefSummary?: string;
    detailedDescription?: string;
  };
  eligibilityModule?: {
    eligibilityCriteria?: string;
    healthyVolunteers?: boolean;
    sex?: string;
    minimumAge?: string;
    maximumAge?: string;
    stdAges?: string[];
  };
  contactsLocationsModule?: {
    centralContacts?: RawContact[];
    locations?: RawLocation[];
  };
}

export interface RawStudy {
  protocolSection?: RawProtocolSection;
  derivedSection?: unknown;
  hasResults?: boolean;
}

export interface RawSearchResponse {
  studies?: RawStudy[];
  nextPageToken?: string;
}
