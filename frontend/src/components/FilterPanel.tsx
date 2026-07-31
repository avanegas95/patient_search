import type { FilterOptions, PatientFilters } from '../types'

interface FilterPanelProps {
  /** The criteria currently applied. */
  filters: PatientFilters
  /** Dropdown choices, loaded from the API. */
  options: FilterOptions
  /** Called with the full updated filter object whenever one field changes. */
  onChange: (filters: PatientFilters) => void
  onClear: () => void
}

export function FilterPanel({ filters, options, onChange, onClear }: FilterPanelProps) {
  /** Replace one field and hand the whole object back to the parent. */
  function update(field: keyof PatientFilters, value: string) {
    onChange({ ...filters, [field]: value })
  }

  const hasActiveFilter = Object.values(filters).some((value) => value !== '')

  return (
    <section className="filter-panel">
      <div className="filter-field">
        <label htmlFor="first_name">First name</label>
        <input
          id="first_name"
          type="text"
          value={filters.first_name}
          placeholder="Any"
          onChange={(event) => update('first_name', event.target.value)}
        />
      </div>

      <div className="filter-field">
        <label htmlFor="last_name">Last name</label>
        <input
          id="last_name"
          type="text"
          value={filters.last_name}
          placeholder="Any"
          onChange={(event) => update('last_name', event.target.value)}
        />
      </div>

      <div className="filter-field">
        <label htmlFor="state">State</label>
        <select
          id="state"
          value={filters.state}
          onChange={(event) => update('state', event.target.value)}
        >
          <option value="">Any</option>
          {options.states.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-field">
        <label htmlFor="diagnosis">Cancer diagnosis</label>
        <select
          id="diagnosis"
          value={filters.diagnosis}
          onChange={(event) => update('diagnosis', event.target.value)}
        >
          <option value="">Any</option>
          {options.diagnoses.map((diagnosis) => (
            <option key={diagnosis} value={diagnosis}>
              {diagnosis}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-field">
        <label htmlFor="gene">Gene</label>
        <select
          id="gene"
          value={filters.gene}
          onChange={(event) => update('gene', event.target.value)}
        >
          <option value="">Any</option>
          {options.genes.map((gene) => (
            <option key={gene} value={gene}>
              {gene}
            </option>
          ))}
        </select>
      </div>

      <button type="button" onClick={onClear} disabled={!hasActiveFilter}>
        Clear filters
      </button>
    </section>
  )
}
