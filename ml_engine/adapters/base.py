from abc import ABC, abstractmethod
from typing import Any, Dict


CAPABILITY_MATRIX = {
    "api": {
        "historical_fairness": "Conditional",
        "counterfactual_testing": True,
        "rule_extraction": True,
        "hallucination_detection": "Conditional",
        "live_privacy_probes": True,
        "remediation_simulation": True,
        "live_re_audit": True,
    },
    "csv": {
        "historical_fairness": True,
        "counterfactual_testing": False,
        "rule_extraction": "Limited",
        "hallucination_detection": "Conditional",
        "live_privacy_probes": False,
        "remediation_simulation": "Limited",
        "live_re_audit": False,
    },
    "ml_model": {
        "historical_fairness": "Conditional",
        "counterfactual_testing": True,
        "rule_extraction": True,
        "hallucination_detection": "Conditional",
        "live_privacy_probes": "Conditional",
        "remediation_simulation": True,
        "live_re_audit": True,
    },
    "llm": {
        "historical_fairness": "Conditional",
        "counterfactual_testing": True,
        "rule_extraction": "Limited",
        "hallucination_detection": True,
        "live_privacy_probes": True,
        "remediation_simulation": True,
        "live_re_audit": True,
    },
}


class ModelAdapter(ABC):
    """Standardized Universal Model Adapter interface."""

    adapter_type: str = "unknown"
    model_name: str = "unknown"

    def capabilities(self) -> Dict[str, Any]:
        return CAPABILITY_MATRIX.get(self.adapter_type, {})

    @abstractmethod
    def decide(self, profile: Dict[str, Any], domain: str = "hiring") -> Dict[str, Any]:
        """
        Evaluate a single applicant/borrower profile.
        Must return:
          - score: float (0-100)
          - decision: str ('SHORTLIST'/'REJECT' or 'APPROVE'/'DECLINE')
          - rationale: str
          - metadata: dict
        """
        raise NotImplementedError
