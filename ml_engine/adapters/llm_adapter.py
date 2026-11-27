import json
import os
import re
import urllib.request
import urllib.error
from typing import Any, Dict, Optional

from .base import ModelAdapter

API_URL = "https://integrate.api.nvidia.com/v1/chat/completions"


class LLMAdapter(ModelAdapter):
    """Universal Adapter for LLM decision screeners via NVIDIA NIM API."""

    adapter_type = "llm"

    def __init__(self, model_name: Optional[str] = None, api_key: Optional[str] = None):
        self.model_name = (
            model_name
            or os.environ.get("NVIDIA_MODEL")
            or "nvidia/nemotron-3.5-lightning-30b-a3b"
        )
        self.api_key = (
            api_key
            or os.environ.get("NVIDIA_API_KEY")
            or os.environ.get("NVIDIA_NIM_API_KEY")
            or ""
        )

    def _build_prompt(self, profile: Dict[str, Any], domain: str) -> str:
        if domain == "hiring":
            return (
                f"Evaluate candidate for role: {profile.get('target_role', 'Software Engineer')}.\n"
                f"Name: {profile.get('full_name', 'Applicant')}\n"
                f"Gender: {profile.get('gender', 'Not specified')}\n"
                f"Experience: {profile.get('years_exp', 0)} years\n"
                f"Career Break: {profile.get('career_break_months', 0)} months\n"
                f"College: {profile.get('college_tier', 'Not specified')}\n"
                f"Employer: {profile.get('employer', 'Not specified')}\n"
                f"GitHub: {profile.get('github', 'None')}\n"
                f"Portfolio: {profile.get('portfolio', 'None')}\n"
                f"Resume Text:\n\"\"\"\n{profile.get('resume_text') or profile.get('notes', '')}\n\"\"\"\n\n"
                "Respond strictly in this format:\n"
                "SCORE: <0-100>\n"
                "DECISION: <SHORTLIST or REJECT>\n"
                "WHY_SHOULD_HIRE:\n- <Point 1>\n- <Point 2>\n"
                "WHY_AI_MIGHT_FLAG:\n- <Flag 1>\n- <Flag 2>\n"
                "REASONING: <Concise summary citing only verified facts>"
            )
        return (
            f"Evaluate loan application:\n"
            f"Name: {profile.get('full_name', 'Applicant')}\n"
            f"Gender: {profile.get('gender', 'Not specified')}\n"
            f"Location: {profile.get('tier_location', 'Not specified')} (PIN: {profile.get('pin_code', 'N/A')})\n"
            f"Employment: {profile.get('employment_type', 'salaried')}\n"
            f"Monthly Income: Rs. {profile.get('monthly_income_inr', 0)}\n"
            f"Monthly Obligations: Rs. {profile.get('monthly_obligations_inr', 0)}\n"
            f"Loan Amount: Rs. {profile.get('loan_amount_inr', 0)} for {profile.get('tenor_months', 24)} months\n"
            f"CIBIL Score: {profile.get('credit_score', 700)}\n"
            f"Financial Statement Text:\n\"\"\"\n{profile.get('statement_text') or profile.get('notes', '')}\n\"\"\"\n\n"
            "Respond strictly in this format:\n"
            "SCORE: <0-100>\n"
            "DECISION: <APPROVE or DECLINE>\n"
            "WHY_SHOULD_HIRE:\n- <Strength 1>\n- <Strength 2>\n"
            "WHY_AI_MIGHT_FLAG:\n- <Risk 1>\n- <Risk 2>\n"
            "REASONING: <Concise solvency evaluation citing only verified facts>"
        )

    def decide(self, profile: Dict[str, Any], domain: str = "hiring") -> Dict[str, Any]:
        if not self.api_key:
            raise RuntimeError(
                "NVIDIA_API_KEY (or NVIDIA_NIM_API_KEY) is not configured in environment variables."
            )

        prompt = self._build_prompt(profile, domain)
        payload = json.dumps(
            {
                "model": self.model_name,
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are an objective hiring evaluator."
                            if domain == "hiring"
                            else "You are an objective credit underwriting evaluator."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                "max_tokens": 1200,
                "temperature": 0.2,
            }
        ).encode("utf-8")

        req = urllib.request.Request(
            API_URL,
            data=payload,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=35) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        choice = (data.get("choices") or [{}])[0]
        msg = choice.get("message") or {}
        content = msg.get("content") or msg.get("reasoning_content") or ""
        reasoning_chain = msg.get("reasoning_content") or ""

        score_match = re.search(r"SCORE:\s*(\d{1,3})", content, re.IGNORECASE)
        score = int(score_match.group(1)) if score_match else 50
        score = max(0, min(100, score))

        if domain == "hiring":
            dec_match = re.search(r"DECISION:\s*(SHORTLIST|REJECT)", content, re.IGNORECASE)
            decision = dec_match.group(1).upper() if dec_match else ("SHORTLIST" if score >= 60 else "REJECT")
        else:
            dec_match = re.search(r"DECISION:\s*(APPROVE|DECLINE)", content, re.IGNORECASE)
            decision = dec_match.group(1).upper() if dec_match else ("APPROVE" if score >= 60 else "DECLINE")

        why_hire = []
        why_flag = []
        hire_sec = re.search(r"WHY_SHOULD_HIRE:\s*([\s\S]*?)(?=WHY_AI_MIGHT_FLAG:|REASONING:|$)", content, re.IGNORECASE)
        if hire_sec:
            why_hire = [
                line.lstrip("-•* ").strip()
                for line in hire_sec.group(1).splitlines()
                if line.strip().startswith(("-", "•", "*"))
            ]

        flag_sec = re.search(r"WHY_AI_MIGHT_FLAG:\s*([\s\S]*?)(?=REASONING:|$)", content, re.IGNORECASE)
        if flag_sec:
            why_flag = [
                line.lstrip("-•* ").strip()
                for line in flag_sec.group(1).splitlines()
                if line.strip().startswith(("-", "•", "*"))
            ]

        reason_match = re.search(r"REASONING:\s*([\s\S]*?)$", content, re.IGNORECASE)
        rationale = reason_match.group(1).strip() if reason_match else content[:400].strip()

        return {
            "score": score,
            "decision": decision,
            "rationale": rationale,
            "why_positive": why_hire,
            "why_flags": why_flag,
            "reasoning_chain": reasoning_chain,
            "raw_output": content,
            "metadata": {
                "adapter_type": self.adapter_type,
                "model_name": self.model_name,
            },
        }
