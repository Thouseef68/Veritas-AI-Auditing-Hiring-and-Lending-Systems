"""
Hash-Chained Audit Ledger Store.
Supports:
1. PostgreSQL via DATABASE_URL (psycopg)
2. Supabase PostgreSQL via SUPABASE_URL + SUPABASE_KEY (HTTPS PostgREST)
3. Local SQLite for development & pytest (disabled in production)
"""

import hashlib
import json
import os
import sqlite3
import time
import urllib.request
import uuid
from typing import Any, Dict, List, Optional

from .security import is_production_env

DB_PATH = os.path.join(os.path.dirname(__file__), "veritas_audit.db")


def _get_database_url() -> str:
    return os.environ.get("DATABASE_URL", "").strip()


def _get_supabase_config() -> tuple[str, str]:
    return os.environ.get("SUPABASE_URL", "").strip().rstrip("/"), os.environ.get("SUPABASE_KEY", "").strip()


def _storage_mode() -> str:
    db_url = _get_database_url()
    if db_url.startswith("postgres://") or db_url.startswith("postgresql://"):
        return "postgres"
    sb_url, sb_key = _get_supabase_config()
    if sb_url and sb_key:
        return "supabase"
    if is_production_env():
        raise RuntimeError(
            "Persistent storage required in production: configure DATABASE_URL or SUPABASE_URL + SUPABASE_KEY."
        )
    return "sqlite"


def _sb_request(path: str, method: str = "GET", payload: Optional[Dict[str, Any]] = None) -> Any:
    sb_url, sb_key = _get_supabase_config()
    url = f"{sb_url}/rest/v1/{path}"
    headers = {
        "apikey": sb_key,
        "Authorization": f"Bearer {sb_key}",
        "Content-Type": "application/json",
    }
    if method == "POST":
        headers["Prefer"] = "return=representation"
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=10) as resp:
        body = resp.read().decode("utf-8")
        return json.loads(body) if body else []


def _get_pg_conn():
    import psycopg
    from psycopg.rows import dict_row

    return psycopg.connect(_get_database_url(), row_factory=dict_row)


def _get_sqlite_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    mode = _storage_mode()
    if mode == "supabase":
        # Tables are managed via Supabase migrations
        return
    if mode == "postgres":
        with _get_pg_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS audit_runs (
                        id TEXT PRIMARY KEY,
                        created_at DOUBLE PRECISION NOT NULL,
                        domain TEXT NOT NULL,
                        adapter_type TEXT NOT NULL,
                        model_name TEXT NOT NULL,
                        applicant_name TEXT,
                        score DOUBLE PRECISION,
                        decision TEXT,
                        disparate_impact_ratio TEXT,
                        grounding_rate TEXT,
                        result_json TEXT NOT NULL,
                        prev_hash TEXT NOT NULL,
                        entry_hash TEXT NOT NULL
                    )
                    """
                )
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS human_signoffs (
                        id TEXT PRIMARY KEY,
                        run_id TEXT NOT NULL,
                        created_at DOUBLE PRECISION NOT NULL,
                        reviewer_id TEXT NOT NULL,
                        reviewer_name TEXT NOT NULL,
                        reviewer_role TEXT NOT NULL,
                        decision_before TEXT,
                        decision_after TEXT,
                        reviewer_action TEXT NOT NULL,
                        override_reason TEXT,
                        prev_hash TEXT NOT NULL,
                        entry_hash TEXT NOT NULL
                    )
                    """
                )
            conn.commit()
        return

    conn = _get_sqlite_conn()
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS audit_runs (
            id TEXT PRIMARY KEY,
            created_at REAL NOT NULL,
            domain TEXT NOT NULL,
            adapter_type TEXT NOT NULL,
            model_name TEXT NOT NULL,
            applicant_name TEXT,
            score REAL,
            decision TEXT,
            disparate_impact_ratio TEXT,
            grounding_rate TEXT,
            result_json TEXT NOT NULL,
            prev_hash TEXT NOT NULL,
            entry_hash TEXT NOT NULL
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS human_signoffs (
            id TEXT PRIMARY KEY,
            run_id TEXT NOT NULL,
            created_at REAL NOT NULL,
            reviewer_id TEXT NOT NULL,
            reviewer_name TEXT NOT NULL,
            reviewer_role TEXT NOT NULL,
            decision_before TEXT,
            decision_after TEXT,
            reviewer_action TEXT NOT NULL,
            override_reason TEXT,
            prev_hash TEXT NOT NULL,
            entry_hash TEXT NOT NULL
        )
        """
    )
    cur.execute("PRAGMA table_info(human_signoffs)")
    existing_cols = {row[1] for row in cur.fetchall()}
    for col, col_def in [
        ("reviewer_id", "TEXT DEFAULT 'OFFICER-001'"),
        ("reviewer_name", "TEXT DEFAULT 'Authorized Reviewer'"),
        ("reviewer_role", "TEXT DEFAULT 'Oversight Officer'"),
        ("decision_before", "TEXT DEFAULT ''"),
        ("decision_after", "TEXT DEFAULT ''"),
        ("override_reason", "TEXT DEFAULT ''"),
    ]:
        if col not in existing_cols:
            cur.execute(f"ALTER TABLE human_signoffs ADD COLUMN {col} {col_def}")
    conn.commit()
    conn.close()


def _compute_hash(prev_hash: str, payload_str: str) -> str:
    return hashlib.sha256(f"{prev_hash}|{payload_str}".encode("utf-8")).hexdigest()


def save_audit_run(
    domain: str,
    adapter_type: str,
    model_name: str,
    applicant_name: str,
    score: Optional[float],
    decision: str,
    disparate_impact_ratio: Any,
    grounding_rate: Any,
    result: Dict[str, Any],
) -> Dict[str, str]:
    init_db()
    mode = _storage_mode()
    run_id = str(uuid.uuid4())
    created_at = time.time()
    result_json = json.dumps(result, sort_keys=True)

    if mode == "supabase":
        rows = _sb_request("audit_runs?select=entry_hash&order=created_at.desc&limit=1")
        prev_hash = rows[0]["entry_hash"] if rows else ("0" * 64)
        entry_hash = _compute_hash(prev_hash, f"{run_id}|{created_at}|{result_json}")
        _sb_request(
            "audit_runs",
            method="POST",
            payload={
                "id": run_id,
                "created_at": created_at,
                "domain": domain,
                "adapter_type": adapter_type,
                "model_name": model_name,
                "applicant_name": applicant_name,
                "score": score,
                "decision": decision,
                "disparate_impact_ratio": str(disparate_impact_ratio),
                "grounding_rate": str(grounding_rate),
                "result_json": result_json,
                "prev_hash": prev_hash,
                "entry_hash": entry_hash,
            },
        )
        return {"run_id": run_id, "prev_hash": prev_hash, "entry_hash": entry_hash, "storage": "supabase-postgres"}

    if mode == "postgres":
        with _get_pg_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT entry_hash FROM audit_runs ORDER BY created_at DESC LIMIT 1")
                row = cur.fetchone()
                prev_hash = row["entry_hash"] if row else ("0" * 64)
                entry_hash = _compute_hash(prev_hash, f"{run_id}|{created_at}|{result_json}")
                cur.execute(
                    """
                    INSERT INTO audit_runs (
                        id, created_at, domain, adapter_type, model_name,
                        applicant_name, score, decision, disparate_impact_ratio,
                        grounding_rate, result_json, prev_hash, entry_hash
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        run_id, created_at, domain, adapter_type, model_name,
                        applicant_name, score, decision, str(disparate_impact_ratio),
                        str(grounding_rate), result_json, prev_hash, entry_hash,
                    ),
                )
            conn.commit()
        return {"run_id": run_id, "prev_hash": prev_hash, "entry_hash": entry_hash, "storage": "postgresql"}

    conn = _get_sqlite_conn()
    cur = conn.cursor()
    cur.execute("SELECT entry_hash FROM audit_runs ORDER BY created_at DESC LIMIT 1")
    row = cur.fetchone()
    prev_hash = row["entry_hash"] if row else ("0" * 64)
    entry_hash = _compute_hash(prev_hash, f"{run_id}|{created_at}|{result_json}")
    cur.execute(
        """
        INSERT INTO audit_runs (
            id, created_at, domain, adapter_type, model_name,
            applicant_name, score, decision, disparate_impact_ratio,
            grounding_rate, result_json, prev_hash, entry_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            run_id, created_at, domain, adapter_type, model_name,
            applicant_name, score, decision, str(disparate_impact_ratio),
            str(grounding_rate), result_json, prev_hash, entry_hash,
        ),
    )
    conn.commit()
    conn.close()
    return {"run_id": run_id, "prev_hash": prev_hash, "entry_hash": entry_hash, "storage": "sqlite-local"}


def save_human_signoff(
    run_id: str,
    action: str,
    justification: str = "",
    reviewer_id: str = "OFFICER-001",
    reviewer_name: str = "Authorized Reviewer",
    reviewer_role: str = "Hiring / Credit Oversight Officer",
    decision_before: str = "",
    decision_after: str = "",
) -> Dict[str, Any]:
    init_db()
    mode = _storage_mode()
    signoff_id = str(uuid.uuid4())
    created_at = time.time()
    payload = f"{signoff_id}|{run_id}|{reviewer_id}|{reviewer_role}|{decision_before}|{decision_after}|{action}|{justification}|{created_at}"

    if mode == "supabase":
        rows = _sb_request("human_signoffs?select=entry_hash&order=created_at.desc&limit=1")
        prev_hash = rows[0]["entry_hash"] if rows else ("0" * 64)
        entry_hash = _compute_hash(prev_hash, payload)
        _sb_request(
            "human_signoffs",
            method="POST",
            payload={
                "id": signoff_id,
                "run_id": run_id,
                "created_at": created_at,
                "reviewer_id": reviewer_id,
                "reviewer_name": reviewer_name,
                "reviewer_role": reviewer_role,
                "decision_before": decision_before,
                "decision_after": decision_after,
                "reviewer_action": action,
                "override_reason": justification,
                "prev_hash": prev_hash,
                "entry_hash": entry_hash,
            },
        )
    elif mode == "postgres":
        with _get_pg_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT entry_hash FROM human_signoffs ORDER BY created_at DESC LIMIT 1")
                row = cur.fetchone()
                prev_hash = row["entry_hash"] if row else ("0" * 64)
                entry_hash = _compute_hash(prev_hash, payload)
                cur.execute(
                    """
                    INSERT INTO human_signoffs (
                        id, run_id, created_at, reviewer_id, reviewer_name, reviewer_role,
                        decision_before, decision_after, reviewer_action, override_reason,
                        prev_hash, entry_hash
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        signoff_id, run_id, created_at, reviewer_id, reviewer_name, reviewer_role,
                        decision_before, decision_after, action, justification, prev_hash, entry_hash,
                    ),
                )
            conn.commit()
    else:
        conn = _get_sqlite_conn()
        cur = conn.cursor()
        cur.execute("SELECT entry_hash FROM human_signoffs ORDER BY created_at DESC LIMIT 1")
        row = cur.fetchone()
        prev_hash = row["entry_hash"] if row else ("0" * 64)
        entry_hash = _compute_hash(prev_hash, payload)
        cur.execute(
            """
            INSERT INTO human_signoffs (
                id, run_id, created_at, reviewer_id, reviewer_name, reviewer_role,
                decision_before, decision_after, reviewer_action, override_reason,
                prev_hash, entry_hash
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                signoff_id, run_id, created_at, reviewer_id, reviewer_name, reviewer_role,
                decision_before, decision_after, action, justification, prev_hash, entry_hash,
            ),
        )
        conn.commit()
        conn.close()

    return {
        "signoff_id": signoff_id,
        "reviewer_id": reviewer_id,
        "reviewer_name": reviewer_name,
        "reviewer_role": reviewer_role,
        "decision_before": decision_before,
        "decision_after": decision_after,
        "timestamp": created_at,
        "prev_hash": prev_hash,
        "entry_hash": entry_hash,
    }


def get_monitoring_history(limit: int = 20) -> Dict[str, Any]:
    init_db()
    mode = _storage_mode()
    if mode == "supabase":
        rows = _sb_request(
            f"audit_runs?select=id,created_at,domain,adapter_type,model_name,applicant_name,score,decision,disparate_impact_ratio,grounding_rate,prev_hash,entry_hash&order=created_at.desc&limit={limit}"
        )
        all_rows = _sb_request("audit_runs?select=id,created_at,result_json,prev_hash,entry_hash&order=created_at.asc")
    elif mode == "postgres":
        with _get_pg_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id, created_at, domain, adapter_type, model_name, applicant_name, score, decision, disparate_impact_ratio, grounding_rate, prev_hash, entry_hash FROM audit_runs ORDER BY created_at DESC LIMIT %s",
                    (limit,),
                )
                rows = [dict(r) for r in cur.fetchall()]
                cur.execute("SELECT id, created_at, result_json, prev_hash, entry_hash FROM audit_runs ORDER BY created_at ASC")
                all_rows = cur.fetchall()
    else:
        conn = _get_sqlite_conn()
        cur = conn.cursor()
        cur.execute(
            "SELECT id, created_at, domain, adapter_type, model_name, applicant_name, score, decision, disparate_impact_ratio, grounding_rate, prev_hash, entry_hash FROM audit_runs ORDER BY created_at DESC LIMIT ?",
            (limit,),
        )
        rows = [dict(r) for r in cur.fetchall()]
        cur.execute("SELECT id, created_at, result_json, prev_hash, entry_hash FROM audit_runs ORDER BY created_at ASC")
        all_rows = cur.fetchall()
        conn.close()

    chain_valid = True
    expected_prev = "0" * 64
    for r in all_rows:
        recomputed = _compute_hash(r["prev_hash"], f"{r['id']}|{r['created_at']}|{r['result_json']}")
        if r["prev_hash"] != expected_prev or recomputed != r["entry_hash"]:
            chain_valid = False
            break
        expected_prev = r["entry_hash"]

    drift_alerts = []
    for r in rows[:5]:
        try:
            dir_f = float(r["disparate_impact_ratio"])
            if dir_f < 0.80:
                drift_alerts.append(
                    f"Run {r['id'][:8]} ({r['model_name']}): DIR dropped to {dir_f} (< 0.80 threshold)"
                )
        except (ValueError, TypeError):
            pass

    return {
        "total_runs": len(all_rows),
        "hash_chain_valid": chain_valid,
        "latest_runs": rows,
        "drift_alerts": drift_alerts,
    }
