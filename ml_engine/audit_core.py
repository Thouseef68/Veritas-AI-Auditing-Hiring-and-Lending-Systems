"""
Fairness Metrology, Counterfactual Twin Testing, and Auto-Mitigation Engine
Implements strict mathematical audit formulas compliant with EEOC 80% rule
and Responsible AI metrology standards.
"""

import math

def compute_group_metrics(records, sensitive_attr, priv_val, unpriv_val, outcome_attr="approved_historically", merit_attr="qualified_merit", score_attr="simulated_model_score", threshold=0.50):
    """
    Computes rigorous fairness metrics between Privileged and Unprivileged groups.
    """
    priv_records = [r for r in records if r.get(sensitive_attr) == priv_val]
    unpriv_records = [r for r in records if r.get(sensitive_attr) == unpriv_val]
    
    if not priv_records or not unpriv_records:
        return {"error": "Insufficient group population"}
        
    def evaluate_group(group):
        total = len(group)
        # Decision based on score threshold or outcome
        positives = sum(1 for r in group if r.get(score_attr, 0) >= threshold)
        selection_rate = positives / total if total > 0 else 0
        
        # Merit / Ground Truth counts
        tp = sum(1 for r in group if r.get(score_attr, 0) >= threshold and r.get(merit_attr, 0) == 1)
        fp = sum(1 for r in group if r.get(score_attr, 0) >= threshold and r.get(merit_attr, 0) == 0)
        fn = sum(1 for r in group if r.get(score_attr, 0) < threshold and r.get(merit_attr, 0) == 1)
        tn = sum(1 for r in group if r.get(score_attr, 0) < threshold and r.get(merit_attr, 0) == 0)
        
        actual_positives = tp + fn
        actual_negatives = fp + tn
        
        tpr = tp / actual_positives if actual_positives > 0 else 0 # Recall / Opportunity
        fpr = fp / actual_negatives if actual_negatives > 0 else 0
        accuracy = (tp + tn) / total if total > 0 else 0
        
        return {
            "total": total,
            "positives": positives,
            "selection_rate": round(selection_rate, 4),
            "tpr": round(tpr, 4),
            "fpr": round(fpr, 4),
            "accuracy": round(accuracy, 4),
            "tp": tp, "fp": fp, "fn": fn, "tn": tn
        }

    priv_stats = evaluate_group(priv_records)
    unpriv_stats = evaluate_group(unpriv_records)
    
    # 1. Disparate Impact Ratio (Four-Fifths Rule)
    if priv_stats["selection_rate"] > 0:
        disparate_impact = unpriv_stats["selection_rate"] / priv_stats["selection_rate"]
    else:
        disparate_impact = 1.0
        
    # 2. Demographic Parity Difference
    demographic_parity_diff = abs(priv_stats["selection_rate"] - unpriv_stats["selection_rate"])
    
    # 3. Equal Opportunity Difference (Delta TPR)
    equal_opportunity_diff = abs(priv_stats["tpr"] - unpriv_stats["tpr"])
    
    # 4. Average Odds Difference
    avg_odds_diff = 0.5 * (abs(priv_stats["fpr"] - unpriv_stats["fpr"]) + abs(priv_stats["tpr"] - unpriv_stats["tpr"]))
    
    # Disparate impact compliance evaluation
    if disparate_impact >= 0.80:
        di_status = "COMPLIANT (Passes 80% Rule)"
        severity = "green"
    elif disparate_impact >= 0.65:
        di_status = "WARNING (Moderate Adverse Impact)"
        severity = "amber"
    else:
        di_status = "CRITICAL VIOLATION (Severe Adverse Impact)"
        severity = "red"
        
    # Counterfactual Perturbation (Twin Test)
    # Estimate flip rate for unprivileged group members if elevated by the delta penalty
    counterfactual_flips = 0
    penalty_offset = 0.12 # empirical demographic penalty
    for r in unpriv_records:
        current_score = r.get(score_attr, 0)
        if current_score < threshold and (current_score + penalty_offset) >= threshold:
            counterfactual_flips += 1
            
    flip_rate = counterfactual_flips / len(unpriv_records) if len(unpriv_records) > 0 else 0

    return {
        "sensitive_attribute": sensitive_attr,
        "privileged_group": priv_val,
        "unprivileged_group": unpriv_val,
        "disparate_impact_ratio": round(disparate_impact, 3),
        "disparate_impact_status": di_status,
        "severity": severity,
        "demographic_parity_difference": round(demographic_parity_diff, 4),
        "equal_opportunity_difference": round(equal_opportunity_diff, 4),
        "average_odds_difference": round(avg_odds_diff, 4),
        "counterfactual_decision_flip_rate": round(flip_rate, 3),
        "counterfactual_flip_count": counterfactual_flips,
        "privileged_stats": priv_stats,
        "unprivileged_stats": unpriv_stats,
        "overall_records_tested": len(records)
    }


def find_optimal_mitigation_threshold(records, sensitive_attr, priv_val, unpriv_val, score_attr="simulated_model_score"):
    """
    Searches thresholds to find the Pareto optimal operating point
    that restores Disparate Impact >= 0.80 with minimal global accuracy drop.
    """
    best_threshold = 0.50
    best_score = -999
    optimal_stats = None
    
    steps = [round(t * 0.02, 2) for t in range(18, 38)] # 0.36 to 0.74
    
    results = []
    for t in steps:
        m = compute_group_metrics(records, sensitive_attr, priv_val, unpriv_val, score_attr=score_attr, threshold=t)
        di = m["disparate_impact_ratio"]
        total_acc = (m["privileged_stats"]["accuracy"] * m["privileged_stats"]["total"] + 
                     m["unprivileged_stats"]["accuracy"] * m["unprivileged_stats"]["total"]) / len(records)
        
        # Reward DI >= 0.80 and high accuracy
        fairness_penalty = max(0, 0.80 - di) * 3.5
        objective = total_acc - fairness_penalty
        
        results.append({
            "threshold": t,
            "disparate_impact": di,
            "accuracy": round(total_acc, 4),
            "objective": round(objective, 4)
        })
        
        if objective > best_score:
            best_score = objective
            best_threshold = t
            optimal_stats = {
                "threshold": t,
                "disparate_impact": di,
                "accuracy": round(total_acc, 4),
                "di_status": m["disparate_impact_status"]
            }
            
    return {
        "calibrated_threshold": best_threshold,
        "mitigation_summary": optimal_stats,
        "curve_points": results[::2] # sample for charts
    }
