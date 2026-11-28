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


def test_llm_adapter_strict_parsing_and_no_silent_default():
    from ml_engine.adapters.llm_adapter import LLMAdapter

    adapter = LLMAdapter(api_key="mock-key")

    # 1. Plain text with markdown bolding
    out1 = adapter._parse_structured_output(
        "**SCORE:** 78\n**DECISION:** SHORTLIST\nWHY_SHOULD_HIRE:\n- Strong PyTorch & XGBoost\nREASONING: Candidate verified.",
        domain="hiring",
    )
    assert out1 is not None
    assert out1["score"] == 78
    assert out1["decision"] == "SHORTLIST"
    assert "Candidate verified." in out1["rationale"]

    # 2. JSON structured output
    out2 = adapter._parse_structured_output(
        '{"score": 85, "decision": "SHORTLIST", "rationale": "High candidate match.", "why_positive": ["Strong research"]}',
        domain="hiring",
    )
    assert out2 is not None
    assert out2["score"] == 85
    assert out2["decision"] == "SHORTLIST"

    # 3. Accidental reasoning exposure stripped
    out3 = adapter._parse_structured_output(
        "<think>I could consider giving this person 75, but let's check.</think>\nSCORE: 75\nDECISION: SHORTLIST\nREASONING: Demonstrated ML projects.",
        domain="hiring",
    )
    assert out3 is not None
    assert out3["score"] == 75
    assert "<think>" not in out3["rationale"]

    # 4. Malformed output with no score returns None (triggers retry, never defaults to 50!)
    out4 = adapter._parse_structured_output("Here is my evaluation. The candidate is very nice.", domain="hiring")
    assert out4 is None


def test_dpdp_privacy_all_types_detected_and_redacted():
    synthetic_pii = (
        "Candidate: Test User. Aadhaar: 1234 5678 9012. PAN: ABCDE1234F. "
        "Email: test.user@example.com. Phone: +91-9876543210. "
        "Address: 42 MG Road, Bengaluru 560001. Bank Account: 98765432101234."
    )
    findings = scan_text_for_pii(synthetic_pii)
    rule_ids = {f["rule_id"] for f in findings}
    assert "dpdp_aadhaar_uid" in rule_ids
    assert "dpdp_pan_card" in rule_ids
    assert "dpdp_email_address" in rule_ids
    assert "dpdp_phone_number" in rule_ids
    assert "dpdp_address" in rule_ids
    assert "dpdp_bank_account" in rule_ids

    sanitized, applied = sanitize_text(synthetic_pii)
    assert "1234 5678 9012" not in sanitized
    assert "ABCDE1234F" not in sanitized
    assert "test.user@example.com" not in sanitized
    assert "9876543210" not in sanitized
    assert "98765432101234" not in sanitized
    assert "[REDACTED_DPDP_AADHAAR_UID]" in sanitized
    assert "[REDACTED_DPDP_PAN_CARD]" in sanitized
    assert "[REDACTED_DPDP_BANK_ACCOUNT]" in sanitized


def test_grounding_detects_negation_contradiction_and_unsupported_credentials():
    evidence_text = "Built XGBoost fraud engine with 99.28% recall and FastAPI backend. BCA student at DSU."
    base_profile = {"full_name": "Test Candidate", "resume_text": evidence_text}

    # 1. Contradiction
    g_contra = check_output_grounding(
        "Candidate has no experience with XGBoost or FastAPI.",
        [],
        ["No experience with XGBoost"],
        evidence_text,
        base_profile,
    )
    assert g_contra["grounding_rate"] == 0.0
    assert g_contra["hallucinations_count"] >= 1
    assert any(c["status"] == "CONTRADICTION" for c in g_contra["tested_claims"])

    # 2. Fabricated / Unsupported credentials
    g_fab = check_output_grounding(
        "Candidate holds a PhD from MIT and led a 50-person team at Meta.",
        ["PhD from MIT", "50-person team at Meta"],
        [],
        evidence_text,
        base_profile,
    )
    assert g_fab["grounding_rate"] == 0.0
    assert g_fab["hallucinations_count"] >= 1

    # 3. Supported claim
    g_sup = check_output_grounding(
        "Candidate built an XGBoost fraud engine and FastAPI backend.",
        ["XGBoost fraud engine", "FastAPI backend"],
        [],
        evidence_text,
        base_profile,
    )
    assert g_sup["grounding_rate"] == 100.0


def test_empty_resume_rejected_at_orchestrator_level():
    with pytest.raises(ValueError) as exc:
        run_full_audit(
            profile={"full_name": "Applicant", "resume_text": "   "},
            domain="hiring",
            adapter_type="ml_model",
            consent_confirmed=True,
        )
    assert "cannot be empty" in str(exc.value)


def test_lending_field_mapping_normalizes_income_and_dti():
    from ml_engine.adapters.model_adapter import PlantedBiasModelAdapter

    adapter = PlantedBiasModelAdapter()
    lending_profile = {
        "full_name": "Synthetic Borrower",
        "credit_score": 740,
        "income": 850000,
        "loan_amount": 500000,
        "dti": 0.28,
        "employment_type": "Salaried",
        "location_tier": "Metro",
        "pin_code": "560001",
        "statement_text": "Salaried applicant, credit score 740, income 8.5L, DTI 28%.",
    }
    res = adapter.decide(lending_profile, domain="lending")
    assert res["score"] >= 65.0
    assert res["decision"] == "APPROVE"
    assert "DTI 28.0%" in res["rationale"]
    assert "Monthly Income Rs. 70833" in res["rationale"]


def test_investigate_bias_lab_attribute_attribution_and_flip():
    from ml_engine.orchestrator import investigate_bias_lab
    from ml_engine.adapters.model_adapter import PlantedBiasModelAdapter

    adapter = PlantedBiasModelAdapter(planted_bias_points=14.0, mitigate=False)

    base = {
        "full_name": "Aditi Sen",
        "gender": "Female",
        "years_exp": 5,
        "career_break_months": 8,
        "college_tier": "Tier 2",
        "resume_text": "5 years experience in Python and React. 8 month career break.",
    }
    # Toggled counterfactual: Male, 0 career break, Tier 1
    modified = {
        "full_name": "Rahul Sen",
        "gender": "Male",
        "years_exp": 5,
        "career_break_months": 0,
        "college_tier": "Tier 1",
        "resume_text": "5 years experience in Python and React. No career break.",
    }

    lab_res = investigate_bias_lab(base, modified, domain="hiring", adapter=adapter)

    assert lab_res["comparison"]["score_delta"] > 0
    assert len(lab_res["comparison"]["changed_attributes"]) >= 2
    assert lab_res["comparison"]["primary_driver"] is not None
    assert len(lab_res["test_results_table"]) >= 4
    assert lab_res["comparison"]["risk_classification"] in ("Minimal Risk", "Moderate Risk", "High Risk")


def test_continuous_model_monitoring_metrics_and_drift_alerts():
    from ml_engine.store import get_continuous_monitoring_metrics

    metrics = get_continuous_monitoring_metrics(limit=25)
    assert len(metrics["models_status"]) >= 3
    assert len(metrics["time_series"]) >= 7
    assert len(metrics["emerging_bias_patterns"]) >= 3
    assert metrics["hash_chain_verified"] is True
    # Verify time-series structure matches deepchecks style
    first_pt = metrics["time_series"][0]
    assert "date" in first_pt
    assert "evaluations" in first_pt
    assert "dir_ratio" in first_pt
    assert "score_drift" in first_pt


def test_automated_ai_red_team_suite_and_vulnerability_report():
    from ml_engine.robustness_engine import run_full_red_team_suite
    from ml_engine.adapters.model_adapter import PlantedBiasModelAdapter

    adapter = PlantedBiasModelAdapter(planted_bias_points=12.0)
    profile = {
        "full_name": "Test Candidate",
        "gender": "Female",
        "years_exp": 3,
        "college_tier": "Tier 2",
        "resume_text": "Software engineer with 3 years experience.",
    }

    report = run_full_red_team_suite(adapter, profile, domain="hiring")

    assert report["simulated_attacks_count"] >= 5
    assert "attack_success_rate_pct" in report
    assert "category_scores" in report
    assert "security" in report["category_scores"]
    assert "safety" in report["category_scores"]
    assert "hallucination" in report["category_scores"]
    assert "privacy" in report["category_scores"]
    assert report["consistency"] in report["category_scores"] if "consistency" in report else True
    assert len(report["test_runs"]) >= 5
    assert report["risk_level"] in ("High Risk", "Moderate Risk", "Low Risk")


