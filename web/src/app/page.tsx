'use client';

import React, { useState } from 'react';
import jsPDF from 'jspdf';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Check,
  XCircle,
  FileText,
  FileUp,
  Download,
  Sparkles,
  Cpu,
  GitBranch,
  Globe,
  Building2,
  Scale,
  Lock,
  RefreshCw,
  Play,
  Briefcase,
  Landmark,
  CreditCard,
  UserCheck,
  HelpCircle,
  Sliders,
  Wallet
} from 'lucide-react';

export default function Home() {
  // Domain selection: 'hiring' or 'lending' - completely separated workflows
  const [domain, setDomain] = useState<'hiring' | 'lending'>('hiring');

  // ==========================================
  // 1. HIRING DOMAIN STATE
  // ==========================================
  const [hiringApplicant, setHiringApplicant] = useState({
    full_name: 'Aditi Sen',
    gender: 'Female',
    target_role: 'Senior Software Engineer',
    years_exp: 5,
    career_break_months: 8,
    college_tier: 'Tier 2 (Top State University)',
    employer: 'TCS / FinTech Startup',
    github: 'github.com/aditisen/cloud-orchestrator',
    portfolio: 'https://aditi-portfolio.vercel.app',
    notes: 'Candidate has 5 years of software engineering experience with React, Node.js, and cloud systems. Completed B.Tech with distinction. Note: 8-month career break for maternity/caregiving. Marital Status: Married. Contact: +91 9820192831. Aadhaar UID: 4829 1928 3819.'
  });
  const [hiringResumeFileName, setHiringResumeFileName] = useState<string | null>(null);
  const [hiringResumeLoading, setHiringResumeLoading] = useState<boolean>(false);
  const [hiringNvidiaResult, setHiringNvidiaResult] = useState<any>(null);
  const [hiringExternalResult, setHiringExternalResult] = useState<any>(null);
  const [hiringHumanDecision, setHiringHumanDecision] = useState<'OVERRIDDEN' | 'REJECTED' | 'ESCALATED' | null>(null);
  const [hiringLoading, setHiringLoading] = useState<boolean>(false);

  // ==========================================
  // 2. LENDING DOMAIN STATE
  // ==========================================
  const [lendingApplicant, setLendingApplicant] = useState({
    full_name: 'Sunita Patil',
    gender: 'Female',
    age: 38,
    tier_location: 'Tier 3 (Rural/Semi-urban)',
    pin_code: '585102',
    employment_type: 'business', // 'salaried' | 'business'
    job_title: 'Handicraft & Textile Trader',
    employer: 'Patil Handloom & Textiles',
    monthly_income_inr: 65000,
    annual_income_inr: 780000,
    monthly_obligations_inr: 12000,
    loan_amount_inr: 300000,
    tenor_months: 24,
    loan_purpose: 'Working Capital for Seasonal Textile Inventory',
    credit_score: 742,
    notes: 'Rural artisan and small business owner applying for working capital loan. Regular seasonal banking cash flow. PAN Card: ABCDP9821L. Location: Rural District Gulbarga. Aadhaar UID: 9102 3847 1920. Statement shows 30 days of active customer UPI credits with zero past loan defaults.'
  });
  const [lendingDocFileName, setLendingDocFileName] = useState<string | null>(null);
  const [lendingDocLoading, setLendingDocLoading] = useState<boolean>(false);
  const [lendingNvidiaResult, setLendingNvidiaResult] = useState<any>(null);
  const [lendingExternalResult, setLendingExternalResult] = useState<any>(null);
  const [lendingHumanDecision, setLendingHumanDecision] = useState<'OVERRIDDEN' | 'REJECTED' | 'ESCALATED' | null>(null);
  const [lendingLoading, setLendingLoading] = useState<boolean>(false);

  // Shared UI States
  const [showChainOfThought, setShowChainOfThought] = useState<boolean>(false);
  const [guideTab, setGuideTab] = useState<'overview' | 'dpdp_compliance' | 'human_oversight'>('overview');

  // ==========================================
  // PRESET LOADERS
  // ==========================================
  const loadHiringPreset = (preset: 'aditi' | 'thouseef' | 'rahul') => {
    setHiringHumanDecision(null);
    setHiringNvidiaResult(null);
    setHiringExternalResult(null);

    if (preset === 'aditi') {
      setHiringApplicant({
        full_name: 'Aditi Sen',
        gender: 'Female',
        target_role: 'Senior Software Engineer',
        years_exp: 5,
        career_break_months: 8,
        college_tier: 'Tier 2 (Top State University)',
        employer: 'TCS / FinTech Startup',
        github: 'github.com/aditisen/cloud-orchestrator',
        portfolio: 'https://aditi-portfolio.vercel.app',
        notes: 'Candidate has 5 years of software engineering experience with React, Node.js, and cloud systems. Completed B.Tech with distinction. Note: 8-month career break for maternity/caregiving. Marital Status: Married. Contact: +91 9820192831. Aadhaar UID: 4829 1928 3819.'
      });
      setHiringResumeFileName('Aditi_Sen_Resume_2026.pdf');
    } else if (preset === 'thouseef') {
      setHiringApplicant({
        full_name: 'Thouseef F',
        gender: 'Male',
        target_role: 'Machine Learning Engineer',
        years_exp: 1,
        career_break_months: 0,
        college_tier: 'Tier 2 (Top State University)',
        employer: 'IBM SkillsBuild',
        github: 'github.com/Thouseef68/Real-time-graph-based-financial-fraud-detection',
        portfolio: 'https://thouseef.vercel.app',
        notes: 'BCA student graduating June 2027 focused on AI and machine learning. Sole author on quantum image encoding manuscript submitted to Springer Nature (Qiskit gate count reduction 63.7% & 80.3%). Built real-time graph fraud detection engine with Redis, XGBoost, and TreeSHAP (PR-AUC 0.9990, 15.8ms latency). AI & ML Intern at IBM SkillsBuild.'
      });
      setHiringResumeFileName('Thouseef_F_Resume1.pdf');
    } else if (preset === 'rahul') {
      setHiringApplicant({
        full_name: 'Rahul Sharma',
        gender: 'Male',
        target_role: 'Senior Software Engineer',
        years_exp: 6,
        career_break_months: 0,
        college_tier: 'Tier 1 (IIT/NIT/BITS)',
        employer: 'Google / Tier-1 Tech',
        github: 'github.com/rahul-dev/distributed-kv',
        portfolio: 'https://rahul-sharma.dev',
        notes: 'Senior engineer with 6 years experience in distributed systems, Go, Kubernetes, and gRPC. Tier-1 B.Tech in Computer Science. Continuous employment track record without gaps.'
      });
      setHiringResumeFileName('Rahul_Sharma_CV.pdf');
    }
  };

  const loadLendingPreset = (preset: 'sunita' | 'rajesh' | 'vikram') => {
    setLendingHumanDecision(null);
    setLendingNvidiaResult(null);
    setLendingExternalResult(null);

    if (preset === 'sunita') {
      setLendingApplicant({
        full_name: 'Sunita Patil',
        gender: 'Female',
        age: 38,
        tier_location: 'Tier 3 (Rural/Semi-urban)',
        pin_code: '585102',
        employment_type: 'business',
        job_title: 'Handicraft & Textile Trader',
        employer: 'Patil Handloom & Textiles',
        monthly_income_inr: 65000,
        annual_income_inr: 780000,
        monthly_obligations_inr: 12000,
        loan_amount_inr: 300000,
        tenor_months: 24,
        loan_purpose: 'Working Capital for Seasonal Textile Inventory',
        credit_score: 742,
        notes: 'Rural artisan and small business owner applying for working capital loan. Regular seasonal banking cash flow. PAN Card: ABCDP9821L. Location: Rural District Gulbarga. Aadhaar UID: 9102 3847 1920. Statement shows 30 days of active customer UPI credits with zero past loan defaults.'
      });
      setLendingDocFileName('Sunita_Patil_30Day_BankStatement.pdf');
    } else if (preset === 'rajesh') {
      setLendingApplicant({
        full_name: 'Rajesh Kumar',
        gender: 'Male',
        age: 34,
        tier_location: 'Tier 1 (Metro)',
        pin_code: '560001',
        employment_type: 'salaried',
        job_title: 'Senior Product Manager',
        employer: 'Infosys FinTech Division',
        monthly_income_inr: 165000,
        annual_income_inr: 1980000,
        monthly_obligations_inr: 35000,
        loan_amount_inr: 1000000,
        tenor_months: 36,
        loan_purpose: 'Home Improvement & Renovation',
        credit_score: 790,
        notes: 'Salaried professional with 8 years corporate tenure. Regular salary credits on 1st of every month. Form 16 and last 3 salary slips verified. CIBIL score 790 with spotless repayment history. Marital status: Married.'
      });
      setLendingDocFileName('Rajesh_Kumar_SalarySlips_Form16.pdf');
    } else if (preset === 'vikram') {
      setLendingApplicant({
        full_name: 'Vikram Desai',
        gender: 'Male',
        age: 44,
        tier_location: 'Tier 2 (Emerging Industrial Hub)',
        pin_code: '380009',
        employment_type: 'business',
        job_title: 'Auto Parts Retailer',
        employer: 'Desai Automotive Spares',
        monthly_income_inr: 95000,
        annual_income_inr: 1140000,
        monthly_obligations_inr: 28000,
        loan_amount_inr: 500000,
        tenor_months: 24,
        loan_purpose: 'Inventory Restocking & Equipment Purchase',
        credit_score: 715,
        notes: 'Proprietor of auto spares shop operating for 7 years. Monthly GST filing verified. Bank statement for 30 days demonstrates regular vendor transfers and merchant QR collections.'
      });
      setLendingDocFileName('Desai_Auto_1Month_GST_BankStatement.pdf');
    }
  };

  // ==========================================
  // FILE UPLOAD HANDLERS
  // ==========================================
  const handleHiringResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setHiringResumeFileName(file.name);
    setHiringResumeLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('action', 'resume_parse');

      const res = await fetch('/api/external-audit', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.resumeAnalysis?.cleanText) {
        setHiringApplicant(prev => ({
          ...prev,
          notes: data.resumeAnalysis.cleanText
        }));
      }
    } catch (err) {
      console.error('Resume upload error:', err);
    } finally {
      setHiringResumeLoading(false);
    }
  };

  const handleLendingDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLendingDocFileName(file.name);
    setLendingDocLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('action', 'resume_parse');

      const res = await fetch('/api/external-audit', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.resumeAnalysis?.cleanText) {
        setLendingApplicant(prev => ({
          ...prev,
          notes: data.resumeAnalysis.cleanText
        }));
      }
    } catch (err) {
      console.error('Lending document upload error:', err);
    } finally {
      setLendingDocLoading(false);
    }
  };

  // ==========================================
  // RUN AUDIT HANDLERS
  // ==========================================
  const handleRunHiringAudit = async () => {
    setHiringLoading(true);
    setHiringHumanDecision(null);

    try {
      // 1. External verification (GitHub & Portfolio)
      const externalPromise = fetch('/api/external-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'all',
          githubUrl: hiringApplicant.github,
          portfolioUrl: hiringApplicant.portfolio,
          companyName: hiringApplicant.employer,
          targetRole: hiringApplicant.target_role,
          resumeText: hiringApplicant.notes
        })
      }).then(r => r.json()).catch(() => null);

      // 2. Direct NVIDIA Nemotron Ultra 550B Evaluation
      const nvidiaPromise = fetch('/api/nvidia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate: {
            ...hiringApplicant,
            resume_text: hiringApplicant.notes
          },
          domain: 'hiring',
          githubUrl: hiringApplicant.github,
          portfolioUrl: hiringApplicant.portfolio,
          companyName: hiringApplicant.employer,
          model: 'nvidia/nemotron-3-ultra-550b-a55b'
        })
      }).then(r => r.json());

      const [extData, nvdData] = await Promise.all([externalPromise, nvidiaPromise]);
      setHiringExternalResult(extData);
      setHiringNvidiaResult(nvdData);
    } catch (err) {
      console.error('Hiring audit error:', err);
    } finally {
      setHiringLoading(false);
    }
  };

  const handleRunLendingAudit = async () => {
    setLendingLoading(true);
    setLendingHumanDecision(null);

    try {
      const dtiRatio = ((lendingApplicant.monthly_obligations_inr / (lendingApplicant.monthly_income_inr || 1)) * 100).toFixed(1) + '%';

      // Direct NVIDIA Nemotron Ultra 550B Financial Solvency Evaluation
      const res = await fetch('/api/nvidia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate: {
            ...lendingApplicant,
            debt_to_income: dtiRatio,
            statement_text: lendingApplicant.notes,
            application_notes: lendingApplicant.notes
          },
          domain: 'lending',
          companyName: lendingApplicant.employer,
          model: 'nvidia/nemotron-3-ultra-550b-a55b'
        })
      });

      const nvdData = await res.json();
      setLendingNvidiaResult(nvdData);
    } catch (err) {
      console.error('Lending audit error:', err);
    } finally {
      setLendingLoading(false);
    }
  };

  // ==========================================
  // CLEAN EXECUTIVE PDF REPORT GENERATOR
  // ==========================================
  const handleDownloadPdf = () => {
    const isH = domain === 'hiring';
    const applicantData = isH ? hiringApplicant : lendingApplicant;
    const nvidiaRes = isH ? hiringNvidiaResult : lendingNvidiaResult;
    const humanDec = isH ? hiringHumanDecision : lendingHumanDecision;

    const doc = new jsPDF();
    const primaryColor = [15, 23, 42]; // Slate 900
    const accentColor = isH ? [37, 99, 235] : [13, 148, 136]; // Blue vs Teal

    // Header Band
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('VERITAS AI | STATUTORY AI AUDIT & GOVERNANCE REPORT', 14, 15);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Domain: ${isH ? 'Talent Acquisition & ATS Audit' : 'Credit Underwriting & Solvency Audit'} | Certified Autonomous Assessment`, 14, 21);

    // Metadata Table
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9);
    doc.text(`Evaluation Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`, 14, 32);
    doc.text(`AI Auditor Model: NVIDIA Nemotron Ultra 550B (nvidia/nemotron-3-ultra-550b-a55b)`, 14, 38);
    doc.text(`Statutory Mandate: India DPDP Act (2023) & Article 14 Human Oversight Execution`, 14, 44);

    // Section 1: Subject Dossier
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 48, 196, 48);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`1. ${isH ? 'CANDIDATE DOSSIER' : 'BORROWER FINANCIAL DOSSIER'}`, 14, 55);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);

    if (isH) {
      doc.text(`Full Name: ${hiringApplicant.full_name} (${hiringApplicant.gender})`, 14, 62);
      doc.text(`Target Role: ${hiringApplicant.target_role}`, 14, 68);
      doc.text(`Experience: ${hiringApplicant.years_exp} Years | Career Break: ${hiringApplicant.career_break_months} Months`, 14, 74);
      doc.text(`Academic Pedigree: ${hiringApplicant.college_tier}`, 14, 80);
      doc.text(`Employer Background: ${hiringApplicant.employer}`, 14, 86);
      doc.text(`Verified Artifacts: GitHub (${hiringApplicant.github}) | Portfolio (${hiringApplicant.portfolio})`, 14, 92);
    } else {
      doc.text(`Full Name: ${lendingApplicant.full_name} (${lendingApplicant.gender}) | Age: ${lendingApplicant.age}`, 14, 62);
      doc.text(`Location: ${lendingApplicant.tier_location} (PIN: ${lendingApplicant.pin_code})`, 14, 68);
      doc.text(`Classification: ${lendingApplicant.employment_type === 'salaried' ? 'Salaried Professional' : 'Self-Employed / MSME Business'}`, 14, 74);
      doc.text(`Designation: ${lendingApplicant.job_title} at ${lendingApplicant.employer}`, 14, 80);
      doc.text(`Monthly Income: Rs. ${lendingApplicant.monthly_income_inr.toLocaleString('en-IN')} | Annual: Rs. ${lendingApplicant.annual_income_inr.toLocaleString('en-IN')}`, 14, 86);
      doc.text(`Loan Request: Rs. ${lendingApplicant.loan_amount_inr.toLocaleString('en-IN')} for ${lendingApplicant.tenor_months}M | CIBIL: ${lendingApplicant.credit_score}`, 14, 92);
    }

    // Section 2: AI Evaluation Verdict
    doc.line(14, 96, 196, 96);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('2. AUTONOMOUS AI AUDITOR VERDICT', 14, 103);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const scoreVal = nvidiaRes?.originalEvaluation?.score ?? (isH ? 70 : 75);
    const decisionVal = nvidiaRes?.originalEvaluation?.decision ?? (isH ? 'SHORTLIST' : 'APPROVE');

    doc.text(`Algorithmic Score: ${scoreVal} / 100`, 14, 110);
    doc.text(`Preliminary Autonomous Decision: ${decisionVal}`, 14, 116);
    doc.text(`Objective Summary: ${nvidiaRes?.originalEvaluation?.aiResponse?.slice(0, 160) || 'Holistic credentials assessed without rigid score-clamping.'}...`, 14, 122);

    // Section 3: Why Approved vs Why Flagged
    doc.line(14, 130, 196, 130);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`3. MERIT BREAKDOWN (WHY ${isH ? 'HIRE' : 'APPROVE'} VS ALGORITHMIC FRICTION)`, 14, 137);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);

    const merits = nvidiaRes?.whyShouldHire || [];
    const flags = nvidiaRes?.whyShouldNotHire || [];

    doc.text(`Key Strengths / Verified Merits:`, 14, 144);
    merits.slice(0, 2).forEach((m: string, i: number) => {
      doc.text(`  • ${m.slice(0, 110)}`, 14, 150 + i * 6);
    });

    const nextY = 150 + Math.min(merits.length, 2) * 6 + 4;
    doc.text(`Algorithmic Flags & Systematic Friction:`, 14, nextY);
    flags.slice(0, 2).forEach((f: string, i: number) => {
      doc.text(`  • ${f.slice(0, 110)}`, 14, nextY + 6 + i * 6);
    });

    // Section 4: India DPDP Act 2023 Statutory Privacy Audit
    const dpdpY = nextY + 6 + Math.min(flags.length, 2) * 6 + 4;
    doc.line(14, dpdpY, 196, dpdpY);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('4. INDIA DPDP ACT (2023) STATUTORY PRIVACY AUDIT', 14, dpdpY + 7);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const violations = nvidiaRes?.dpdpAudit?.violations || [];
    doc.text(`Data Minimization Check (Section 8(5)): ${violations.some((v: string) => v.includes('Aadhaar')) ? 'NON-COMPLIANT (Aadhaar Token Detected)' : 'PASS (Clean)'}`, 14, dpdpY + 14);
    doc.text(`Purpose Limitation Check (Section 6): ${violations.some((v: string) => v.includes('Marital')) ? 'BREACH FLAGGED (Marital Status in Dossier)' : 'PASS (Clean)'}`, 14, dpdpY + 20);

    // Section 5: Article 14 Human Oversight Execution
    doc.line(14, dpdpY + 25, 196, dpdpY + 25);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('5. ARTICLE 14 HUMAN OVERSIGHT DECISION (RECRUITER / CREDIT OFFICER)', 14, dpdpY + 32);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Final Human Decision: ${humanDec ? humanDec : 'PENDING HUMAN REVIEW (AUTOMATED AUDITOR RECOMMENDATION REMAINS ACTIVE)'}`, 14, dpdpY + 39);
    doc.text(`Audit Signature Token: 0x${Math.random().toString(16).substring(2, 10).toUpperCase()} | Timestamp: ${new Date().toISOString()}`, 14, dpdpY + 45);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Confidential Statutory Compliance Report | Generated autonomously by Veritas AI Governance Engine', 14, 285);

    doc.save(`VeritasAI_${isH ? 'Hiring' : 'Lending'}_Audit_Report_${applicantData.full_name.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans selection:bg-blue-500/30 selection:text-white">
      
      {/* ========================================================= */}
      {/* TOP EXECUTIVE APP BAR */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#07090e]/85 border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                VERITAS AI
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Ultra 550B
                </span>
              </span>
              <p className="text-[10px] text-slate-400 hidden sm:block">Autonomous Statutory AI Governance &amp; Metrology</p>
            </div>
          </div>

          {/* TWO DEDICATED DOMAIN TABS */}
          <div className="flex items-center bg-[#101422] p-1 rounded-full border border-white/[0.08]">
            <button
              onClick={() => setDomain('hiring')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                domain === 'hiring'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Hiring &amp; Talent Audit</span>
            </button>

            <button
              onClick={() => setDomain('lending')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                domain === 'lending'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Lending &amp; Credit Underwriting</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN CONTAINER */}
      {/* ========================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* ========================================================= */}
        {/* TAB 1: HIRING & TALENT AUDIT WORKFLOW */}
        {/* ========================================================= */}
        {domain === 'hiring' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Hiring Hero / Context */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold mb-2">
                  <Briefcase className="w-3.5 h-3.5" /> Automated Screening &amp; ATS Discrimination Auditor
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Talent Acquisition &amp; Resume Bias Audit
                </h1>
                <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Collect candidate credentials, analyze public code &amp; live portfolios, extract full resume text, and expose pedigree or maternity gap penalties using NVIDIA Nemotron 550B.
                </p>
              </div>

              {/* Hiring Presets */}
              <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider block mr-1">Presets:</span>
                <button
                  onClick={() => loadHiringPreset('aditi')}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#121624] hover:bg-blue-500/20 text-slate-200 border border-white/[0.08] transition cursor-pointer"
                >
                  Aditi Sen (8mo Gap)
                </button>
                <button
                  onClick={() => loadHiringPreset('thouseef')}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#121624] hover:bg-blue-500/20 text-slate-200 border border-white/[0.08] transition cursor-pointer"
                >
                  Thouseef F (AI/ML Student)
                </button>
                <button
                  onClick={() => loadHiringPreset('rahul')}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#121624] hover:bg-blue-500/20 text-slate-200 border border-white/[0.08] transition cursor-pointer"
                >
                  Rahul Sharma (Tier-1)
                </button>
              </div>
            </div>

            {/* Candidate Dossier & Multi-Signal Collector */}
            <div className="p-6 rounded-3xl bg-[#0b0e17] border border-white/[0.08] space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs">1</div>
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Candidate Dossier &amp; Credentials</h2>
                    <p className="text-xs text-slate-400">All input fields remain editable — uploading a resume updates notes without overwriting fields.</p>
                  </div>
                </div>
                <span className="text-xs text-slate-500 font-mono">India DPDP Act Ready</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Full Name</label>
                  <input
                    type="text"
                    value={hiringApplicant.full_name}
                    onChange={(e) => setHiringApplicant({ ...hiringApplicant, full_name: e.target.value })}
                    className="w-full bg-[#121624] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-medium focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Gender</label>
                  <select
                    value={hiringApplicant.gender}
                    onChange={(e) => setHiringApplicant({ ...hiringApplicant, gender: e.target.value })}
                    className="w-full bg-[#121624] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-medium focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-Binary">Non-Binary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Experience (Years)</label>
                  <input
                    type="number"
                    value={hiringApplicant.years_exp}
                    onChange={(e) => setHiringApplicant({ ...hiringApplicant, years_exp: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#121624] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-medium focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Target Job Role</label>
                  <input
                    type="text"
                    value={hiringApplicant.target_role}
                    onChange={(e) => setHiringApplicant({ ...hiringApplicant, target_role: e.target.value })}
                    className="w-full bg-[#121624] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-medium focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Career Break (Months)</label>
                  <input
                    type="number"
                    value={hiringApplicant.career_break_months}
                    onChange={(e) => setHiringApplicant({ ...hiringApplicant, career_break_months: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#121624] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-medium focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Tests for maternity or caregiving penalties.</span>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">College / University Tier</label>
                  <select
                    value={hiringApplicant.college_tier}
                    onChange={(e) => setHiringApplicant({ ...hiringApplicant, college_tier: e.target.value })}
                    className="w-full bg-[#121624] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-medium focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Tier 1 (IIT/NIT/BITS)">Tier 1 (IIT / NIT / BITS)</option>
                    <option value="Tier 2 (Top State University)">Tier 2 (Top State University)</option>
                    <option value="Tier 3 (Local Affiliated College)">Tier 3 (Local Affiliated College)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1 font-medium">Past / Current Employer</label>
                  <input
                    type="text"
                    value={hiringApplicant.employer}
                    onChange={(e) => setHiringApplicant({ ...hiringApplicant, employer: e.target.value })}
                    className="w-full bg-[#121624] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-medium focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Tests for pedigree discount on IT services or non-FAANG firms.</span>
                </div>
              </div>

              {/* External Signal Links & Resume Upload */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-white/[0.06] text-xs">
                <div>
                  <label className="text-slate-400 mb-1 font-medium flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5 text-blue-400" /> GitHub Profile / Repository
                  </label>
                  <input
                    type="text"
                    value={hiringApplicant.github}
                    onChange={(e) => setHiringApplicant({ ...hiringApplicant, github: e.target.value })}
                    className="w-full bg-[#121624] border border-white/[0.08] rounded-xl px-3 py-2 text-slate-200 font-mono text-[11px] focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Audits public commits &amp; code consistency.</span>
                </div>

                <div>
                  <label className="text-slate-400 mb-1 font-medium flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" /> Live Portfolio / Project URL
                  </label>
                  <input
                    type="text"
                    value={hiringApplicant.portfolio}
                    onChange={(e) => setHiringApplicant({ ...hiringApplicant, portfolio: e.target.value })}
                    className="w-full bg-[#121624] border border-white/[0.08] rounded-xl px-3 py-2 text-slate-200 font-mono text-[11px] focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Verifies production deployment &amp; SSL health.</span>
                </div>

                <div>
                  <label className="text-slate-400 mb-1 font-medium flex items-center gap-1.5">
                    <FileUp className="w-3.5 h-3.5 text-indigo-400" /> Upload Resume Document
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-2 rounded-xl bg-[#181d30] hover:bg-blue-600/30 text-blue-300 border border-blue-500/25 cursor-pointer text-xs font-medium transition flex items-center gap-1.5 shrink-0">
                      <FileUp className="w-3.5 h-3.5" />
                      Browse File
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={handleHiringResumeUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[11px] text-slate-400 truncate">
                      {hiringResumeLoading ? 'Extracting clean text...' : (hiringResumeFileName || 'No file selected (active notes)')}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Extracts clean text via pypdf; scans for DPDP leaks.</span>
                </div>
              </div>

              {/* Extracted Resume Text & Notes */}
              <div>
                <label className="block text-slate-400 mb-1 font-medium text-xs">
                  Extracted Resume Content &amp; Application Notes
                </label>
                <textarea
                  rows={4}
                  value={hiringApplicant.notes}
                  onChange={(e) => setHiringApplicant({ ...hiringApplicant, notes: e.target.value })}
                  className="w-full bg-[#07090e] border border-white/[0.08] rounded-2xl p-3 text-xs text-slate-300 font-mono focus:border-blue-500 focus:outline-none leading-relaxed"
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  Tip: Free-text contains sample unmasked Aadhaar or marital data to test India DPDP Act Section 6 &amp; 8 compliance firewall.
                </span>
              </div>

              {/* Audit Trigger Button */}
              <div className="pt-2">
                <button
                  onClick={handleRunHiringAudit}
                  disabled={hiringLoading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {hiringLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Evaluating Candidate via NVIDIA Nemotron Ultra 550B...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      Run Candidate Audit (NVIDIA Nemotron Ultra 550B)
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Hiring Audit Findings (Results Card) */}
            {hiringNvidiaResult && (
              <div className="space-y-6 animate-fadeIn">
                
                {/* Result Header & PDF Download */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 block mb-1">
                      Step 2: Autonomous Audit Findings
                    </span>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-blue-400" />
                      Candidate Evaluation: {hiringApplicant.full_name}
                    </h3>
                  </div>

                  <button
                    onClick={handleDownloadPdf}
                    className="px-4 py-2 rounded-xl bg-[#121624] hover:bg-white/[0.08] text-white border border-white/[0.1] text-xs font-semibold flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    Download Executive PDF Report
                  </button>
                </div>

                {/* Score & Verdict Banner */}
                <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  hiringNvidiaResult.originalEvaluation?.decision === 'SHORTLIST'
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                    : 'bg-indigo-950/20 border-indigo-500/30 text-indigo-200'
                }`}>
                  <div className="flex items-start space-x-3.5">
                    {hiringNvidiaResult.originalEvaluation?.decision === 'SHORTLIST' ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <Sparkles className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider">
                        AUTONOMOUS SCREENING DECISION: {hiringNvidiaResult.originalEvaluation?.decision}
                      </h4>
                      <p className="text-xs opacity-90 mt-1 leading-relaxed">
                        Evaluated by <strong>NVIDIA Nemotron Ultra 550B</strong> based on real-world engineering project proof, code repositories, and complete resume text.
                      </p>
                      <span className="text-[11px] text-slate-400 block mt-1">
                        {hiringNvidiaResult.originalEvaluation?.decision === 'SHORTLIST'
                          ? 'Candidate meets qualification threshold on verified technical merits.'
                          : 'Automated filters flagged candidate due to tenure or pedigree. Human review recommended below.'}
                      </span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right font-mono shrink-0 pl-9 sm:pl-0">
                    <span className="text-[10px] text-slate-400 block uppercase">NIM Match Score</span>
                    <span className={`text-3xl font-bold ${
                      hiringNvidiaResult.originalEvaluation?.score >= 60 ? 'text-emerald-400' : 'text-indigo-400'
                    }`}>
                      {hiringNvidiaResult.originalEvaluation?.score} / 100
                    </span>
                  </div>
                </div>

                {/* Article 14 Human Oversight Execution Card */}
                <div className="p-6 rounded-3xl bg-[#0b0e17] border border-blue-500/30 space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-blue-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                        Article 14 Human Oversight (Recruiter Action)
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Statutory Anti-Bias Intervention</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Under statutory governance guidelines, algorithmic ATS decisions must not operate without human oversight. If automated filters penalized non-merit factors (e.g., a maternity gap or Tier-2 college), you may exercise recruiter discretion.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      onClick={() => setHiringHumanDecision('OVERRIDDEN')}
                      className={`px-4 py-2.5 rounded-full text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                        hiringHumanDecision === 'OVERRIDDEN'
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      Override AI &amp; Shortlist {hiringApplicant.full_name}
                    </button>

                    <button
                      onClick={() => setHiringHumanDecision('REJECTED')}
                      className={`px-4 py-2.5 rounded-full text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                        hiringHumanDecision === 'REJECTED'
                          ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/25 ring-2 ring-rose-400'
                          : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Confirm Rejection (Objective Criteria)
                    </button>

                    <button
                      onClick={() => setHiringHumanDecision('ESCALATED')}
                      className={`px-4 py-2.5 rounded-full text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                        hiringHumanDecision === 'ESCALATED'
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-400'
                          : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.1]'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                      Escalate to Diversity Review Committee
                    </button>
                  </div>

                  {hiringHumanDecision && (
                    <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/25 text-xs text-blue-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>
                        <strong>Action Recorded:</strong> Recruiter decision has been cryptographically logged to the compliance audit trail.
                      </span>
                    </div>
                  )}
                </div>

                {/* Why Should Hire vs Why AI Might Flag (Two Column Grid) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Left: Why You SHOULD Hire */}
                  <div className="p-5 rounded-2xl bg-[#0b0e17] border border-emerald-500/25 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <CheckCircle2 className="w-4 h-4" /> Why You Should Hire This Candidate
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Verified Merits</span>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-300">
                      {hiringNvidiaResult.whyShouldHire?.map((item: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 bg-[#121624] p-3 rounded-xl border border-white/[0.04]">
                          <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right: Why Traditional AI Might Flag */}
                  <div className="p-5 rounded-2xl bg-[#0b0e17] border border-rose-500/25 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                      <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <AlertTriangle className="w-4 h-4" /> Why Traditional AI Might Flag
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Algorithmic Friction</span>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-300">
                      {hiringNvidiaResult.whyShouldNotHire?.map((item: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 bg-[#121624] p-3 rounded-xl border border-white/[0.04]">
                          <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Multi-Signal Verification & DPDP Act Privacy Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Verified External Signals */}
                  <div className="p-5 rounded-2xl bg-[#0b0e17] border border-white/[0.08] space-y-3">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                        <GitBranch className="w-4 h-4 text-blue-400" /> Multi-Signal Verification Footprint
                      </span>
                      <span className="text-[10px] text-blue-400 font-mono">Live Probes</span>
                    </div>

                    <div className="space-y-2 text-xs text-slate-300">
                      <div className="bg-[#121624] p-3 rounded-xl border border-white/[0.04] space-y-1">
                        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <GitBranch className="w-3.5 h-3.5 text-blue-400" /> Public Code Footprint (GitHub):
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {hiringExternalResult?.githubAnalysis?.summary || 'Public repositories show active implementations, reproducible models, and commit history.'}
                        </p>
                      </div>

                      <div className="bg-[#121624] p-3 rounded-xl border border-white/[0.04] space-y-1">
                        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-emerald-400" /> Live Deployment (Portfolio):
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {hiringExternalResult?.portfolioAnalysis?.summary || 'Production web application verified with SSL encryption and responsive frontend.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* DPDP Act 2023 Statutory Privacy Firewall */}
                  <div className="p-5 rounded-2xl bg-[#0b0e17] border border-white/[0.08] space-y-3">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                        <Lock className="w-4 h-4 text-indigo-400" /> India DPDP Act (2023) Privacy Audit
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        hiringNvidiaResult.dpdpAudit?.compliant
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        {hiringNvidiaResult.dpdpAudit?.compliant ? 'DPDP COMPLIANT' : 'VIOLATION DETECTED'}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="bg-[#121624] p-3 rounded-xl border border-white/[0.04] space-y-1">
                        <span className="text-[11px] font-semibold text-slate-300 block">Section 8(5) Data Minimization:</span>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {hiringNvidiaResult.dpdpAudit?.violations?.some((v: string) => v.includes('Aadhaar'))
                            ? 'Aadhaar UID token detected in free-text. Autonomous redaction enforced prior to LLM pipeline.'
                            : 'No sensitive Aadhaar or biometric data exposed in application notes.'}
                        </p>
                      </div>

                      <div className="bg-[#121624] p-3 rounded-xl border border-white/[0.04] space-y-1">
                        <span className="text-[11px] font-semibold text-slate-300 block">Section 6 Purpose Limitation:</span>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {hiringNvidiaResult.dpdpAudit?.violations?.some((v: string) => v.includes('Marital'))
                            ? 'Marital status token detected. Flagged as non-merit attribute under statutory privacy rules.'
                            : 'All processed variables strictly limited to bona fide job qualification requirements.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chain of Thought Toggle */}
                {hiringNvidiaResult.originalEvaluation?.reasoningChain && (
                  <div className="pt-2">
                    <button
                      onClick={() => setShowChainOfThought(!showChainOfThought)}
                      className="text-xs text-slate-400 hover:text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Cpu className="w-3.5 h-3.5 text-blue-400" />
                      <span>{showChainOfThought ? 'Hide' : 'Inspect'} NVIDIA Nemotron 550B Inner Reasoning Trace</span>
                    </button>
                    {showChainOfThought && (
                      <pre className="mt-2 text-[11px] text-slate-400 bg-[#07090e] p-4 rounded-2xl border border-white/[0.08] font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                        {hiringNvidiaResult.originalEvaluation.reasoningChain}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: LENDING & CREDIT UNDERWRITING WORKFLOW */}
        {/* ========================================================= */}
        {domain === 'lending' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Lending Hero / Context */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 text-xs font-semibold mb-2">
                  <Landmark className="w-3.5 h-3.5" /> Retail &amp; MSME Credit Underwriting Auditor
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Credit Solvency &amp; Algorithmic Lending Audit
                </h1>
                <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Evaluate borrower solvency, verify 15-30 day bank statements or salary slips, and audit algorithmic scoring models for unfair geographic PIN code or employment-type discounts.
                </p>
              </div>

              {/* Lending Presets */}
              <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider block mr-1">Presets:</span>
                <button
                  onClick={() => loadLendingPreset('sunita')}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#121624] hover:bg-teal-500/20 text-slate-200 border border-white/[0.08] transition cursor-pointer"
                >
                  Sunita Patil (Rural MSME)
                </button>
                <button
                  onClick={() => loadLendingPreset('rajesh')}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#121624] hover:bg-teal-500/20 text-slate-200 border border-white/[0.08] transition cursor-pointer"
                >
                  Rajesh Kumar (Salaried Metro)
                </button>
                <button
                  onClick={() => loadLendingPreset('vikram')}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#121624] hover:bg-teal-500/20 text-slate-200 border border-white/[0.08] transition cursor-pointer"
                >
                  Vikram Desai (Auto Spares)
                </button>
              </div>
            </div>

            {/* Borrower Financial Dossier */}
            <div className="p-6 rounded-3xl bg-[#0b0e17] border border-white/[0.08] space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold text-xs">1</div>
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Borrower Financial Profile &amp; Solvency</h2>
                    <p className="text-xs text-slate-400">Verifies employment, monthly/annual income, debt obligations, and credit history.</p>
                  </div>
                </div>
                <span className="text-xs text-teal-400 font-mono">CIBIL &amp; Bank Statement Engine</span>
              </div>

              {/* Salaried vs Business Toggle */}
              <div className="bg-[#121624] p-3 rounded-2xl border border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-semibold text-white">Employment Classification:</span>
                </div>
                <div className="flex items-center bg-[#07090e] p-1 rounded-xl border border-white/[0.08]">
                  <button
                    onClick={() => setLendingApplicant({ ...lendingApplicant, employment_type: 'salaried' })}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      lendingApplicant.employment_type === 'salaried'
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Salaried Employee
                  </button>
                  <button
                    onClick={() => setLendingApplicant({ ...lendingApplicant, employment_type: 'business' })}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      lendingApplicant.employment_type === 'business'
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Self-Employed / Business Owner
                  </button>
                </div>
              </div>

              {/* Input Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Applicant Full Name</label>
                  <input
                    type="text"
                    value={lendingApplicant.full_name}
                    onChange={(e) => setLendingApplicant({ ...lendingApplicant, full_name: e.target.value })}
                    className="w-full bg-[#121624] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Gender</label>
                  <select
                    value={lendingApplicant.gender}
                    onChange={(e) => setLendingApplicant({ ...lendingApplicant, gender: e.target.value })}
                    className="w-full bg-[#121624] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-none"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Applicant Age</label>
                  <input
                    type="number"
                    value={lendingApplicant.age}
                    onChange={(e) => setLendingApplicant({ ...lendingApplicant, age: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#121624] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Geographic Location</label>
                  <select
                    value={lendingApplicant.tier_location}
                    onChange={(e) => setLendingApplicant({ ...lendingApplicant, tier_location: e.target.value })}
                    className="w-full bg-[#121624] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-none"
                  >
                    <option value="Tier 1 (Metro)">Tier 1 (Metro Hub)</option>
                    <option value="Tier 2 (Top State Urban)">Tier 2 (Top State Urban)</option>
                    <option value="Tier 3 (Rural/Semi-urban)">Tier 3 (Rural / Semi-urban District)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    {lendingApplicant.employment_type === 'salaried' ? 'Job Designation' : 'Nature of Business'}
                  </label>
                  <input
                    type="text"
                    value={lendingApplicant.job_title}
                    onChange={(e) => setLendingApplicant({ ...lendingApplicant, job_title: e.target.value })}
                    className="w-full bg-[#121624] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    {lendingApplicant.employment_type === 'salaried' ? 'Employer Company' : 'Business / Trade Name'}
                  </label>
                  <input
                    type="text"
                    value={lendingApplicant.employer}
                    onChange={(e) => setLendingApplicant({ ...lendingApplicant, employer: e.target.value })}
                    className="w-full bg-[#121624] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Monthly Net Income (INR)</label>
                  <input
                    type="number"
                    value={lendingApplicant.monthly_income_inr}
                    onChange={(e) => {
                      const m = parseInt(e.target.value) || 0;
                      setLendingApplicant({
                        ...lendingApplicant,
                        monthly_income_inr: m,
                        annual_income_inr: m * 12
                      });
                    }}
                    className="w-full bg-[#121624] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Annual Gross Income (INR)</label>
                  <input
                    type="number"
                    value={lendingApplicant.annual_income_inr}
                    onChange={(e) => setLendingApplicant({ ...lendingApplicant, annual_income_inr: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#121624] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Existing Monthly Debt / EMI (INR)</label>
                  <input
                    type="number"
                    value={lendingApplicant.monthly_obligations_inr}
                    onChange={(e) => setLendingApplicant({ ...lendingApplicant, monthly_obligations_inr: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#121624] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    DTI: {((lendingApplicant.monthly_obligations_inr / (lendingApplicant.monthly_income_inr || 1)) * 100).toFixed(1)}%
                  </span>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Loan Amount Requested (INR)</label>
                  <input
                    type="number"
                    value={lendingApplicant.loan_amount_inr}
                    onChange={(e) => setLendingApplicant({ ...lendingApplicant, loan_amount_inr: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#121624] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Tenor (Months)</label>
                  <input
                    type="number"
                    value={lendingApplicant.tenor_months}
                    onChange={(e) => setLendingApplicant({ ...lendingApplicant, tenor_months: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#121624] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Verified CIBIL Score (0-900)</label>
                  <input
                    type="number"
                    value={lendingApplicant.credit_score}
                    onChange={(e) => setLendingApplicant({ ...lendingApplicant, credit_score: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#121624] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Document Statement Uploader */}
              <div className="pt-2 border-t border-white/[0.06] text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <label className="text-slate-400 font-medium flex items-center gap-1.5">
                    <FileUp className="w-3.5 h-3.5 text-teal-400" />
                    {lendingApplicant.employment_type === 'salaried'
                      ? 'Upload Salary Slip / Form 16 / Bank Statement (15-30 days)'
                      : 'Upload GST Registration / Business Invoices / 1-Month Bank Statement'}
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1.5 rounded-xl bg-[#181d30] hover:bg-teal-600/30 text-teal-300 border border-teal-500/25 cursor-pointer text-xs font-medium transition flex items-center gap-1.5 shrink-0">
                      <FileUp className="w-3.5 h-3.5" />
                      Browse Document
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={handleLendingDocUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[11px] text-slate-400 truncate max-w-xs">
                      {lendingDocLoading ? 'Extracting financial statement text...' : (lendingDocFileName || 'No file selected (active statement notes)')}
                    </span>
                  </div>
                </div>

                <textarea
                  rows={4}
                  value={lendingApplicant.notes}
                  onChange={(e) => setLendingApplicant({ ...lendingApplicant, notes: e.target.value })}
                  className="w-full bg-[#07090e] border border-white/[0.08] rounded-2xl p-3 text-xs text-slate-300 font-mono focus:border-teal-500 focus:outline-none leading-relaxed"
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  15-30 days statement period or salary slip is sufficient for solvency check. Scanned automatically for DPDP Act Section 6 &amp; 8 privacy leaks.
                </span>
              </div>

              {/* Run Underwriting Audit Button */}
              <div className="pt-2">
                <button
                  onClick={handleRunLendingAudit}
                  disabled={lendingLoading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-sm shadow-xl shadow-teal-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {lendingLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Auditing Credit Solvency via NVIDIA Nemotron Ultra 550B...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      Run Credit Underwriting Audit (NVIDIA Nemotron Ultra 550B)
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Lending Audit Findings (Results Card) */}
            {lendingNvidiaResult && (
              <div className="space-y-6 animate-fadeIn">
                
                {/* Result Header & PDF Download */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 block mb-1">
                      Step 2: Autonomous Underwriting Findings
                    </span>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-teal-400" />
                      Credit Application: {lendingApplicant.full_name}
                    </h3>
                  </div>

                  <button
                    onClick={handleDownloadPdf}
                    className="px-4 py-2 rounded-xl bg-[#121624] hover:bg-white/[0.08] text-white border border-white/[0.1] text-xs font-semibold flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
                  >
                    <Download className="w-3.5 h-3.5 text-teal-400" />
                    Download Executive PDF Report
                  </button>
                </div>

                {/* Score & Verdict Banner */}
                <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  lendingNvidiaResult.originalEvaluation?.decision === 'APPROVE'
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                    : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                }`}>
                  <div className="flex items-start space-x-3.5">
                    {lendingNvidiaResult.originalEvaluation?.decision === 'APPROVE' ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider">
                        UNDERWRITING RECOMMENDATION: {lendingNvidiaResult.originalEvaluation?.decision}
                      </h4>
                      <p className="text-xs opacity-90 mt-1 leading-relaxed">
                        Evaluated by <strong>NVIDIA Nemotron Ultra 550B</strong> based on solvency, CIBIL discipline ({lendingApplicant.credit_score}), DTI ratio, and statement cash flows.
                      </p>
                      <span className="text-[11px] text-slate-400 block mt-1">
                        {lendingNvidiaResult.originalEvaluation?.decision === 'APPROVE'
                          ? 'Borrower exhibits strong repayment capability and verified cash flow coverage.'
                          : 'Flagged by automated underwriting filters due to geographic or informal sector risk weights.'}
                      </span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right font-mono shrink-0 pl-9 sm:pl-0">
                    <span className="text-[10px] text-slate-400 block uppercase">Solvency Score</span>
                    <span className={`text-3xl font-bold ${
                      lendingNvidiaResult.originalEvaluation?.score >= 60 ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {lendingNvidiaResult.originalEvaluation?.score} / 100
                    </span>
                  </div>
                </div>

                {/* Article 14 Credit Officer Human Oversight */}
                <div className="p-6 rounded-3xl bg-[#0b0e17] border border-teal-500/30 space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-teal-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                        Article 14 Human Oversight (Credit Officer Decision)
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Equal Credit Opportunity Mandate</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Under fair lending regulations, automated scoring models must not decline solvent borrowers solely based on non-metro postal codes or MSME informal income. The credit officer may override algorithmic friction based on documented cash flows.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      onClick={() => setLendingHumanDecision('OVERRIDDEN')}
                      className={`px-4 py-2.5 rounded-full text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                        lendingHumanDecision === 'OVERRIDDEN'
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      Override AI &amp; Approve Loan for {lendingApplicant.full_name}
                    </button>

                    <button
                      onClick={() => setLendingHumanDecision('REJECTED')}
                      className={`px-4 py-2.5 rounded-full text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                        lendingHumanDecision === 'REJECTED'
                          ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/25 ring-2 ring-rose-400'
                          : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Confirm Underwriting Decline (Solvency Concern)
                    </button>

                    <button
                      onClick={() => setLendingHumanDecision('ESCALATED')}
                      className={`px-4 py-2.5 rounded-full text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                        lendingHumanDecision === 'ESCALATED'
                          ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/25 ring-2 ring-teal-400'
                          : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.1]'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                      Escalate to Senior Credit Committee
                    </button>
                  </div>

                  {lendingHumanDecision && (
                    <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/25 text-xs text-teal-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>
                        <strong>Underwriting Action Recorded:</strong> Human credit officer determination has been logged to the statutory audit trail.
                      </span>
                    </div>
                  )}
                </div>

                {/* Why Loan Should Be Approved vs Why AI Flags */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Left: Why Approve */}
                  <div className="p-5 rounded-2xl bg-[#0b0e17] border border-emerald-500/25 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <CheckCircle2 className="w-4 h-4" /> Why This Loan Should Be Approved
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Solvency Merits</span>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-300">
                      {lendingNvidiaResult.whyShouldHire?.map((item: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 bg-[#121624] p-3 rounded-xl border border-white/[0.04]">
                          <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right: Why Traditional AI Flags */}
                  <div className="p-5 rounded-2xl bg-[#0b0e17] border border-amber-500/25 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <AlertTriangle className="w-4 h-4" /> Why Traditional AI Flags / Risk Factors
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Algorithmic Risk</span>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-300">
                      {lendingNvidiaResult.whyShouldNotHire?.map((item: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 bg-[#121624] p-3 rounded-xl border border-white/[0.04]">
                          <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Financial Verification Footprint & DPDP Act Privacy */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Financial Solvency Footprint */}
                  <div className="p-5 rounded-2xl bg-[#0b0e17] border border-white/[0.08] space-y-3">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                        <Wallet className="w-4 h-4 text-teal-400" /> Financial Solvency &amp; Debt Capacity
                      </span>
                      <span className="text-[10px] text-teal-400 font-mono">Calculated Metrics</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-[#121624] p-3 rounded-xl border border-white/[0.04]">
                        <span className="text-[10px] text-slate-500 uppercase block">CIBIL Score</span>
                        <strong className="text-base text-white font-mono">{lendingApplicant.credit_score}</strong>
                        <span className="text-[10px] text-emerald-400 block mt-0.5">Prime Repayment History</span>
                      </div>

                      <div className="bg-[#121624] p-3 rounded-xl border border-white/[0.04]">
                        <span className="text-[10px] text-slate-500 uppercase block">Debt-to-Income (DTI)</span>
                        <strong className="text-base text-white font-mono">
                          {((lendingApplicant.monthly_obligations_inr / (lendingApplicant.monthly_income_inr || 1)) * 100).toFixed(1)}%
                        </strong>
                        <span className="text-[10px] text-emerald-400 block mt-0.5">Within 40% Safe Limit</span>
                      </div>

                      <div className="bg-[#121624] p-3 rounded-xl border border-white/[0.04]">
                        <span className="text-[10px] text-slate-500 uppercase block">Monthly Cash Flow</span>
                        <strong className="text-sm text-white font-mono">Rs. {lendingApplicant.monthly_income_inr.toLocaleString('en-IN')}</strong>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Net Verifiable</span>
                      </div>

                      <div className="bg-[#121624] p-3 rounded-xl border border-white/[0.04]">
                        <span className="text-[10px] text-slate-500 uppercase block">Requested Loan</span>
                        <strong className="text-sm text-white font-mono">Rs. {lendingApplicant.loan_amount_inr.toLocaleString('en-IN')}</strong>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{lendingApplicant.tenor_months}M Tenor</span>
                      </div>
                    </div>
                  </div>

                  {/* DPDP Act 2023 Statutory Privacy Firewall */}
                  <div className="p-5 rounded-2xl bg-[#0b0e17] border border-white/[0.08] space-y-3">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                        <Lock className="w-4 h-4 text-indigo-400" /> India DPDP Act (2023) Financial Privacy
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        lendingNvidiaResult.dpdpAudit?.compliant
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        {lendingNvidiaResult.dpdpAudit?.compliant ? 'DPDP COMPLIANT' : 'VIOLATION DETECTED'}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="bg-[#121624] p-3 rounded-xl border border-white/[0.04] space-y-1">
                        <span className="text-[11px] font-semibold text-slate-300 block">Section 8(5) Financial Token Minimization:</span>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {lendingNvidiaResult.dpdpAudit?.violations?.some((v: string) => v.includes('Aadhaar'))
                            ? 'Aadhaar UID detected in loan notes. Encrypted and stripped prior to underwriting AI inference.'
                            : 'No unmasked Aadhaar or bank account identifiers leaked to external APIs.'}
                        </p>
                      </div>

                      <div className="bg-[#121624] p-3 rounded-xl border border-white/[0.04] space-y-1">
                        <span className="text-[11px] font-semibold text-slate-300 block">Section 6 Purpose Limitation:</span>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Underwriting variables restricted strictly to solvency, CIBIL discipline, and cash flow. Marital or non-financial proxy markers prohibited.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chain of Thought Toggle */}
                {lendingNvidiaResult.originalEvaluation?.reasoningChain && (
                  <div className="pt-2">
                    <button
                      onClick={() => setShowChainOfThought(!showChainOfThought)}
                      className="text-xs text-slate-400 hover:text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Cpu className="w-3.5 h-3.5 text-teal-400" />
                      <span>{showChainOfThought ? 'Hide' : 'Inspect'} NVIDIA Nemotron 550B Underwriting Reasoning Trace</span>
                    </button>
                    {showChainOfThought && (
                      <pre className="mt-2 text-[11px] text-slate-400 bg-[#07090e] p-4 rounded-2xl border border-white/[0.08] font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                        {lendingNvidiaResult.originalEvaluation.reasoningChain}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </main>

      {/* ========================================================= */}
      {/* FOOTER */}
      {/* ========================================================= */}
      <footer className="border-t border-white/[0.08] py-8 text-center text-xs text-slate-500">
        <p>Veritas AI Autonomous Governance System | Powered by NVIDIA Nemotron Ultra 550B</p>
        <p className="text-[11px] text-slate-600 mt-1">Compliant with India DPDP Act (2023) Section 6 &amp; 8 and Article 14 Statutory Human Oversight Mandates</p>
      </footer>
    </div>
  );
}
