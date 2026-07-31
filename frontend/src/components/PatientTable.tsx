import { Link } from 'react-router-dom'

import type { PatientSummary } from '../types'

interface PatientTableProps {
  patients: PatientSummary[]
  isLoading: boolean
}

/** Most patients have no gene records, so show a dash instead of a blank cell. */
function joinOrDash(values: string[]): string {
  return values.length > 0 ? values.join(', ') : '—'
}

export function PatientTable({ patients, isLoading }: PatientTableProps) {
  if (!isLoading && patients.length === 0) {
    return <p className="empty-state">No patients match these filters.</p>
  }

  return (
    <table className="patient-table">
      <thead>
        <tr>
          <th>Patient ID</th>
          <th>First name</th>
          <th>Last name</th>
          <th>State</th>
          <th>Diagnosis</th>
          <th>Genes</th>
        </tr>
      </thead>
      <tbody>
        {patients.map((patient) => (
          <tr key={patient.patient_id}>
            <td>
              <Link to={`/patients/${patient.patient_id}`}>{patient.patient_id}</Link>
            </td>
            <td>{patient.first_name}</td>
            <td>{patient.last_name}</td>
            <td>{patient.state}</td>
            <td>{joinOrDash(patient.diagnoses)}</td>
            <td>{joinOrDash(patient.genes)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
