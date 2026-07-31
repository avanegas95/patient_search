import { useEffect, useState } from 'react'

import { fetchFilterOptions, fetchPatients } from '../api'
import { FilterPanel } from '../components/FilterPanel'
import { PatientTable } from '../components/PatientTable'
import { EMPTY_FILTERS } from '../types'
import type { FilterOptions, PatientFilters, PatientSummary } from '../types'

const NO_OPTIONS: FilterOptions = { states: [], diagnoses: [], genes: [] }

/** How long to wait after the last keystroke before searching. */
const DEBOUNCE_MS = 300

export function PatientListPage() {
  const [filters, setFilters] = useState<PatientFilters>(EMPTY_FILTERS)
  const [options, setOptions] = useState<FilterOptions>(NO_OPTIONS)
  const [patients, setPatients] = useState<PatientSummary[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // The dropdown choices come from the data and never change while running.
  useEffect(() => {
    fetchFilterOptions()
      .then(setOptions)
      .catch((cause: Error) => setError(cause.message))
  }, [])

  useEffect(() => {
    // `cancelled` guards against a slow earlier request landing after a newer
    // one and overwriting the results with stale data.
    let cancelled = false
    setIsLoading(true)

    const timer = setTimeout(() => {
      fetchPatients(filters)
        .then((response) => {
          if (cancelled) return
          setPatients(response.patients)
          setTotal(response.total)
          setError(null)
        })
        .catch((cause: Error) => {
          if (cancelled) return
          setError(cause.message)
          setPatients([])
          setTotal(0)
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false)
        })
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [filters])

  return (
    <div>
      <FilterPanel
        filters={filters}
        options={options}
        onChange={setFilters}
        onClear={() => setFilters(EMPTY_FILTERS)}
      />

      {error && <p className="error">{error}</p>}

      <p className="result-count">
        {isLoading ? 'Searching…' : `${total} ${total === 1 ? 'patient' : 'patients'}`}
      </p>

      <PatientTable patients={patients} isLoading={isLoading} />
    </div>
  )
}
