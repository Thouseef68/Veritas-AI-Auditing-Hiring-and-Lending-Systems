"""
Hash-Chained SQLite Run Store & Continuous Monitoring Registry.
Stores audit runs, human sign-offs, and drift metrics with SHA-256 hash chaining.
"""

import hashlib
import json
import os
import sqlite3
import time
import uuid
from typing import Any, Dict, List, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "veritas_audit.db")


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = _get_conn()
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
            reviewer_action TEXT NOT NULL,
            justification TEXT,
            prev_hash TEXT NOT NULL,
            entry_hash TEXT NOT NULL
        )
        """
    )
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
    conn = _get_conn()
    cur = conn.cursor()

    cur.execute("SELECT entry_hash FROM audit_runs ORDER BY created_at DESC LIMIT 1")
    row = cur.fetchone()
    prev_hash = row["entry_hash"] if row else ("0" * 64)

    run_id = str(uuid.uuid4())
    created_at = time.time()
    result_json = json.dumps(result, sort_keys=True)
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
            run_id,
            created_at,
            domain,
            adapter_type,
            model_name,
            applicant_name,
            score,
            decision,
            str(disparate_impact_ratio),
            str(grounding_rate),
            result_json,
            prev_hash,
            entry_hash,
        ),
    )
    conn.commit()
    conn.close()
    return {"run_id": run_id, "prev_hash": prev_hash, "entry_hash": entry_hash}


def save_human_signoff(run_id: str, action: str, justification: str = "") -> Dict[str, str]:
    init_db()
    conn = _get_conn()
    cur = conn.cursor()

    cur.execute("SELECT entry_hash FROM human_signoffs ORDER BY created_at DESC LIMIT 1")
    row = cur.fetchone()
    prev_hash = row["entry_hash"] if row else ("0" * 64)

    signoff_id = str(uuid.uuid4())
    created_at = time.time()
    entry_hash = _compute_hash(prev_hash, f"{signoff_id}|{run_id}|{action}|{justification}|{created_at}")

    cur.execute(
        """
        INSERT INTO human_signoffs (id, run_id, created_at, reviewer_action, justification, prev_hash, entry_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (signoff_id, run_id, created_at, action, justification, prev_hash, entry_hash),
    )
    conn.commit()
    conn.close()
    return {"signoff_id": signoff_id, "prev_hash": prev_hash, "entry_hash": entry_hash}


def get_monitoring_history(limit: int = 20) -> Dict[str, Any]:
    init_db()
    conn = _get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, created_at, domain, adapter_type, model_name, applicant_name, score, decision, disparate_impact_ratio, grounding_rate, prev_hash, entry_hash FROM audit_runs ORDER BY created_at DESC LIMIT ?",
        (limit,),
    )
    rows = [dict(r) for r in cur.fetchall()]

    # Verify hash-chain integrity across all runs
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

    # Drift alert if latest DIR < 0.80
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
