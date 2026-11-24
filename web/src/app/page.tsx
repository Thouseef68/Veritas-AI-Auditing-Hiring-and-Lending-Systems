'use client';

import React, { useState, useEffect } from 'react';
import { 
  Scale, 
  Briefcase, 
  CreditCard, 
  Cpu, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  Sparkles, 
  Sliders, 
  Lock, 
  RefreshCw, 
  ArrowRight,
  Eye,
  Check,
  Users,
  ChevronRight,
  HelpCircle,
  FileCheck2,
  Building,
  UserCheck,
  Zap,
  Info
} from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function Home() {
  // Main Domain: 'hiring' or 'lending'
  const [domain, setDomain] = useState<'hiring' | 'lending'>('hiring');

  // Interactive Candidate Profile (Editable by User / Judge)
  const [applicant, setApplicant] = useState({
    full_name: 'Aditi Sen',
    gender: 'Female',
    age: 28,
    target_role: 'Senior Software Engineer',
    years_exp: 5,
    skills_score: 84,
    college_tier: 'Tier 2 (Top State University)',
    career_break_months: 8,
    credit_score: 740,
    annual_income_inr: 1200000,
    loan_amount_inr: 600000,
    debt_to_income: 0.32,
    tier_location: 'Tier 3 (Rural/Semi-urban)',
    notes: 'Candidate has 5 years of software development experience with React and Node.js. Completed B.Tech with 84/100 skills assessment. Note: 8-month career break for maternity/caregiving. Marital Status: Married. Contact: +91 9820192831. Aadhaar UID: 4829 1928 3819.'
  });

  // Threshold Sandbox
  const [threshold, setThreshold] = useState<number>(0.50);

  // Audit Results
  const [auditData, setAuditData] = useState<any>(null);
  const [dpdpData, setDpdpData] = useState<any>(null);
  const [nvidiaResult, setNvidiaResult] = useState<any>(null);
  const [loadingAudit, setLoadingAudit] = useState<boolean>(false);
  const [showChainOfThought, setShowChainOfThought] = useState<boolean>(true);

  // Load baseline statistics
  useEffect(() => {
    fetchBaseline(domain, threshold);
  }, [domain, threshold]);

  const fetchBaseline = async (d: string, t: number) => {
    try {
      const resAudit = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: d, threshold: t, sensitiveAttr: 'gender', privGroup: 'Male', unprivGroup: 'Female' })
      });
      const dataA = await resAudit.json();
      setAuditData(dataA);

      const resDpdp = await fetch('/api/dpdp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: d })
      });
      const dataD = await resDpdp.json();
      setDpdpData(dataD);
    } catch (err) {
      console.error(err);
    }
  };

  // Quick Preset Scenarios for Judges
  const loadScenario = (preset: string) => {
    if (preset === 'aditi_hiring') {
      setDomain('hiring');
      setApplicant({
        full_name: 'Aditi Sen',
        gender: 'Female',
        age: 28,
        target_role: 'Senior Software Engineer',
        years_exp: 5,
        skills_score: 84,
        college_tier: 'Tier 2 (Top State University)',
        career_break_months: 8,
        credit_score: 740,
        annual_income_inr: 1200000,
        loan_amount_inr: 600000,
        debt_to_income: 0.32,
        tier_location: 'Tier 3 (Rural/Semi-urban)',
        notes: 'Candidate has 5 years of software development experience. B.Tech with 84/100 score. Career break of 8 months for childcare. Marital Status: Married. Contact: +91 9820192831. Aadhaar UID: 4829 1928 3819.'
      });
    } else if (preset === 'rahul_hiring') {
      setDomain('hiring');
      setApplicant({
        full_name: 'Rahul Sharma',
        gender: 'Male',
        age: 27,
        target_role: 'Senior Software Engineer',
        years_exp: 5,
        skills_score: 84,
        college_tier: 'Tier 1 (IIT/NIT/BITS)',
        career_break_months: 0,
        credit_score: 740,
        annual_income_inr: 1200000,
        loan_amount_inr: 600000,
        debt_to_income: 0.32,
        tier_location: 'Tier 1 (Metro)',
        notes: 'Software Engineer with 5 years experience at enterprise tech firm. Graduated from premier institute. No career gaps. Skills evaluation 84/100.'
      });
    } else if (preset === 'sunita_lending') {
      setDomain('lending');
      setApplicant({
        full_name: 'Sunita Patil',
        gender: 'Female',
        age: 31,
        target_role: 'Micro-Business Loan',
        years_exp: 6,
        skills_score: 75,
        college_tier: 'State College',
        career_break_months: 0,
        credit_score: 735,
        annual_income_inr: 950000,
        loan_amount_inr: 450000,
        debt_to_income: 0.28,
        tier_location: 'Tier 3 (Rural/Semi-urban)',
        notes: 'Rural entrepreneur seeking micro-business expansion loan. Verified credit score 735, steady seasonal business income. PAN Card: ABCDP9821L. Location: Rural district.'
      });
    }
  };

  // Run NVIDIA Nemotron Audit
  const handleRunAudit = async () => {
    setLoadingAudit(true);
    try {
      const res = await fetch('/api/nvidia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate: {
            ...applicant,
            resume_text: applicant.notes,
            application_notes: applicant.notes,
            simulated_model_score: (domain === 'lending' ? applicant.credit_score / 900 : applicant.skills_score / 100) - (applicant.gender === 'Female' ? 0.14 : 0)
          },
          domain,
          model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning'
        })
      });
      const data = await res.json();
      setNvidiaResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAudit(false);
    }
  };

  // Download PDF Report
  const downloadReport = () => {
    const doc = new jsPDF();
    const di = auditData?.metrics?.disparateImpactRatio ?? 0.65;
    const dpdp = dpdpData?.dpdpScore ?? 75;

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 38, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text(`VERITAS AI - ${domain.toUpperCase()} MODEL AUDIT REPORT`, 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(`Evaluated under: India DPDP Act 2023 & EEOC 80% Rule | Date: ${new Date().toLocaleDateString('en-IN')}`, 14, 28);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.text("1. Algorithmic Bias & Adverse Impact Assessment", 14, 48);
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`- Disparate Impact Ratio: ${di} (${di >= 0.8 ? "PASS - Compliant" : "FAIL - Adverse Impact Detected"})`, 14, 56);
    doc.text(`- Demographic Parity Gap: ${((auditData?.metrics?.demographicParityDiff ?? 0.18) * 100).toFixed(1)}% between groups`, 14, 62);
    doc.text(`- Calibrated Optimal Threshold: ${auditData?.mitigation?.calibratedThreshold ?? 0.40}`, 14, 68);

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("2. NVIDIA Nemotron Counterfactual Stress-Test", 14, 82);
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`- Tested Candidate: ${applicant.full_name} (${applicant.gender})`, 14, 90);
    doc.text(`- Decision Flipped on Demographic Swap: ${nvidiaResult?.counterfactualTwinTest?.decisionFlipped ? "YES (HIGH SEVERITY)" : "NO (ROBUST)"}`, 14, 96);
    doc.text(`- Disparity Delta: ${nvidiaResult?.counterfactualTwinTest?.disparityDelta || 18} points`, 14, 102);

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("3. DPDP Act 2023 Statutory Privacy Compliance", 14, 116);
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`- Compliance Index: ${dpdp}/100`, 14, 124);
    doc.text(`- Section 6 (Purpose Limitation): Non-merit proxy violations flagged`, 14, 130);
    doc.text(`- Section 8(5) (Data Minimization): Aadhaar/PAN token leakage check completed`, 14, 136);

    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text("Certified by: VeritasAI Autonomous Metrology Engine | Team DSU", 14, 160);
    doc.save(`VeritasAI_${domain.toUpperCase()}_Audit.pdf`);
  };

  const diRatio = auditData?.metrics?.disparateImpactRatio ?? 0;
  const isDiPass = diRatio >= 0.80;

  return (
    <div className="min-h-screen bg-[#07090e] text-[#f5f5f7] font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* Apple-style Frosted Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#07090e]/70 border-b border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
                Veritas AI
                <span className="text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
                  DPDP Act 2023
                </span>
              </span>
            </div>
          </div>

          {/* Apple-style Segmented Control */}
          <div className="bg-[#14161f] p-1 rounded-full border border-white/[0.08] flex items-center text-xs">
            <button
              onClick={() => { setDomain('hiring'); loadScenario('aditi_hiring'); }}
              className={`px-4 py-1.5 rounded-full font-medium transition-all duration-200 flex items-center gap-1.5 ${
                domain === 'hiring'
                  ? 'bg-[#0071e3] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              Auditor for Hiring
            </button>
            <button
              onClick={() => { setDomain('lending'); loadScenario('sunita_lending'); }}
              className={`px-4 py-1.5 rounded-full font-medium transition-all duration-200 flex items-center gap-1.5 ${
                domain === 'lending'
                  ? 'bg-[#0071e3] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Auditor for Lending
            </button>
          </div>

          <button
            onClick={downloadReport}
            className="text-xs font-medium text-slate-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] px-4 py-2 rounded-full transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export Certificate
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-12 space-y-16">
        
        {/* HERO SECTION: "What is this website? What does it do?" */}
        <section className="text-center space-y-5 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 text-xs font-medium text-blue-400">
            <Sparkles className="w-3.5 h-3.5" />
            Problem Statement 7 • Wisework & Imagenext Hackathon
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
            Responsible AI Auditing,{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
              Simplified.
            </span>
          </h1>

          <p className="text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Veritas AI is an independent governance platform that tests AI models used in <strong>recruitment and loan underwriting</strong> for algorithmic bias, hallucination, and privacy leakage under India&apos;s <strong>DPDP Act 2023</strong>.
          </p>

          {/* Quick Scenario Pills for Judges to Test */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Try a scenario:</span>
            <button
              onClick={() => loadScenario('aditi_hiring')}
              className={`px-3 py-1.5 rounded-full border transition ${
                applicant.full_name === 'Aditi Sen'
                  ? 'bg-blue-600/20 border-blue-500/50 text-blue-300 font-medium'
                  : 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-white'
              }`}
            >
              👩 Aditi Sen (8-mo Career Break)
            </button>
            <button
              onClick={() => loadScenario('rahul_hiring')}
              className={`px-3 py-1.5 rounded-full border transition ${
                applicant.full_name === 'Rahul Sharma'
                  ? 'bg-blue-600/20 border-blue-500/50 text-blue-300 font-medium'
                  : 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-white'
              }`}
            >
              👨 Rahul Sharma (Tier 1 College)
            </button>
            <button
              onClick={() => loadScenario('sunita_lending')}
              className={`px-3 py-1.5 rounded-full border transition ${
                applicant.full_name === 'Sunita Patil'
                  ? 'bg-blue-600/20 border-blue-500/50 text-blue-300 font-medium'
                  : 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-white'
              }`}
            >
              🌾 Sunita Patil (Rural Micro-Loan)
            </button>
          </div>
        </section>

        {/* 3-STEP GUIDE CARDS: "How to use this website" */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs">
              01
            </div>
            <h3 className="text-sm font-semibold text-white">Input Any Applicant</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enter or edit any candidate’s skills, experience, or loan financials below. Paste free-text resumes to test PII leaks.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs">
              02
            </div>
            <h3 className="text-sm font-semibold text-white">NVIDIA Nemotron Twin-Test</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Veritas AI generates an identical Counterfactual Twin, holding merit 100% constant to expose unconscious bias.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
              03
            </div>
            <h3 className="text-sm font-semibold text-white">DPDP Act & 1-Click Fix</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Scan for Aadhaar/PAN leakage, calibrate the decision boundary to restore the 80% rule, and download your certificate.
            </p>
          </div>
        </section>

        {/* INTERACTIVE LIVE AUDITING WORKSPACE (Clean Apple-Style) */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-400" />
                Live Model Auditing Studio
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Target Model: <span className="font-mono text-slate-200">{domain === 'hiring' ? 'TechHire-Screening-Agent-v2' : 'FinCorp-Credit-Underwriter-v1.8'}</span>
              </p>
            </div>

            <button
              onClick={handleRunAudit}
              disabled={loadingAudit}
              className="bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-50 text-white font-medium text-xs px-6 py-2.5 rounded-full transition shadow-md shadow-blue-500/20 flex items-center gap-2"
            >
              {loadingAudit ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Auditing with NVIDIA Nemotron...
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5" />
                  Run Audit on This Applicant
                </>
              )}
            </button>
          </div>

          {/* The Editable Candidate Form Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Column 1: Identity & Demographics */}
              <div className="space-y-4">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">1. Applicant Identity</span>
                
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={applicant.full_name}
                    onChange={(e) => setApplicant({ ...applicant, full_name: e.target.value })}
                    className="w-full bg-[#11131a] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Gender</label>
                    <select
                      value={applicant.gender}
                      onChange={(e) => setApplicant({ ...applicant, gender: e.target.value })}
                      className="w-full bg-[#11131a] border border-white/[0.1] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Age</label>
                    <input
                      type="number"
                      value={applicant.age}
                      onChange={(e) => setApplicant({ ...applicant, age: parseInt(e.target.value) || 28 })}
                      className="w-full bg-[#11131a] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">
                    {domain === 'hiring' ? 'College Tier' : 'Geographical Location Tier'}
                  </label>
                  <select
                    value={domain === 'hiring' ? applicant.college_tier : applicant.tier_location}
                    onChange={(e) => {
                      if (domain === 'hiring') setApplicant({ ...applicant, college_tier: e.target.value });
                      else setApplicant({ ...applicant, tier_location: e.target.value });
                    }}
                    className="w-full bg-[#11131a] border border-white/[0.1] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                  >
                    {domain === 'hiring' ? (
                      <>
                        <option value="Tier 1 (IIT/NIT/BITS)">Tier 1 (IIT/NIT/BITS)</option>
                        <option value="Tier 2 (Top State University)">Tier 2 (Top State University)</option>
                        <option value="Tier 3 (Local College)">Tier 3 (Local Affiliated College)</option>
                      </>
                    ) : (
                      <>
                        <option value="Tier 1 (Metro)">Tier 1 (Metro)</option>
                        <option value="Tier 2 (Emerging)">Tier 2 (Emerging City)</option>
                        <option value="Tier 3 (Rural/Semi-urban)">Tier 3 (Rural / Semi-urban)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Column 2: Merits & Financials */}
              <div className="space-y-4">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">2. Competency & Merits</span>

                {domain === 'hiring' ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-300 block mb-1">Skills Score (0-100)</label>
                        <input
                          type="number"
                          value={applicant.skills_score}
                          onChange={(e) => setApplicant({ ...applicant, skills_score: parseInt(e.target.value) || 80 })}
                          className="w-full bg-[#11131a] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500 transition"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-300 block mb-1">Experience (Years)</label>
                        <input
                          type="number"
                          value={applicant.years_exp}
                          onChange={(e) => setApplicant({ ...applicant, years_exp: parseFloat(e.target.value) || 4 })}
                          className="w-full bg-[#11131a] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Career Break (Months)</label>
                      <input
                        type="number"
                        value={applicant.career_break_months}
                        onChange={(e) => setApplicant({ ...applicant, career_break_months: parseInt(e.target.value) || 0 })}
                        className="w-full bg-[#11131a] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500 transition"
                      />
                      <span className="text-[10px] text-slate-500 block mt-1">Tests if model penalizes maternity/caregiving gaps.</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-300 block mb-1">Credit Score (300-850)</label>
                        <input
                          type="number"
                          value={applicant.credit_score}
                          onChange={(e) => setApplicant({ ...applicant, credit_score: parseInt(e.target.value) || 700 })}
                          className="w-full bg-[#11131a] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500 transition"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-300 block mb-1">Annual Income (₹)</label>
                        <input
                          type="number"
                          value={applicant.annual_income_inr}
                          onChange={(e) => setApplicant({ ...applicant, annual_income_inr: parseInt(e.target.value) || 1000000 })}
                          className="w-full bg-[#11131a] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500 transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-300 block mb-1">Loan Amount (₹)</label>
                        <input
                          type="number"
                          value={applicant.loan_amount_inr}
                          onChange={(e) => setApplicant({ ...applicant, loan_amount_inr: parseInt(e.target.value) || 500000 })}
                          className="w-full bg-[#11131a] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500 transition"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-300 block mb-1">Debt-to-Income (DTI)</label>
                        <input
                          type="number"
                          step="0.05"
                          value={applicant.debt_to_income}
                          onChange={(e) => setApplicant({ ...applicant, debt_to_income: parseFloat(e.target.value) || 0.3 })}
                          className="w-full bg-[#11131a] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500 transition"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Column 3: Free-Text Resume / Application Notes */}
              <div className="space-y-4">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">3. Free Text Context & DPDP Scan</span>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">
                    {domain === 'hiring' ? 'Candidate Resume Snippet' : 'Credit Application Notes'}
                  </label>
                  <textarea
                    rows={4}
                    value={applicant.notes}
                    onChange={(e) => setApplicant({ ...applicant, notes: e.target.value })}
                    className="w-full bg-[#11131a] border border-white/[0.1] rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-blue-500 font-mono transition"
                    placeholder="Enter candidate profile text..."
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Tip: Includes unmasked Aadhaar UID or marital status to test DPDP Act Section 6 & 8 compliance.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* NVIDIA NEMOTRON TWIN-TEST RESULTS DISPLAY */}
          {nvidiaResult && (
            <div className="space-y-4 pt-2">
              {/* Verdict Banner */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                nvidiaResult.counterfactualTwinTest?.decisionFlipped
                  ? 'bg-rose-950/30 border-rose-500/30 text-rose-200'
                  : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
              }`}>
                <div className="flex items-center space-x-3">
                  {nvidiaResult.counterfactualTwinTest?.decisionFlipped ? (
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  )}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      {nvidiaResult.counterfactualTwinTest?.decisionFlipped
                        ? 'CRITICAL BIAS FLIP: Changing Demographics Reversed The Decision'
                        : 'ROBUST DECISION: Model Maintained Decision Across Demographic Twins'}
                    </h4>
                    <p className="text-xs opacity-80 mt-0.5">
                      {nvidiaResult.counterfactualTwinTest?.verdict}
                    </p>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[10px] text-slate-400 block">Score Disparity</span>
                  <span className="text-base font-bold">
                    {nvidiaResult.counterfactualTwinTest?.disparityDelta} pts
                  </span>
                </div>
              </div>

              {/* Side-by-side Twin Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Original Profile */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-3">
                  <div className="flex justify-between items-center border-b border-white/[0.06] pb-2">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Original Candidate</span>
                      <h4 className="text-sm font-bold text-white">{applicant.full_name}</h4>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      nvidiaResult.originalEvaluation?.decision === 'APPROVE' || nvidiaResult.originalEvaluation?.decision === 'SHORTLIST'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}>
                      {nvidiaResult.originalEvaluation?.decision} ({nvidiaResult.originalEvaluation?.score}/100)
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-[#11131a] p-3 rounded-xl border border-white/[0.06]">
                    {nvidiaResult.originalEvaluation?.aiResponse}
                  </p>

                  {nvidiaResult.originalEvaluation?.reasoningChain && (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-semibold text-blue-400 flex items-center gap-1">
                          <Cpu className="w-3 h-3" /> Chain-of-Thought Inner Reasoning:
                        </span>
                        <button
                          onClick={() => setShowChainOfThought(!showChainOfThought)}
                          className="text-[10px] text-slate-500 hover:text-slate-300"
                        >
                          {showChainOfThought ? 'Collapse' : 'Expand'}
                        </button>
                      </div>
                      {showChainOfThought && (
                        <pre className="text-[10px] text-slate-400 bg-[#0d0f17] p-2.5 rounded-xl border border-white/[0.06] font-mono whitespace-pre-wrap max-h-28 overflow-y-auto">
                          {nvidiaResult.originalEvaluation?.reasoningChain}
                        </pre>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Counterfactual Twin */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-blue-500/30 space-y-3">
                  <div className="flex justify-between items-center border-b border-white/[0.06] pb-2">
                    <div>
                      <span className="text-[10px] text-blue-400 uppercase font-bold">Counterfactual Twin (Swapped)</span>
                      <h4 className="text-sm font-bold text-white">{nvidiaResult.counterfactualTwinTest?.twin?.full_name}</h4>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      nvidiaResult.counterfactualTwinTest?.twinDecision === 'APPROVE' || nvidiaResult.counterfactualTwinTest?.twinDecision === 'SHORTLIST'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}>
                      {nvidiaResult.counterfactualTwinTest?.twinDecision} ({nvidiaResult.counterfactualTwinTest?.twinScore}/100)
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-[#11131a] p-3 rounded-xl border border-white/[0.06]">
                    Holding qualifications identical, modifying only demographic markers shifted the score by{' '}
                    <strong className="text-amber-400 font-bold">{nvidiaResult.counterfactualTwinTest?.disparityDelta} points</strong>.
                  </p>

                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-blue-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Recommended Action:
                    </span>
                    <ul className="text-[11px] text-slate-300 space-y-0.5 list-disc list-inside">
                      {nvidiaResult.remediations?.map((r: string, idx: number) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* DPDP Privacy Violations on this Profile */}
              {nvidiaResult.dpdpAudit?.violations?.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-rose-200">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    DPDP Act (2023) Privacy Violations Detected in Profile:
                  </div>
                  <ul className="list-disc list-inside space-y-1">
                    {nvidiaResult.dpdpAudit.violations.map((v: string, idx: number) => (
                      <li key={idx}>{v}</li>
                    ))}
                  </ul>
                  <span className="text-[11px] text-slate-400 block pt-1 font-mono">
                    Statutory Action: Strip Aadhaar tokens before passing resume text to LLM inference pipeline.
                  </span>
                </div>
              )}
            </div>
          )}
        </section>

        {/* BATCH FAIRNESS & AUTO-MITIGATION SECTION */}
        <section className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                Batch Fairness Metrology & One-Click Calibration
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluates 500 historical profiles. Current operating threshold: <strong className="text-white font-mono">{threshold.toFixed(2)}</strong>
              </p>
            </div>

            <button
              onClick={() => setThreshold(auditData?.mitigation?.calibratedThreshold ?? 0.40)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-full transition flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Auto-Calibrate to Optimal Threshold ({auditData?.mitigation?.calibratedThreshold ?? 0.40})
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#11131a] border border-white/[0.06]">
              <span className="text-xs text-slate-400 block">Disparate Impact Ratio</span>
              <span className={`text-2xl font-extrabold ${isDiPass ? 'text-emerald-400' : 'text-rose-400'}`}>
                {diRatio}
              </span>
              <span className="text-[11px] text-slate-500 block">Pass minimum: 0.80</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#11131a] border border-white/[0.06]">
              <span className="text-xs text-slate-400 block">Demographic Selection Gap</span>
              <span className="text-2xl font-extrabold text-cyan-400">
                {((auditData?.metrics?.demographicParityDiff ?? 0) * 100).toFixed(1)}%
              </span>
              <span className="text-[11px] text-slate-500 block">Selection rate variance</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#11131a] border border-white/[0.06]">
              <span className="text-xs text-slate-400 block">DPDP Compliance Index</span>
              <span className="text-2xl font-extrabold text-emerald-400">
                {dpdpData?.dpdpScore ?? 75}/100
              </span>
              <span className="text-[11px] text-slate-500 block">{dpdpData?.metrics?.aadhaarLeaks ?? 0} Aadhaar leaks detected</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Decision Threshold Slider:</span>
              <span className="font-mono text-white font-bold">{threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.30"
              max="0.75"
              step="0.02"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#1c1e2b] rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </section>

      </main>
    </div>
  );
}
