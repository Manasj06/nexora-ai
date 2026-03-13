"""
Nexora AI — Local authentication and history store
Provides account management, session handling, and per-user history storage.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

from fastapi import Header, HTTPException

from config import settings

DB_PATH = Path(settings.AUTH_DB_PATH)
if not DB_PATH.is_absolute():
    DB_PATH = Path(__file__).resolve().parent.parent / DB_PATH
SESSION_DURATION = timedelta(days=settings.AUTH_SESSION_DAYS)
PBKDF2_ITERATIONS = 240_000


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _to_iso(value: datetime) -> str:
    return value.isoformat()


def _from_iso(value: str) -> datetime:
    return datetime.fromisoformat(value)


def _connect() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_auth_store() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    with _connect() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                display_name TEXT NOT NULL,
                password_salt TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                history_salt TEXT NOT NULL,
                created_at TEXT NOT NULL,
                last_login_at TEXT
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS history_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                encrypted_payload TEXT NOT NULL,
                iv TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )
        connection.execute(
            "CREATE INDEX IF NOT EXISTS idx_history_user_created ON history_entries(user_id, created_at DESC)"
        )
        connection.execute(
            "CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)"
        )


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _hash_password(password: str, salt: bytes) -> str:
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PBKDF2_ITERATIONS,
    )
    return base64.b64encode(digest).decode("utf-8")


def _serialize_user(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "email": row["email"],
        "display_name": row["display_name"],
        "created_at": row["created_at"],
        "last_login_at": row["last_login_at"],
        "history_salt": row["history_salt"],
    }


def create_user(display_name: str, email: str, password: str) -> dict:
    normalized_email = _normalize_email(email)

    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    password_salt = secrets.token_bytes(16)
    history_salt = base64.b64encode(secrets.token_bytes(16)).decode("utf-8")
    created_at = _to_iso(_utcnow())

    with _connect() as connection:
        existing = connection.execute(
            "SELECT id FROM users WHERE email = ?",
            (normalized_email,),
        ).fetchone()

        if existing:
            raise HTTPException(status_code=409, detail="An account with this email already exists.")

        connection.execute(
            """
            INSERT INTO users (email, display_name, password_salt, password_hash, history_salt, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                normalized_email,
                display_name.strip() or "Nexora User",
                base64.b64encode(password_salt).decode("utf-8"),
                _hash_password(password, password_salt),
                history_salt,
                created_at,
            ),
        )

        row = connection.execute(
            "SELECT * FROM users WHERE email = ?",
            (normalized_email,),
        ).fetchone()

    return _serialize_user(row)


def authenticate_user(email: str, password: str) -> dict:
    normalized_email = _normalize_email(email)

    with _connect() as connection:
        row = connection.execute(
            "SELECT * FROM users WHERE email = ?",
            (normalized_email,),
        ).fetchone()

        if not row:
            raise HTTPException(status_code=401, detail="Invalid email or password.")

        password_salt = base64.b64decode(row["password_salt"])
        expected_hash = row["password_hash"]
        provided_hash = _hash_password(password, password_salt)

        if not hmac.compare_digest(expected_hash, provided_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password.")

        login_at = _to_iso(_utcnow())
        connection.execute(
            "UPDATE users SET last_login_at = ? WHERE id = ?",
            (login_at, row["id"]),
        )

        updated_row = connection.execute(
            "SELECT * FROM users WHERE id = ?",
            (row["id"],),
        ).fetchone()

    return _serialize_user(updated_row)


def create_session(user_id: int) -> dict:
    token = secrets.token_urlsafe(32)
    now = _utcnow()
    expires_at = now + SESSION_DURATION

    with _connect() as connection:
        connection.execute(
            """
            INSERT INTO sessions (token, user_id, created_at, expires_at)
            VALUES (?, ?, ?, ?)
            """,
            (token, user_id, _to_iso(now), _to_iso(expires_at)),
        )

    return {
        "token": token,
        "expires_at": _to_iso(expires_at),
    }


def delete_session(token: str) -> None:
    with _connect() as connection:
        connection.execute("DELETE FROM sessions WHERE token = ?", (token,))


def _get_user_by_token(token: str) -> Optional[dict]:
    with _connect() as connection:
        session_row = connection.execute(
            """
            SELECT sessions.token, sessions.expires_at, users.*
            FROM sessions
            JOIN users ON users.id = sessions.user_id
            WHERE sessions.token = ?
            """,
            (token,),
        ).fetchone()

        if not session_row:
            return None

        expires_at = _from_iso(session_row["expires_at"])
        if expires_at <= _utcnow():
            connection.execute("DELETE FROM sessions WHERE token = ?", (token,))
            return None

        return _serialize_user(session_row)


def require_authenticated_user(authorization: Optional[str] = Header(default=None)) -> dict:
    token = extract_bearer_token(authorization)
    user = _get_user_by_token(token)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session.")

    return user


def extract_bearer_token(authorization: Optional[str]) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required.")

    return authorization.split(" ", 1)[1].strip()


def save_history_entry(user_id: int, encrypted_payload: str, iv: str) -> dict:
    created_at = _to_iso(_utcnow())

    with _connect() as connection:
        cursor = connection.execute(
            """
            INSERT INTO history_entries (user_id, encrypted_payload, iv, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (user_id, encrypted_payload, iv, created_at),
        )

        row = connection.execute(
            "SELECT * FROM history_entries WHERE id = ?",
            (cursor.lastrowid,),
        ).fetchone()

    return {
        "id": row["id"],
        "encrypted_payload": row["encrypted_payload"],
        "iv": row["iv"],
        "created_at": row["created_at"],
    }


def list_history_entries(user_id: int) -> list[dict]:
    with _connect() as connection:
        rows = connection.execute(
            """
            SELECT id, encrypted_payload, iv, created_at
            FROM history_entries
            WHERE user_id = ?
            ORDER BY created_at DESC
            """,
            (user_id,),
        ).fetchall()

    return [
        {
            "id": row["id"],
            "encrypted_payload": row["encrypted_payload"],
            "iv": row["iv"],
            "created_at": row["created_at"],
        }
        for row in rows
    ]


def clear_history_entries(user_id: int) -> None:
    with _connect() as connection:
        connection.execute("DELETE FROM history_entries WHERE user_id = ?", (user_id,))
