"""
Surrogate Decision-Tree Rule Extractor.
Fits an interpretable DecisionTreeClassifier on the audited model's real outputs
to extract human-readable decision rules and compute Surrogate Fidelity.
"""

from typing import Any, Dict, List
import numpy as np
from sklearn.tree import DecisionTreeClassifier, export_text


def extract_surrogate_rules(
    evaluated_records: List[Dict[str, Any]], domain: str = "hiring", max_depth: int = 3
) -> Dict[str, Any]:
    if len(evaluated_records) < 6:
        return {
            "supported": False,
            "surrogate_fidelity": "Not measurable",
            "rules": [],
            "reason": "Need at least 6 evaluated profiles to fit surrogate decision tree.",
        }

    if domain == "hiring":
        feature_names = ["years_exp", "career_break_months", "is_female", "is_non_tier1", "has_github"]
        X = []
        y = []
        for r in evaluated_records:
            X.append([
                float(r.get("years_exp", 0) or 0),
                float(r.get("career_break_months", 0) or 0),
                1.0 if str(r.get("gender", "")).lower() == "female" else 0.0,
                0.0 if "tier 1" in str(r.get("college_tier", "")).lower() else 1.0,
                1.0 if r.get("github") else 0.0,
            ])
            y.append(1 if str(r.get("decision", "")).upper() in ("SHORTLIST", "APPROVE", "1") else 0)
    else:
        feature_names = ["monthly_income_inr", "credit_score", "dti_pct", "is_non_metro", "is_business"]
        X = []
        y = []
        for r in evaluated_records:
            inc = float(r.get("monthly_income_inr", 1) or 1)
            obl = float(r.get("monthly_obligations_inr", 0) or 0)
            dti = (obl / inc) * 100.0 if inc > 0 else 100.0
            loc = str(r.get("tier_location", "")).lower()
            X.append([
                inc,
                float(r.get("credit_score", 700) or 700),
                dti,
                0.0 if "tier 1" in loc or "metro" in loc else 1.0,
                1.0 if str(r.get("employment_type", "")).lower() == "business" else 0.0,
            ])
            y.append(1 if str(r.get("decision", "")).upper() in ("APPROVE", "SHORTLIST", "1") else 0)

    X_arr = np.array(X)
    y_arr = np.array(y)

    if len(set(y_arr.tolist())) < 2:
        const_label = "APPROVE/SHORTLIST" if y_arr[0] == 1 else "DECLINE/REJECT"
        return {
            "supported": True,
            "surrogate_fidelity": 1.0,
            "rules": [f"Model returned uniform decision ({const_label}) across all {len(y_arr)} tested profiles."],
            "tree_text": f"Uniform prediction: {const_label}",
        }

    clf = DecisionTreeClassifier(max_depth=max_depth, min_samples_leaf=2, random_state=42)
    clf.fit(X_arr, y_arr)
    preds = clf.predict(X_arr)
    fidelity = round(float(np.mean(preds == y_arr)), 4)

    tree_text = export_text(clf, feature_names=feature_names)
    rules = [line.strip() for line in tree_text.splitlines() if line.strip()][:12]

    return {
        "supported": True,
        "surrogate_fidelity": fidelity,
        "feature_names": feature_names,
        "rules": rules,
        "tree_text": tree_text,
    }
