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
  Users
} from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function Home() {
  // Main 2 Tabs: 'hiring' or 'lending'
  const [activeTab, setActiveTab] = useState<'hiring' | 'lending'>('hiring');

  // Shared Parameters
  const [threshold, setThreshold] = useState<number>(0.50);

  // Hiring Tab State
  const [hiringAudit, setHiringAudit] = useState<any>(null);
  const [hiringDpdp, setHiringDpdp] = useState<any>(null);
  const [selectedHiringCand, setSelectedHiringCand] = useState<any>(null);
  const [hiringNvidiaResult, setHiringNvidiaResult] = useState<any>(null);
  const [loadingHiringNvidia, setLoadingHiringNvidia] = useState<boolean>(false);
  const [customHiringText, setCustomHiringText] = useState<string>(
    "Candidate: Aditi Sen. Experience: 4 years. Marital Status: Married. Contact: +91 9820192831. Aadhaar UID: 4829 1928 3819. Notice Period: 30 days."
  );
  const [hiringScanResult, setHiringScanResult] = useState<any>(null);
  const [scanningHiring, setScanningHiring] = useState<boolean>(false);

  // Lending Tab State
  const [lendingAudit, setLendingAudit] = useState<any>(null);
  const [lendingDpdp, setLendingDpdp] = useState<any>(null);
  const [selectedLendingCand, setSelectedLendingCand] = useState<any>(null);
  const [lendingNvidiaResult, setLendingNvidiaResult] = useState<any>(null);
  const [loadingLendingNvidia, setLoadingLendingNvidia] = useState<boolean>(false);
  const [customLendingText, setCustomLendingText] = useState<string>(
    "Applicant: Sunita Patil. Age: 29. Location: Tier 3 (Rural/Semi-urban). PAN Card: ABCDE1234F. Marital Status: Married with 2 dependents. Credit Score: 740."
  );
  const [lendingScanResult, setLendingScanResult] = useState<any>(null);
  const [scanningLending, setScanningLending] = useState<boolean>(false);

  // Fetch data on load or tab/threshold switch
  useEffect(() => {
    fetchTabData(activeTab, threshold);
  }, [activeTab, threshold]);

  const fetchTabData = async (tab: 'hiring' | 'lending', t: number) => {
    try {
      // 1. Audit
      const auditRes = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: tab,
          threshold: t,
          sensitiveAttr: 'gender',
          privGroup: 'Male',
          unprivGroup: 'Female'
        })
      });
      const aData = await auditRes.json();

      // 2. DPDP
      const dpdpRes = await fetch('/api/dpdp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: tab })
      });
      const dData = await dpdpRes.json();

      if (tab === 'hiring') {
        setHiringAudit(aData);
        setHiringDpdp(dData);
        if (aData.sampleCandidates?.length > 0 && !selectedHiringCand) {
          setSelectedHiringCand(aData.sampleCandidates[0]);
        }
      } else {
        setLendingAudit(aData);
        setLendingDpdp(dData);
        if (aData.sampleCandidates?.length > 0 && !selectedLendingCand) {
          setSelectedLendingCand(aData.sampleCandidates[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Run NVIDIA Nemotron Audit
  const runNvidiaAudit = async (domainTab: 'hiring' | 'lending', cand: any) => {
    if (!cand) return;
    if (domainTab === 'hiring') setLoadingHiringNvidia(true);
    else setLoadingLendingNvidia(true);

    try {
      const res = await fetch('/api/nvidia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate: cand,
          domain: domainTab,
          model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning'
        })
      });
      const data = await res.json();
      if (domainTab === 'hiring') setHiringNvidiaResult(data);
      else setLendingNvidiaResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      if (domainTab === 'hiring') setLoadingHiringNvidia(false);
      else setLoadingLendingNvidia(false);
    }
  };

  // DPDP Scan Text
  const handleScanText = async (domainTab: 'hiring' | 'lending') => {
    const text = domainTab === 'hiring' ? customHiringText : customLendingText;
    if (!text.trim()) return;

    if (domainTab === 'hiring') setScanningHiring(true);
    else setScanningLending(true);

    try {
      const res = await fetch('/api/dpdp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customText: text })
      });
      const data = await res.json();
      if (domainTab === 'hiring') setHiringScanResult(data);
      else setLendingScanResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      if (domainTab === 'hiring') setScanningHiring(false);
      else setScanningLending(false);
    }
  };

  // Download PDF Certificate
  const downloadPDF = (domainTab: 'hiring' | 'lending') => {
    const doc = new jsPDF();
    const audit = domainTab === 'hiring' ? hiringAudit : lendingAudit;
    const dpdp = domainTab === 'hiring' ? hiringDpdp : lendingDpdp;
    const di = audit?.metrics?.disparateImpactRatio ?? 0.65;
    const score = dpdp?.dpdpScore ?? 75;

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 38, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text(`VERITAS AI - ${domainTab.toUpperCase()} MODEL AUDIT REPORT`, 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(`Audited Under: India DPDP Act 2023 & EEOC 80% Rule | Date: ${new Date().toLocaleDateString('en-IN')}`, 14, 28);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.text("1. Algorithmic Bias Assessment", 14, 48);
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`- Disparate Impact Ratio: ${di} (${di >= 0.8 ? "PASS - Compliant" : "FAIL - Adverse Impact Detected"})`, 14, 56);
    doc.text(`- Demographic Parity Delta: ${((audit?.metrics?.demographicParityDiff ?? 0.18) * 100).toFixed(1)}% selection gap`, 14, 62);
    doc.text(`- Counterfactual Twin Flip Rate: ${((audit?.metrics?.flipRate ?? 0.3) * 100).toFixed(1)}% decisions flipped on demographic swap`, 14, 68);
    doc.text(`- Recommended Calibrated Threshold: ${audit?.mitigation?.calibratedThreshold ?? 0.40}`, 14, 74);

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("2. DPDP Act 2023 Statutory Compliance", 14, 88);
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`- Compliance Index: ${score}/100 (Grade: ${dpdp?.grade?.slice(0, 1) || 'F'})`, 14, 96);
    doc.text(`- Section 6 (Purpose Limitation): ${dpdp?.metrics?.proxyBreaches || 0} non-merit demographic proxy breaches`, 14, 102);
    doc.text(`- Section 8(5) (Security Safeguards): ${dpdp?.metrics?.aadhaarLeaks || 0} unmasked Aadhaar credentials leaked`, 14, 108);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("Certified by: VeritasAI Autonomous Metrology Engine | Team DSU", 14, 130);
    doc.save(`VeritasAI_${domainTab.toUpperCase()}_Audit_Report.pdf`);
  };

  const currentAudit = activeTab === 'hiring' ? hiringAudit : lendingAudit;
  const currentDpdp = activeTab === 'hiring' ? hiringDpdp : lendingDpdp;
  const currentNvidia = activeTab === 'hiring' ? hiringNvidiaResult : lendingNvidiaResult;
  const loadingNvidia = activeTab === 'hiring' ? loadingHiringNvidia : loadingLendingNvidia;
  const selectedCand = activeTab === 'hiring' ? selectedHiringCand : selectedLendingCand;

  const diRatio = currentAudit?.metrics?.disparateImpactRatio ?? 0;
  const isDiPass = diRatio >= 0.80;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Modern Clean Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-white">VERITAS AI</span>
                <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  DPDP Act 2023
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Responsible AI Auditor Platform</p>
            </div>
          </div>

          {/* TWO MAIN TABS (The User's Core Request) */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center">
            <button
              onClick={() => setActiveTab('hiring')}
              className={`px-4 py-2 rounded-lg font-semibold text-xs transition flex items-center gap-2 ${
                activeTab === 'hiring'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              AI Auditor for Hiring
            </button>
            <button
              onClick={() => setActiveTab('lending')}
              className={`px-4 py-2 rounded-lg font-semibold text-xs transition flex items-center gap-2 ${
                activeTab === 'lending'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              AI Auditor for Lending
            </button>
          </div>

          {/* Download Report Button */}
          <button
            onClick={() => downloadPDF(activeTab)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-lg transition border border-slate-700 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export Audit PDF
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Tab Context Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider text-indigo-400">
                {activeTab === 'hiring' ? 'Target System: Automated Resume Screener' : 'Target System: FinTech Credit Underwriter'}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                isDiPass ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                {isDiPass ? 'PASSED 80% RULE' : 'ADVERSE IMPACT DETECTED'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">
              {activeTab === 'hiring' 
                ? 'Auditing AI Models Used in Recruitment & Resume Screening'
                : 'Auditing AI Models Used in Loan Approvals & Credit Scoring'}
            </h2>
            <p className="text-xs text-slate-400">
              Evaluates model predictions for bias against gender & socio-economic tiers, tests decision flip stability with NVIDIA Nemotron, and verifies DPDP Act privacy rules.
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-right shrink-0">
            <span className="text-[11px] text-slate-400 block">Tested Batch Size</span>
            <span className="text-lg font-bold text-white font-mono">{currentAudit?.totalAudited || 500} Profiles</span>
          </div>
        </div>

        {/* 3 Main KPI Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Disparate Impact */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
            <div className="flex justify-between text-xs text-slate-400 font-medium">
              <span>Disparate Impact Ratio</span>
              <Scale className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className={`text-3xl font-extrabold ${isDiPass ? 'text-emerald-400' : 'text-rose-400'}`}>
                {diRatio}
              </span>
              <span className="text-xs text-slate-500">/ 1.00 (Min 0.80)</span>
            </div>
            <p className="text-xs text-slate-400">
              {isDiPass 
                ? 'Compliant with EEOC 80% Four-Fifths rule' 
                : `${((1 - diRatio) * 100).toFixed(0)}% lower approval rate for female applicants`}
            </p>
          </div>

          {/* 2. Demographic Parity */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
            <div className="flex justify-between text-xs text-slate-400 font-medium">
              <span>Demographic Parity Gap</span>
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-cyan-400">
                {((currentAudit?.metrics?.demographicParityDiff ?? 0) * 100).toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Male ({((currentAudit?.privStats?.selectionRate ?? 0) * 100).toFixed(0)}%) vs Female ({((currentAudit?.unprivStats?.selectionRate ?? 0) * 100).toFixed(0)}%) pass rate
            </p>
          </div>

          {/* 3. DPDP Index */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
            <div className="flex justify-between text-xs text-slate-400 font-medium">
              <span>DPDP Act (2023) Index</span>
              <Lock className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className={`text-3xl font-extrabold ${currentDpdp?.dpdpScore >= 70 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {currentDpdp?.dpdpScore ?? 0}/100
              </span>
              <span className="text-xs text-slate-500">Grade: {currentDpdp?.grade?.slice(0, 1)}</span>
            </div>
            <p className="text-xs text-slate-400">
              {currentDpdp?.metrics?.aadhaarLeaks ?? 0} Aadhaar leaks • {currentDpdp?.metrics?.proxyBreaches ?? 0} proxy breaches
            </p>
          </div>
        </div>

        {/* SECTION 1: DECISION THRESHOLD & ONE-CLICK AUTO-MITIGATION */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                Live Decision Boundary Sandbox & Threshold Auto-Fix
              </h3>
              <p className="text-xs text-slate-400">
                Move slider to see how model threshold impacts selection disparity, or click auto-mitigate.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">Current: <strong className="text-white font-mono">{threshold.toFixed(2)}</strong></span>
              <button
                onClick={() => setThreshold(currentAudit?.mitigation?.calibratedThreshold ?? 0.40)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Apply Auto-Fix ({currentAudit?.mitigation?.calibratedThreshold ?? 0.40})
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="range"
              min="0.30"
              max="0.75"
              step="0.02"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>0.30 (Relaxed)</span>
              <span>0.50 (Standard Legacy Threshold)</span>
              <span>0.75 (Strict)</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: NVIDIA NEMOTRON TWIN-TEST ARENA (CORE INNOVATION) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  NVIDIA Nemotron Reasoning & Twin Stress-Test
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluates a profile and generates an identical Counterfactual Twin to detect latent bias and Chain-of-Thought reasoning.
              </p>
            </div>

            <button
              onClick={() => runNvidiaAudit(activeTab, selectedCand)}
              disabled={loadingNvidia}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition flex items-center gap-2 shadow-md shadow-indigo-600/30"
            >
              {loadingNvidia ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Auditing via NVIDIA NIM...
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5" />
                  Run NVIDIA Twin Audit
                </>
              )}
            </button>
          </div>

          {/* Quick Profile Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
            <span className="text-slate-400 shrink-0 font-medium">Select Applicant:</span>
            {currentAudit?.sampleCandidates?.slice(0, 6).map((cand: any) => (
              <button
                key={cand.applicant_id || cand.candidate_id || Math.random()}
                onClick={() => {
                  if (activeTab === 'hiring') setSelectedHiringCand(cand);
                  else setSelectedLendingCand(cand);
                  runNvidiaAudit(activeTab, cand);
                }}
                className={`px-3 py-1.5 rounded-lg border transition shrink-0 ${
                  selectedCand?.full_name === cand.full_name
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-semibold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cand.full_name || cand.name} ({cand.gender})
              </button>
            ))}
          </div>

          {/* Side-by-side Twin Results */}
          {currentNvidia && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                currentNvidia.counterfactualTwinTest?.decisionFlipped
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              }`}>
                <div className="flex items-center space-x-3">
                  {currentNvidia.counterfactualTwinTest?.decisionFlipped ? (
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  )}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      {currentNvidia.counterfactualTwinTest?.decisionFlipped
                        ? 'CRITICAL BIAS: Counterfactual Demographic Swap Reversed Decision'
                        : 'DECISION STABLE ACROSS COUNTERFACTUAL TWINS'}
                    </h4>
                    <p className="text-xs opacity-80">
                      {currentNvidia.counterfactualTwinTest?.verdict}
                    </p>
                  </div>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="text-slate-400 block text-[10px]">Score Disparity</span>
                  <span className="text-lg font-bold">
                    {currentNvidia.counterfactualTwinTest?.disparityDelta} pts
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original Profile */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Original Candidate</span>
                      <h4 className="text-sm font-bold text-white">{currentNvidia.originalEvaluation?.candidate?.full_name}</h4>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      currentNvidia.originalEvaluation?.decision === 'APPROVE' || currentNvidia.originalEvaluation?.decision === 'SHORTLIST'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {currentNvidia.originalEvaluation?.decision} ({currentNvidia.originalEvaluation?.score}/100)
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    {currentNvidia.originalEvaluation?.aiResponse}
                  </p>

                  {currentNvidia.originalEvaluation?.reasoningChain && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-indigo-400 flex items-center gap-1">
                        <Cpu className="w-3 h-3" /> Chain-of-Thought Inner Reasoning:
                      </span>
                      <pre className="text-[10px] text-slate-400 bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono whitespace-pre-wrap max-h-24 overflow-y-auto">
                        {currentNvidia.originalEvaluation?.reasoningChain}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Counterfactual Twin */}
                <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/30 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <div>
                      <span className="text-[10px] text-indigo-400 uppercase font-bold">Counterfactual Twin (Demographics Swapped)</span>
                      <h4 className="text-sm font-bold text-white">{currentNvidia.counterfactualTwinTest?.twin?.full_name}</h4>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      currentNvidia.counterfactualTwinTest?.twinDecision === 'APPROVE' || currentNvidia.counterfactualTwinTest?.twinDecision === 'SHORTLIST'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {currentNvidia.counterfactualTwinTest?.twinDecision} ({currentNvidia.counterfactualTwinTest?.twinScore}/100)
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    Holding merits identical, changing only demographic markers created a{' '}
                    <strong className="text-amber-400 font-bold">{currentNvidia.counterfactualTwinTest?.disparityDelta} point delta</strong>.
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-indigo-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Recommended Fix:
                    </span>
                    <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                      {currentNvidia.remediations?.map((r: string, idx: number) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: DPDP ACT (2023) PRIVACY CHECKER */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="border-b border-slate-800 pb-4 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                DPDP Act 2023 Statutory Privacy & Redaction Scanner
              </h3>
              <p className="text-xs text-slate-400">
                Audits free text resumes and loan notes for Aadhaar (Sec 8(5)) and marital proxy leaks (Sec 6).
              </p>
            </div>
            <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full">
              Score: {currentDpdp?.dpdpScore ?? 75}/100
            </span>
          </div>

          <div className="space-y-3">
            <textarea
              rows={3}
              value={activeTab === 'hiring' ? customHiringText : customLendingText}
              onChange={(e) => {
                if (activeTab === 'hiring') setCustomHiringText(e.target.value);
                else setCustomLendingText(e.target.value);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              placeholder="Paste candidate resume or loan application text to test DPDP redaction..."
            />

            <div className="flex justify-between items-center">
              <span className="text-[11px] text-slate-500">
                Tests for 12-digit Aadhaar UID, PAN Card patterns, mobile numbers, and non-merit marital status.
              </span>
              <button
                onClick={() => handleScanText(activeTab)}
                disabled={activeTab === 'hiring' ? scanningHiring : scanningLending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                Scan Text for Violations
              </button>
            </div>

            {/* Scan Results */}
            {((activeTab === 'hiring' && hiringScanResult) || (activeTab === 'lending' && lendingScanResult)) && (
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2 text-xs">
                {((activeTab === 'hiring' ? hiringScanResult : lendingScanResult).findings || []).map((f: any, idx: number) => (
                  <div key={idx} className="bg-rose-500/10 border border-rose-500/30 rounded p-2 text-rose-300 flex justify-between items-center">
                    <div>
                      <strong className="block text-white">{f.type} ({f.section})</strong>
                      <span className="text-[11px] text-slate-400">Fix: {f.fix}</span>
                    </div>
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded">{f.severity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
