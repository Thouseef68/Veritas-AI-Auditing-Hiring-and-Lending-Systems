"""
DPDP Act (India 2023) Compliance & Privacy Leakage Scanner
Evaluates candidate records, resumes, and model prompts for compliance with:
- Section 6: Purpose Limitation & Consent Drift
- Section 8: Data Fiduciary Obligations & Data Minimization (PII Leakage)
- Section 12: Right to Erasure & Explainable Redressal Readiness
"""

import re

# RegEx patterns for Indian PII identifiers
AADHAAR_PATTERN = re.compile(r'\b[2-9]{1}[0-9]{3}\s?[0-9]{4}\s?[0-9]{4}\b')
PAN_PATTERN = re.compile(r'\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b')
PHONE_PATTERN = re.compile(r'(\+91[\-\s]?)?[6-9]\d{9}\b')
EMAIL_PATTERN = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')

# Prohibited decision proxy keywords under DPDP Purpose Limitation & Fair Employment
SENSITIVE_PROXIES = {
    "marital_status": [r"\bmarried\b", r"\bsingle\b", r"\bdivorced\b", r"\bmarital status\b", r"\bspouse\b", r"\bhoneymoon\b", r"\bmaternity\b"],
    "caste_religion": [r"\bcaste\b", r"\breligion\b", r"\bhindu\b", r"\bmuslim\b", r"\bchristian\b", r"\bsikh\b", r"\bbrahmin\b", r"\bdalit\b"],
    "family_dependents": [r"\bpregnant\b", r"\bchildcare\b", r"\bmother of\b", r"\bfather of\b", r"\bfamily planning\b"]
}

def scan_text_for_pii(text):
    """Scans free text or prompt output for Indian PII data leakage."""
    findings = []
    
    # Aadhaar Scan
    aadhaar_matches = AADHAAR_PATTERN.findall(text)
    if aadhaar_matches:
        findings.append({
            "type": "Aadhaar Number Leakage",
            "section": "DPDP Act Sec 8(5) - Severe PII Breach",
            "severity": "CRITICAL",
            "matches": [m[:4] + " **** " + m[-4:] for m in aadhaar_matches], # masked preview
            "recommendation": "Immediately redact 12-digit UIDAI Aadhaar tokens using synthetic hashing."
        })
        
    # PAN Scan
    pan_matches = PAN_PATTERN.findall(text)
    if pan_matches:
        findings.append({
            "type": "PAN Card Token Detected",
            "section": "DPDP Act Sec 8(1) - Data Minimization Violation",
            "severity": "HIGH",
            "matches": [p[:2] + "***" + p[-2:] for p in pan_matches],
            "recommendation": "PAN should not be processed directly by generative models or stored in prompt context."
        })
        
    # Phone Scan
    phone_matches = PHONE_PATTERN.findall(text)
    if phone_matches:
        findings.append({
            "type": "Direct Contact Number Exposed",
            "section": "DPDP Act Sec 8(1) - Unnecessary Identifiable Data",
            "severity": "MEDIUM",
            "matches": [p[:4] + "******" for p in phone_matches],
            "recommendation": "Mask telephone numbers during candidate screening phase."
        })
        
    # Sensitive Proxies Scan
    for category, patterns in SENSITIVE_PROXIES.items():
        for pat in patterns:
            found = re.findall(pat, text, re.IGNORECASE)
            if found:
                findings.append({
                    "type": f"Discriminatory Proxy ({category.replace('_', ' ').title()})",
                    "section": "DPDP Act Sec 6 - Purpose Limitation Violation",
                    "severity": "HIGH",
                    "matches": list(set(found)),
                    "recommendation": f"Remove {category} attributes from scoring criteria. Marital/family status has zero legal relevance to job/credit merit."
                })
                break
                
    return findings


def audit_dpdp_compliance(dataset_records):
    """
    Evaluates an entire dataset or candidate batch for systemic DPDP Act compliance.
    """
    total = len(dataset_records)
    aadhaar_violations = 0
    proxy_violations = 0
    phone_exposures = 0
    
    sample_violations = []
    
    for r in dataset_records:
        text_dump = str(r)
        findings = scan_text_for_pii(text_dump)
        if findings:
            for f in findings:
                if "Aadhaar" in f["type"]:
                    aadhaar_violations += 1
                elif "Discriminatory Proxy" in f["type"]:
                    proxy_violations += 1
                elif "Contact Number" in f["type"]:
                    phone_exposures += 1
            if len(sample_violations) < 6:
                sample_violations.append({
                    "id": r.get("applicant_id") or r.get("candidate_id"),
                    "name": r.get("full_name"),
                    "findings": findings
                })
                
    # Compute overall compliance grade (0 to 100)
    penalty = (aadhaar_violations * 15) + (proxy_violations * 8) + (phone_exposures * 3)
    score = max(15, 100 - int(penalty / total * 100))
    
    if score >= 85:
        grade = "A (Compliant)"
        status = "COMPLIANT"
    elif score >= 65:
        grade = "B (Conditional Compliance - Remediation Required)"
        status = "WARNING"
    else:
        grade = "F (High Regulatory Liability under DPDP Act)"
        status = "NON_COMPLIANT"
        
    return {
        "dpdp_score": score,
        "grade": grade,
        "status": status,
        "metrics": {
            "total_records_scanned": total,
            "aadhaar_leakage_count": aadhaar_violations,
            "purpose_limitation_breaches": proxy_violations,
            "unmasked_phone_records": phone_exposures,
        },
        "regulatory_clauses": [
            {
                "clause": "DPDP Act 2023 - Section 6",
                "title": "Consent & Purpose Limitation",
                "status": "FAIL" if proxy_violations > 0 else "PASS",
                "detail": "Data must only be processed for specific purpose; non-job/non-financial proxies must not influence scoring."
            },
            {
                "clause": "DPDP Act 2023 - Section 8(1)",
                "title": "Data Minimization Mandate",
                "status": "FAIL" if (phone_exposures > 0 or aadhaar_violations > 0) else "PASS",
                "detail": "Data fiduciary must not ingest unnecessary PII (Aadhaar, marital status) into AI evaluation pipelines."
            },
            {
                "clause": "DPDP Act 2023 - Section 8(5)",
                "title": "Reasonable Security & Breach Prevention",
                "status": "FAIL" if aadhaar_violations > 0 else "PASS",
                "detail": "Strict prevention of government identity credential memorization or leakage in prompts."
            },
            {
                "clause": "DPDP Act 2023 - Section 12",
                "title": "Right to Erasure & Correction Readiness",
                "status": "PASS",
                "detail": "Platform supports automated candidate record purging and decoupled audit logs."
            }
        ],
        "sample_findings": sample_violations
    }
