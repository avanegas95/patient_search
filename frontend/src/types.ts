/**
 * Shapes returned by the Flask API.
 *
 * Field names are snake_case to match the JSON exactly, so there is no
 * translation layer between the API and the components.
 */

/** A patient as shown in the results table. */
export interface PatientSummary {
  patient_id: string
  first_name: string
  last_name: string
  state: string
  /** Empty when the patient has no diagnosis rows. */
  diagnoses: string[]
  /** Empty for the majority of patients, who have no gene records at all. */
  genes: string[]
}

/** A patient as shown on the detail page: everything in the summary, plus contact info. */
export interface PatientDetail extends PatientSummary {
  gender: string
  street_address: string
  city: string
  zip_code: string
  phone: string
}

/** Response body of GET /api/patients. */
export interface PatientListResponse {
  patients: PatientSummary[]
  total: number
}

/** Response body of GET /api/filters, used to populate the dropdowns. */
export interface FilterOptions {
  states: string[]
  diagnoses: string[]
  genes: string[]
}

/** The current search criteria. Empty string means "no filter on this field". */
export interface PatientFilters {
  first_name: string
  last_name: string
  state: string
  diagnosis: string
  gene: string
}

export const EMPTY_FILTERS: PatientFilters = {
  first_name: '',
  last_name: '',
  state: '',
  diagnosis: '',
  gene: '',
}
