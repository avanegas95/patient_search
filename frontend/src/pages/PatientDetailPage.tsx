import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { fetchPatient } from '../api'
import type { PatientDetail } from '../types'

interface DetailRowProps {
  label: string
  value: string
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  )
}

export function PatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>()

  const [patient, setPatient] = useState<PatientDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!patientId) return

    let cancelled = false
    setIsLoading(true)

    fetchPatient(patientId)
      .then((response) => {
        if (cancelled) return
        setPatient(response)
        setError(null)
      })
      .catch((cause: Error) => {
        if (cancelled) return
        setError(cause.message)
        setPatient(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [patientId])

  return (
    <div className="detail-page">
      <Link to="/" className="back-link">
        Back to all patients
      </Link>

      {isLoading && <p>Loading…</p>}
      {error && <p className="error">{error}</p>}

      {patient && (
        <article className="patient-detail">
          <h2>
            {patient.first_name} {patient.last_name}
          </h2>

          <DetailRow label="Patient ID" value={patient.patient_id} />
          <DetailRow label="Gender" value={patient.gender} />
          <DetailRow
            label="Diagnosis"
            value={patient.diagnoses.length > 0 ? patient.diagnoses.join(', ') : 'None recorded'}
          />
          <DetailRow
            label="Genes"
            value={patient.genes.length > 0 ? patient.genes.join(', ') : 'None recorded'}
          />
          <DetailRow
            label="Address"
            value={`${patient.street_address}, ${patient.city}, ${patient.state} ${patient.zip_code}`}
          />
          <DetailRow label="Phone" value={patient.phone} />
        </article>
      )}
    </div>
  )
}
