# Veritas AI – Responsible AI Auditor for Hiring & Lending (DPDP Act Compliant)
> **Problem Statement 7 (Track B: Trust, Safety and Responsible AI)**  
> *Developed for Wisework & Imagenext Hackathon Recruitment Process (Team DSU)*

---

## 🌟 Executive Overview
**Veritas AI** is an autonomous enterprise governance and model-auditing platform engineered to evaluate AI systems used in **HR recruitment** and **FinTech credit underwriting** for:
1. **Algorithmic Bias & Adverse Impact** (Four-Fifths 80% Rule, Demographic Parity, Equal Opportunity).
2. **Counterfactual Instability & Decision Drift** (The "Twin-Test" Stress Red-Teaming).
3. **Privacy Leakage & India DPDP Act 2023 Compliance** (Sections 6, 8, and 12).
4. **NVIDIA Nemotron Dual-Reasoning Engine** (Chain-of-Thought explainability + auto-mitigation).
5. **One-Click Audit PDF Certificate Export** for corporate compliance sign-off.

---

## 🏛️ The Winning Dual Architecture
To demonstrate both traditional ML governance and state-of-the-art GenAI auditing, Veritas AI evaluates **two distinct classes of models**:

```
                               ┌────────────────────────────────────────────────────────┐
                               │                    VERITAS AI                          │
                               │           Autonomous Governance Platform               │
                               └──────────────────────────┬─────────────────────────────┘
                                                          │
                    ┌─────────────────────────────────────┴─────────────────────────────────────┐
                    ▼                                                                           ▼
     [Target 1: Traditional Tabular ML]                                          [Target 2: Modern GenAI Agent]
  - Pre-trained Credit & Resume Classifier                                    - NVIDIA Nemotron Reasoning Engine
  - 500 Historical Enterprise Records                                         - Chain-of-Thought ("reasoning_content")
  - Evaluates Disparate Impact & Parity                                       - Dynamic Counterfactual "Twin-Test"
  - Interactive Decision Threshold Slider                                     - Automatic Prompt Remediation Guidance
                    │                                                                           │
                    └─────────────────────────────────────┬─────────────────────────────────────┘
                                                          ▼
                                      [DPDP Act (India 2023) Legal Scanner]
                                   - Sec 6: Purpose Limitation (Marital/Caste)
                                   - Sec 8(1): Data Minimization Mandate
                                   - Sec 8(5): Aadhaar/PAN Leakage Safeguards
                                   - Sec 12: Right to Erasure Readiness
                                                          │
                                                          ▼
                                     [Executive Compliance Certificate (PDF)]
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on v25)
- **Python**: 3.10+ (with `numpy`, `scipy`, `scikit-learn` installed)
- **NVIDIA NIM API Key**: Configured in `web/.env.local`

### 2. Run the Web Application
```bash
# Navigate to web directory
cd web

# Start Next.js development server
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🎯 5-Minute Hackathon Demo Script (For Wisework & Imagenext)

### Minute 1: The Problem & The Gap
- *"Most AI fairness tools like Fairlearn are just Python scripts for data scientists. They don't test modern LLM screeners, they ignore Indian laws like the DPDP Act 2023, and they don't provide automated fixes."*
- Show the **Veritas AI** Dashboard with live KPI cards showing **Disparate Impact Ratio (0.38 - Failing)** and **DPDP Score (Grade F)**.

### Minute 2: Tabular Model Audit & Live Threshold Optimizer
- Switch between **Lending Underwriter** and **HR Resume Screener**.
- Move the **Live Decision Threshold Slider** from `0.50` to `0.40`. Show how the Disparate Impact ratio immediately recalculates in real-time.
- Click **"Apply Optimal Mitigation (0.40)"**: Show how our Pareto optimization algorithm restores fairness (`DI >= 0.82`) with only a 1.2% trade-off in accuracy.

### Minute 3: NVIDIA Nemotron "Twin-Test" Arena
- Navigate to the **"2. NVIDIA Nemotron Twin-Test Arena"** tab.
- Pick a candidate (e.g. `Aditi Sen` - female applicant from Tier 3 city with a career break).
- Click **"Run Dual-Audit"**:
  - The system calls **NVIDIA Nemotron (`nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`)**.
  - Show the **Original Candidate** vs **Counterfactual Twin** (`Rahul Verma`).
  - Highlight the **Chain-of-Thought Inner Reasoning** (`reasoning_content`) revealing how the AI subtly penalized non-merit factors.
  - Show the **Decision Flip Alert**: Swapping the demographic turned a `REJECT` into an `APPROVE` with a 18-point swing!

### Minute 4: DPDP Act (2023) Legal Scanner
- Navigate to the **"3. DPDP Act Privacy Scanner"** tab.
- Show the 4 statutory clauses under India's DPDP Act:
  - *Section 6 (Purpose Limitation)*: Flags marital status & career breaks.
  - *Section 8(5) (Security Safeguards)*: Detected 88 unmasked Aadhaar numbers.
  - *Section 8(1) (Data Minimization)*: Detected unmasked PAN and phone numbers.
- Type in the **Live Text Redaction Sandbox** to demonstrate instantaneous PII token stripping.

### Minute 5: Executive Certificate & Close
- Click **"Download Audit PDF"** in the top navigation.
- Open the newly generated **"VERITAS AI - RESPONSIBLE AI AUDIT CERTIFICATE"** PDF.
- Deliver the closing punchline: *"Veritas AI transforms AI governance from an academic afterthought into an automated, legal-grade compliance firewall for enterprise recruitment and lending."*

---

## 💡 How to Answer the Interviewer's Question:
> **"Why didn't you just train your own model from scratch?"**

**Your Answer:**
> *"Sir/Ma'am, in AI Governance and Law, an Auditor must be strictly independent of the system under test—a company cannot audit its own model without conflict of interest.*
> 
> *Our engineering contribution is the **Auditing Platform itself**:*
> 1. *We tested both a baseline trained classifier (to prove auditing legacy tabular models) AND modern GenAI LLMs (using NVIDIA Nemotron for deep reasoning).*
> 2. *We built the counterfactual perturbation engine, the mathematical fairness metrology, the India DPDP Act compliance scanner, and the automated Pareto mitigation optimizer.*
> 3. *This gives companies an end-to-end governance firewall that works regardless of whether their internal models use XGBoost, PyTorch, or LLM agents."*

---

## 🔒 Security & Privacy Notice
All API keys (including NVIDIA NIM tokens) are isolated in `.env.local` and `.gitignore`. No confidential personal credentials or API secrets are stored in version control.
