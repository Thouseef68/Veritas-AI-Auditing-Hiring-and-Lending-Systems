import pptx
from copy import deepcopy

def build_7_slide_presentation():
    # Load base template
    prs = pptx.Presentation('docs/Veritas_AI_Presentation_Clean.pptx')
    
    # Slide order in original presentation:
    # Slide 1: Title (1/6)
    # Slide 2: The Problem (2/6)
    # Slide 3: Real-World Scenarios (5/6)
    # Slide 4: System Architecture (3/6)
    # Slide 5: Technology Stack (4/6)
    # Slide 6: Impact & Live App (6/6)
    
    # We will:
    # 1. Update pagination badges across all slides to "X / 7"
    # 2. Re-arrange and polish slide contents to incorporate the fresh testing & audit metrics:
    #    - Slide 1: Title & Overview (1 / 7)
    #    - Slide 2: The Enterprise Crisis (2 / 7)
    #    - Slide 3: System Architecture (3 / 7)
    #    - Slide 4: Technology Stack & Defense Matrix (4 / 7)
    #    - Slide 5: Real-World Case Studies & Forensic Audit (5 / 7)
    #    - Slide 6: Automated Testing & Production Validation (6 / 7) [NEW SLIDE]
    #    - Slide 7: Regulatory Compliance, Legal Evidence & Live Deployment (7 / 7)
    
    # Let's inspect slide shapes on Slide 6 to clone for Slide 7
    s6 = prs.slides[5]
    slide_layout = prs.slide_layouts[6] # blank layout
    s7 = prs.slides.add_slide(slide_layout)
    
    # Copy background & shapes from s6 to s7
    for shp in s6.shapes:
        new_el = deepcopy(shp.element)
        s7.shapes._spTree.append(new_el)
        
    # --- SLIDE 1: Title & Overview (1 / 7) ---
    s1 = prs.slides[0]
    for shp in s1.shapes:
        if shp.name == 'TextBox 15':
            shp.text_frame.text = 'Live App: veritas-ai-auditor.vercel.app   |   Backend: veritas-ai-backend-thouseef68s-projects.vercel.app'
            
    # --- SLIDE 2: The Problem (2 / 7) ---
    s2 = prs.slides[1]
    for shp in s2.shapes:
        if shp.name == 'TextBox 7':
            shp.text_frame.text = '2 / 7'
        elif shp.name == 'TextBox 12':
            # Job rejections
            p_lines = [
                '• Latent Bias: Flags 8-mo breaks, Tier-2 colleges, non-metro PINs.',
                '• Model Hallucination: Keyword screeners invent skills or penalize absences.',
                '• Disparate Impact: Typical ATS DIR drops to 0.38 (violates 80% Four-Fifths rule).'
            ]
            for i, p in enumerate(shp.text_frame.paragraphs):
                if i < len(p_lines):
                    p.text = p_lines[i]
        elif shp.name == 'TextBox 17':
            # Loan declines
            p_lines = [
                '• Geographic Redlining: Rural PIN codes (e.g. 585102) declined automatically.',
                '• Document Bias: Penalizes MSME cash flow due to lack of corporate salary slips.',
                '• Flawed Metrics: String DTI percentage parsing errors or zero-income traps.'
            ]
            for i, p in enumerate(shp.text_frame.paragraphs):
                if i < len(p_lines):
                    p.text = p_lines[i]
        elif shp.name == 'TextBox 22':
            # Personal data leaks
            p_lines = [
                '• Aadhaar & PAN Leakage: Raw credentials sent unredacted to external LLMs.',
                '• Statutory Exposure: India DPDP Act 2023 mandates penalties up to ₹250 Crores.',
                '• Lack of Tamper-Evident Proof: Decisions lack cryptographic audit trails.'
            ]
            for i, p in enumerate(shp.text_frame.paragraphs):
                if i < len(p_lines):
                    p.text = p_lines[i]

    # --- SLIDE 3: System Architecture (3 / 7) ---
    # Move Slide 4 (Architecture) to position 3 if possible, or update content:
    # In python-pptx, slides can be edited in place. Let's make Slide 4 the Architecture:
    s4 = prs.slides[3]
    for shp in s4.shapes:
        if shp.name == 'TextBox 7':
            shp.text_frame.text = '3 / 7'
        elif shp.name == 'TextBox 22':
            shp.text_frame.text = 'DPDP Allowlist: 6 PII Types Masked   |   Drop Untrusted Keys'
        elif shp.name == 'TextBox 26':
            shp.text_frame.text = 'NIM Reasoning Screen   |   Twin Test   |   Claim Grounding'
        elif shp.name == 'TextBox 38':
            shp.text_frame.text = 'jsPDF + SHA-256 + Supabase'

    # --- SLIDE 4: Technology Stack (4 / 7) ---
    s5 = prs.slides[4]
    for shp in s5.shapes:
        if shp.name == 'TextBox 7':
            shp.text_frame.text = '4 / 7'
        elif shp.name == 'TextBox 17':
            shp.text_frame.text = 'Evaluates resumes & statements with dual-reasoning; strips CoT artifacts; parses strict schemas without silent defaults.'
        elif shp.name == 'TextBox 32':
            shp.text_frame.text = 'Scans & redacts 6 DPDP PII types (Aadhaar, PAN, Phone, Email, Bank, Address) before external inference; guards against SSRF.'
        elif shp.name == 'TextBox 37':
            shp.text_frame.text = 'Exports forensic audit PDFs (BSA Sec 63(4)) and chains audit events to Supabase PostgreSQL ledger.'

    # --- SLIDE 5: Real-World Case Studies (5 / 7) ---
    s3 = prs.slides[2]
    for shp in s3.shapes:
        if shp.name == 'TextBox 7':
            shp.text_frame.text = '5 / 7'
        elif shp.name == 'TextBox 11':
            p_lines = [
                '• Problem: ATS penalized 8-mo maternity gap & Tier-2 college; exposed Aadhaar & marital markers.',
                '• Veritas AI Audit: Verified GitHub repos & live HTTPS deployments; created identical 0-gap twin.',
                '• Privacy Action: Masked 6 PII types under DPDP Sec 8(5); stripped sensitive proxies under Sec 6.',
                '• Final Outcome: Recruiter uses Article 14 override; candidate shortlisted based on verified merits.'
            ]
            for i, p in enumerate(shp.text_frame.paragraphs):
                if i < len(p_lines):
                    p.text = p_lines[i]
        elif shp.name == 'TextBox 17':
            p_lines = [
                '• Problem: Rejected due to rural PIN 585102 & missing payslip despite 760 CIBIL & Rs. 68K income.',
                '• Veritas AI Audit: Normalized DTI to 17.6%; evaluated MSME cash inflows on parity with corporate salaries.',
                '• Location Twin Test: Isolated postal delta (PIN 585102 vs 560001) to expose redlining bias.',
                '• Final Outcome: Credit Officer overrides geographic penalty; approves loan under RBI 2025 guidelines.'
            ]
            for i, p in enumerate(shp.text_frame.paragraphs):
                if i < len(p_lines):
                    p.text = p_lines[i]

    # --- SLIDE 6: Automated Testing & Production Validation (6 / 7) ---
    # We will configure s6 as the comprehensive Production Testing & Quality Assurance slide!
    for shp in s6.shapes:
        if shp.name == 'TextBox 3':
            shp.text_frame.text = 'TESTING & VALIDATION'
        elif shp.name == 'TextBox 4':
            shp.text_frame.text = 'Automated Quality Assurance & Production Test Results'
        elif shp.name == 'TextBox 5':
            shp.text_frame.text = 'Rigorous, evidence-based verification across unit, integration, and live production endpoints.'
        elif shp.name == 'TextBox 7':
            shp.text_frame.text = '6 / 7'
        elif shp.name == 'TextBox 10':
            shp.text_frame.text = (
                "• 15/15 Automated Pytest Suite Passed:\n"
                "  - Pre-inference privacy firewall masks all 6 PII types (Aadhaar, PAN, Bank, Address, Phone, Email).\n"
                "  - Grounding checker accurately detects negation and contradictions (grounding rate 0.0% on contradictions).\n"
                "  - Strict schema parsing eliminates silent default scoring (no ungrounded default 50s).\n"
                "  - Mandatory FastAPI production authentication rejects unauthenticated calls with 401 Unauthorized.\n"
                "  - SSRF guard blocks loopback (127.0.0.1) and cloud metadata (169.254.169.254) exploits.\n\n"
                "• 5/5 Playwright E2E UI Suite Passed on Deployed Production:\n"
                "  - Document parsing, empty resume rejection (400), consent gate enforcement (403), hiring and lending audits."
            )
        elif shp.name == 'TextBox 12':
            shp.text_frame.text = 'Test Suite: 15/15 Pytest & 5/5 E2E Passed'

    # --- SLIDE 7: Regulatory Compliance, Legal Evidence & Live Deployment (7 / 7) ---
    for shp in s7.shapes:
        if shp.name == 'TextBox 3':
            shp.text_frame.text = 'IMPACT & LIVE APP'
        elif shp.name == 'TextBox 4':
            shp.text_frame.text = 'Legal Compliance, Speed & Production Readiness'
        elif shp.name == 'TextBox 5':
            shp.text_frame.text = 'Ready for real enterprises, HR teams, and FinTech lenders today.'
        elif shp.name == 'TextBox 7':
            shp.text_frame.text = '7 / 7'
        elif shp.name == 'TextBox 10':
            shp.text_frame.text = (
                "• India DPDP Act (2023) Compliant:\n"
                "  - Enforces Sec 8(5) technical safeguards and Sec 6 purpose limitation before external LLM inference.\n"
                "  - Section 8(3) factual completeness checked via claim-level grounding verification.\n\n"
                "• RBI Digital Lending Guidelines (2025):\n"
                "  - Explicit consent enforcement; zero access to unauthorized mobile device resources.\n\n"
                "• Constitutional Article 14 & EU AI Act Article 14:\n"
                "  - Mandatory human oversight override log with reviewer identity and cryptographically anchored receipts.\n\n"
                "• Tamper-Evident Evidence & Cloud Persistence:\n"
                "  - Exports BSA Sec 63(4) forensic PDFs with SHA-256 hash chains stored in Supabase PostgreSQL."
            )
        elif shp.name == 'TextBox 12':
            shp.text_frame.text = 'Live on Vercel: veritas-ai-auditor.vercel.app'

    prs.save('docs/Veritas_AI_Presentation_Clean.pptx')
    print('SUCCESS: Updated docs/Veritas_AI_Presentation_Clean.pptx with 7 slides!')

if __name__ == '__main__':
    build_7_slide_presentation()
