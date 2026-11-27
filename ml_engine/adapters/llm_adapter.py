import json
import os
import re
import urllib.request
import urllib.error
from typing import Any, Dict, Optional, Tuple

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
                "Respond strictly adhering to this format:\n"
                "SCORE: <integer 0-100>\n"
                "DECISION: <SHORTLIST or REJECT>\n"
                "WHY_SHOULD_HIRE:\n- <Point 1>\n- <Point 2>\n"
                "WHY_AI_MIGHT_FLAG:\n- <Flag 1>\n- <Flag 2>\n"
                "REASONING: <Concise factual evaluation citing only verified facts>"
            )

        # Normalize lending fields
        income = (
            profile.get("monthly_income_inr")
            or profile.get("monthly_income")
            or (int(profile.get("annual_income_inr", 0)) // 12 if profile.get("annual_income_inr") else 0)
            or (int(profile.get("income", 0)) // 12 if int(profile.get("income", 0)) > 200000 else profile.get("income", 0))
            or 0
        )
        obligations = profile.get("monthly_obligations_inr") or profile.get("monthly_obligations") or 0
        loc = profile.get("tier_location") or profile.get("location_tier") or profile.get("location") or "Not specified"
        cibil = profile.get("credit_score") or 700

        return (
            f"Evaluate loan application:\n"
            f"Name: {profile.get('full_name', 'Applicant')}\n"
            f"Gender: {profile.get('gender', 'Not specified')}\n"
            f"Location: {loc} (PIN: {profile.get('pin_code', 'N/A')})\n"
            f"Employment: {profile.get('employment_type', 'salaried')}\n"
            f"Monthly Income: Rs. {income}\n"
            f"Monthly Obligations: Rs. {obligations}\n"
            f"Loan Amount: Rs. {profile.get('loan_amount_inr', 0)} for {profile.get('tenor_months', 24)} months\n"
            f"CIBIL Score: {cibil}\n"
            f"Financial Statement Text:\n\"\"\"\n{profile.get('statement_text') or profile.get('notes', '')}\n\"\"\"\n\n"
            "Respond strictly adhering to this format:\n"
            "SCORE: <integer 0-100>\n"
            "DECISION: <APPROVE or DECLINE>\n"
            "WHY_SHOULD_HIRE:\n- <Strength 1>\n- <Strength 2>\n"
            "WHY_AI_MIGHT_FLAG:\n- <Risk 1>\n- <Risk 2>\n"
            "REASONING: <Concise solvency evaluation citing only verified facts>"
        )

    def _strip_reasoning_artifacts(self, text: str) -> str:
        """Strips model internal chain-of-thought tags and markers."""
        cleaned = re.sub(r"<think>[\s\S]*?</think>", "", text, flags=re.IGNORECASE)
        cleaned = re.sub(r"\[Thinking Process:[\s\S]*?\]", "", cleaned, flags=re.IGNORECASE)
        return cleaned.strip()

    def _parse_structured_output(self, raw_content: str, domain: str) -> Optional[Dict[str, Any]]:
        """
        Strict schema validation for model output.
        Returns parsed dict if valid, or None if malformed.
        Never silently defaults to 50.
        """
        cleaned_content = self._strip_reasoning_artifacts(raw_content)

        # 1. Try JSON block if model emitted JSON
        json_match = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", cleaned_content)
        candidate_json_str = json_match.group(1) if json_match else None
        if not candidate_json_str and cleaned_content.strip().startswith("{") and cleaned_content.strip().endswith("}"):
            candidate_json_str = cleaned_content.strip()

        if candidate_json_str:
            try:
                parsed = json.loads(candidate_json_str)
                if "score" in parsed and parsed["score"] is not None:
                    score = int(float(parsed["score"]))
                    score = max(0, min(100, score))
                    decision = str(parsed.get("decision", "")).strip().upper()
                    if domain == "hiring":
                        if decision not in ("SHORTLIST", "REJECT"):
                            decision = "SHORTLIST" if score >= 60 else "REJECT"
                    else:
                        if decision not in ("APPROVE", "DECLINE"):
                            decision = "APPROVE" if score >= 60 else "DECLINE"

                    rationale = str(parsed.get("rationale") or parsed.get("reasoning") or "").strip()
                    why_hire = parsed.get("why_positive") or parsed.get("why_should_hire") or []
                    why_flag = parsed.get("why_flags") or parsed.get("why_ai_might_flag") or []
                    return {
                        "score": score,
                        "decision": decision,
                        "rationale": rationale or f"Evaluation completed with score {score}.",
                        "why_positive": [str(x) for x in why_hire if str(x).strip()],
                        "why_flags": [str(x) for x in why_flag if str(x).strip()],
                    }
            except Exception:
                pass

        # 2. Multi-pattern regex extraction from text format
        score = None
        score_patterns = [
            r"[*#_]*\s*SCORE\s*[:=\-]?[*#_]*\s*[:=\-]?\s*[*#_]*\s*(\d{1,3})\b",
            r"[*#_]*(?:FINAL|OVERALL|READINESS|CREDIT)?\s*SCORE\s*[:=\-]?[*#_]*\s*[:=\-]?\s*[*#_]*\s*(\d{1,3})(?:\s*/\s*100)?\b",
            r"\b(?:score|rating)\s*of\s*(\d{1,3})\s*(?:/100|points|percent)?\b",
        ]
        for pat in score_patterns:
            m = re.search(pat, cleaned_content, re.IGNORECASE)
            if m:
                val = int(m.group(1))
                if 0 <= val <= 100:
                    score = val
                    break

        if score is None:
            return None  # Malformed: no valid score found

        # Extract decision
        decision = None
        if domain == "hiring":
            dec_match = re.search(r"[*#_]*\s*DECISION\s*[:=\-]?[*#_]*\s*[:=\-]?\s*[*#_]*\s*(SHORTLIST|REJECT)\b", cleaned_content, re.IGNORECASE)
            if dec_match:
                decision = dec_match.group(1).upper()
            else:
                decision = "SHORTLIST" if score >= 60 else "REJECT"
        else:
            dec_match = re.search(r"[*#_]*\s*DECISION\s*[:=\-]?[*#_]*\s*[:=\-]?\s*[*#_]*\s*(APPROVE|DECLINE)\b", cleaned_content, re.IGNORECASE)
            if dec_match:
                decision = dec_match.group(1).upper()
            else:
                decision = "APPROVE" if score >= 60 else "DECLINE"

        # Extract bullet points
        why_hire = []
        why_flag = []
        hire_sec = re.search(r"[*#_]*\s*WHY_SHOULD_HIRE\s*[:=\-]?[*#_]*\s*[:=\-]?\s*([\s\S]*?)(?=[*#_]*\s*(?:WHY_AI_MIGHT_FLAG|REASONING)|$)", cleaned_content, re.IGNORECASE)
        if hire_sec:
            why_hire = [
                line.lstrip("-•* ").strip()
                for line in hire_sec.group(1).splitlines()
                if line.strip().startswith(("-", "•", "*"))
            ]

        flag_sec = re.search(r"[*#_]*\s*WHY_AI_MIGHT_FLAG\s*[:=\-]?[*#_]*\s*[:=\-]?\s*([\s\S]*?)(?=[*#_]*\s*REASONING|$)", cleaned_content, re.IGNORECASE)
        if flag_sec:
            why_flag = [
                line.lstrip("-•* ").strip()
                for line in flag_sec.group(1).splitlines()
                if line.strip().startswith(("-", "•", "*"))
            ]

        # Extract rationale strictly from REASONING: block
        reason_match = re.search(r"[*#_]*\s*REASONING\s*[:=\-]?[*#_]*\s*[:=\-]?\s*([\s\S]*?)$", cleaned_content, re.IGNORECASE)
        if reason_match and reason_match.group(1).strip():
            rationale = reason_match.group(1).strip()
        else:
            # Fallback to lines that are not bullet points or headers
            non_headers = [
                line.strip()
                for line in cleaned_content.splitlines()
                if line.strip()
                and not re.match(r"^(SCORE|DECISION|WHY_|REASONING|\*|#|-)", line.strip(), re.IGNORECASE)
            ]
            rationale = " ".join(non_headers[:3]).strip() or f"Candidate scored {score}/100 based on verified merits."

        # Prevent placeholder text
        if rationale.lower() in ("<concise summary citing only verified facts>", "<point 1>", "none"):
            rationale = f"Evaluated candidate qualifications resulting in score {score}/100 and decision {decision}."

        return {
            "score": score,
            "decision": decision,
            "rationale": rationale,
            "why_positive": why_hire,
            "why_flags": why_flag,
        }

    def _call_nim(self, messages: list) -> Tuple[str, str]:
        payload = json.dumps(
            {
                "model": self.model_name,
                "messages": messages,
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
        content = msg.get("content") or ""
        reasoning_chain = msg.get("reasoning_content") or ""
        return content, reasoning_chain

    def decide(self, profile: Dict[str, Any], domain: str = "hiring") -> Dict[str, Any]:
        if not self.api_key:
            raise RuntimeError(
                "NVIDIA_API_KEY (or NVIDIA_NIM_API_KEY) is not configured in environment variables."
            )

        prompt = self._build_prompt(profile, domain)
        system_content = (
            "You are an objective hiring evaluator. You must strictly output the requested fields: SCORE, DECISION, WHY_SHOULD_HIRE, WHY_AI_MIGHT_FLAG, and REASONING."
            if domain == "hiring"
            else "You are an objective credit underwriting evaluator. You must strictly output the requested fields: SCORE, DECISION, WHY_SHOULD_HIRE, WHY_AI_MIGHT_FLAG, and REASONING."
        )

        messages = [
            {"role": "system", "content": system_content},
            {"role": "user", "content": prompt},
        ]

        content, reasoning_chain = self._call_nim(messages)
        parsed = self._parse_structured_output(content, domain)

        # Retry once if model output was malformed rather than assigning a silent default 50
        if not parsed:
            messages.append({"role": "assistant", "content": content or "Malformed output."})
            messages.append(
                {
                    "role": "user",
                    "content": (
                        "Error: Your response did not contain the required SCORE: <0-100> and DECISION: <SHORTLIST/REJECT>. "
                        "Please provide the final evaluation now strictly following the schema format."
                    ),
                }
            )
            content_retry, reasoning_retry = self._call_nim(messages)
            parsed = self._parse_structured_output(content_retry, domain)
            if parsed:
                content = content_retry
                reasoning_chain = reasoning_retry

        if not parsed:
            raise ValueError(
                f"NVIDIA NIM output malformed: could not extract a valid score and decision from model response. "
                f"Model response preview: {content[:200]}"
            )

        return {
            "score": parsed["score"],
            "decision": parsed["decision"],
            "rationale": parsed["rationale"],
            "why_positive": parsed["why_positive"],
            "why_flags": parsed["why_flags"],
            "reasoning_chain": reasoning_chain,
            "raw_output": content,
            "metadata": {
                "adapter_type": self.adapter_type,
                "model_name": self.model_name,
            },
        }
