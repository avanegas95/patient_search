/** Typed wrappers around the Flask API. Every response is described in types.ts. */

import type {
  FilterOptions,
  PatientDetail,
  PatientFilters,
  PatientListResponse,
} from './types'

/** Shape of the error body the API returns for 404s and other failures. */
interface ApiError {
  error: string
}

async function request<T>(url: string): Promise<T> {
  const response = await fetch(url)

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiError | null
    throw new Error(body?.error ?? `Request failed with status ${response.status}`)
  }

  return (await response.json()) as T
}

/** Drop empty filters so the URL only carries criteria the user actually set. */
function toQueryString(filters: PatientFilters): string {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(filters)) {
    if (value.trim() !== '') {
      params.set(key, value.trim())
    }
  }

  const query = params.toString()
  return query === '' ? '' : `?${query}`
}

export function fetchPatients(filters: PatientFilters): Promise<PatientListResponse> {
  return request<PatientListResponse>(`/api/patients${toQueryString(filters)}`)
}

export function fetchPatient(patientId: string): Promise<PatientDetail> {
  return request<PatientDetail>(`/api/patients/${encodeURIComponent(patientId)}`)
}

export function fetchFilterOptions(): Promise<FilterOptions> {
  return request<FilterOptions>('/api/filters')
}
