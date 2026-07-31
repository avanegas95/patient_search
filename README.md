# Patient Search

A web application for finding cancer patients who may be eligible for clinical studies.
Clinicians can browse all patients at once, filter by first name, last name, state,
cancer diagnosis, and gene, and open any individual patient to see their full record.

**Stack:** Flask (Python 3.13) + SQLite with raw SQL, React 19 + TypeScript via Vite.

## Setup

Requires Python 3.13 and Node 20+.

```bash
# Backend: virtual environment and dependencies
/opt/homebrew/bin/python3.13 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt

# Build the database from the CSVs in data/
npm run seed

# Frontend and root dependencies
npm install
cd frontend && npm install && cd ..
```

The explicit `python3.13` path matters: on macOS the bare `python3` command often
resolves to an older interpreter.

## Running

```bash
npm run dev
```

This starts both servers together and prefixes their output with `api` and `web`:

- API on http://localhost:5001
- App on http://localhost:5173 — **open this one**

Vite proxies `/api` requests through to Flask, so the browser only talks to one
origin and there is no CORS configuration. Port 5001 is used instead of Flask's
default 5000, which macOS reserves for the AirPlay Receiver.

## Project layout

```
data/                      the three source CSVs
backend/
  db.py                    paths and the SQLite connection helper
  seed_db.py               CSV -> SQLite, safe to re-run
  app.py                   Flask routes and query building
frontend/src/
  types.ts                 interfaces for every API response
  api.ts                   typed fetch wrappers
  components/              FilterPanel, PatientTable
  pages/                   PatientListPage, PatientDetailPage
  styles.css               all styling
```

## Data model

The CSVs allow a patient to appear more than once in the diagnosis and gene files,
so those become their own tables rather than columns on the patient:

```
patients (patient_id PK, first_name, last_name, gender,
          street_address, city, state, zip_code, phone)
diagnoses (patient_id FK, diagnosis)
genes     (patient_id FK, gene)
```

The current data has 200 patients, exactly one diagnosis each, and gene records for
only 37 of them (up to two genes apiece). Patients with no gene record still appear
in results with an empty gene list, shown as a dash in the table.

## API

| Endpoint | Purpose |
| --- | --- |
| `GET /api/patients` | List patients, optionally filtered |
| `GET /api/patients/<patient_id>` | One patient with full details, 404 if unknown |
| `GET /api/filters` | Distinct states, diagnoses, and genes for the dropdowns |

`/api/patients` accepts `first_name`, `last_name`, `state`, `diagnosis`, and `gene`.
Names are case-insensitive partial matches; state, diagnosis, and gene are exact
matches; and multiple filters combine with AND. Every value is passed as a bound SQL
parameter rather than interpolated into the query string.

The list is a single query. Diagnoses and genes come back through correlated
subqueries using `GROUP_CONCAT`, which avoids both the N+1 problem and the row
multiplication you would get from joining two one-to-many tables at once.

## Notes on the frontend

`types.ts` describes every API response, and `api.ts` returns those types from its
fetch wrappers, so components receive checked data rather than `any`. Each component
declares an explicit props interface. JSON field names stay snake_case to match the
database exactly, which removes an entire mapping layer.

Filter changes are debounced by 300ms and then re-query the API; there is no search
button. Both pages guard against out-of-order responses so a slow earlier request
cannot overwrite newer results.
