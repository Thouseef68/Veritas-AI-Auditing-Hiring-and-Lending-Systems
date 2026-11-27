"""
Veritas AI Independent Auditing Backend (FastAPI).
- Mandatory VERITAS_API_SECRET authentication in production (fail-closed).
- Restricted CORS origins.
- Reviewer identity tracking on /audit/signoff.
"""

import hmac
import os
from typing import Any, Dict, List, Optional
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .orchestrator import run_full_audit, build_adapter
from .robustness_engine import run_prompt_injection_probe, run_robustness_check
from .dpdp_scanner import run_canary_leakage_probe
from .security import is_production_env
from .store import save_human_signoff, get_monitoring_history

API_SECRET = os.environ.get("VERITAS_API_SECRET", "")
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,https://veritas-ai-auditor.vercel.app",
    ).split(",")
    if o.strip()
]


def verify_api_auth(x_veritas_key: Optional[str] = Header(default=None)) -> None:
    prod = is_production_env()
    secret = os.environ.get("VERITAS_API_SECRET", "") or API_SECRET
    if prod and not secret:
        raise HTTPException(
            status_code=500,
            detail="Server misconfiguration: VERITAS_API_SECRET is mandatory in production.",
        )
    if secret:
        if not x_veritas_key or not hmac.compare_digest(x_veritas_key, secret):
            raise HTTPException(status_code=401, detail="Unauthorized: invalid or missing X-Veritas-Key.")


app = FastAPI(
    title="Veritas AI Independent Auditing Engine",
    version="2.2.0",
    description="FastAPI backend for algorithmic fairness, isolated counterfactual twin attribution, surrogate rule extraction, and DPDP governance.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Veritas-Key"],
)


class AuditRequest(BaseModel):
    profile: Dict[str, Any]
    domain: str = "hiring"
    adapter_type: str = "llm"
    model_name: Optional[str] = None
    endpoint_url: str = ""
    csv_records: Optional[List[Dict[str, Any]]] = None
    planted_bias_points: float = 12.0
    mitigate: bool = False
    consent_confirmed: bool = False
    consent_actor: str = "authorized-auditor"
    n_cohort_pairs: int = 6


class SignoffRequest(BaseModel):
    run_id: str
    action: str
    justification: str = ""
    reviewer_id: str = "OFFICER-001"
    reviewer_name: str = "Authorized Reviewer"
    reviewer_role: str = "Hiring / Credit Oversight Officer"
    decision_before: str = ""
    decision_after: str = ""


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok", "engine": "Veritas AI FastAPI Audit Engine v2.2"}


@app.post("/audit/run", dependencies=[Depends(verify_api_auth)])
def api_run_audit(req: AuditRequest) -> Dict[str, Any]:
    try:
        return run_full_audit(
            profile=req.profile,
            domain=req.domain,
            adapter_type=req.adapter_type,
            model_name=req.model_name,
            endpoint_url=req.endpoint_url,
            csv_records=req.csv_records,
            planted_bias_points=req.planted_bias_points,
            mitigate=req.mitigate,
            consent_confirmed=req.consent_confirmed,
            consent_actor=req.consent_actor,
            n_cohort_pairs=req.n_cohort_pairs,
        )
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/audit/attack-probe", dependencies=[Depends(verify_api_auth)])
def api_attack_probe(req: AuditRequest) -> Dict[str, Any]:
    try:
        adapter = build_adapter(
            adapter_type=req.adapter_type,
            model_name=req.model_name,
            endpoint_url=req.endpoint_url,
            planted_bias_points=req.planted_bias_points,
        )
        return {
            "prompt_injection": run_prompt_injection_probe(adapter, req.profile, domain=req.domain),
            "privacy_canary": run_canary_leakage_probe(adapter, req.profile, domain=req.domain),
            "robustness": run_robustness_check(adapter, req.profile, domain=req.domain, repeats=2),
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/audit/signoff", dependencies=[Depends(verify_api_auth)])
def api_signoff(req: SignoffRequest) -> Dict[str, Any]:
    return save_human_signoff(
        run_id=req.run_id,
        action=req.action,
        justification=req.justification,
        reviewer_id=req.reviewer_id,
        reviewer_name=req.reviewer_name,
        reviewer_role=req.reviewer_role,
        decision_before=req.decision_before,
        decision_after=req.decision_after,
    )


@app.get("/audit/monitoring", dependencies=[Depends(verify_api_auth)])
def api_monitoring(limit: int = 20) -> Dict[str, Any]:
    return get_monitoring_history(limit=limit)
