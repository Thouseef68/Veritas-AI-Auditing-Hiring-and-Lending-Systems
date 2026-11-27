"""
Statistical Fairness & Paired Counterfactual Engine.
- Computes Disparate Impact Ratio, Demographic Parity, Equal Opportunity, Equalized Odds.
- Returns 'Not measurable' when ground-truth labels are absent (never invents metrics).
- Computes real paired twin score deltas with bootstrap 95% confidence intervals and p-values.
- Supports intersectional subgroup analysis (e.g., Female + Tier 3 + Career Gap).
"""

import math
import random
from typing import Any, Dict, List, Optional
from scipy import stats


def _bootstrap_ci(values: List[float], n_boot: int = 500, alpha: float = 0.05) -> Optional[List[float]]:
    if len(values) < 2:
        return None
    rng = random.Random(42)
    means = []
    n = len(values)
    for _ in range(n_boot):
        sample = [values[rng.randrange(n)] for _ in range(n)]
        means.append(sum(sample) / n)
    means.sort()
    lo_idx = max(0, int((alpha / 2.0) * n_boot))
    hi_idx = min(n_boot - 1, int((1.0 - alpha / 2.0) * n_boot))
    return [round(means[lo_idx], 3), round(means[hi_idx], 3)]


def compute_paired_twin_statistics(
    original_scores: List[float], twin_scores: List[float]
) -> Dict[str, Any]:
    """Computes paired counterfactual score delta, 95% bootstrap CI, and paired p-value."""
    if not original_scores or len(original_scores) != len(twin_scores):
        return {
            "n_pairs": 0,
            "mean_score_delta": "Not measurable",
            "ci_95": None,
            "p_value": "Not measurable",
            "statistically_significant": False,
        }

    deltas = [t - o for o, t in zip(original_scores, twin_scores)]
    n = len(deltas)
    mean_delta = sum(deltas) / n

    if n < 2 or all(d == deltas[0] for d in deltas):
        p_val = 0.0 if (n >= 2 and deltas[0] != 0) else 1.0
        ci = [round(mean_delta, 3), round(mean_delta, 3)]
    else:
        _, p_val = stats.ttest_rel(twin_scores, original_scores)
        if math.isnan(p_val):
            p_val = 1.0
        ci = _bootstrap_ci(deltas)

    return {
        "n_pairs": n,
        "mean_score_delta": round(mean_delta, 3),
        "abs_mean_delta": round(abs(mean_delta), 3),
        "ci_95": ci,
        "p_value": round(float(p_val), 5),
        "statistically_significant": bool(p_val < 0.05 and abs(mean_delta) > 0.5),
    }


def compute_group_metrics(
    records: List[Dict[str, Any]],
    sensitive_attr: str,
    priv_val: Any,
    unpriv_val: Any,
    merit_attr: str = "qualified_merit",
    score_attr: str = "model_score",
    threshold: float = 60.0,
) -> Dict[str, Any]:
    """
    Computes group fairness metrics from real model outputs.
    Reports 'Not measurable' for ground-truth metrics when merit_attr is missing.
    """
    priv_records = [r for r in records if r.get(sensitive_attr) == priv_val]
    unpriv_records = [r for r in records if r.get(sensitive_attr) == unpriv_val]

    if not priv_records or not unpriv_records:
        return {
            "disparate_impact_ratio": "Not measurable",
            "demographic_parity_difference": "Not measurable",
            "equal_opportunity_difference": "Not measurable",
            "equalized_odds_difference": "Not measurable",
            "reason": "Insufficient group population in sample.",
        }

    has_ground_truth = all(merit_attr in r and r[merit_attr] is not None for r in priv_records + unpriv_records)

    def eval_group(group: List[Dict[str, Any]]) -> Dict[str, Any]:
        total = len(group)
        positives = sum(1 for r in group if float(r.get(score_attr, 0)) >= threshold)
        sel_rate = positives / total if total > 0 else 0.0
        out: Dict[str, Any] = {
            "total": total,
            "positives": positives,
            "selection_rate": round(sel_rate, 4),
        }
        if has_ground_truth:
            tp = sum(1 for r in group if float(r.get(score_attr, 0)) >= threshold and int(r[merit_attr]) == 1)
            fp = sum(1 for r in group if float(r.get(score_attr, 0)) >= threshold and int(r[merit_attr]) == 0)
            fn = sum(1 for r in group if float(r.get(score_attr, 0)) < threshold and int(r[merit_attr]) == 1)
            tn = sum(1 for r in group if float(r.get(score_attr, 0)) < threshold and int(r[merit_attr]) == 0)
            tpr = tp / (tp + fn) if (tp + fn) > 0 else None
            fpr = fp / (fp + tn) if (fp + tn) > 0 else None
            out["tpr"] = round(tpr, 4) if tpr is not None else "Not measurable"
            out["fpr"] = round(fpr, 4) if fpr is not None else "Not measurable"
            out["accuracy"] = round((tp + tn) / total, 4)
        else:
            out["tpr"] = "Not measurable"
            out["fpr"] = "Not measurable"
            out["accuracy"] = "Not measurable"
        return out

    priv_stats = eval_group(priv_records)
    unpriv_stats = eval_group(unpriv_records)

    if priv_stats["selection_rate"] > 0:
        dir_val = round(unpriv_stats["selection_rate"] / priv_stats["selection_rate"], 3)
    else:
        dir_val = "Not measurable"

    dp_diff = round(abs(priv_stats["selection_rate"] - unpriv_stats["selection_rate"]), 4)

    if (
        has_ground_truth
        and isinstance(priv_stats["tpr"], float)
        and isinstance(unpriv_stats["tpr"], float)
    ):
        eo_diff: Any = round(abs(priv_stats["tpr"] - unpriv_stats["tpr"]), 4)
        if isinstance(priv_stats["fpr"], float) and isinstance(unpriv_stats["fpr"], float):
            eq_odds: Any = round(
                0.5 * (abs(priv_stats["fpr"] - unpriv_stats["fpr"]) + eo_diff), 4
            )
        else:
            eq_odds = "Not measurable"
    else:
        eo_diff = "Not measurable"
        eq_odds = "Not measurable"

    return {
        "sensitive_attribute": sensitive_attr,
        "privileged_group": priv_val,
        "unprivileged_group": unpriv_val,
        "disparate_impact_ratio": dir_val,
        "eeoc_four_fifths_pass": (dir_val >= 0.80) if isinstance(dir_val, float) else "Not measurable",
        "demographic_parity_difference": dp_diff,
        "equal_opportunity_difference": eo_diff,
        "equalized_odds_difference": eq_odds,
        "privileged_stats": priv_stats,
        "unprivileged_stats": unpriv_stats,
        "sample_size": len(records),
        "sample_size_warning": len(records) < 30,
    }


def compute_intersectional_fairness(
    records: List[Dict[str, Any]],
    domain: str = "hiring",
    score_attr: str = "model_score",
    threshold: float = 60.0,
) -> Dict[str, Any]:
    """Evaluates intersectional subgroups (e.g., Female + Tier-2/3 + Career Break)."""
    subgroups: Dict[str, List[Dict[str, Any]]] = {}
    for r in records:
        if domain == "hiring":
            g = str(r.get("gender", "Unknown"))
            tier = "Tier 1" if "tier 1" in str(r.get("college_tier", "")).lower() else "Non-Tier 1"
            gap = "Gap>0" if float(r.get("career_break_months", 0) or 0) > 0 else "NoGap"
            key = f"{g} | {tier} | {gap}"
        else:
            emp = str(r.get("employment_type", "salaried"))
            loc = "Metro" if "tier 1" in str(r.get("tier_location", "")).lower() else "Non-Metro"
            key = f"{emp} | {loc}"
        subgroups.setdefault(key, []).append(r)

    summary = []
    for name, grp in subgroups.items():
        pos = sum(1 for r in grp if float(r.get(score_attr, 0)) >= threshold)
        avg_score = sum(float(r.get(score_attr, 0)) for r in grp) / len(grp)
        summary.append(
            {
                "subgroup": name,
                "count": len(grp),
                "selection_rate": round(pos / len(grp), 3),
                "mean_score": round(avg_score, 2),
            }
        )
    summary.sort(key=lambda x: x["mean_score"])
    return {
        "subgroups": summary,
        "lowest_scoring_subgroup": summary[0] if summary else None,
        "highest_scoring_subgroup": summary[-1] if summary else None,
    }
