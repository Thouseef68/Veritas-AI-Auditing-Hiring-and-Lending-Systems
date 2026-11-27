"""
Veritas AI Independent Auditing Backend (FastAPI).
Promotes ml_engine/ into a production-ready Python audit server with
Universal Model Adapters, Capability Detection, Statistical Fairness,
Surrogate Rule Extraction, YAML DPDP Scanner, and Hash-Chained SQLite Store.
"""

from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .orchestrator import run_full_audit, build_adapter
from .robustness_engine import run_prompt_injection_probe, run_robustness_check
from .dpdp_scanner import run_canary_leakage_probe
from .store import save_human_signoff, get_monitoring_history

app = FastAPI(
    title="Veritas AI Independent Auditing Engine",
    version="2.0.0",
    description="FastAPI backend for algorithmic fairness, counterfactual twin testing, surrogate rule extraction, and DPDP Act compliance.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
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
    consent_confirmed: bool = True
    n_cohort_pairs: int = 6


class SignoffRequest(BaseModel):
    run_id: str
    action: str
    justification: str = ""


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok", "engine": "Veritas AI FastAPI Audit Engine v2.0"}


@app.post("/audit/run")
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
            n_cohort_pairs=req.n_cohort_pairs,
        )
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/audit/attack-probe")
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
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/audit/signoff")
def api_signoff(req: SignoffRequest) -> Dict[str, str]:
    return save_human_signoff(req.run_id, req.action, req.justification)


@app.get("/audit/monitoring")
def api_monitoring(limit: int = 20) -> Dict[str, Any]:
    return get_monitoring_history(limit=limit)
