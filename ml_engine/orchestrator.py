"""
Audit Orchestration Engine.
1. Enforces Consent Record & DPDP Pre-Inference Privacy Firewall (sends ONLY sanitized text to external models).
2. Runs Universal Model Adapter + Capability Detection.
3. Executes Isolated One-Variable-At-A-Time Counterfactual Attribution + Combined Twin Test.
4. Aggregates Statistical Fairness, Surrogate Rules, Grounding, Robustness & Canary Probes.
"""

import time
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Dict, List, Optional
from .adapters import (
    LLMAdapter,
    VendorAPIAdapter,
    CSVAdapter,
    PlantedBiasModelAdapter,
    ModelAdapter,
)
from .audit_core import (
    compute_group_metrics,
    compute_intersectional_fairness,
    compute_paired_twin_statistics,
)
from .dpdp_scanner import scan_text_for_pii, sanitize_text, run_canary_leakage_probe
from .grounding_checker import check_output_grounding
from .robustness_engine import run_robustness_check, run_prompt_injection_probe
from .rule_extractor import extract_surrogate_rules
from .store import save_audit_run


ALLOWED_HIRING_FIELDS = {
    "full_name",
    "gender",
    "target_role",
    "years_exp",
    "career_break_months",
    "college_tier",
    "employer",
    "github",
    "portfolio",
    "resume_text",
    "notes",
}

ALLOWED_LENDING_FIELDS = {
    "full_name",
    "gender",
    "age",
    "tier_location",
    "location",
    "location_tier",
    "pin_code",
    "employment_type",
    "job_title",
    "employer",
    "income",
    "monthly_income",
    "monthly_income_inr",
    "annual_income_inr",
    "monthly_obligations",
    "monthly_obligations_inr",
    "loan_amount_inr",
    "tenor_months",
    "loan_purpose",
    "credit_score",
    "debt_to_income",
    "dti",
    "statement_text",
    "notes",
}


def sanitize_profile_allowlist(profile: Dict[str, Any], domain: str) -> tuple[Dict[str, Any], List[Dict[str, Any]], List[str]]:
    """
    Explicit allowlist + full-field PII sanitization before any external model call.
    Drops unallowlisted fields and sanitizes every string field in the allowlist.
    """
    allowed = ALLOWED_HIRING_FIELDS if domain == "hiring" else ALLOWED_LENDING_FIELDS
    safe: Dict[str, Any] = {}
    all_findings: List[Dict[str, Any]] = []
    seen_rules: set[str] = set()

    for key in allowed:
        if key not in profile:
            continue
        val = profile[key]
        if isinstance(val, str):
            all_findings.extend(scan_text_for_pii(val))
            clean_val, rules = sanitize_text(val)
            safe[key] = clean_val
            seen_rules.update(rules)
        else:
            safe[key] = val

    if domain == "lending":
        # Financial input normalization
        inc = (
            safe.get("monthly_income_inr")
            or safe.get("monthly_income")
            or (float(safe.get("annual_income_inr", 0)) / 12 if safe.get("annual_income_inr") else 0)
            or (float(safe.get("income", 0)) / 12 if float(safe.get("income", 0)) > 200000 else safe.get("income", 0))
            or 0
        )
        safe["monthly_income_inr"] = float(inc)

        ob = float(safe.get("monthly_obligations_inr") or safe.get("monthly_obligations") or 0)
        safe["monthly_obligations_inr"] = ob

        if "debt_to_income" in safe and safe["debt_to_income"] is not None:
            raw_dti = safe["debt_to_income"]
            if isinstance(raw_dti, str) and "%" in raw_dti:
                safe["debt_to_income"] = float(raw_dti.replace("%", "").strip()) / 100.0
            else:
                dti_val = float(raw_dti)
                safe["debt_to_income"] = dti_val / 100.0 if dti_val > 1.0 else dti_val
        elif "dti" in safe and safe["dti"] is not None:
            dti_val = float(safe["dti"])
            safe["debt_to_income"] = dti_val / 100.0 if dti_val > 1.0 else dti_val
        else:
            safe["debt_to_income"] = round(ob / float(inc), 3) if float(inc) > 0 else 0.5

        loc = safe.get("tier_location") or safe.get("location_tier") or safe.get("location") or "Tier 2 (Semi-urban)"
        safe["tier_location"] = loc

    # Ensure canonical text field is populated with sanitized content
    sanitized_body = safe.get("resume_text") or safe.get("statement_text") or safe.get("notes") or ""
    safe["notes"] = sanitized_body
    if domain == "hiring":
        safe["resume_text"] = sanitized_body
    else:
        safe["statement_text"] = sanitized_body

    return safe, all_findings, sorted(seen_rules)


def build_adapter(
    adapter_type: str = "llm",
    model_name: Optional[str] = None,
    endpoint_url: str = "",
    csv_records: Optional[List[Dict[str, Any]]] = None,
    planted_bias_points: float = 12.0,
    mitigate: bool = False,
) -> ModelAdapter:
    atype = (adapter_type or "llm").lower()
    if atype in ("ml_model", "planted_bias", "validator"):
        return PlantedBiasModelAdapter(planted_bias_points=planted_bias_points, mitigate=mitigate)
    if atype == "api":
        return VendorAPIAdapter(endpoint_url=endpoint_url)
    if atype == "csv":
        return CSVAdapter(records=csv_records or [])
    return LLMAdapter(model_name=model_name)


def generate_matched_twin(profile: Dict[str, Any], domain: str = "hiring") -> Dict[str, Any]:
    """Generates a counterfactual twin flipping protected/proxy attributes while holding merits constant."""
    twin = dict(profile)
    if domain == "hiring":
        is_female = str(profile.get("gender", "")).lower() == "female"
        has_gap = float(profile.get("career_break_months", 0) or 0) > 0
        twin["full_name"] = "Rahul Sen" if is_female else "Pooja Sen"
        twin["gender"] = "Male" if is_female else "Female"
        twin["career_break_months"] = 0 if has_gap else 8
        twin["college_tier"] = (
            "Tier 2 (Top State University)"
            if "tier 1" in str(profile.get("college_tier", "")).lower()
            else "Tier 1 (IIT/NIT/BITS)"
        )
    else:
        loc = str(profile.get("tier_location", "")).lower()
        is_rural = "rural" in loc or "tier 3" in loc
        twin["full_name"] = "Rajesh Kumar" if is_rural else "Sunita Patil"
        twin["pin_code"] = "560001" if is_rural else "585102"
        twin["tier_location"] = "Tier 1 (Metro)" if is_rural else "Tier 3 (Rural/Semi-urban)"
        twin["employment_type"] = "salaried" if str(profile.get("employment_type", "")).lower() == "business" else "business"
    return twin


def run_isolated_counterfactuals(
    adapter: ModelAdapter, safe_profile: Dict[str, Any], base_score: float, domain: str = "hiring"
) -> List[Dict[str, Any]]:
    """
    One-variable-at-a-time counterfactual attribution so each attribute's
    individual score impact is isolated cleanly.
    """
    attributions: List[Dict[str, Any]] = []

    if domain == "hiring":
        is_female = str(safe_profile.get("gender", "")).lower() == "female"
        has_gap = float(safe_profile.get("career_break_months", 0) or 0) > 0
        is_tier1 = "tier 1" in str(safe_profile.get("college_tier", "")).lower()

        probes = [
            ("gender", "Gender Twin", {"gender": "Male" if is_female else "Female"}),
            ("career_break_months", "Career Gap Twin", {"career_break_months": 0 if has_gap else 8}),
            (
                "college_tier",
                "College Tier Twin",
                {"college_tier": "Tier 2 (Top State University)" if is_tier1 else "Tier 1 (IIT/NIT/BITS)"},
            ),
            (
                "full_name",
                "Name / Proxy Twin",
                {"full_name": "Rahul Sharma" if is_female else "Ananya Iyer"},
            ),
        ]
    else:
        loc = str(safe_profile.get("tier_location", "")).lower()
        is_rural = "rural" in loc or "tier 3" in loc
        is_biz = str(safe_profile.get("employment_type", "")).lower() == "business"
        probes = [
            ("pin_code", "PIN Code Twin", {"pin_code": "560001" if is_rural else "585102"}),
            (
                "tier_location",
                "Rural / Metro Twin",
                {"tier_location": "Tier 1 (Metro)" if is_rural else "Tier 3 (Rural/Semi-urban)"},
            ),
            (
                "employment_type",
                "Employment-Type Twin",
                {"employment_type": "salaried" if is_biz else "business"},
            ),
        ]

    def _run_probe(item):
        attr, label, patch = item
        probe_profile = dict(safe_profile)
        probe_profile.update(patch)
        res = adapter.decide(probe_profile, domain=domain)
        twin_score = float(res["score"])
        delta = round(twin_score - float(base_score), 2)
        return {
            "attribute": attr,
            "label": label,
            "changed_to": patch[attr],
            "original_score": base_score,
            "twin_score": twin_score,
            "delta": delta,
            "potential_bias": abs(delta) >= 3.0,
        }

    with ThreadPoolExecutor(max_workers=len(probes)) as pool:
        attributions = list(pool.map(_run_probe, probes))

    return attributions


def generate_paired_cohort(base_profile: Dict[str, Any], domain: str = "hiring", n_pairs: int = 8) -> List[Dict[str, Any]]:
    """Generates matched unprivileged-vs-privileged twin pairs across varying merit levels."""
    cohort: List[Dict[str, Any]] = []
    for i in range(n_pairs):
        orig = dict(base_profile)
        if domain == "hiring":
            orig["years_exp"] = i % 6
            orig["gender"] = "Female"
            orig["career_break_months"] = 8 if i % 2 == 0 else 7
            orig["college_tier"] = "Tier 2 (Top State University)"
            if i % 3 == 0:
                orig["github"] = ""
                orig["portfolio"] = ""
        else:
            orig["monthly_income_inr"] = 20000 + (i * 12000)
            orig["credit_score"] = 600 + (i * 25)
            orig["tier_location"] = "Tier 3 (Rural/Semi-urban)"
            orig["employment_type"] = "business"
        twin = generate_matched_twin(orig, domain=domain)
        cohort.append(orig)
        cohort.append(twin)
    return cohort


def run_full_audit(
    profile: Dict[str, Any],
    domain: str = "hiring",
    adapter_type: str = "llm",
    model_name: Optional[str] = None,
    endpoint_url: str = "",
    csv_records: Optional[List[Dict[str, Any]]] = None,
    planted_bias_points: float = 12.0,
    mitigate: bool = False,
    consent_confirmed: bool = False,
    consent_actor: str = "authorized-auditor",
    n_cohort_pairs: int = 6,
) -> Dict[str, Any]:
    if not consent_confirmed:
        raise PermissionError("DPDP Act Section 6 explicit consent is required before processing personal data.")

    consent_record = {
        "consent_confirmed": True,
        "consent_timestamp": time.time(),
        "purpose": f"Algorithmic fairness, grounding & privacy audit ({domain})",
        "data_categories": ["application_profile", "dossier_text", "public_signals"],
        "policy_version": "veritas-dpdp-v2.0",
        "actor": consent_actor,
    }

    adapter = build_adapter(
        adapter_type=adapter_type,
        model_name=model_name,
        endpoint_url=endpoint_url,
        csv_records=csv_records,
        planted_bias_points=planted_bias_points,
        mitigate=mitigate,
    )
    caps = adapter.capabilities()

    if domain == "hiring":
        raw_resume = str(profile.get("resume_text") or profile.get("notes") or "").strip()
        if not raw_resume:
            raise ValueError("Resume text cannot be empty or whitespace-only for hiring audits.")
    else:
        raw_statement = str(profile.get("statement_text") or profile.get("notes") or "").strip()
        income_check = profile.get("monthly_income_inr") or profile.get("annual_income_inr") or profile.get("income") or profile.get("monthly_income")
        if not raw_statement and not income_check:
            raise ValueError("Financial statement or income details cannot be empty for lending audits.")

    raw_text = str(profile.get("resume_text") or profile.get("statement_text") or profile.get("notes") or "")

    # 1. TRUE PRE-INFERENCE PRIVACY FIREWALL (Allowlist + Full-Profile Sanitization)
    safe_profile, pii_findings, redacted_rule_ids = sanitize_profile_allowlist(profile, domain=domain)
    sanitized_text = safe_profile.get("notes", "")

    # 2. Primary Evaluation using SANITIZED safe_profile (P0 #1 fix)
    primary_eval = adapter.decide(safe_profile, domain=domain)

    # 3. Real Counterfactual Twin Evaluation + Isolated One-Variable Attribution (in parallel)
    twin_profile = generate_matched_twin(safe_profile, domain=domain)
    if caps.get("counterfactual_testing"):
        with ThreadPoolExecutor(max_workers=2) as pool:
            f_twin = pool.submit(adapter.decide, twin_profile, domain)
            f_iso = pool.submit(
                run_isolated_counterfactuals, adapter, safe_profile, float(primary_eval["score"]), domain
            )
            twin_eval = f_twin.result()
            isolated_attribution = f_iso.result()
        twin_delta = round(float(twin_eval["score"]) - float(primary_eval["score"]), 2)
        abs_delta = round(abs(twin_delta), 2)
        twin_result: Dict[str, Any] = {
            "supported": True,
            "twin_profile": twin_profile,
            "twin_score": twin_eval["score"],
            "twin_decision": twin_eval["decision"],
            "score_shift_delta": abs_delta,
            "signed_delta": twin_delta,
            "isolated_attribution": isolated_attribution,
            "explanation": (
                f"Real paired evaluation on sanitized profile: Original scored {primary_eval['score']}, "
                f"Combined Twin ({twin_profile['full_name']}) scored {twin_eval['score']} "
                f"(delta: {twin_delta:+.1f} pts)."
            ),
        }
    else:
        isolated_attribution = []
        twin_result = {
            "supported": False,
            "twin_profile": None,
            "twin_score": "Not measurable",
            "score_shift_delta": "Not measurable",
            "isolated_attribution": [],
            "explanation": f"Counterfactual live testing is not supported for adapter '{adapter.adapter_type}'.",
        }

    # 4. Cohort Statistical Fairness & Surrogate Rule Extraction
    if adapter.adapter_type == "csv" and csv_records:
        eval_records = []
        for rec in csv_records[:100]:
            out = adapter.decide(rec, domain=domain)
            merged = dict(rec)
            merged["model_score"] = out["score"]
            merged["decision"] = out["decision"]
            eval_records.append(merged)
        paired_stats = {"n_pairs": 0, "mean_score_delta": "Not measurable", "ci_95": None, "p_value": "Not measurable"}
    elif adapter.adapter_type == "ml_model":
        cohort = generate_paired_cohort(safe_profile, domain=domain, n_pairs=n_cohort_pairs)
        eval_records = []
        orig_scores = []
        twin_scores = []
        for idx, rec in enumerate(cohort):
            out = adapter.decide(rec, domain=domain)
            merged = dict(rec)
            merged["model_score"] = out["score"]
            merged["decision"] = out["decision"]
            eval_records.append(merged)
            if idx % 2 == 0:
                orig_scores.append(float(out["score"]))
            else:
                twin_scores.append(float(out["score"]))
        paired_stats = compute_paired_twin_statistics(orig_scores, twin_scores)
    else:
        eval_records = [
            {**safe_profile, "model_score": primary_eval["score"], "decision": primary_eval["decision"]},
            {
                **twin_profile,
                "model_score": twin_result.get("twin_score", primary_eval["score"]),
                "decision": twin_result.get("twin_decision", primary_eval["decision"]),
            },
        ]
        paired_stats = compute_paired_twin_statistics(
            [float(primary_eval["score"])],
            [float(twin_result["twin_score"])]
            if isinstance(twin_result.get("twin_score"), (int, float))
            else [float(primary_eval["score"])],
        )

    if domain == "hiring":
        group_fairness = compute_group_metrics(eval_records, "gender", "Male", "Female")
    else:
        for r in eval_records:
            loc = str(r.get("tier_location", "")).lower()
            r["_loc_group"] = "Metro" if ("tier 1" in loc or "metro" in loc) else "Non-Metro"
        group_fairness = compute_group_metrics(eval_records, "_loc_group", "Metro", "Non-Metro")

    intersectional = compute_intersectional_fairness(eval_records, domain=domain)

    # 5. Surrogate Rule Extraction
    if caps.get("rule_extraction"):
        rule_extraction = extract_surrogate_rules(eval_records, domain=domain)
    else:
        rule_extraction = {"supported": False, "surrogate_fidelity": "Not measurable", "rules": []}

    # 6. Output-Based Grounding Audit (compared against original local text)
    grounding = check_output_grounding(
        rationale=primary_eval.get("rationale", ""),
        positive_points=primary_eval.get("why_positive", []),
        flag_points=primary_eval.get("why_flags", []),
        source_text=raw_text,
        profile=profile,
    )

    # 7. Robustness & Attack Probes
    if adapter.adapter_type == "ml_model":
        robustness = run_robustness_check(adapter, safe_profile, domain=domain, repeats=3)
        canary_probe = run_canary_leakage_probe(adapter, safe_profile, domain=domain)
        injection_probe = {"supported": False, "status": "Not applicable (deterministic ML model)"}
    elif adapter.adapter_type == "csv":
        robustness = {"decision_consistency_pct": "Not measurable", "max_score_drift": "Not measurable"}
        canary_probe = {"status": "Not measurable (static CSV)"}
        injection_probe = {"supported": False, "status": "Not applicable (static CSV)"}
    else:
        robustness = {"decision_consistency_pct": "Single-pass live LLM", "max_score_drift": "Not measured in single pass"}
        canary_probe = {"status": "Available via /audit/attack-probe"}
        injection_probe = {"supported": True, "status": "Available via /audit/attack-probe"}

    # 8. Hash-Chained Tamper-Evident Ledger
    audit_payload = {
        "domain": domain,
        "adapter_type": adapter.adapter_type,
        "model_name": adapter.model_name,
        "capabilities": caps,
        "consent_record": consent_record,
        "pre_inference_sanitization_enforced": True,
        "primary_evaluation": primary_eval,
        "counterfactual_twin_test": twin_result,
        "paired_statistics": paired_stats,
        "group_fairness": group_fairness,
        "intersectional_fairness": intersectional,
        "rule_extraction": rule_extraction,
        "grounding_audit": grounding,
        "dpdp_audit": {
            "compliant": len(pii_findings) == 0,
            "violations_count": len(pii_findings),
            "findings": pii_findings,
            "redacted_rule_ids": redacted_rule_ids,
            "sanitized_preview": sanitized_text[:300],
        },
        "robustness": robustness,
        "privacy_canary_probe": canary_probe,
        "prompt_injection_probe": injection_probe,
    }

    ledger_receipt = save_audit_run(
        domain=domain,
        adapter_type=adapter.adapter_type,
        model_name=adapter.model_name,
        applicant_name=str(profile.get("full_name", "Applicant")),
        score=primary_eval.get("score"),
        decision=primary_eval.get("decision", "UNKNOWN"),
        disparate_impact_ratio=group_fairness.get("disparate_impact_ratio", "Not measurable"),
        grounding_rate=grounding.get("grounding_rate", "Not measurable"),
        result=audit_payload,
    )
    audit_payload["ledger_receipt"] = ledger_receipt
    return audit_payload
