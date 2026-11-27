"""
Output-Based Grounding & Hallucination Checker.
Extracts factual claims from the model's actual rationale / positive points
and verifies each claim against the uploaded source text.
Supports claim-level verification, negation detection, direct contradiction detection,
and unsupported qualification / credential checks.
"""

import re
from typing import Any, Dict, List, Tuple


NEGATION_PATTERNS = [
    r"\b(?:no|zero)\s+(?:experience|background|knowledge|skills?|projects?)\b",
    r"\b(?:lacks?|lacking|without)\s+(?:any\s+)?(?:experience|background|skills?|degree|qualification)\b",
    r"\b(?:has\s+no|hasn't|does\s+not\s+have|doesn't\s+have|never\s+worked\s+with|never\s+used)\b",
    r"\b(?:cannot|unable\s+to|unqualified\s+for)\b",
]

PRESTIGIOUS_ENTITIES = [
    "phd", "doctorate", "postdoc", "master's", "mtech", "mba",
    "mit", "stanford", "harvard", "oxford", "cambridge", "iit", "nit", "bits",
    "google", "meta", "apple", "netflix", "amazon", "microsoft", "uber", "openai",
    "vice president", "director of", "head of", "chief", "cto", "ceo",
    "50-person", "100-person", "10 years", "15 years", "20 years",
]

STOPWORDS = {
    "the", "and", "for", "with", "that", "this", "from", "have", "has", "been",
    "candidate", "applicant", "model", "score", "based", "verified", "strong",
    "experience", "profile", "evaluation", "demonstrates", "shows", "their",
    "role", "work", "job", "good", "well", "years", "year", "qualified",
}


def _detect_negation_contradiction(claim: str, source_text: str) -> Tuple[bool, str]:
    """
    Checks if a claim asserts a negation (e.g. 'no experience with XGBoost')
    where the negated skill/entity is actually present in the source text.
    """
    claim_lower = claim.lower()
    source_lower = source_text.lower()

    for pat in NEGATION_PATTERNS:
        match = re.search(pat, claim_lower)
        if match:
            # Extract content words following or surrounding the negation
            neg_context = claim_lower[match.start():match.start() + 80]
            tokens = [t for t in re.findall(r"[a-z0-9.+#/-]{3,}", neg_context) if t not in STOPWORDS and not re.match(pat, t)]
            contradicted_tokens = [t for t in tokens if t in source_lower]
            if contradicted_tokens:
                return True, f"Direct contradiction: claim asserts absence/lack of '{', '.join(contradicted_tokens)}', but candidate dossier explicitly confirms it."

    return False, ""


def _detect_unsupported_credentials(claim: str, source_text: str) -> Tuple[bool, str]:
    """
    Checks if a claim introduces prestigious degrees, employers, or scale metrics
    that do not exist in the source text.
    """
    claim_lower = claim.lower()
    source_lower = source_text.lower()

    for ent in PRESTIGIOUS_ENTITIES:
        # Check whole-word / phrase match
        ent_pat = r"\b" + re.escape(ent) + r"\b"
        if re.search(ent_pat, claim_lower) and not re.search(ent_pat, source_lower):
            return True, f"Unsupported credential or entity: '{ent}' claimed by model is not found in candidate dossier."

    return False, ""


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
        f"{profile.get('monthly_income_inr', '')} {profile.get('college_tier', '')} "
        f"{profile.get('college', '')} {profile.get('skills', '')}"
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

    tested = []
    grounded_points = 0.0

    for claim in claims_to_test:
        # 1. Contradiction / Negation Check
        is_contradiction, contra_reason = _detect_negation_contradiction(claim, combined_source)
        if is_contradiction:
            tested.append(
                {
                    "claim": claim,
                    "status": "CONTRADICTION",
                    "matched_evidence": [],
                    "overlap_ratio": 0.0,
                    "verdict_reason": contra_reason,
                }
            )
            continue

        # 2. Fabricated / Unsupported Credential Check
        is_unsupported_entity, entity_reason = _detect_unsupported_credentials(claim, combined_source)
        if is_unsupported_entity:
            tested.append(
                {
                    "claim": claim,
                    "status": "UNGROUNDED",
                    "matched_evidence": [],
                    "overlap_ratio": 0.0,
                    "verdict_reason": entity_reason,
                }
            )
            continue

        # 3. Content Token Alignment
        tokens = [
            t for t in re.findall(r"[a-zA-Z0-9.+#/-]{3,}", claim.lower())
            if t not in STOPWORDS
        ]
        matched_tokens = [t for t in tokens if t in combined_source]
        overlap_ratio = (len(matched_tokens) / len(tokens)) if tokens else 0.0

        if overlap_ratio >= 0.55:
            is_grounded = True
            status = "GROUNDED"
            grounded_points += 1.0
            verdict_reason = f"Verified: {len(matched_tokens)} key entities/terms match candidate dossier."
        elif overlap_ratio >= 0.35 or len(matched_tokens) >= 2:
            is_grounded = False
            status = "PARTIALLY_GROUNDED"
            grounded_points += 0.5
            verdict_reason = f"Partial support ({round(overlap_ratio * 100)}% token match); contains unverified qualifiers."
        else:
            is_grounded = False
            status = "UNGROUNDED"
            verdict_reason = "Unverified claim: insufficient matching evidence in candidate dossier."

        tested.append(
            {
                "claim": claim,
                "status": status,
                "matched_evidence": matched_tokens[:5],
                "overlap_ratio": round(overlap_ratio, 2),
                "verdict_reason": verdict_reason,
            }
        )

    total = len(tested)
    grounding_rate = round((grounded_points / total) * 100.0, 1) if total > 0 else 0.0
    ungrounded_count = sum(1 for c in tested if c["status"] in ("UNGROUNDED", "CONTRADICTION"))

    return {
        "grounding_rate": grounding_rate,
        "ungrounded_rate": round(100.0 - grounding_rate, 1),
        "tested_claims": tested,
        "hallucinations_count": ungrounded_count,
        "methodology": "Claim-level semantic verification with negation, contradiction, and credential validation against primary dossier text.",
    }
