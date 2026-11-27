from typing import Any, Dict, List

from .base import ModelAdapter


class CSVAdapter(ModelAdapter):
    """
    Adapter for static historical Decisions CSV/JSON logs.
    Supports historical statistical fairness and limited rule extraction;
    does NOT support live counterfactual twin calls or live re-audits.
    """

    adapter_type = "csv"

    def __init__(self, records: List[Dict[str, Any]], dataset_name: str = "uploaded_decisions.csv"):
        self.records = records
        self.model_name = f"csv:{dataset_name}"

    def decide(self, profile: Dict[str, Any], domain: str = "hiring") -> Dict[str, Any]:
        raw_score = profile.get("model_score", profile.get("score", profile.get("simulated_model_score")))
        if raw_score is None:
            raise ValueError("CSV record missing score column.")
        score = float(raw_score) * 100.0 if 0 <= float(raw_score) <= 1.0 else float(raw_score)
        score = max(0.0, min(100.0, round(score, 2)))

        default_pos = "SHORTLIST" if domain == "hiring" else "APPROVE"
        default_neg = "REJECT" if domain == "hiring" else "DECLINE"
        decision = str(profile.get("decision") or (default_pos if score >= 50 else default_neg)).upper()

        return {
            "score": score,
            "decision": decision,
            "rationale": str(profile.get("rationale") or "Historical decision record from CSV."),
            "why_positive": [],
            "why_flags": [],
            "raw_output": "",
            "metadata": {
                "adapter_type": self.adapter_type,
                "model_name": self.model_name,
            },
        }
