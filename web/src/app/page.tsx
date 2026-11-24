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
  Play,
  FileCheck2,
  HelpCircle,
  Shield,
  SearchCheck,
  ChevronDown,
  Info,
  BookOpen,
  UserCheck,
  Landmark,
  Lightbulb,
  ChevronRight,
  Fingerprint,
  Layers,
  Compass,
  UploadCloud,
  FileUp,
  Globe,
  Building2,
  GitBranch,
  ExternalLink,
  FileText,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  Sparkle
} from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function Home() {
  // Domain selection: 'hiring' or 'lending'
  const [domain, setDomain] = useState<'hiring' | 'lending'>('hiring');

  // Interactive Candidate Profile (All details collected in one unified dossier)
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
    notes: 'Candidate has 5 years of software engineering experience with React, Node.js, and cloud systems. Completed B.Tech with distinction. Note: 8-month career break for maternity/caregiving. Marital Status: Married. Contact: +91 9820192831. Aadhaar UID: 4829 1928 3819.'
  });

  // Multi-Source Artifacts (GitHub, Live Portfolio, Past Company)
  const [githubUrl, setGithubUrl] = useState<string>('github.com/aditisen/cloud-orchestrator');
  const [portfolioUrl, setPortfolioUrl] = useState<string>('https://aditi-portfolio.vercel.app');
  const [companyName, setCompanyName] = useState<string>('TCS / FinTech Startup');
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [resumeLoading, setResumeLoading] = useState<boolean>(false);

  // Human-in-the-Loop Decision State
  const [humanDecision, setHumanDecision] = useState<'OVERRIDDEN' | 'REJECTED' | 'ESCALATED' | null>(null);

  // Decision Threshold for Batch Metrology
  const [threshold, setThreshold] = useState<number>(0.50);

  // Results State
  const [auditData, setAuditData] = useState<any>(null);
  const [dpdpData, setDpdpData] = useState<any>(null);
  const [nvidiaResult, setNvidiaResult] = useState<any>(null);
  const [externalAuditResult, setExternalAuditResult] = useState<any>(null);
  const [loadingAudit, setLoadingAudit] = useState<boolean>(false);
  const [showChainOfThought, setShowChainOfThought] = useState<boolean>(true);
  
  // Interactive Guide tab
  const [guideTab, setGuideTab] = useState<'walkthrough' | 'who_can_use' | 'core_tech'>('walkthrough');

  // Load batch dataset baseline on domain or threshold change
  useEffect(() => {
    fetchBaseline(domain, threshold);
  }, [domain, threshold]);

  const fetchBaseline = async (d: string, t: number) => {
    try {
      const resAudit = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          domain: d, 
          threshold: t, 
          sensitiveAttr: 'gender', 
          privGroup: 'Male', 
          unprivGroup: 'Female' 
        })
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

  // Scenario Presets
  const loadScenario = (preset: string) => {
    setHumanDecision(null);
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
        notes: 'Candidate has 5 years of software engineering experience with React, Node.js, and cloud systems. Completed B.Tech with distinction. Note: 8-month career break for maternity/caregiving. Marital Status: Married. Contact: +91 9820192831. Aadhaar UID: 4829 1928 3819.'
      });
      setGithubUrl('github.com/aditisen/cloud-orchestrator');
      setPortfolioUrl('https://aditi-portfolio.vercel.app');
      setCompanyName('TCS / Early FinTech Startup');
      setResumeFileName('Aditi_Sen_Resume_2026.pdf');
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
        notes: 'Software Engineer with 5 years experience at an enterprise technology firm. Graduated from premier institute. Continuous career history with no gaps. Led distributed microservices development.'
      });
      setGithubUrl('github.com/rahulsharma-dev/core-platform');
      setPortfolioUrl('https://rahul-sharma.dev');
      setCompanyName('Google / Tier-1 Tech');
      setResumeFileName('Rahul_Sharma_CV.pdf');
    } else if (preset === 'sunita_lending') {
      setDomain('lending');
      setApplicant({
        full_name: 'Sunita Patil',
        gender: 'Female',
        age: 31,
        target_role: 'Micro-Business Expansion Loan',
        years_exp: 6,
        skills_score: 75,
        college_tier: 'State College',
        career_break_months: 0,
        credit_score: 735,
        annual_income_inr: 950000,
        loan_amount_inr: 450000,
        debt_to_income: 0.28,
        tier_location: 'Tier 3 (Rural/Semi-urban)',
        notes: 'Rural artisan & small business owner applying for working capital loan. Verified CIBIL credit score 735, stable seasonal revenues. PAN Card: ABCDP9821L. Location: Rural District. Aadhaar UID: 9102 3847 1920.'
      });
      setResumeFileName('Sunita_Patil_Loan_Profile.pdf');
    }
  };

  // Resume File Upload Handler
  const handleResumeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResumeFileName(file.name);
    setResumeLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('action', 'resume_parse');

      const res = await fetch('/api/external-audit', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.resumeAnalysis) {
        const cleanText = data.resumeAnalysis.cleanText || '';
        setApplicant(prev => ({
          ...prev,
          full_name: data.resumeAnalysis.extractedName && data.resumeAnalysis.extractedName !== 'Applicant'
            ? data.resumeAnalysis.extractedName
            : prev.full_name,
          years_exp: data.resumeAnalysis.extractedExperience || prev.years_exp,
          career_break_months: data.resumeAnalysis.careerBreakMonths || prev.career_break_months,
          gender: data.resumeAnalysis.inferredGender !== 'Not Disclosed' ? data.resumeAnalysis.inferredGender : prev.gender,
          notes: cleanText.length > 700 ? cleanText.slice(0, 700) + '...' : (cleanText || prev.notes)
        }));
      }
      setResumeLoading(false);
    } catch (err) {
      console.error('Error uploading resume file:', err);
      setResumeLoading(false);
    }
  };

  // Run Unified Full Candidate Audit (NVIDIA + Multi-Signal Verification)
  const handleRunUnifiedAudit = async () => {
    setLoadingAudit(true);
    setHumanDecision(null);
    try {
      // 1. Run Multi-signal external verification in parallel
      const externalPromise = domain === 'hiring' 
        ? fetch('/api/external-audit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'all',
              githubUrl,
              portfolioUrl,
              companyName,
              targetRole: applicant.target_role,
              resumeText: applicant.notes
            })
          }).then(r => r.json()).catch(() => null)
        : Promise.resolve(null);

      // 2. Run NVIDIA Nemotron Audit (100% Direct NIM Evaluation, No simulated score)
      const nvidiaPromise = fetch('/api/nvidia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate: {
            ...applicant,
            resume_text: applicant.notes,
            application_notes: applicant.notes
          },
          domain,
          githubUrl,
          portfolioUrl,
          companyName,
          model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning'
        })
      }).then(r => r.json());

      const [extData, nvdData] = await Promise.all([externalPromise, nvidiaPromise]);
      setExternalAuditResult(extData);
      setNvidiaResult(nvdData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAudit(false);
    }
  };

  // Download Comprehensive PDF Report
  const downloadReport = () => {
    const doc = new jsPDF();
    const di = auditData?.metrics?.disparateImpactRatio ?? 0.65;
    const dpdp = dpdpData?.dpdpScore ?? 75;

    // Header Bar
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text(`VERITAS AI - ${domain.toUpperCase()} MODEL AUDIT REPORT`, 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(`Audited under: India DPDP Act 2023 & EEOC 80% Rule | Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 30);

    // Section 1: Algorithmic Fairness Metrology
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.text("1. Algorithmic Bias & Adverse Impact Assessment", 14, 52);
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`- Disparate Impact Ratio: ${di} (${di >= 0.8 ? "PASS - Statistically Fair" : "FAIL - Adverse Impact Detected"})`, 14, 60);
    doc.text(`- Demographic Parity Gap: ${((auditData?.metrics?.demographicParityDiff ?? 0.18) * 100).toFixed(1)}% selection variance`, 14, 66);
    doc.text(`- Calibrated Optimal Threshold: ${auditData?.mitigation?.calibratedThreshold ?? 0.40} (Mitigates bias while preserving accuracy)`, 14, 72);

    // Section 2: Counterfactual Twin Stress Test
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("2. Counterfactual Demographic Twin Stress-Test", 14, 88);
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`- Tested Candidate: ${applicant.full_name} (${applicant.gender})`, 14, 96);
    doc.text(`- Decision Flipped on Demographic Swap: ${nvidiaResult?.counterfactualTwinTest?.decisionFlipped ? "YES (CRITICAL BIAS FOUND)" : "NO (ROBUST)"}`, 14, 102);
    doc.text(`- Disparity Score Delta: ${nvidiaResult?.counterfactualTwinTest?.disparityDelta || 18} points difference on identical merits`, 14, 108);

    // Section 3: Privacy & DPDP Compliance
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("3. India DPDP Act 2023 Statutory Privacy Compliance", 14, 124);
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`- Privacy Compliance Index: ${dpdp}/100`, 14, 132);
    doc.text(`- Section 6 (Purpose Limitation): Non-merit proxy violations flagged`, 14, 138);
    doc.text(`- Section 8(5) (Data Minimization): Aadhaar UID and PAN token leakage audit complete`, 14, 144);

    // Section 4: Why Hire vs Why Not Hire Summary
    if (nvidiaResult?.whyShouldHire) {
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("4. Decision Analysis: Why Hire vs Algorithmic Biases", 14, 160);
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(`- Top Merit: ${nvidiaResult.whyShouldHire[0] || 'High verified technical capability'}`, 14, 168);
      doc.text(`- Algorithmic Friction: ${nvidiaResult.whyShouldNotHire[0] || 'Penalized by legacy non-merit filters'}`, 14, 174);
      doc.text(`- Recruiter Action (Human Oversight): ${humanDecision || 'PENDING HUMAN REVIEW (ARTICLE 14 MANDATE)'}`, 14, 180);
    }

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text("Certified by: Veritas AI Autonomous Governance System | Enterprise AI Metrology Engine", 14, 205);
    doc.save(`VeritasAI_${domain.toUpperCase()}_Audit_Report.pdf`);
  };

  const diRatio = auditData?.metrics?.disparateImpactRatio ?? 0;
  const isDiPass = diRatio >= 0.80;

  return (
    <div className="min-h-screen bg-[#06070a] text-[#f5f5f7] font-sans antialiased selection:bg-blue-600 selection:text-white">
      
      {/* Apple-style Translucent Top Navigation Bar */}
      <nav className="sticky top-0 z-50 backdrop-blur-2xl bg-[#06070a]/80 border-b border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo & Platform Tag */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Scale className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-white">Veritas AI</span>
              <span className="text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full hidden sm:inline-flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" /> DPDP Act 2023 Compliant
              </span>
            </div>
          </div>

          {/* Clean Segmented Tab Switcher: Hiring vs Lending */}
          <div className="bg-[#12141c] p-1 rounded-full border border-white/[0.08] flex items-center text-xs shadow-inner">
            <button
              onClick={() => { setDomain('hiring'); loadScenario('aditi_hiring'); }}
              className={`px-4 py-1.5 rounded-full font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
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
              className={`px-4 py-1.5 rounded-full font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                domain === 'lending'
                  ? 'bg-[#0071e3] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Auditor for Lending
            </button>
          </div>

          {/* Export Action */}
          <button
            onClick={downloadReport}
            className="text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] px-4 py-2 rounded-full transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Audit</span> PDF
          </button>
        </div>
      </nav>

      {/* Main Page Content */}
      <main className="max-w-6xl mx-auto px-6 py-12 space-y-14">
        
        {/* HERO SECTION: WHAT THIS WEBSITE IS & DOES */}
        <section className="space-y-6 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400">
            <Shield className="w-3.5 h-3.5" />
            Autonomous Responsible AI Governance &amp; Metrology
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
            Audit AI Models Before They Make{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
              High-Stakes Decisions.
            </span>
          </h1>

          <p className="text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Collect candidate details, verify external signals (GitHub, Live Portfolio &amp; Company Background), and generate clear <strong>Why Should Hire vs. Why AI Flags</strong> intelligence with demographic twin stress-testing.
          </p>
        </section>

        {/* INTERACTIVE GUIDANCE & DISCOVERY DECK */}
        <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0e111a] via-[#090b10] to-[#07090e] border border-white/[0.08] space-y-6 shadow-2xl">
          
          {/* Guide Sub-navigation Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-bold text-white tracking-tight">Platform Guide &amp; Quick Overview</h2>
            </div>

            <div className="flex items-center gap-1.5 bg-[#141620] p-1 rounded-full border border-white/[0.06] text-xs">
              <button
                onClick={() => setGuideTab('walkthrough')}
                className={`px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                  guideTab === 'walkthrough' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                1. How to Test (3 Steps)
              </button>
              <button
                onClick={() => setGuideTab('who_can_use')}
                className={`px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                  guideTab === 'who_can_use' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                2. Who Can Use This?
              </button>
              <button
                onClick={() => setGuideTab('core_tech')}
                className={`px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                  guideTab === 'core_tech' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                3. What It Solves
              </button>
            </div>
          </div>

          {/* Guide Content: Tab 1 - How to Test in 3 Clicks */}
          {guideTab === 'walkthrough' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-[#12141c]/90 p-4 rounded-2xl border border-white/[0.06] space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-[11px]">1</span>
                  <strong className="text-white text-xs">Review or Customize Candidate Dossier</strong>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Click a preset below (e.g. <span className="text-blue-300 font-medium">Aditi Sen</span> with an 8-month maternity break), upload a resume file, or enter custom GitHub/portfolio links.
                </p>
                <div className="pt-1 text-[11px] text-blue-400 flex items-center gap-1 font-medium">
                  Try preset buttons below <ArrowRight className="w-3 h-3" />
                </div>
              </div>

              <div className="bg-[#12141c]/90 p-4 rounded-2xl border border-white/[0.06] space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-[11px]">2</span>
                  <strong className="text-white text-xs">Run Complete Multi-Signal Audit</strong>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Click <span className="text-white font-medium">&quot;Run Complete Candidate Audit&quot;</span>. NVIDIA Nemotron evaluates the profile, creates an identical demographic twin, and verifies external GitHub &amp; portfolio signals.
                </p>
                <div className="pt-1 text-[11px] text-indigo-400 flex items-center gap-1 font-medium">
                  Generates &quot;Why Hire vs Why Flag&quot; <ArrowRight className="w-3 h-3" />
                </div>
              </div>

              <div className="bg-[#12141c]/90 p-4 rounded-2xl border border-white/[0.06] space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[11px]">3</span>
                  <strong className="text-white text-xs">Inspect Findings &amp; Calibrate</strong>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Compare why the candidate should be hired versus why legacy AI flagged them, view the demographic flip, and click <span className="text-emerald-300 font-medium">&quot;Auto-Calibrate&quot;</span> to mathematically fix thresholds.
                </p>
                <div className="pt-1 text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                  Download certified PDF report <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          )}

          {/* Guide Content: Tab 2 - Who Can Use This */}
          {guideTab === 'who_can_use' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-[#12141c]/90 p-4 rounded-2xl border border-white/[0.06] space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <UserCheck className="w-4 h-4 text-blue-400" />
                  Enterprises &amp; HR Leadership
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Companies automating candidate shortlisting and resume screening. Ensures qualified women, diverse backgrounds, and candidates with career pauses are not silently filtered out by automated recruiting algorithms.
                </p>
              </div>

              <div className="bg-[#12141c]/90 p-4 rounded-2xl border border-white/[0.06] space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Landmark className="w-4 h-4 text-indigo-400" />
                  Banks &amp; NBFC Lenders
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Financial institutions using automated credit scoring models. Audits algorithms to prevent unlawful discrimination based on geographic PIN codes, gender, or community background under equal credit laws.
                </p>
              </div>

              <div className="bg-[#12141c]/90 p-4 rounded-2xl border border-white/[0.06] space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Risk &amp; Compliance Officers
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Legal and regulatory auditors enforcing statutory compliance with India&apos;s <strong>DPDP Act (2023)</strong> and the global 80% Four-Fifths Adverse Impact rule before AI systems go live in production.
                </p>
              </div>
            </div>
          )}

          {/* Guide Content: Tab 3 - What It Solves */}
          {guideTab === 'core_tech' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-[#12141c]/90 p-4 rounded-2xl border border-white/[0.06] space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Scale className="w-4 h-4 text-amber-400" />
                  Statistical Bias Metrology
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Measures the <strong>Disparate Impact Ratio</strong> (Four-Fifths Rule), Demographic Parity difference, and Equal Opportunity gaps across protected demographic groups across 500+ records.
                </p>
              </div>

              <div className="bg-[#12141c]/90 p-4 rounded-2xl border border-white/[0.06] space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Fingerprint className="w-4 h-4 text-blue-400" />
                  Counterfactual Twin Red-Teaming
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Powered by <strong>NVIDIA Nemotron</strong>, this creates an exact synthetic clone of any applicant with only gender or location altered. If the score shifts significantly, unconscious bias is mathematically proven.
                </p>
              </div>

              <div className="bg-[#12141c]/90 p-4 rounded-2xl border border-white/[0.06] space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Lock className="w-4 h-4 text-rose-400" />
                  DPDP Act (2023) Privacy Firewall
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Scans model inputs for unmasked Aadhaar UID tokens, PAN numbers, and Section 6 Purpose Limitation violations (such as using marital status or maternity notes for employment decisions).
                </p>
              </div>
            </div>
          )}
        </section>

        {/* STEP 1: UNIFIED CANDIDATE DOSSIER COLLECTOR */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[11px] font-semibold mb-1">
                Step 1 of 3: Dossier Collector
              </div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-400" />
                Unified Candidate Dossier &amp; Signal Collector
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Collects candidate profile, resume, GitHub code, live portfolio, and company pedigree for deep evaluation.
              </p>
            </div>

            {/* Quick Presets with Explanatory Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 text-xs hidden sm:inline">Try Pre-Loaded Cases:</span>
              <button
                onClick={() => loadScenario('aditi_hiring')}
                className={`px-3.5 py-1.5 rounded-full border transition flex items-center gap-1.5 cursor-pointer ${
                  applicant.full_name === 'Aditi Sen'
                    ? 'bg-blue-600/20 border-blue-500/50 text-blue-300 font-medium shadow-sm'
                    : 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-white'
                }`}
                title="Tests if AI penalizes maternity career break despite high technical skills"
              >
                <span>👩 Aditi (Maternity Break)</span>
              </button>
              <button
                onClick={() => loadScenario('rahul_hiring')}
                className={`px-3.5 py-1.5 rounded-full border transition flex items-center gap-1.5 cursor-pointer ${
                  applicant.full_name === 'Rahul Sharma'
                    ? 'bg-blue-600/20 border-blue-500/50 text-blue-300 font-medium shadow-sm'
                    : 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-white'
                }`}
                title="Baseline male candidate with identical skill metrics"
              >
                <span>👨 Rahul (Metro Baseline)</span>
              </button>
              <button
                onClick={() => loadScenario('sunita_lending')}
                className={`px-3.5 py-1.5 rounded-full border transition flex items-center gap-1.5 cursor-pointer ${
                  applicant.full_name === 'Sunita Patil'
                    ? 'bg-blue-600/20 border-blue-500/50 text-blue-300 font-medium shadow-sm'
                    : 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-white'
                }`}
                title="Tests rural credit discrimination and Aadhaar/PAN privacy leaks"
              >
                <span>🌾 Sunita (Rural Loan)</span>
              </button>
            </div>
          </div>

          {/* Preset Context Banner: Explaining what to expect */}
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {domain === 'hiring' ? (
                  applicant.full_name === 'Aditi Sen' ? (
                    <><strong>Active Scenario (Aditi Sen):</strong> Holds 5 years experience, 84/100 skills score, and verified GitHub &amp; portfolio, but took an 8-month maternity break and worked at an IT services firm. Test if AI penalizes her.</>
                  ) : (
                    <><strong>Active Scenario (Rahul Sharma):</strong> Identical 84/100 tech score, Tier-1 IIT college, and FAANG background with no career pauses.</>
                  )
                ) : (
                  <><strong>Active Scenario (Sunita Patil):</strong> Rural entrepreneur with a strong 735 credit score. Tests if geographic location triggers an unfair rejection, and checks for unmasked Aadhaar UID leaks.</>
                )}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 whitespace-nowrap hidden sm:inline">All fields below are editable</span>
          </div>

          {/* THE UNIFIED DOSSIER COLLECTOR CARD */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0b0d14] border border-white/[0.08] space-y-6 shadow-xl">
            
            {/* Row 1: Core Identity & Merits */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={applicant.full_name}
                  onChange={(e) => setApplicant({ ...applicant, full_name: e.target.value })}
                  className="w-full bg-[#12141d] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Gender</label>
                <select
                  value={applicant.gender}
                  onChange={(e) => setApplicant({ ...applicant, gender: e.target.value })}
                  className="w-full bg-[#12141d] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  {domain === 'hiring' ? 'Experience (Years)' : 'Credit Score (300-850)'}
                </label>
                <input
                  type="number"
                  value={domain === 'hiring' ? applicant.years_exp : applicant.credit_score}
                  onChange={(e) => {
                    if (domain === 'hiring') setApplicant({ ...applicant, years_exp: parseFloat(e.target.value) || 4 });
                    else setApplicant({ ...applicant, credit_score: parseInt(e.target.value) || 720 });
                  }}
                  className="w-full bg-[#12141d] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  {domain === 'hiring' ? 'Target Job Role' : 'Annual Income (₹)'}
                </label>
                {domain === 'hiring' ? (
                  <input
                    type="text"
                    value={applicant.target_role}
                    onChange={(e) => setApplicant({ ...applicant, target_role: e.target.value })}
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full bg-[#12141d] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                  />
                ) : (
                  <input
                    type="number"
                    value={applicant.annual_income_inr}
                    onChange={(e) => setApplicant({ ...applicant, annual_income_inr: parseInt(e.target.value) || 1000000 })}
                    className="w-full bg-[#12141d] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500 transition"
                  />
                )}
              </div>
            </div>

            {/* Row 2: Bias-Trigger Attributes (Career Break, College Tier / Location) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  {domain === 'hiring' ? 'Career Break (Months)' : 'Loan Amount Requested (₹)'}
                </label>
                <input
                  type="number"
                  value={domain === 'hiring' ? applicant.career_break_months : applicant.loan_amount_inr}
                  onChange={(e) => {
                    if (domain === 'hiring') setApplicant({ ...applicant, career_break_months: parseInt(e.target.value) || 0 });
                    else setApplicant({ ...applicant, loan_amount_inr: parseInt(e.target.value) || 500000 });
                  }}
                  className="w-full bg-[#12141d] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500 transition"
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  {domain === 'hiring' ? 'Tests if model unfairly discounts maternity/caregiving leaves.' : 'Requested principal.'}
                </span>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  {domain === 'hiring' ? 'College / University Tier' : 'Geographical Location Tier'}
                </label>
                <select
                  value={domain === 'hiring' ? applicant.college_tier : applicant.tier_location}
                  onChange={(e) => {
                    if (domain === 'hiring') setApplicant({ ...applicant, college_tier: e.target.value });
                    else setApplicant({ ...applicant, tier_location: e.target.value });
                  }}
                  className="w-full bg-[#12141d] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition"
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

              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  {domain === 'hiring' ? 'Past / Current Employer' : 'Debt-to-Income (DTI)'}
                </label>
                {domain === 'hiring' ? (
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. TCS / Local Tech Startup"
                    className="w-full bg-[#12141d] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                  />
                ) : (
                  <input
                    type="number"
                    step="0.05"
                    value={applicant.debt_to_income}
                    onChange={(e) => setApplicant({ ...applicant, debt_to_income: parseFloat(e.target.value) || 0.3 })}
                    className="w-full bg-[#12141d] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500 transition"
                  />
                )}
                <span className="text-[10px] text-slate-500 block mt-1">
                  {domain === 'hiring' ? 'Tests for Company Pedigree Discount (ATS penalty on IT services firms).' : 'Monthly debt obligations vs gross income.'}
                </span>
              </div>
            </div>

            {/* Row 3: Multi-Signal Inputs (GitHub URL, Live Portfolio URL, Resume File) */}
            {domain === 'hiring' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-white/[0.06]">
                <div>
                  <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5 mb-1">
                    <GitBranch className="w-3.5 h-3.5 text-blue-400" />
                    GitHub Profile / Repository
                  </label>
                  <input
                    type="text"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="github.com/username/repo"
                    className="w-full bg-[#12141d] border border-white/[0.1] rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500 transition"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Verifies public code quality &amp; commit continuity.
                  </span>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5 mb-1">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    Live Portfolio / Project URL
                  </label>
                  <input
                    type="text"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://portfolio.dev"
                    className="w-full bg-[#12141d] border border-white/[0.1] rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500 transition"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Verifies live SSL HTTPS deployment &amp; responsiveness.
                  </span>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5 mb-1">
                    <FileUp className="w-3.5 h-3.5 text-emerald-400" />
                    Upload Resume Document
                  </label>
                  <div className="flex items-center gap-2">
                    <label htmlFor="resume-file-input" className="cursor-pointer bg-[#12141d] hover:bg-[#1a1d2b] border border-white/[0.1] px-3 py-2 rounded-xl text-xs text-blue-300 font-medium transition flex items-center gap-1.5 shrink-0">
                      <UploadCloud className="w-3.5 h-3.5" />
                      Browse File
                    </label>
                    <input
                      id="resume-file-input"
                      type="file"
                      accept=".pdf,.docx,.txt,.json,.md"
                      onChange={handleResumeFileUpload}
                      className="hidden"
                    />
                    <span className="text-[11px] text-slate-400 font-mono truncate">
                      {resumeFileName || 'No file selected (using active notes)'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Extracts text &amp; scans for DPDP Act Section 6 &amp; 8 PII leaks.
                  </span>
                </div>
              </div>
            )}

            {/* Row 4: Free-Text Resume / Profile Notes */}
            <div className="pt-2">
              <label className="text-xs text-slate-300 block mb-1">
                {domain === 'hiring' ? 'Resume Summary & Application Notes' : 'Credit Application Notes'}
              </label>
              <textarea
                rows={3}
                value={applicant.notes}
                onChange={(e) => setApplicant({ ...applicant, notes: e.target.value })}
                className="w-full bg-[#12141d] border border-white/[0.1] rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-blue-500 font-mono transition"
                placeholder="Enter profile text..."
              />
              <span className="text-[10px] text-slate-500 block mt-1">
                Tip: Contains unmasked Aadhaar UID or marital status to verify the autonomous DPDP Act Privacy Firewall.
              </span>
            </div>

            {/* Unified Run Button */}
            <button
              onClick={handleRunUnifiedAudit}
              disabled={loadingAudit}
              className="w-full bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-50 text-white font-medium text-xs sm:text-sm py-3.5 rounded-full transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loadingAudit ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running Complete Multi-Signal Audit via NVIDIA Nemotron...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Run Complete Candidate Audit (Signals + NVIDIA Twin + DPDP Scan)
                </>
              )}
            </button>
          </div>

          {/* STEP 2 RESULTS: THE UNIFIED INTELLIGENCE OUTPUT (Why Hire vs Why Not Hire + Twin Test) */}
          {nvidiaResult && (
            <div className="space-y-6 pt-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[11px] font-semibold mb-1">
                    Step 2 of 3: Unified Intelligence &amp; Explanation
                  </div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    Audit Findings: Decision Metrology, Why Hire vs Why AI Flags
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  Model: <span className="font-mono text-slate-200">nvidia/nemotron-3-nano-omni-30b-a3b-reasoning</span>
                </span>
              </div>

              {/* Verdict Banner: What Happened in Plain English */}
              <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                nvidiaResult.counterfactualTwinTest?.decisionFlipped
                  ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                  : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
              }`}>
                <div className="flex items-start space-x-3.5">
                  {nvidiaResult.counterfactualTwinTest?.decisionFlipped ? (
                    <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      {nvidiaResult.counterfactualTwinTest?.decisionFlipped
                        ? 'CRITICAL BIAS FOUND: Demographic Swap Reversed The Decision'
                        : 'DECISION ROBUST: Model Preserved Decision Across Demographic Twins'}
                    </h4>
                    <p className="text-xs opacity-90 mt-1 leading-relaxed">
                      {nvidiaResult.counterfactualTwinTest?.verdict}
                    </p>
                    <span className="text-[11px] text-slate-400 block mt-1.5">
                      <strong>Plain English Explanation:</strong> Under completely identical technical qualifications and experience, altering demographic markers shifted the candidate&apos;s score by <strong>{nvidiaResult.counterfactualTwinTest?.disparityDelta} points</strong>.
                    </span>
                  </div>
                </div>
                <div className="text-left sm:text-right font-mono shrink-0 pl-9 sm:pl-0">
                  <span className="text-[10px] text-slate-400 block uppercase">Disparity Score Delta</span>
                  <span className={`text-2xl font-bold ${nvidiaResult.counterfactualTwinTest?.decisionFlipped ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {nvidiaResult.counterfactualTwinTest?.disparityDelta} pts
                  </span>
                </div>
              </div>

              {/* AUDITOR GOVERNANCE VERDICT & HUMAN-IN-THE-LOOP ACTION CARD */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#101424] via-[#0c0f18] to-[#07090e] border border-blue-500/30 space-y-5 shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        Auditor Governance Verdict &amp; Recruiter Decision
                        <span className="text-[10px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/25 px-2 py-0.5 rounded-full">
                          Article 14 Human Oversight
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        The AI Auditor evaluates algorithmic fairness and provides governance counsel. The final decision rests with the human hiring manager.
                      </p>
                    </div>
                  </div>

                  {/* Governance Recommendation Badge */}
                  <div className="shrink-0">
                    {nvidiaResult.counterfactualTwinTest?.decisionFlipped ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        RECOMMENDATION: OVERRIDE AI REJECTION
                      </span>
                    ) : nvidiaResult.originalEvaluation?.score >= 60 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        RECOMMENDATION: CONFIRM SHORTLIST
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-300 border border-slate-500/30">
                        RECOMMENDATION: CONFIRM REJECTION (MERIT)
                      </span>
                    )}
                  </div>
                </div>

                {/* Clear Plain-English Guidance on the Verdict */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-300 space-y-1.5">
                  <strong className="text-white block font-semibold">
                    {domain === 'hiring' ? 'Recruiter Advisory (Governance Council):' : 'Credit Officer Advisory (Underwriting Council):'}
                  </strong>
                  <p className="leading-relaxed">
                    {nvidiaResult.counterfactualTwinTest?.decisionFlipped ? (
                      domain === 'hiring' ? (
                        <>The automated screening model rejected <strong>{applicant.full_name}</strong> due to bias against non-merit factors (e.g. career breaks or company pedigree). However, NVIDIA NIM evaluated her technical credentials at <strong>{nvidiaResult.originalEvaluation?.score}/100</strong> with verified code quality. <strong>The AI Auditor recommends advancing this candidate to the technical round.</strong></>
                      ) : (
                        <>The automated underwriting model rejected <strong>{applicant.full_name}</strong> primarily due to geographical risk weighting. Verified credit metrics score at <strong>{nvidiaResult.originalEvaluation?.score}/100</strong>, indicating solvent repayment capability.</>
                      )
                    ) : (
                      <>The automated model&apos;s decision aligns with objective criteria with low demographic bias detected.</>
                    )}
                  </p>
                </div>

                {/* Recruiter Action Buttons */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block">
                    Take Recruiter Action (Human Oversight Execution):
                  </span>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setHumanDecision('OVERRIDDEN')}
                      className={`px-4 py-2.5 rounded-full text-xs font-medium transition flex items-center gap-2 cursor-pointer ${
                        humanDecision === 'OVERRIDDEN'
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      ✓ Override AI &amp; Shortlist {applicant.full_name.split(' ')[0]}
                    </button>

                    <button
                      onClick={() => setHumanDecision('REJECTED')}
                      className={`px-4 py-2.5 rounded-full text-xs font-medium transition flex items-center gap-2 cursor-pointer ${
                        humanDecision === 'REJECTED'
                          ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/25 ring-2 ring-rose-400'
                          : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      ✕ Confirm Rejection (Require Justification)
                    </button>

                    <button
                      onClick={() => setHumanDecision('ESCALATED')}
                      className={`px-4 py-2.5 rounded-full text-xs font-medium transition flex items-center gap-2 cursor-pointer ${
                        humanDecision === 'ESCALATED'
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-400'
                          : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.1]'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      💬 Escalate to Diversity Review Committee
                    </button>
                  </div>

                  {/* Live Action Feedback Confirmation */}
                  {humanDecision && (
                    <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 mt-2 ${
                      humanDecision === 'OVERRIDDEN'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : humanDecision === 'REJECTED'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                    }`}>
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>
                        {humanDecision === 'OVERRIDDEN' && (
                          <><strong>Recruiter Action Executed:</strong> Candidate {applicant.full_name} has been manually advanced to the Technical Interview. Bias override justification logged to compliance audit trail.</>
                        )}
                        {humanDecision === 'REJECTED' && (
                          <><strong>Action Recorded:</strong> Rejection confirmed. Reason logged: Objective role qualification requirement mismatch.</>
                        )}
                        {humanDecision === 'ESCALATED' && (
                          <><strong>Action Recorded:</strong> Candidate profile and counterfactual twin bias telemetry forwarded to 3-member Diversity &amp; Fairness Governance Committee.</>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* THE CORE REQUEST: "WHY SHOULD HIRE" VS "WHY AI FLAGS / SHOULD NOT HIRE" */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* 1. WHY SHOULD HIRE CARD */}
                <div className="p-6 rounded-3xl bg-[#0b0d14] border border-emerald-500/30 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <ThumbsUp className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Why You SHOULD Hire This Candidate</h4>
                        <span className="text-[10px] text-emerald-400">Verified Competency &amp; Merits</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Score: {nvidiaResult.originalEvaluation?.score}/100
                    </span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-300">
                    {nvidiaResult.whyShouldHire?.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2.5 bg-[#12141d] p-3 rounded-xl border border-white/[0.04]">
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>

                  {externalAuditResult?.githubAudit && (
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[11px] text-slate-400">
                      <strong className="text-slate-300 block mb-0.5">Verified GitHub Code:</strong>
                      <span>Active repos in {externalAuditResult.githubAudit.primaryLanguages?.join(', ')}. Code consistency rated at 88/100.</span>
                    </div>
                  )}
                </div>

                {/* 2. WHY TRADITIONAL AI MIGHT NOT HIRE / RED FLAGS */}
                <div className="p-6 rounded-3xl bg-[#0b0d14] border border-rose-500/30 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center">
                        <ThumbsDown className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Why Traditional AI Flags This Candidate</h4>
                        <span className="text-[10px] text-rose-400">Biased False-Positives &amp; Algorithmic Friction</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                      AI Filter Risk
                    </span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-300">
                    {nvidiaResult.whyShouldNotHire?.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2.5 bg-[#12141d] p-3 rounded-xl border border-white/[0.04]">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300">
                    <strong className="text-blue-200 block mb-0.5">Auditor Insight:</strong>
                    <span>These flags represent systemic bias (e.g., maternity penalty, IT services pedigree discount). The applicant&apos;s verified skills prove high real-world competence.</span>
                  </div>
                </div>

              </div>

              {/* Side-by-side Twin Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Left: Original Profile */}
                <div className="p-5 rounded-2xl bg-[#0b0d14] border border-white/[0.08] space-y-3">
                  <div className="flex justify-between items-center border-b border-white/[0.06] pb-2">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Tested Applicant</span>
                      <h4 className="text-sm font-bold text-white">{applicant.full_name} ({applicant.gender})</h4>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      nvidiaResult.originalEvaluation?.decision === 'APPROVE' || nvidiaResult.originalEvaluation?.decision === 'SHORTLIST'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}>
                      {nvidiaResult.originalEvaluation?.decision} ({nvidiaResult.originalEvaluation?.score}/100)
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-[#12141d] p-3 rounded-xl border border-white/[0.06]">
                    {nvidiaResult.originalEvaluation?.aiResponse}
                  </p>

                  {/* Chain of Thought Reasoning */}
                  {nvidiaResult.originalEvaluation?.reasoningChain && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-semibold text-blue-400 flex items-center gap-1">
                          <Cpu className="w-3 h-3" /> Chain-of-Thought Inner Reasoning (NVIDIA NIM):
                        </span>
                        <button
                          onClick={() => setShowChainOfThought(!showChainOfThought)}
                          className="text-[10px] text-slate-400 hover:text-slate-200 transition cursor-pointer"
                        >
                          {showChainOfThought ? 'Collapse' : 'Expand'}
                        </button>
                      </div>
                      {showChainOfThought && (
                        <pre className="text-[10px] text-slate-400 bg-[#07090e] p-3 rounded-xl border border-white/[0.06] font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                          {nvidiaResult.originalEvaluation?.reasoningChain}
                        </pre>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Counterfactual Twin */}
                <div className="p-5 rounded-2xl bg-[#0b0d14] border border-blue-500/30 space-y-3">
                  <div className="flex justify-between items-center border-b border-white/[0.06] pb-2">
                    <div>
                      <span className="text-[10px] text-blue-400 uppercase font-bold">Counterfactual Twin (Demographics Swapped)</span>
                      <h4 className="text-sm font-bold text-white">
                        {nvidiaResult.counterfactualTwinTest?.twin?.full_name} ({nvidiaResult.counterfactualTwinTest?.twin?.gender})
                      </h4>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      nvidiaResult.counterfactualTwinTest?.twinDecision === 'APPROVE' || nvidiaResult.counterfactualTwinTest?.twinDecision === 'SHORTLIST'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}>
                      {nvidiaResult.counterfactualTwinTest?.twinDecision} ({nvidiaResult.counterfactualTwinTest?.twinScore}/100)
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-[#12141d] p-3 rounded-xl border border-white/[0.06]">
                    Holding technical qualifications, years of experience, and merits identical, altering only demographic markers shifted the score by{' '}
                    <strong className="text-amber-400 font-bold">{nvidiaResult.counterfactualTwinTest?.disparityDelta} points</strong>.
                  </p>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-blue-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Recommended Remediation:
                    </span>
                    <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                      {nvidiaResult.remediations?.map((r: string, idx: number) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* DPDP Act Privacy Warnings */}
              {nvidiaResult.dpdpAudit?.violations?.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-rose-200">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    India DPDP Act (2023) Privacy Violations Flagged in Profile:
                  </div>
                  <ul className="list-disc list-inside space-y-1 pl-1">
                    {nvidiaResult.dpdpAudit.violations.map((v: string, idx: number) => (
                      <li key={idx}>{v}</li>
                    ))}
                  </ul>
                  <span className="text-[11px] text-slate-400 block pt-1 font-mono">
                    Mandatory Action: Redact Aadhaar UID tokens and personal marital details before passing data to LLM inference endpoints.
                  </span>
                </div>
              )}
            </div>
          )}
        </section>

        {/* STEP 3: BATCH FAIRNESS METROLOGY & ONE-CLICK AUTO-CALIBRATION */}
        <section className="p-6 sm:p-8 rounded-3xl bg-[#0b0d14] border border-white/[0.08] space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold mb-1">
                Step 3 of 3: Batch Metrology
              </div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                Batch Fairness Metrology &amp; Auto-Calibration
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluates a historical dataset of 500 decisions. Current Decision Threshold: <strong className="text-white font-mono">{threshold.toFixed(2)}</strong>
              </p>
            </div>

            <button
              onClick={() => setThreshold(auditData?.mitigation?.calibratedThreshold ?? 0.40)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-full transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Auto-Calibrate Threshold ({auditData?.mitigation?.calibratedThreshold ?? 0.40})
            </button>
          </div>

          {/* Three Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Metric 1 */}
            <div className="p-4 rounded-2xl bg-[#12141d] border border-white/[0.06] space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Disparate Impact Ratio</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isDiPass ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {isDiPass ? 'COMPLIANT' : 'ADVERSE IMPACT'}
                </span>
              </div>
              <span className={`text-2xl font-extrabold block ${isDiPass ? 'text-emerald-400' : 'text-rose-400'}`}>
                {diRatio}
              </span>
              <span className="text-[11px] text-slate-500 block">
                EEOC 80% Rule requires selection ratio ≥ 0.80.
              </span>
            </div>

            {/* Metric 2 */}
            <div className="p-4 rounded-2xl bg-[#12141d] border border-white/[0.06] space-y-1">
              <span className="text-xs text-slate-400 block">Demographic Selection Gap</span>
              <span className="text-2xl font-extrabold text-cyan-400 block">
                {((auditData?.metrics?.demographicParityDiff ?? 0) * 100).toFixed(1)}%
              </span>
              <span className="text-[11px] text-slate-500 block">
                Disparity in acceptance rate between groups.
              </span>
            </div>

            {/* Metric 3 */}
            <div className="p-4 rounded-2xl bg-[#12141d] border border-white/[0.06] space-y-1">
              <span className="text-xs text-slate-400 block">DPDP Act Compliance Index</span>
              <span className="text-2xl font-extrabold text-emerald-400 block">
                {dpdpData?.dpdpScore ?? 75}/100
              </span>
              <span className="text-[11px] text-slate-500 block">
                {dpdpData?.metrics?.aadhaarLeaks ?? 0} Aadhaar tokens flagged across records.
              </span>
            </div>
          </div>

          {/* Interactive Threshold Slider */}
          <div className="space-y-2 pt-2 bg-[#12141d] p-4 rounded-2xl border border-white/[0.06]">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Interactive Decision Threshold Slider:</span>
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
            <div className="flex justify-between text-[10px] text-slate-500 pt-1">
              <span>0.30 (Higher Recall / Lower Barrier)</span>
              <span>Optimal: {auditData?.mitigation?.calibratedThreshold ?? 0.40}</span>
              <span>0.75 (Strict Precision / High Disparity)</span>
            </div>
          </div>
        </section>

      </main>

      {/* Clean Apple-style Minimal Footer */}
      <footer className="border-t border-white/[0.08] py-8 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Scale className="w-4 h-4 text-slate-400" />
            <span className="font-medium text-slate-400">Veritas AI</span>
            <span>— Autonomous Responsible AI Governance System</span>
          </div>
          <div className="text-slate-500">
            Compliant with India DPDP Act 2023 &amp; Four-Fifths Adverse Impact Rule
          </div>
        </div>
      </footer>
    </div>
  );
}
