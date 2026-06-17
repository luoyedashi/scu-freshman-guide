"""SQLite persistence for profiles and analytics events."""

from __future__ import annotations

import json
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DB_PATH = Path(os.environ.get("DATABASE_PATH", Path(__file__).parent / "data" / "guide.db"))


def _utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


@contextmanager
def get_conn():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with get_conn() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                province TEXT NOT NULL,
                category TEXT NOT NULL,
                rank INTEGER,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_profiles_session ON profiles(session_id);
            CREATE INDEX IF NOT EXISTS idx_profiles_updated ON profiles(updated_at);

            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                payload TEXT,
                page_path TEXT,
                referrer TEXT,
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
            CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);
            """
        )


def upsert_profile(session_id: str, province: str, category: str, rank: int | None) -> None:
    now = _utc_now()
    with get_conn() as conn:
        row = conn.execute(
            "SELECT id FROM profiles WHERE session_id = ?", (session_id,)
        ).fetchone()
        if row:
            conn.execute(
                """
                UPDATE profiles SET province=?, category=?, rank=?, updated_at=?
                WHERE session_id=?
                """,
                (province, category, rank, now, session_id),
            )
        else:
            conn.execute(
                """
                INSERT INTO profiles (session_id, province, category, rank, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (session_id, province, category, rank, now, now),
            )


def insert_events(events: list[dict[str, Any]]) -> int:
    now = _utc_now()
    with get_conn() as conn:
        for ev in events:
            conn.execute(
                """
                INSERT INTO events (session_id, event_type, payload, page_path, referrer, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    ev["session_id"],
                    ev["event_type"],
                    json.dumps(ev.get("payload") or {}, ensure_ascii=False),
                    ev.get("page_path"),
                    ev.get("referrer"),
                    ev.get("created_at") or now,
                ),
            )
    return len(events)


def fetch_stats() -> dict[str, Any]:
    with get_conn() as conn:
        total_pv = conn.execute(
            "SELECT COUNT(*) AS c FROM events WHERE event_type = 'pageview'"
        ).fetchone()["c"]
        unique_sessions = conn.execute(
            "SELECT COUNT(DISTINCT session_id) AS c FROM events"
        ).fetchone()["c"]
        profile_count = conn.execute("SELECT COUNT(*) AS c FROM profiles").fetchone()["c"]
        sim_runs = conn.execute(
            "SELECT COUNT(*) AS c FROM events WHERE event_type = 'sim_run'"
        ).fetchone()["c"]

        by_province = conn.execute(
            """
            SELECT province, COUNT(*) AS c FROM profiles
            GROUP BY province ORDER BY c DESC LIMIT 15
            """
        ).fetchall()
        by_category = conn.execute(
            """
            SELECT category, COUNT(*) AS c FROM profiles
            GROUP BY category ORDER BY c DESC
            """
        ).fetchall()
        rank_buckets = conn.execute(
            """
            SELECT bucket, COUNT(*) AS c FROM (
              SELECT CASE
                WHEN rank IS NULL THEN '未填位次'
                WHEN rank <= 3000 THEN '1-3000'
                WHEN rank <= 8000 THEN '3001-8000'
                WHEN rank <= 20000 THEN '8001-20000'
                ELSE '20000+'
              END AS bucket
              FROM profiles
            ) GROUP BY bucket ORDER BY c DESC
            """
        ).fetchall()
        daily_pv = conn.execute(
            """
            SELECT date(created_at) AS day, COUNT(*) AS c
            FROM events WHERE event_type = 'pageview'
            GROUP BY day ORDER BY day DESC LIMIT 14
            """
        ).fetchall()
        recent_profiles = conn.execute(
            """
            SELECT province, category, rank, updated_at
            FROM profiles ORDER BY updated_at DESC LIMIT 30
            """
        ).fetchall()

    return {
        "summary": {
            "pageviews": total_pv,
            "unique_sessions": unique_sessions,
            "profiles_saved": profile_count,
            "sim_runs": sim_runs,
        },
        "profiles_by_province": [dict(r) for r in by_province],
        "profiles_by_category": [dict(r) for r in by_category],
        "rank_buckets": [dict(r) for r in rank_buckets],
        "daily_pageviews": [dict(r) for r in daily_pv],
        "recent_profiles": [dict(r) for r in recent_profiles],
    }
