import json
import urllib.request
from typing import Any, Dict

from .base import ModelAdapter
from ..security import validate_external_url


class VendorAPIAdapter(ModelAdapter):
    """Adapter for auditing external black-box Vendor HTTP decision APIs."""

    adapter_type = "api"

    def __init__(self, endpoint_url: str, auth_header: str = ""):
        self.endpoint_url = validate_external_url(endpoint_url, require_https=False) if endpoint_url else ""
        self.auth_header = auth_header
        self.model_name = f"vendor-api:{self.endpoint_url}"

    def decide(self, profile: Dict[str, Any], domain: str = "hiring") -> Dict[str, Any]:
        if not self.endpoint_url:
            raise ValueError("Vendor API endpoint_url is required.")
        validate_external_url(self.endpoint_url, require_https=False)

        headers = {"Content-Type": "application/json"}
        if self.auth_header:
            headers["Authorization"] = self.auth_header

        payload = json.dumps({"profile": profile, "domain": domain}).encode("utf-8")
        req = urllib.request.Request(self.endpoint_url, data=payload, headers=headers, method="POST")

        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        raw_score = float(data.get("score", 0))
        score = raw_score * 100.0 if 0 <= raw_score <= 1 else raw_score
        score = max(0.0, min(100.0, round(score, 2)))

        default_pos = "SHORTLIST" if domain == "hiring" else "APPROVE"
        default_neg = "REJECT" if domain == "hiring" else "DECLINE"
        decision = str(data.get("decision") or (default_pos if score >= 60 else default_neg)).upper()

        return {
            "score": score,
            "decision": decision,
            "rationale": str(data.get("rationale") or data.get("explanation") or "External vendor API decision."),
            "why_positive": data.get("why_positive", []),
            "why_flags": data.get("why_flags", []),
            "raw_output": json.dumps(data),
            "metadata": {
                "adapter_type": self.adapter_type,
                "model_name": self.model_name,
            },
        }
