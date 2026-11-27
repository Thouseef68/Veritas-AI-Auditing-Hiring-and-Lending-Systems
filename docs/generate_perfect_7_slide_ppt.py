import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

# Clean Dark Executive Theme Colors
BG_DARK = RGBColor(7, 9, 14)         # #07090e
CARD_BG = RGBColor(18, 22, 36)       # #121624
CARD_ALT = RGBColor(13, 18, 30)      # #0d121e
BORDER_SUBTLE = RGBColor(45, 55, 80)
WHITE = RGBColor(255, 255, 255)
SLATE_200 = RGBColor(226, 232, 240)
SLATE_300 = RGBColor(203, 213, 225)
SLATE_400 = RGBColor(148, 163, 184)
BLUE = RGBColor(59, 130, 246)
TEAL = RGBColor(20, 184, 166)
EMERALD = RGBColor(16, 185, 129)
AMBER = RGBColor(245, 158, 11)
ROSE = RGBColor(244, 63, 94)
INDIGO = RGBColor(129, 140, 248)

FONT_MAIN = "Segoe UI"


def set_slide_bg(slide, color=BG_DARK):
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = color


def add_card(slide, left, top, width, height, fill_color=CARD_BG, border_color=BORDER_SUBTLE, border_pt=1.2):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
    shape.adjustments[0] = 0.04
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill_color
    if border_color:
        shape.line.color.rgb = border_color
        shape.line.width = Pt(border_pt)
    else:
        shape.line.fill.background()
    return shape


def add_text(slide, left, top, width, height, text, font_size=14, color=WHITE, bold=False, align=PP_ALIGN.LEFT, line_spacing=1.2):
    tb = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.05)
    tf.margin_right = Inches(0.05)
    tf.margin_top = Inches(0.02)
    tf.margin_bottom = Inches(0.02)
    p = tf.paragraphs[0]
    p.alignment = align
    p.line_spacing = line_spacing
    run = p.add_run()
    run.text = text
    run.font.name = FONT_MAIN
    run.font.size = Pt(font_size)
    run.font.color.rgb = color
    run.font.bold = bold
    return tb


def add_simple_list(slide, left, top, width, height, items, font_size=13.0, color=SLATE_200, space_after=10):
    tb = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.05)
    tf.margin_right = Inches(0.05)
    tf.margin_top = Inches(0.02)
    tf.margin_bottom = Inches(0.02)
    for idx, item in enumerate(items):
        p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
        p.space_after = Pt(space_after)
        p.line_spacing = 1.18
        if isinstance(item, tuple):
            lead, body = item
            r1 = p.add_run()
            r1.text = f"• {lead}: "
            r1.font.name = FONT_MAIN
            r1.font.size = Pt(font_size)
            r1.font.bold = True
            r1.font.color.rgb = WHITE
            r2 = p.add_run()
            r2.text = body
            r2.font.name = FONT_MAIN
            r2.font.size = Pt(font_size)
            r2.font.color.rgb = color
        else:
            r = p.add_run()
            r.text = f"• {item}"
            r.font.name = FONT_MAIN
            r.font.size = Pt(font_size)
            r.font.color.rgb = color
    return tb


def add_header(slide, tag, title, subtitle, slide_num, accent=BLUE):
    # Top edge accent line
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.07))
    bar.fill.solid()
    bar.fill.fore_color.rgb = accent
    bar.line.fill.background()

    # Pill tag
    pill = add_card(slide, 0.7, 0.36, 2.8, 0.32, fill_color=CARD_ALT, border_color=accent, border_pt=1)
    pill.adjustments[0] = 0.5
    add_text(slide, 0.75, 0.40, 2.7, 0.26, tag.upper(), font_size=9.5, color=accent, bold=True, align=PP_ALIGN.CENTER)

    # Title & Subtitle
    add_text(slide, 0.7, 0.78, 11.8, 0.5, title, font_size=28, color=WHITE, bold=True)
    add_text(slide, 0.7, 1.32, 11.8, 0.35, subtitle, font_size=13.5, color=SLATE_400)

    # Footer
    add_text(slide, 0.7, 7.05, 8.0, 0.3, "Veritas AI  |  Auditing Hiring & Lending Systems", font_size=10, color=SLATE_400)
    add_text(slide, 11.4, 7.05, 1.2, 0.3, f"{slide_num} / 7", font_size=10, color=SLATE_400, align=PP_ALIGN.RIGHT, bold=True)


def build_deck():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    base_dir = r"c:\Users\thous\Desktop\Hackathon-DSU"
    hero_path = os.path.join(base_dir, "docs", "hero_ai_governance.jpg")
    impact_path = os.path.join(base_dir, "docs", "fairness_impact.jpg")

    # ==============================================================================
    # SLIDE 1: TITLE & EXECUTIVE OVERVIEW (1 / 7)
    # ==============================================================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s1)

    if os.path.exists(hero_path):
        s1.shapes.add_picture(hero_path, Inches(7.1), Inches(1.5), width=Inches(5.6))

    badge = add_card(s1, 0.8, 1.15, 3.6, 0.38, fill_color=CARD_BG, border_color=BLUE, border_pt=1.2)
    badge.adjustments[0] = 0.5
    add_text(s1, 0.85, 1.20, 3.5, 0.3, "RESPONSIBLE AI AUDITOR", font_size=11, color=BLUE, bold=True, align=PP_ALIGN.CENTER)

    add_text(s1, 0.8, 1.75, 6.2, 1.35, "Veritas AI\nHiring & Lending Auditor", font_size=44, color=WHITE, bold=True, line_spacing=1.12)
    add_text(s1, 0.8, 3.65, 5.9, 1.05, "Detect unfair AI bias, protect personal privacy under India's DPDP Act, and keep humans in control of automated job and loan decisions.", font_size=16.5, color=SLATE_200, line_spacing=1.35)

    pills = [
        ("Bias Audit", "Twin Testing", BLUE),
        ("Privacy Shield", "DPDP Act 2023", TEAL),
        ("Human Control", "Article 14 Override", EMERALD),
    ]
    for i, (t, sub, col) in enumerate(pills):
        x = 0.8 + i * 2.05
        add_card(s1, x, 5.10, 1.9, 0.95, fill_color=CARD_BG, border_color=col, border_pt=1.2)
        add_text(s1, x + 0.1, 5.23, 1.7, 0.35, t, font_size=13, color=col, bold=True, align=PP_ALIGN.CENTER)
        add_text(s1, x + 0.1, 5.60, 1.7, 0.35, sub, font_size=11.5, color=SLATE_300, align=PP_ALIGN.CENTER)

    add_text(s1, 0.8, 6.85, 10.5, 0.3, "Live App: veritas-ai-auditor.vercel.app   |   Backend: veritas-ai-backend-thouseef68s-projects.vercel.app", font_size=10.5, color=SLATE_400)
    add_text(s1, 11.4, 6.85, 1.2, 0.3, "1 / 7", font_size=10, color=SLATE_400, align=PP_ALIGN.RIGHT, bold=True)

    # ==============================================================================
    # SLIDE 2: THE PROBLEM (2 / 7)
    # ==============================================================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s2)
    add_header(
        s2,
        "The Problem",
        "Why Automated Hiring & Lending AI Needs an Auditor",
        "AI screeners save time, but they often make unfair decisions, leak personal data, and lack human accountability.",
        2,
        accent=ROSE
    )

    cards_s2 = [
        (
            "1. Unfair Job Rejections",
            ROSE,
            "Example: Aditi Sen (Software Engineer)",
            [
                ("Latent Career Break Bias", "Penalized for an 8-month maternity break despite stellar software experience."),
                ("Pedigree Penalty", "Downgraded for Tier-2 college; real GitHub code and portfolio ignored."),
                ("Disparate Impact Trap", "Unconscious algorithmic bias drops DIR to 0.38, violating EEOC 80% rule.")
            ]
        ),
        (
            "2. Unfair Loan Declines",
            AMBER,
            "Example: Sunita Patil (Small Business)",
            [
                ("Geographic Redlining", "Declined automatically due to rural PIN code (585102)."),
                ("Cash Flow Disadvantage", "Penalized for lacking corporate salary slips despite healthy business cash flow."),
                ("Distorted Risk Assessment", "Ignored 760 CIBIL score and ₹68,000 monthly income.")
            ]
        ),
        (
            "3. Personal Data Leaks",
            BLUE,
            "Example: Unmasked Info in Documents",
            [
                ("Unredacted PII Exposure", "Aadhaar, PAN, phone, and banking details sent raw to third-party LLMs."),
                ("Proxy Discrimination", "Marital status, gender, and age markers leak into scoring algorithms."),
                ("Statutory Liability", "Directly violates India DPDP Act 2023 (₹250 Cr penalty) and RBI 2025 rules.")
            ]
        ),
    ]

    for idx, (c_title, col, ex, pts) in enumerate(cards_s2):
        x = 0.7 + idx * 4.05
        add_card(s2, x, 1.95, 3.8, 4.75, fill_color=CARD_BG, border_color=col, border_pt=1.5)
        add_text(s2, x + 0.25, 2.15, 3.3, 0.4, c_title, font_size=17, color=col, bold=True)
        add_card(s2, x + 0.25, 2.68, 3.3, 0.45, fill_color=CARD_ALT, border_color=None)
        add_text(s2, x + 0.35, 2.76, 3.1, 0.3, ex, font_size=12, color=WHITE, bold=True)
        add_simple_list(s2, x + 0.2, 3.35, 3.4, 3.2, pts, font_size=12.5, color=SLATE_200, space_after=14)

    # ==============================================================================
    # SLIDE 3: SYSTEM ARCHITECTURE (3 / 7)
    # ==============================================================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s3)
    add_header(
        s3,
        "System Architecture",
        "End-to-End Auditing Architecture",
        "How Veritas AI processes an application from input through privacy defense to human decision.",
        3,
        accent=BLUE
    )

    # --- LEFT: USER & FRONTEND ---
    add_card(s3, 0.7, 2.50, 2.5, 3.3, fill_color=CARD_BG, border_color=BLUE, border_pt=1.8)
    add_text(s3, 0.8, 2.70, 2.3, 0.35, "Web Frontend", font_size=15, color=BLUE, bold=True, align=PP_ALIGN.CENTER)
    add_text(s3, 0.8, 3.06, 2.3, 0.3, "Next.js 16 + React 19", font_size=11.5, color=SLATE_400, align=PP_ALIGN.CENTER)

    add_card(s3, 0.95, 3.55, 2.0, 0.85, fill_color=CARD_ALT, border_color=BLUE, border_pt=1)
    add_text(s3, 1.0, 3.70, 1.9, 0.55, "Hiring Dossier\n(PDF/DOCX + GitHub + URL)", font_size=10.5, color=WHITE, bold=True, align=PP_ALIGN.CENTER)

    add_card(s3, 0.95, 4.60, 2.0, 0.85, fill_color=CARD_ALT, border_color=TEAL, border_pt=1)
    add_text(s3, 1.0, 4.75, 1.9, 0.55, "Lending Dossier\n(PDF + Cashflow + CIBIL)", font_size=10.5, color=WHITE, bold=True, align=PP_ALIGN.CENTER)

    # Arrow 1 -> 2
    a_left = s3.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(3.35), Inches(3.98), Inches(0.45), Inches(0.36))
    a_left.fill.solid(); a_left.fill.fore_color.rgb = BLUE; a_left.line.fill.background()

    # --- CENTER: PROCESSING PIPELINE ---
    # Box 1: Extractor
    add_card(s3, 3.95, 2.00, 4.8, 1.20, fill_color=CARD_BG, border_color=AMBER, border_pt=1.8)
    add_text(s3, 4.1, 2.15, 4.5, 0.35, "1. Document & Signal Extractor", font_size=14, color=AMBER, bold=True, align=PP_ALIGN.CENTER)
    add_text(s3, 4.1, 2.58, 4.5, 0.45, "Python pypdf  |  pdf-parse  |  GitHub API  |  HTTPS SSL Probe", font_size=11.5, color=SLATE_200, align=PP_ALIGN.CENTER)

    # Down arrow 1 -> 2
    d1 = s3.shapes.add_shape(MSO_SHAPE.DOWN_ARROW, Inches(6.20), Inches(3.28), Inches(0.30), Inches(0.32))
    d1.fill.solid(); d1.fill.fore_color.rgb = SLATE_400; d1.line.fill.background()

    # Box 2: Privacy Firewall
    add_card(s3, 3.95, 3.68, 4.8, 1.20, fill_color=CARD_BG, border_color=ROSE, border_pt=1.8)
    add_text(s3, 4.1, 3.83, 4.5, 0.35, "2. DPDP (2023) & RBI Privacy Firewall", font_size=14, color=ROSE, bold=True, align=PP_ALIGN.CENTER)
    add_text(s3, 4.1, 4.26, 4.5, 0.45, "Masks 6 PII Types (Aadhaar, PAN, Bank, Address)  |  Consent Gate", font_size=11.5, color=SLATE_200, align=PP_ALIGN.CENTER)

    # Down arrow 2 -> 3
    d2 = s3.shapes.add_shape(MSO_SHAPE.DOWN_ARROW, Inches(6.20), Inches(4.96), Inches(0.30), Inches(0.32))
    d2.fill.solid(); d2.fill.fore_color.rgb = SLATE_400; d2.line.fill.background()

    # Box 3: AI Audit Engine
    add_card(s3, 3.95, 5.36, 4.8, 1.25, fill_color=CARD_BG, border_color=TEAL, border_pt=1.8)
    add_text(s3, 4.1, 5.51, 4.5, 0.35, "3. AI Audit & Reasoning Engine", font_size=14, color=TEAL, bold=True, align=PP_ALIGN.CENTER)
    add_text(s3, 4.1, 5.94, 4.5, 0.45, "NVIDIA Nemotron 3.5 (30B)  |  Demographic Twin Test  |  Claim Grounding", font_size=11.5, color=SLATE_200, align=PP_ALIGN.CENTER)

    # Arrow 2 -> 3
    a_right = s3.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(8.90), Inches(3.98), Inches(0.45), Inches(0.36))
    a_right.fill.solid(); a_right.fill.fore_color.rgb = EMERALD; a_right.line.fill.background()

    # --- RIGHT: OUTPUT & HUMAN CONTROL ---
    add_card(s3, 9.50, 2.25, 3.1, 4.1, fill_color=CARD_BG, border_color=EMERALD, border_pt=1.8)
    add_text(s3, 9.6, 2.45, 2.9, 0.35, "Outputs & Human Control", font_size=15, color=EMERALD, bold=True, align=PP_ALIGN.CENTER)

    out_boxes = [
        ("Audit Dashboard", "Score, Bias Delta & Evidence", EMERALD),
        ("Human Override", "Approve / Reject (Art. 14)", BLUE),
        ("Forensic Ledger", "jsPDF + SHA-256 + Supabase", INDIGO),
    ]
    for idx, (ot, osb, ocol) in enumerate(out_boxes):
        oy = 3.05 + idx * 1.08
        add_card(s3, 9.75, oy, 2.6, 0.88, fill_color=CARD_ALT, border_color=ocol, border_pt=1)
        add_text(s3, 9.8, oy + 0.14, 2.5, 0.3, ot, font_size=12.5, color=WHITE, bold=True, align=PP_ALIGN.CENTER)
        add_text(s3, 9.8, oy + 0.47, 2.5, 0.3, osb, font_size=10.5, color=SLATE_300, align=PP_ALIGN.CENTER)

    # ==============================================================================
    # SLIDE 4: TECHNOLOGY STACK (4 / 7)
    # ==============================================================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s4)
    add_header(
        s4,
        "Technology Stack",
        "Technologies Used & What Each One Does",
        "Every tool in Veritas AI was chosen for speed, auditability, and legal compliance.",
        4,
        accent=INDIGO
    )

    tech_items = [
        ("Next.js 16, React 19 & TypeScript", BLUE, "Web App & Serverless APIs",
         "High-performance frontend with dual audit tabs (Hiring & Lending) and Vercel serverless functions (maxDuration=300s)."),
        ("NVIDIA Nemotron 3.5 (30B) via NIM", TEAL, "AI Reasoning & Twin Tests",
         "High-accuracy reasoning LLM; performs dual-pass schema parsing, counterfactual twin testing, and claim grounding in 3–6s."),
        ("Python (pypdf) & FastAPI", AMBER, "Document Processing & ML Engine",
         "Extracts clean text from PDF/DOCX, normalizes DTI & financial metrics, and powers statistical fairness metrics (DIR, EOD)."),
        ("GitHub API & Live HTTPS Probe", EMERALD, "Real Skill Verification",
         "Verifies live GitHub repositories, commit activity, and active SSL web deployments so non-Tier-1 candidates aren't penalized."),
        ("DPDP (2023) & RBI (2025) Scanner", ROSE, "Pre-Inference Privacy Guard",
         "Scans & redacts 6 sensitive PII types (Aadhaar, PAN, Bank, Address, Phone, Email); blocks loopback and SSRF probes."),
        ("jsPDF + SHA-256 + Supabase", INDIGO, "Forensic Proof & Persistence",
         "Exports court-admissible BSA Sec 63(4) forensic PDFs and anchors cryptographic hash chains into PostgreSQL for tamper evidence."),
    ]

    for idx, (t_name, col, role, desc) in enumerate(tech_items):
        col_i = idx % 2
        row_i = idx // 2
        x = 0.7 + col_i * 6.05
        y = 1.9 + row_i * 1.65
        add_card(s4, x, y, 5.85, 1.48, fill_color=CARD_BG, border_color=col, border_pt=1.3)

        rp = add_card(s4, x + 3.45, y + 0.16, 2.25, 0.3, fill_color=CARD_ALT, border_color=col, border_pt=0.8)
        rp.adjustments[0] = 0.5
        add_text(s4, x + 3.48, y + 0.19, 2.19, 0.25, role, font_size=9.5, color=col, bold=True, align=PP_ALIGN.CENTER)

        add_text(s4, x + 0.2, y + 0.16, 3.2, 0.35, t_name, font_size=13.5, color=WHITE, bold=True)
        add_text(s4, x + 0.2, y + 0.58, 5.45, 0.80, desc, font_size=12, color=SLATE_300, line_spacing=1.22)

    # ==============================================================================
    # SLIDE 5: REAL-WORLD SCENARIOS (5 / 7)
    # ==============================================================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s5)
    add_header(
        s5,
        "Real-World Scenarios",
        "How Veritas AI Solves Real Hiring & Lending Bias",
        "Side-by-side comparison of automated algorithmic bias vs Veritas AI's verified human-in-the-loop audit.",
        5,
        accent=TEAL
    )

    # Left: Hiring Scenario
    add_card(s5, 0.7, 1.9, 5.8, 4.85, fill_color=CARD_BG, border_color=BLUE, border_pt=1.5)
    add_card(s5, 0.9, 2.08, 5.4, 0.45, fill_color=CARD_ALT, border_color=BLUE, border_pt=0.8)
    add_text(s5, 0.95, 2.16, 5.3, 0.3, "HIRING: Aditi Sen (Senior Software Engineer)", font_size=13.5, color=BLUE, bold=True, align=PP_ALIGN.CENTER)

    add_simple_list(s5, 0.95, 2.70, 5.3, 3.15, [
        ("Normal ATS Problem", "Penalized 8-month maternity break & Tier-2 college; exposed Aadhaar & marital status; scored 48 (REJECT)."),
        ("Veritas AI Audit", "Verified live GitHub repos & Vercel SSL portfolio; generated 0-gap counterfactual twin to isolate career break bias."),
        ("Privacy Defense", "Masked 6 PII types under DPDP Sec 8(5); stripped marital status under Sec 6 before external LLM inference."),
        ("Final Outcome", "Recruiter uses Article 14 Override to shortlist candidate based on verified technical merit; scored 84 (SHORTLIST)."),
    ], font_size=12.2, color=SLATE_200, space_after=12)

    add_card(s5, 0.95, 6.00, 5.3, 0.55, fill_color=CARD_ALT, border_color=EMERALD, border_pt=1)
    add_text(s5, 1.05, 6.12, 5.1, 0.3, "Fairness Result: Passes US EEOC Four-Fifths Rule (DIR >= 0.80)", font_size=11.5, color=EMERALD, bold=True, align=PP_ALIGN.CENTER)

    # Right: Lending Scenario
    add_card(s5, 6.83, 1.9, 5.8, 4.85, fill_color=CARD_BG, border_color=TEAL, border_pt=1.5)
    add_card(s5, 7.03, 2.08, 5.4, 0.45, fill_color=CARD_ALT, border_color=TEAL, border_pt=0.8)
    add_text(s5, 7.08, 2.16, 5.3, 0.3, "LENDING: Sunita Patil (Rural MSME Owner)", font_size=13.5, color=TEAL, bold=True, align=PP_ALIGN.CENTER)

    add_simple_list(s5, 7.08, 2.70, 5.3, 3.15, [
        ("Normal Bank Problem", "Declined loan due to rural PIN 585102 & missing corporate salary slip despite 760 CIBIL score; scored 42 (DECLINE)."),
        ("Veritas AI Audit", "Extracted 15–30 day bank statement & CIBIL from 1 PDF; normalized DTI to low 17.6%; evaluated MSME cashflow."),
        ("Location Twin Test", "Isolated postal delta (PIN 585102 vs 560001) to expose and quantify geographic redlining penalty."),
        ("Final Outcome", "Credit Officer eliminates geographic bias and approves ₹2.5 Lakh loan under RBI 2025 guidelines; scored 80 (APPROVE)."),
    ], font_size=12.2, color=SLATE_200, space_after=12)

    add_card(s5, 7.08, 6.00, 5.3, 0.55, fill_color=CARD_ALT, border_color=TEAL, border_pt=1)
    add_text(s5, 7.18, 6.12, 5.1, 0.3, "Fairness Result: Audited via Veritas MSME Credit Inclusion Index", font_size=11.5, color=TEAL, bold=True, align=PP_ALIGN.CENTER)

    # ==============================================================================
    # SLIDE 6: AUTOMATED TESTING & PRODUCTION VALIDATION (6 / 7)
    # ==============================================================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s6)
    add_header(
        s6,
        "Testing & Validation",
        "Automated Quality Assurance & Production Test Results",
        "Rigorous, evidence-based verification across unit, integration, and live production endpoints.",
        6,
        accent=AMBER
    )

    # Left Card: Pytest ML Engine Suite
    add_card(s6, 0.7, 1.90, 5.8, 4.85, fill_color=CARD_BG, border_color=EMERALD, border_pt=1.5)
    add_card(s6, 0.9, 2.05, 5.4, 0.40, fill_color=CARD_ALT, border_color=EMERALD, border_pt=0.8)
    add_text(s6, 0.95, 2.12, 5.3, 0.3, "15/15 Pytest ML Suite (100% Passed)", font_size=13.5, color=EMERALD, bold=True, align=PP_ALIGN.CENTER)

    add_simple_list(s6, 0.95, 2.58, 5.3, 3.4, [
        ("Pre-Inference Privacy Guard", "100% masking across 6 PII types (Aadhaar, PAN, Bank, Address, Phone, Email) with zero leakage."),
        ("Claim Grounding Checker", "Detects negation & unsupported claims (grounding rate drops to 0.0% on contradictions)."),
        ("Strict Schema Parsing", "Eliminates silent default scoring; dual-pass parser extracts output from reasoning chains."),
        ("Production API Authentication", "FastAPI production security rejects unauthenticated calls with 401 Unauthorized."),
        ("SSRF & Security Defense", "Blocks loopback (127.0.0.1) and cloud metadata (169.254.169.254) probe exploits."),
        ("Financial Normalization", "Parses complex string DTI percentages ('17.6%') and eliminates zero-income traps."),
    ], font_size=11.8, color=SLATE_200, space_after=9)

    add_card(s6, 0.95, 6.10, 5.3, 0.48, fill_color=CARD_ALT, border_color=EMERALD, border_pt=1)
    add_text(s6, 1.05, 6.20, 5.1, 0.3, "Regression Suite Status: 15 Passed | 0 Failed | 0 Regressions", font_size=11, color=EMERALD, bold=True, align=PP_ALIGN.CENTER)

    # Right Card 1 (Top): Playwright UI Suite
    add_card(s6, 6.83, 1.90, 5.8, 2.30, fill_color=CARD_BG, border_color=BLUE, border_pt=1.5)
    add_card(s6, 7.03, 2.05, 5.4, 0.38, fill_color=CARD_ALT, border_color=BLUE, border_pt=0.8)
    add_text(s6, 7.08, 2.11, 5.3, 0.28, "5/5 Playwright E2E UI Suite (100% Passed)", font_size=13, color=BLUE, bold=True, align=PP_ALIGN.CENTER)

    add_simple_list(s6, 7.08, 2.52, 5.3, 1.6, [
        ("Document Upload & Extraction", "Verified live PDF & DOCX upload and parsing on production frontend."),
        ("Validation & Consent Gates", "Empty resumes reject with 400; denied consent blocks inference with 403."),
        ("Full Audit Lifecycle", "Hiring and Lending audits execute end-to-end with real-time UI score updates."),
    ], font_size=11.5, color=SLATE_200, space_after=7)

    # Right Card 2 (Bottom): Live Production Verification
    add_card(s6, 6.83, 4.40, 5.8, 2.35, fill_color=CARD_BG, border_color=TEAL, border_pt=1.5)
    add_card(s6, 7.03, 4.55, 5.4, 0.38, fill_color=CARD_ALT, border_color=TEAL, border_pt=0.8)
    add_text(s6, 7.08, 4.61, 5.3, 0.28, "Live Production Verification & Robustness", font_size=13, color=TEAL, bold=True, align=PP_ALIGN.CENTER)

    add_simple_list(s6, 7.08, 5.02, 5.3, 1.6, [
        ("Dual Production Endpoints", "Web frontend and FastAPI serverless backend active with 200 OK health checks."),
        ("NVIDIA NIM Live Inference", "Verified live model runs: Run 1 score 84 SHORTLIST, Run 2 score 78 SHORTLIST."),
        ("Resilient Timeouts", "Vercel maxDuration configured to 300s with 240s client timeout for deep CoT audits."),
    ], font_size=11.5, color=SLATE_200, space_after=7)

    # ==============================================================================
    # SLIDE 7: IMPACT, REGULATORY COMPLIANCE & LIVE APP (7 / 7)
    # ==============================================================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s7)
    add_header(
        s7,
        "Impact & Live App",
        "Legal Compliance, Speed & Production Readiness",
        "Ready for real enterprises, HR teams, and FinTech lenders today.",
        7,
        accent=EMERALD
    )

    # Left: Impact & Compliance Card
    add_card(s7, 0.7, 1.90, 6.65, 4.85, fill_color=CARD_BG, border_color=EMERALD, border_pt=1.5)
    add_card(s7, 0.9, 2.05, 6.25, 0.40, fill_color=CARD_ALT, border_color=EMERALD, border_pt=0.8)
    add_text(s7, 0.95, 2.12, 6.15, 0.3, "Enterprise Impact & Statutory Compliance", font_size=13.5, color=EMERALD, bold=True, align=PP_ALIGN.CENTER)

    add_simple_list(s7, 0.95, 2.60, 6.25, 3.9, [
        ("India DPDP Act (2023) Compliant", "Enforces Sec 8(5) technical safeguards, Sec 6 purpose limitation, and Sec 8(3) accuracy before LLM calls."),
        ("RBI Digital Lending Directions (2025)", "Enforces explicit borrower consent, bans mobile device snooping, and validates cashflow metrics."),
        ("Constitutional & EU AI Act Article 14", "Guarantees human-in-the-loop oversight; provides cryptographic override logs with reviewer identity."),
        ("Forensic Proof (BSA Sec 63(4))", "Generates court-admissible audit certificates with SHA-256 hash chains stored in Supabase PostgreSQL."),
        ("Enterprise Speed & Cost Efficiency", "NVIDIA Nemotron 3.5 (30B) audits comprehensive multi-page dossiers in just 3–6 seconds."),
    ], font_size=12.5, color=SLATE_200, space_after=14)

    # Right Top: Impact Picture
    if os.path.exists(impact_path):
        s7.shapes.add_picture(impact_path, Inches(7.65), Inches(1.90), width=Inches(4.98))

    # Right Bottom: Live App Details Card
    add_card(s7, 7.65, 5.15, 4.98, 1.60, fill_color=CARD_ALT, border_color=TEAL, border_pt=1.2)
    add_text(s7, 7.75, 5.25, 4.78, 0.30, "Live Production Deployments", font_size=13, color=TEAL, bold=True, align=PP_ALIGN.CENTER)
    add_text(s7, 7.75, 5.60, 4.78, 0.28, "Web App: veritas-ai-auditor.vercel.app", font_size=11, color=WHITE, bold=True, align=PP_ALIGN.CENTER)
    add_text(s7, 7.75, 5.92, 4.78, 0.26, "Backend: veritas-ai-backend-thouseef68s-projects.vercel.app", font_size=9.5, color=SLATE_300, align=PP_ALIGN.CENTER)
    add_text(s7, 7.75, 6.22, 4.78, 0.26, "GitHub: Thouseef68/Veritas-AI-Auditing-Hiring-and-Lending-Systems", font_size=9.5, color=SLATE_400, align=PP_ALIGN.CENTER)

    out_path = os.path.join(base_dir, "docs", "Veritas_AI_Presentation_Clean.pptx")
    prs.save(out_path)
    print(f"SUCCESS: Clean 7-slide deck generated at: {out_path} (Slides: {len(prs.slides)})")


if __name__ == '__main__':
    build_deck()
