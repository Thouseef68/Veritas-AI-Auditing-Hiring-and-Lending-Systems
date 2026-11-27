from typing import Any, Dict

from .base import ModelAdapter


class PlantedBiasModelAdapter(ModelAdapter):
    """
    Safe, sandboxed deterministic ML toy model with a known planted bias.
    Used for Auditor Validation Mode: proves Veritas accurately detects a known
    planted penalty (e.g., -12 pts for female/career-gap or -10 pts for rural PIN).
    Never executes untrusted Pickle/Joblib files.
    """

    adapter_type = "ml_model"

    def __init__(self, planted_bias_points: float = 12.0, mitigate: bool = False):
        self.planted_bias_points = planted_bias_points
        self.mitigate = mitigate
        self.model_name = (
            "planted-bias-validator-v1(mitigated)"
            if mitigate
            else f"planted-bias-validator-v1(-{int(planted_bias_points)}pts)"
        )

    def decide(self, profile: Dict[str, Any], domain: str = "hiring") -> Dict[str, Any]:
        if domain == "hiring":
            years = float(profile.get("years_exp", 0) or 0)
            has_github = bool(profile.get("github"))
            has_portfolio = bool(profile.get("portfolio"))
            notes = (profile.get("resume_text") or profile.get("notes") or "").lower()
            matched_skills = [
                kw for kw in ["react", "node", "python", "typescript", "cloud", "ml", "xgboost", "go"]
                if kw in notes
            ]
            skill_hits = len(matched_skills)

            base_score = 40.0 + min(25.0, years * 4.5) + (10.0 if has_github else 0.0) + (8.0 if has_portfolio else 0.0) + min(12.0, skill_hits * 3.0)

            bias_reasons = []
            penalty = 0.0
            if not self.mitigate:
                if str(profile.get("gender", "")).lower() == "female":
                    penalty += self.planted_bias_points * 0.5
                    bias_reasons.append("Gender marker penalty applied")
                if float(profile.get("career_break_months", 0) or 0) > 6:
                    penalty += self.planted_bias_points * 0.5
                    bias_reasons.append("Career gap > 6 months penalty applied")
                if "tier 3" in str(profile.get("college_tier", "")).lower():
                    penalty += 4.0
                    bias_reasons.append("Tier-3 college discount applied")

            score = max(0.0, min(100.0, round(base_score - penalty, 2)))
            decision = "SHORTLIST" if score >= 65.0 else "REJECT"
            skills_str = ", ".join(matched_skills) if matched_skills else "none"
            rationale = (
                f"Applicant {profile.get('full_name', '')} has {int(years)} years experience, "
                f"skills ({skills_str}), GitHub {profile.get('github', 'none')}."
                + (f" Penalties: {'; '.join(bias_reasons)}." if bias_reasons else " No demographic penalties applied.")
            )
            return {
                "score": score,
                "decision": decision,
                "rationale": rationale,
                "why_positive": [
                    f"{int(years)} years experience with {skills_str} in resume",
                    f"GitHub repository {profile.get('github', 'verified')}" if has_github else "Resume credentials evaluated",
                ],
                "why_flags": bias_reasons,
                "raw_output": rationale,
                "metadata": {
                    "adapter_type": self.adapter_type,
                    "model_name": self.model_name,
                    "planted_bias_points": 0.0 if self.mitigate else self.planted_bias_points,
                },
            }

        # Lending domain - normalize financial inputs
        income = float(
            profile.get("monthly_income_inr")
            or profile.get("monthly_income")
            or (float(profile.get("annual_income_inr", 0)) / 12 if profile.get("annual_income_inr") else 0)
            or (float(profile.get("income", 0)) / 12 if float(profile.get("income", 0)) > 200000 else profile.get("income", 0))
            or 0
        )
        obligations = float(
            profile.get("monthly_obligations_inr")
            or profile.get("monthly_obligations")
            or 0
        )
        cibil = float(profile.get("credit_score", 650) or 650)

        # Normalize DTI
        if "debt_to_income" in profile and profile.get("debt_to_income") is not None:
            raw_dti = profile["debt_to_income"]
            if isinstance(raw_dti, str) and "%" in raw_dti:
                dti = float(raw_dti.replace("%", "").strip()) / 100.0
            else:
                dti = float(raw_dti)
                if dti > 1.0:
                    dti = dti / 100.0
        elif "dti" in profile and profile.get("dti") is not None:
            dti = float(profile["dti"])
            if dti > 1.0:
                dti = dti / 100.0
        else:
            dti = (obligations / income) if income > 0 else 0.5

        base_score = 35.0
        if cibil >= 750:
            base_score += 32.0
        elif cibil >= 700:
            base_score += 22.0
        else:
            base_score += 10.0

        if dti <= 0.30:
            base_score += 23.0
        elif dti <= 0.45:
            base_score += 12.0

        if income >= 50000:
            base_score += 10.0

        bias_reasons = []
        penalty = 0.0
        if not self.mitigate:
            loc = str(profile.get("tier_location") or profile.get("location_tier") or profile.get("location") or "").lower()
            if "rural" in loc or "tier 3" in loc:
                penalty += self.planted_bias_points
                bias_reasons.append("Non-metro rural/Tier-3 PIN risk penalty applied")
            if str(profile.get("employment_type", "")).lower() == "business":
                penalty += 4.0
                bias_reasons.append("Informal/MSME employment discount applied")

        score = max(0.0, min(100.0, round(base_score - penalty, 2)))
        decision = "APPROVE" if score >= 65.0 else "DECLINE"
        rationale = (
            f"CIBIL {int(cibil)}, Monthly Income Rs. {int(income)}, DTI {dti*100:.1f}%. "
            + (f"Penalties: {'; '.join(bias_reasons)}." if bias_reasons else "Objective solvency evaluation.")
        )
        return {
            "score": score,
            "decision": decision,
            "rationale": rationale,
            "why_positive": [
                f"CIBIL {int(cibil)} and DTI {dti*100:.1f}% within solvency threshold",
                f"Verified monthly cash flow Rs. {int(income)}",
            ],
            "why_flags": bias_reasons,
            "raw_output": rationale,
            "metadata": {
                "adapter_type": self.adapter_type,
                "model_name": self.model_name,
                "planted_bias_points": 0.0 if self.mitigate else self.planted_bias_points,
            },
        }
