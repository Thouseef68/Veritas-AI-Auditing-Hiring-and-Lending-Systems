# Veritas AI: Auditing Hiring and Lending Systems

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4-black?logo=next.js)](https://nextjs.org/)
[![NVIDIA NIM](https://img.shields.io/badge/NVIDIA%20NIM-Nemotron%20Ultra%20550B-76B900?logo=nvidia)](https://build.nvidia.com/)
[![DPDP Act 2023](https://img.shields.io/badge/India%20DPDP%20Act-2023%20Compliant-008080)](#statutory-privacy-firewall)
[![EU AI Act](https://img.shields.io/badge/EU%20AI%20Act-Article%2014%20Human--in--the--Loop-blue)](#article-14-human-oversight)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Enterprise AI Auditor for Autonomous Hiring & FinTech Credit Underwriting Systems**  
> Evaluates decision metrology, red-teams algorithmic bias via adversarial counterfactual twins, audits factual grounding, and enforces statutory privacy compliance under the **Digital Personal Data Protection (DPDP) Act, 2023** and **RBI Digital Lending Directions (2025)**.

---

## 🏛️ Executive Summary

Automated decision-making systems in recruitment and lending have created unprecedented operational efficiency—but they have also introduced systemic, unaccountable algorithmic bias:
- **Hiring ATS engines** routinely penalize qualified women returning from maternity or caregiving leaves (career gap haircut) and automatically downgrade applicants graduating from Tier-2 and Tier-3 institutions regardless of actual programming competence.
- **Credit underwriting models** systematically redline applicants from non-metro postal codes and penalize MSME entrepreneurs and self-employed artisans who lack corporate salary slips despite robust 15–30 day bank cash inflows and impeccable CIBIL discipline.

**Veritas AI** is an independent, legal-grade AI auditor for hiring and lending decisions. Rather than acting as another black-box decision engine, Veritas AI investigates, audits, and stress-tests the AI models making employment and credit determinations.

---

## 🏗️ The 6-Box Ordered Governance Pipeline

Both the **Hiring & Talent Audit** and **Lending & Credit Underwriting** workflows enforce a rigorous 6-box governance layout designed for human accountability and statutory compliance:

```
┌────────────────────────────────────────────────────────────────────────┐
│ BOX 1: AUTONOMOUS SCREENING / UNDERWRITING DECISION & NIM MATCH SCORE  │
│        - High-confidence evaluation via NVIDIA Nemotron Ultra 550B    │
│        - Objective qualification / solvency percentage score           │
├────────────────────────────────────────────────────────────────────────┤
│ BOX 2: ARTICLE 14 HUMAN OVERSIGHT & FIDUCIARY DECISION EXECUTION       │
│        - Enforces Article 14 Constitution of India (Equality Principle)│
│        - Operationalizes EU AI Act Article 14 Human-in-the-Loop        │
│        - Fiduciary Action: Override AI, Confirm Rejection, or Escalate │
├────────────────────────────────────────────────────────────────────────┤
│ BOX 3: AUDIT REPORT: ALGORITHMIC FAIRNESS & METROLOGY                  │
│        ├── 1. Bias Detection (Adversarial Counterfactual Twin Test)   │
│        ├── 2. Hallucination Detection (Source Evidence Grounding Audit)│
│        ├── 3. Statutory Privacy Audit (DPDP Act & RBI 2025 Directions) │
│        ├── 4. Fairness Evaluation (Disparate Impact Ratio / 4/5th Rule)│
│        └── 5. Simulate Statutory Remediation & Re-Audit Engine         │
├────────────────────────────────────────────────────────────────────────┤
│ BOX 4: STATUTORY PRIVACY FIREWALL                                      │
│        - Section 8(5): Reasonable Security Safeguards (Aadhaar Token)  │
│        - Section 6: Specified Purpose & Consent (Marital Status Purged)│
│        - Section 8(3): Accuracy and Completeness Mandate               │
│        - RBI Digital Lending (2025): Zero Mobile Resource Access       │
├────────────────────────────────────────────────────────────────────────┤
│ BOX 5: WHY HIRE / APPROVE vs WHY TRADITIONAL AI FLAGS                  │
│        - Left: Verified Merits & Objective Solvency Drivers            │
│        - Right: Algorithmic Friction, Pedigree & Postal Risk Penalties │
├────────────────────────────────────────────────────────────────────────┤
│ BOX 6: MULTI-SIGNAL VERIFICATION FOOTPRINT                             │
│        - Hiring: Live GitHub Code Auditing & Production SSL Deployment  │
│        - Lending: DTI Calculation, CIBIL History & Cash Flow Liquidity │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🌟 Core Technical & Regulatory Innovations

### 1. Adversarial Counterfactual Twin Testing (Bias Detection)
Veritas AI runs live adversarial counterfactual perturbation tests on every submitted profile:
- **Demographic Twin Test (Hiring)**: Clones the candidate profile with identical technical credentials, projects, and years of experience while flipping demographic markers (e.g., gender, career gap, institutional tier). Calculates the exact **Score Shift Delta ($\Delta$)** to prove whether the model penalized non-merit protected attributes.
- **Postal Twin Test (Lending)**: Benchmarks rural and Tier-3 district applications against a Metro benchmark (PIN 560001) with identical financial metrics to expose geographic redlining penalties.

### 2. Live Evidence Grounding & Hallucination Audit
- Extracts factual assertions from the AI model's decision rationale.
- Cross-references each evaluated claim against primary source text extracted from submitted resumes, salary slips, or bank statements.
- Displays verified claims alongside exact citation snippets, measuring evidence grounding confidence and flagging any hallucinated skills, fake defaults, or ungrounded qualifications.

### 3. Statutory Privacy Firewall (India DPDP Act 2023 & RBI 2025)
- **Section 8(5) Security Safeguards**: Autonomous detection, encryption, and token quarantine for unmasked Aadhaar UIDs and PAN identifiers before passing data to external LLMs.
- **Section 6 Specified Purpose & Consent**: Prohibits and purges non-essential proxy data (e.g., marital status, caste markers) from evaluative scoring.
- **Section 8(3) Accuracy & Completeness**: Ensures algorithmic determinations rely strictly on verified primary documents.
- **RBI Digital Lending Directions (2025)**: Validates that underwriting pipelines strictly enforce need-based financial collection with zero unauthorized access to mobile device resources (contacts, photos, or telephony metadata).

### 4. Constitutional Article 14 Human Oversight Execution
- Anchored in **Article 14 of the Constitution of India** (equality before the law and freedom from arbitrariness) and **EU AI Act Article 14**.
- Ensures that algorithmic recommendations remain strictly advisory. Human recruiters and credit officers retain the statutory authority to override algorithmic friction, confirm rejections with documented justification, or escalate applications to senior diversity/credit committees. Every human decision is cryptographically logged to the audit ledger.

### 5. Multi-Signal Ground Truth Verification
- **GitHub Repository Analysis**: Live probing of public code footprints, commit continuity, repository dependencies, and code complexity to bypass college pedigree filters.
- **Live Deployment Health Check**: Validates production web application deployments, SSL/TLS handshake security, and HTTP responsiveness.
- **Consolidated Single-PDF Dossier Ingestion**: Clean Python `pypdf` extraction engine that strips corrupted binary markers (`/K[...]`) and handles multi-document bundles (bank statements, certificates, and CIBIL reports) in a single upload.

### 6. Statutory Forensic PDF Report Generation
- Exports a comprehensive legal-grade audit certificate compliant with **Section 63(4) of the Bharatiya Sakshya Adhiniyam, 2023** (electronic evidence admissibility).
- Includes cryptographic SHA-256 digests, officer verification tokens, Section 4 adversarial twin findings, and Section 8 DPDP statutory compliance checklists.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend & Framework** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide Icons |
| **AI & Inference Metrology** | NVIDIA NIM API (`nvidia/nemotron-3-ultra-550b-a55b` flagship reasoning model) |
| **Document & Evidence Engine** | Python 3 `pypdf`, native binary-marker sanitizer, jsPDF legal reporter |
| **Statistical Metrology** | Disparate Impact Ratio ($DIR \ge 0.80$), US EEOC Four-Fifths Rule, DTI Calculations |
| **Governance & Law** | India DPDP Act (2023), RBI Digital Lending Directions (2025), EU AI Act (Article 14) |

---

## 🚀 Local Installation & Quickstart

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Python**: 3.9+ (optional for local standalone script execution)
- **NVIDIA NIM API Key**: Free API key obtainable from [build.nvidia.com](https://build.nvidia.com/)

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/Hackathon-DSU.git
cd Hackathon-DSU
```

### 2. Install Web Dependencies
```bash
cd web
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file inside the `web/` directory:
```env
# web/.env.local (DO NOT COMMIT THIS FILE TO VERSION CONTROL)
NVIDIA_NIM_API_KEY=nvapi-your-nvidia-nim-api-key-here
```
> **Security Note**: `.env.local` is listed in `.gitignore`. Never commit API keys or private tokens to GitHub.

### 4. Run the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser to interact with the platform.

### 5. Production Build Verification
```bash
npm run build
```

---

## 🌐 Deploying to Vercel

Veritas AI is optimized for zero-configuration deployment on **Vercel**:

### Step 1: Import Project in Vercel
1. Log in to [Vercel](https://vercel.com/) and click **"Add New Project"**.
2. Select your imported GitHub repository (`Hackathon-DSU`).

### Step 2: Configure Project Settings
- **Framework Preset**: `Next.js`
- **Root Directory**: `web` *(Click "Edit" and set to `web`)*
- **Build Command**: `next build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Step 3: Add Environment Variables
In the Vercel project configuration screen, add:
- **Key**: `NVIDIA_NIM_API_KEY`
- **Value**: `nvapi-your-nvidia-nim-key`

Click **Deploy**. Your Veritas AI governance portal will be live with high-speed edge API routing and SSL certification.

---

## 📂 Repository Structure

```
Hackathon-DSU/
├── README.md                      # Comprehensive project documentation & governance reference
├── .gitignore                     # Enforces zero-leakage of .env, secrets, and caches
├── docs/
│   └── HACKATHON_PITCH_DECK.md    # Executive pitch outline and competition presentation deck
├── datasets/                      # Benchmark datasets for tabular model testing
├── ml_engine/                     # Baseline classifiers and evaluation scripts
└── web/                           # Next.js 16 Web Application
    ├── package.json               # Frontend dependencies (React 19, jsPDF, Lucide)
    ├── .gitignore                 # Web-specific gitignore rules (.env.local ignored)
    ├── next.config.ts             # Next.js optimization configuration
    └── src/
        └── app/
            ├── layout.tsx         # Executive theme layout
            ├── page.tsx           # Dual-domain auditor interface (Hiring & Lending)
            └── api/
                ├── nvidia/        # NVIDIA Nemotron 550B inference & twin-test metrology
                ├── external-audit/# GitHub API, portfolio SSL checks & pypdf dossier parser
                ├── dpdp/          # Statutory DPDP Act Section 6, 8 & RBI compliance scan
                └── audit/         # Audit report state & cryptographic ledger
```

---

## 🔒 Security & Privacy Notice

Veritas AI enforces strict data governance practices:
1. **Zero Secret Commitment**: No API tokens, private credentials, or cryptographic keys are tracked in git history.
2. **Local Token Sanitization**: Sensitive identifiers (Aadhaar, PAN, marital status) are sanitized or quarantined locally before transmitting payloads to inference endpoints.
3. **Fiduciary Human Oversight**: Automated scores are classified strictly as decision-support guidance; legal responsibility for all hiring and credit actions remains with human fiduciaries.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
