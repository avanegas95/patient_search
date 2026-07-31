"""Database location and connection helper."""

import sqlite3
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent

DATA_DIR = PROJECT_ROOT / "data"
DB_PATH = BACKEND_DIR / "patients.db"


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    # Rows behave like dicts, so we can do row["first_name"] instead of row[1].
    connection.row_factory = sqlite3.Row
    return connection
