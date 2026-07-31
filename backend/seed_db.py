"""Build patients.db from the CSV files in data/.

Run this once before starting the API:

    python seed_db.py

The tables are dropped and rebuilt every time, so re-running is always safe.
"""

import csv
from pathlib import Path
from typing import Iterator

from db import DATA_DIR, DB_PATH, get_connection

SCHEMA = """
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS diagnoses;
DROP TABLE IF EXISTS genes;

CREATE TABLE patients (
    patient_id     TEXT PRIMARY KEY,
    first_name     TEXT NOT NULL,
    last_name      TEXT NOT NULL,
    gender         TEXT,
    street_address TEXT,
    city           TEXT,
    state          TEXT,
    zip_code       TEXT,
    phone          TEXT
);

-- Diagnoses and genes live in their own tables because the CSVs allow a
-- patient to appear more than once. Today every patient has exactly one
-- diagnosis and at most two genes, but the shape is one-to-many.
CREATE TABLE diagnoses (
    patient_id TEXT NOT NULL REFERENCES patients(patient_id),
    diagnosis  TEXT NOT NULL
);

CREATE TABLE genes (
    patient_id TEXT NOT NULL REFERENCES patients(patient_id),
    gene       TEXT NOT NULL
);

CREATE INDEX idx_diagnoses_patient ON diagnoses(patient_id);
CREATE INDEX idx_genes_patient ON genes(patient_id);
"""


def read_csv(filename: str) -> Iterator[dict[str, str]]:
    path: Path = DATA_DIR / filename
    with open(path, newline="", encoding="utf-8-sig") as handle:
        for row in csv.DictReader(handle):
            yield {key: value.strip() for key, value in row.items()}


def seed() -> None:
    connection = get_connection()
    with connection:
        connection.executescript(SCHEMA)

        connection.executemany(
            """
            INSERT INTO patients (
                patient_id, first_name, last_name, gender,
                street_address, city, state, zip_code, phone
            ) VALUES (
                :patient_id, :first_name, :last_name, :gender,
                :street_address, :city, :state, :zip_code, :phone
            )
            """,
            read_csv("fake_patient_details.csv"),
        )

        connection.executemany(
            "INSERT INTO diagnoses (patient_id, diagnosis) VALUES (:patient_id, :diagnosis)",
            read_csv("fake_patient_diagnosis.csv"),
        )

        connection.executemany(
            "INSERT INTO genes (patient_id, gene) VALUES (:patient_id, :gene)",
            read_csv("fake_patient_genes.csv"),
        )

    for table in ("patients", "diagnoses", "genes"):
        count = connection.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        print(f"  {table}: {count} rows")

    connection.close()
    print(f"Seeded {DB_PATH}")


if __name__ == "__main__":
    seed()
