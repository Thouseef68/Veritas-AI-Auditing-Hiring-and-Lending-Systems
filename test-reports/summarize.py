import json

loc = json.load(open("test-reports/local_test_results.json"))
print("=== PHASE 2/3 ML MODEL ===")
for k, v in loc["phase2_3_ml_model"].items():
    print(f"  {k}: score={v.get('score')} decision={v.get('decision')}")

print("=== PHASE 4 FAIRNESS ===")
for k, v in loc["phase4_fairness"].items():
    print(f"  {k}: DPD={v.get('demographic_parity_diff')} DIR={v.get('disparate_impact_ratio')} EOD={v.get('equal_opportunity_diff')} EqOdds={v.get('equalized_odds_diff')}")

print("=== PHASE 5 PRIVACY ===")
p5 = loc["phase5_privacy"]
print("  findings:", [(f.get("rule_id"), f.get("match")) for f in p5.get("pii_findings", [])])
print("  redacted_ids:", p5.get("redacted_ids"))
print("  consent_blocked:", p5.get("consent_blocked_error"))

print("=== PHASE 6 GROUNDING ===")
for k, v in loc["phase6_grounding"].items():
    print(f"  {k}: grounding_rate={v.get('grounding_rate')} unsupported={v.get('unsupported_claims')}")

print("=== PHASE 7 ROBUSTNESS ===")
print("  prompt_injection:", loc["phase7_robustness"]["prompt_injection"].get("injection_succeeded"), "score=", loc["phase7_robustness"]["prompt_injection"].get("injected_score"))
print("  empty_resume:", loc["phase7_robustness"]["empty_resume"].get("score"), loc["phase7_robustness"]["empty_resume"].get("decision"))
print("  long_resume_score:", loc["phase7_robustness"]["long_resume_score"])

print("=== PHASE 10 SSRF ===")
print(" ", loc["phase10_ssrf"])

print("=== PHASE 11 LENDING ===")
for k, v in loc["phase11_lending"].items():
    print(f"  {k}: score={v.get('score')} decision={v.get('decision')}")

print("\n=== LIVE TESTS ===")
live = json.load(open("test-reports/live_test_results.json"))
for k, v in live.items():
    j = v.get("json") or {}
    if k.startswith("llm_run"):
        p = j.get("primary_evaluation") or {}
        print(f"  {k}: status={v.get('status')} ms={v.get('ms')} score={p.get('score')} decision={p.get('decision')} model={p.get('model')} isolated={len(j.get('isolated_counterfactuals') or [])} grounding={(j.get('grounding') or {}).get('grounding_rate')} dpdp={len((j.get('privacy_firewall') or {}).get('findings') or [])}")
        for ic in (j.get("isolated_counterfactuals") or []):
            print(f"    iso: {ic.get('attribute')} delta={ic.get('delta')} flip={ic.get('decision_flip')}")
    else:
        print(f"  {k}: status={v.get('status')} ms={v.get('ms')} preview={v.get('textPreview', '')[:140]}")
