"""
Output-Based Grounding & Hallucination Checker.
Extracts factual claims from the model's actual rationale / positive points
and verifies each claim against the uploaded source text.
"""

import re
from typing import Any, Dict, List


def check_output_grounding(
    rationale: str,
    positive_points: List[str],
    flag_points: List[str],
    source_text: str,
    profile: Dict[str, Any],
) -> Dict[str, Any]:
    combined_source = (
        f"{source_text}\n"
        f"{profile.get('full_name', '')} {profile.get('employer', '')} "
        f"{profile.get('github', '')} {profile.get('portfolio', '')} "
        f"{profile.get('years_exp', '')} {profile.get('credit_score', '')} "
        f"{profile.get('monthly_income_inr', '')}"
    ).lower()

    # Extract atomic claim sentences from the model's actual output
    raw_claims = list(positive_points) + list(flag_points)
    if rationale:
        for sent in re.split(r"[.;\n]+", rationale):
            s = sent.strip()
            if len(s) >= 12:
                raw_claims.append(s)

    # Deduplicate and cap at 8 claims
    seen = set()
    claims_to_test = []
    for c in raw_claims:
        c_clean = c.strip()
        if c_clean and c_clean.lower() not in seen:
            seen.add(c_clean.lower())
            claims_to_test.append(c_clean)
        if len(claims_to_test) >= 8:
            break

    if not claims_to_test:
        return {
            "grounding_rate": "Not measurable",
            "ungrounded_rate": "Not measurable",
            "tested_claims": [],
            "hallucinations_count": 0,
            "methodology": "No atomic claims emitted in model rationale.",
        }

    stopwords = {
        "the", "and", "for", "with", "that", "this", "from", "have", "has", "been",
        "candidate", "applicant", "model", "score", "based", "verified", "strong",
        "experience", "profile", "evaluation", "demonstrates", "shows", "their",
    }

    tested = []
    grounded_count = 0

    for claim in claims_to_test:
        tokens = [
            t for t in re.findall(r"[a-zA-Z0-9.+#/-]{3,}", claim.lower())
            if t not in stopwords
        ]
        matched_tokens = [t for t in tokens if t in combined_source]
        overlap_ratio = (len(matched_tokens) / len(tokens)) if tokens else 0.0

        is_grounded = overlap_ratio >= 0.35 or len(matched_tokens) >= 2
        if is_grounded:
            grounded_count += 1

        tested.append(
            {
                "claim": claim,
                "status": "GROUNDED" if is_grounded else "UNGROUNDED",
                "matched_evidence": matched_tokens[:5],
                "overlap_ratio": round(overlap_ratio, 2),
            }
        )

    total = len(tested)
    grounding_rate = round((grounded_count / total) * 100.0, 1)
    ungrounded_count = total - grounded_count

    return {
        "grounding_rate": grounding_rate,
        "ungrounded_rate": round(100.0 - grounding_rate, 1),
        "tested_claims": tested,
        "hallucinations_count": ungrounded_count,
        "methodology": "Token & entity overlap verification of model rationale against primary dossier text.",
    }
