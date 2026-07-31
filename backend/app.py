"""Patient search API.

Endpoints:
    GET /api/patients            list patients, optionally filtered
    GET /api/patients/<id>       one patient with full details
    GET /api/filters             distinct values for the filter dropdowns
"""

import sqlite3
from typing import Any

from flask import Flask, jsonify, request

from db import DB_PATH, get_connection

app = Flask(__name__)

# GROUP_CONCAT needs a separator that cannot appear inside a value.
SEPARATOR = "|"


def split_list(value: str | None) -> list[str]:
    """Turn a GROUP_CONCAT result into a list. NULL means the patient had no rows."""
    if not value:
        return []
    return sorted(value.split(SEPARATOR))


def build_filters(args: dict[str, str]) -> tuple[list[str], list[Any]]:
    """Turn query string arguments into SQL WHERE clauses and bound parameters.

    Values are always bound as parameters, never interpolated into the SQL.
    """
    clauses: list[str] = []
    params: list[Any] = []

    first_name = args.get("first_name", "").strip()
    if first_name:
        clauses.append("LOWER(p.first_name) LIKE ?")
        params.append(f"%{first_name.lower()}%")

    last_name = args.get("last_name", "").strip()
    if last_name:
        clauses.append("LOWER(p.last_name) LIKE ?")
        params.append(f"%{last_name.lower()}%")

    state = args.get("state", "").strip()
    if state:
        clauses.append("p.state = ?")
        params.append(state)

    diagnosis = args.get("diagnosis", "").strip()
    if diagnosis:
        clauses.append(
            "EXISTS (SELECT 1 FROM diagnoses d"
            " WHERE d.patient_id = p.patient_id AND d.diagnosis = ?)"
        )
        params.append(diagnosis)

    gene = args.get("gene", "").strip()
    if gene:
        clauses.append(
            "EXISTS (SELECT 1 FROM genes g"
            " WHERE g.patient_id = p.patient_id AND g.gene = ?)"
        )
        params.append(gene)

    return clauses, params


@app.get("/api/patients")
def list_patients():
    clauses, params = build_filters(request.args)
    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""

    # The diagnoses and genes are pulled in as correlated subqueries rather than
    # joins. Joining both tables at once would multiply the rows together, and
    # this keeps the whole list to a single query.
    sql = f"""
        SELECT
            p.patient_id,
            p.first_name,
            p.last_name,
            p.state,
            (SELECT GROUP_CONCAT(d.diagnosis, '{SEPARATOR}')
               FROM diagnoses d WHERE d.patient_id = p.patient_id) AS diagnoses,
            (SELECT GROUP_CONCAT(g.gene, '{SEPARATOR}')
               FROM genes g WHERE g.patient_id = p.patient_id) AS genes
        FROM patients p
        {where}
        ORDER BY p.last_name, p.first_name
    """

    connection = get_connection()
    rows = connection.execute(sql, params).fetchall()
    connection.close()

    patients = [
        {
            "patient_id": row["patient_id"],
            "first_name": row["first_name"],
            "last_name": row["last_name"],
            "state": row["state"],
            "diagnoses": split_list(row["diagnoses"]),
            "genes": split_list(row["genes"]),
        }
        for row in rows
    ]

    return jsonify({"patients": patients, "total": len(patients)})


@app.get("/api/patients/<patient_id>")
def get_patient(patient_id: str):
    connection = get_connection()

    row = connection.execute(
        "SELECT * FROM patients WHERE patient_id = ?", (patient_id,)
    ).fetchone()

    if row is None:
        connection.close()
        return jsonify({"error": f"No patient found with id {patient_id}"}), 404

    diagnoses = connection.execute(
        "SELECT diagnosis FROM diagnoses WHERE patient_id = ? ORDER BY diagnosis",
        (patient_id,),
    ).fetchall()
    genes = connection.execute(
        "SELECT gene FROM genes WHERE patient_id = ? ORDER BY gene", (patient_id,)
    ).fetchall()
    connection.close()

    patient = dict(row)
    patient["diagnoses"] = [item["diagnosis"] for item in diagnoses]
    patient["genes"] = [item["gene"] for item in genes]

    return jsonify(patient)


@app.get("/api/filters")
def get_filters():
    """Dropdown options, read from the data so they never drift out of sync."""
    connection = get_connection()

    def column_values(sql: str) -> list[str]:
        return [row[0] for row in connection.execute(sql).fetchall()]

    options = {
        "states": column_values(
            "SELECT DISTINCT state FROM patients WHERE state <> '' ORDER BY state"
        ),
        "diagnoses": column_values(
            "SELECT DISTINCT diagnosis FROM diagnoses ORDER BY diagnosis"
        ),
        "genes": column_values("SELECT DISTINCT gene FROM genes ORDER BY gene"),
    }
    connection.close()

    return jsonify(options)


@app.errorhandler(sqlite3.OperationalError)
def handle_missing_database(error: sqlite3.OperationalError):
    if not DB_PATH.exists():
        message = "Database not found. Run `python seed_db.py` in the backend directory."
    else:
        message = str(error)
    return jsonify({"error": message}), 500


if __name__ == "__main__":
    # Port 5001 rather than Flask's default 5000, which macOS reserves for the
    # AirPlay Receiver.
    app.run(port=5001, debug=True)
