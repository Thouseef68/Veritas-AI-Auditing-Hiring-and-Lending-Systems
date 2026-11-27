import pytest

from ml_engine.adapters.base import ModelAdapter
from ml_engine.audit_core import compute_group_metrics
from ml_engine.dpdp_scanner import scan_text_for_pii, sanitize_text
from ml_engine.grounding_checker import check_output_grounding
from ml_engine.orchestrator import run_full_audit
from ml_engine.security import validate_external_url
from ml_engine.store import get_monitoring_history, save_human_signoff


class SpyAdapter(ModelAdapter):
    """Test spy verifying raw PII never leaves the Pre-Inference Privacy Firewall."""

    adapter_type = "ml_model"
    model_name = "spy-adapter"

    def __init__(self):
        self.seen_texts = []

    def decide(self, profile, domain="hiring"):
        txt = profile.get("resume_text") or profile.get("statement_text") or profile.get("notes") or ""
        self.seen_texts.append(txt)
        return {
            "score": 75.0,
            "decision": "SHORTLIST" if domain == "hiring" else "APPROVE",
            "rationale": "Evaluated 5 years React experience.",
            "why_positive": ["5 years React experience"],
            "why_flags": [],
            "raw_output": "",
            "metadata": {"adapter_type": "ml_model", "model_name": self.model_name},
        }


def test_pre_inference_privacy_firewall_masks_pii_before_model_call(monkeypatch):
    spy = SpyAdapter()
    monkeypatch.setattr("ml_engine.orchestrator.build_adapter", lambda **kwargs: spy)

    res = run_full_audit(
        profile={
            "full_name": "Aditi Sen",
            "gender": "Female",
            "years_exp": 5,
            "notes": "5 years React. Aadhaar UID: 4829 1928 3819. Marital Status: Married.",
        },
        domain="hiring",
        adapter_type="ml_model",
        consent_confirmed=True,
    )

    assert res["pre_inference_sanitization_enforced"] is True
    assert len(spy.seen_texts) > 0
    assert "[REDACTED_DPDP_AADHAAR_UID]" in spy.seen_texts[0]
    assert "[REDACTED_DPDP_MARITAL_PROXY]" in spy.seen_texts[0]
    for seen in spy.seen_texts:
        assert "4829 1928 3819" not in seen


def test_consent_is_enforced():
    with pytest.raises(PermissionError):
        run_full_audit(
            profile={"full_name": "Test User", "notes": "Python engineer"},
            domain="hiring",
            adapter_type="ml_model",
            consent_confirmed=False,
        )


def test_planted_bias_detection_and_isolated_counterfactual_attribution():
    res = run_full_audit(
        profile={
            "full_name": "Aditi Sen",
            "gender": "Female",
            "years_exp": 5,
            "career_break_months": 8,
            "college_tier": "Tier 2 (Top State University)",
            "github": "github.com/aditisen/cloud-orchestrator",
            "portfolio": "https://aditi-portfolio.vercel.app",
            "notes": "5 years React, Node.js, cloud systems.",
        },
        domain="hiring",
        adapter_type="ml_model",
        planted_bias_points=12.0,
        mitigate=False,
        consent_confirmed=True,
    )

    # Combined twin detects exact 12-pt planted penalty
    assert res["counterfactual_twin_test"]["score_shift_delta"] == 12.0
    assert res["paired_statistics"]["mean_score_delta"] == 12.0

    # Isolated attribution separates Gender (+6) and Career Gap (+6)
    attrs = {a["attribute"]: a for a in res["counterfactual_twin_test"]["isolated_attribution"]}
    assert attrs["gender"]["delta"] == 6.0
    assert attrs["career_break_months"]["delta"] == 6.0
    assert attrs["college_tier"]["delta"] == 0.0
    assert attrs["full_name"]["delta"] == 0.0


def test_remediation_neutralizes_planted_bias():
    res = run_full_audit(
        profile={
            "full_name": "Aditi Sen",
            "gender": "Female",
            "years_exp": 5,
            "career_break_months": 8,
            "college_tier": "Tier 2 (Top State University)",
            "github": "github.com/aditisen/cloud-orchestrator",
            "notes": "5 years React, Node.js.",
        },
        domain="hiring",
        adapter_type="ml_model",
        planted_bias_points=12.0,
        mitigate=True,
        consent_confirmed=True,
    )
    assert res["counterfactual_twin_test"]["score_shift_delta"] == 0.0


def test_missing_ground_truth_reports_not_measurable():
    records = [
        {"gender": "Male", "model_score": 80},
        {"gender": "Female", "model_score": 65},
    ]
    metrics = compute_group_metrics(records, "gender", "Male", "Female")
    assert metrics["disparate_impact_ratio"] == 1.0
    assert metrics["equal_opportunity_difference"] == "Not measurable"
    assert metrics["equalized_odds_difference"] == "Not measurable"
    assert metrics["sample_size_warning"] is True


def test_ssrf_guard_blocks_internal_hosts():
    for bad_url in [
        "http://localhost:8000/health",
        "http://127.0.0.1:3000",
        "http://169.254.169.254/latest/meta-data/",
        "http://10.0.0.5/internal",
        "file:///etc/passwd",
    ]:
        with pytest.raises(ValueError):
            validate_external_url(bad_url)


def test_yaml_dpdp_scanner_and_grounding_and_hash_chain():
    findings = scan_text_for_pii("Aadhaar: 4829 1928 3819, PAN: ABCDE1234F, Marital: Married")
    rule_ids = {f["rule_id"] for f in findings}
    assert {"dpdp_aadhaar_uid", "dpdp_pan_card", "dpdp_marital_proxy"}.issubset(rule_ids)

    sanitized, applied = sanitize_text("Aadhaar 4829 1928 3819")
    assert "4829 1928 3819" not in sanitized
    assert "dpdp_aadhaar_uid" in applied

    grd = check_output_grounding(
        rationale="Developed fraud detection using XGBoost.",
        positive_points=["Developed fraud detection using XGBoost"],
        flag_points=[],
        source_text="Built real-time graph fraud detection engine with Redis and XGBoost.",
        profile={"full_name": "Thouseef"},
    )
    assert grd["grounding_rate"] == 100.0

    signoff = save_human_signoff(
        run_id="test-run-1",
        action="OVERRIDDEN",
        justification="Career gap improperly penalized",
        reviewer_id="R-104",
        reviewer_name="Priya Nair",
        reviewer_role="Lead Recruiter",
        decision_before="REJECT",
        decision_after="SHORTLIST",
    )
    assert len(signoff["entry_hash"]) == 64

    hist = get_monitoring_history()
    assert hist["hash_chain_valid"] is True


def test_allowlist_sanitizes_all_fields_and_drops_extra_keys():
    from ml_engine.orchestrator import sanitize_profile_allowlist

    safe, findings, rules = sanitize_profile_allowlist(
        {
            "full_name": "Aditi Sen",
            "employer": "TCS (PAN: ABCDE1234F)",
            "notes": "5 years React",
            "secret_extra_field": "should_be_dropped",
            "raw_aadhaar": "4829 1928 3819",
        },
        domain="hiring",
    )
    assert "secret_extra_field" not in safe
    assert "raw_aadhaar" not in safe
    assert "ABCDE1234F" not in safe["employer"]
    assert "[REDACTED_DPDP_PAN_CARD]" in safe["employer"]
    assert "dpdp_pan_card" in rules


def test_fastapi_auth_mandatory_in_production(monkeypatch):
    from fastapi import HTTPException
    from ml_engine.server import verify_api_auth

    monkeypatch.setenv("VERITAS_ENV", "production")
    monkeypatch.delenv("VERITAS_API_SECRET", raising=False)
    with pytest.raises(HTTPException) as exc500:
        verify_api_auth(x_veritas_key=None)
    assert exc500.value.status_code == 500

    monkeypatch.setenv("VERITAS_API_SECRET", "super-secret-token")
    with pytest.raises(HTTPException) as exc401:
        verify_api_auth(x_veritas_key="wrong-token")
    assert exc401.value.status_code == 401

    verify_api_auth(x_veritas_key="super-secret-token")


def test_https_required_in_production_for_external_urls():
    with pytest.raises(ValueError):
        validate_external_url("http://example.com/api", require_https=True)
    assert validate_external_url("https://example.com/api", require_https=True) == "https://example.com/api"
