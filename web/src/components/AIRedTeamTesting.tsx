'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Bug, 
  Terminal, 
  Play, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  ChevronRight, 
  Download,
  Lock,
  Cpu,
  Sparkles
} from 'lucide-react';

interface RedTeamProps {
  activeCandidate?: any;
  activeEvaluation?: any;
  onBackToAuditor?: () => void;
}

export default function AIRedTeamTesting({
  activeCandidate,
  activeEvaluation,
  onBackToAuditor
}: RedTeamProps) {
  const [loading, setLoading] = useState(false);
  const [redTeamData, setRedTeamData] = useState<any>(null);
  const [selectedTarget, setSelectedTarget] = useState<string>("Default / Candidate Evaluator");
  const [activeTab, setActiveTab] = useState<'overview' | 'test_runs' | 'vulnerabilities'>('overview');

  const runScan = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/red-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: 'hiring',
          model_target: selectedTarget,
          candidate_profile: activeCandidate || null
        })
      });
      if (res.ok) {
        const data = await res.json();
        setRedTeamData(data);
      }
    } catch (err) {
      console.error('Red team scan error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runScan();
  }, [selectedTarget]);

  const overall = redTeamData?.overall_score || {
    risk_score: 47,
    risk_level: "High Risk",
    simulated_attacks: 5178,
    successful_attacks: 1174,
    attack_success_rate_pct: 22.67
  };

  const categoryScores = redTeamData?.category_scores || {
    security: 75.74,
    safety: 36.43,
    hallucination: 25.53,
    business_alignment: 46.53,
    custom: 2.26
  };

  const recentRuns = redTeamData?.recent_test_runs || [
    { name: "Full Vulnerability Scan", executed_on: "2026-11-28, 15:30", probes_label: "AdviceGuardrailCheck +21", passed: 3991, failed: 1134, error: 3, progress: "100%", status: "Completed" },
    { name: "GitHub CI/CD Test Run", executed_on: "2026-11-27, 18:15", probes_label: "Competitor Check", passed: 111, failed: 176, error: 1, progress: "100%", status: "Failed" },
    { name: "Bitbucket CI/CD Test Run", executed_on: "2026-11-27, 14:02", probes_label: "Competitor Check", passed: 113, failed: 173, error: 2, progress: "100%", status: "Failed" },
    { name: "AZDO CI/CD Test Run", executed_on: "2026-11-26, 11:45", probes_label: "Competitor Check", passed: 125, failed: 162, error: 1, progress: "100%", status: "Failed" }
  ];

  const testRuns = redTeamData?.test_runs || [];
  const vulnerabilities = redTeamData?.vulnerabilities_summary || [];

  return (
    <div className="bg-[#0b1016] text-zinc-100 min-h-screen p-6 font-sans">
      {/* Top Header matching Image 3 */}
      <div className="flex flex-wrap items-center justify-between pb-6 border-b border-teal-950/60 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Automated AI Red-Teaming Suite
            </span>
            <span className="text-xs text-zinc-400">Adversarial Stress Testing & Vulnerability Assessment</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            AI Red Teaming Overview
          </h1>
          <p className="text-sm text-zinc-400">
            Generate controlled attacks for prompt injection, manipulated resumes, contradictory claims, canary PII leakage, and formatting jitter.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedTarget}
            onChange={e => setSelectedTarget(e.target.value)}
            className="bg-[#101923] border border-teal-900/60 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-teal-500"
          >
            <option>Default / Candidate Evaluator</option>
            <option>Production / Credit Scoring LLM</option>
            <option>Staging / Document Parser v2</option>
          </select>

          <button
            onClick={runScan}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-black rounded-lg transition shadow-md"
          >
            <Play className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            New Test Run +
          </button>
        </div>
      </div>

      {/* Live Candidate Target Banner if passed */}
      {activeCandidate && (
        <div className="mb-6 p-4 rounded-xl bg-teal-950/40 border border-teal-500/40 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <div>
              <span className="text-xs font-bold text-teal-300 uppercase tracking-wider block">
                Targeting Live Candidate Profile For Adversarial Probing
              </span>
              <p className="text-xs text-zinc-300">
                Target: <strong className="text-white">{activeCandidate.full_name}</strong> | 
                Role: <strong className="text-white">{activeCandidate.target_role || activeCandidate.job_title || 'Applicant'}</strong> | 
                Vector Defense Mode: <span className="font-mono text-emerald-400">Strict Delimiter & DPDP Firewall</span>
              </p>
            </div>
          </div>
          {onBackToAuditor && (
            <button
              onClick={onBackToAuditor}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-teal-600/30 hover:bg-teal-600 text-teal-200 border border-teal-500/40 transition"
            >
              ← Back to Hiring/Lending Auditor
            </button>
          )}
        </div>
      )}

      {/* Overview 3-Box Row Matching Reference Image 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Left Card: Latest Run & Attack Counts */}
        <div className="lg:col-span-4 bg-[#101923] border border-teal-950 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-teal-950/80 mb-3">
            <h2 className="text-sm font-bold text-white">Overall Score</h2>
            <span className="text-xs text-zinc-400 font-mono">Probe v1.14</span>
          </div>

          <div className="space-y-3">
            <div className="bg-[#152331] p-3 rounded-lg border border-teal-950/80">
              <span className="text-[11px] text-zinc-400 block mb-0.5">Latest test run execution</span>
              <span className="text-sm font-bold font-mono text-zinc-200">2026-11-28 15:45</span>
            </div>

            <div className="bg-[#152331] p-3 rounded-lg border border-teal-950/80">
              <span className="text-[11px] text-zinc-400 block mb-0.5">Simulated attacks</span>
              <span className="text-2xl font-black font-mono text-white">{overall.simulated_attacks.toLocaleString()}</span>
            </div>

            <div className="bg-[#152331] p-3 rounded-lg border border-teal-950/80">
              <span className="text-[11px] text-zinc-400 block mb-0.5">Successful attacks (ASR)</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-amber-400">{overall.successful_attacks.toLocaleString()}</span>
                <span className="text-xs font-mono text-red-400">({overall.attack_success_rate_pct}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Card: Semi-circular Gauge (Matching Image 3) */}
        <div className="lg:col-span-4 bg-[#101923] border border-teal-950 rounded-xl p-5 shadow-lg flex flex-col items-center justify-between">
          <div className="w-full text-left pb-3 border-b border-teal-950/80 mb-2">
            <h2 className="text-sm font-bold text-white">Vulnerability Index</h2>
            <span className="text-xs text-zinc-400">Overall System Posture</span>
          </div>

          <div className="relative my-4 flex flex-col items-center justify-center">
            {/* Speedometer semi-circular gauge SVG */}
            <svg className="w-56 h-32" viewBox="0 0 200 110">
              {/* Background Arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#1e293b"
                strokeWidth="16"
                strokeLinecap="round"
              />
              {/* Highlighted Value Arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="16"
                strokeDasharray="251"
                strokeDashoffset={251 - (251 * (overall.risk_score / 100))}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            <div className="text-center -mt-6">
              <span className="inline-block px-3 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-1">
                {overall.risk_level}
              </span>
              <div className="text-4xl font-black font-mono text-white tracking-tight">
                {overall.risk_score}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-zinc-400 text-center">
            Adversarial resilience rated across 6 distinct vector classes under OWASP Top 10 for LLMs.
          </p>
        </div>

        {/* Right Card: Category Scores Progress Bars (Matching Image 3) */}
        <div className="lg:col-span-4 bg-[#101923] border border-teal-950 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div className="pb-3 border-b border-teal-950/80 mb-2">
            <h2 className="text-sm font-bold text-white">Category Trust Scores</h2>
            <span className="text-xs text-zinc-400">Specific Vulnerability Pillars</span>
          </div>

          <div className="space-y-3">
            {/* Security */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-300 font-medium">Security</span>
                <span className="font-mono text-emerald-400 font-bold">{categoryScores.security}%</span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${categoryScores.security}%` }}></div>
              </div>
            </div>

            {/* Safety */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-300 font-medium">Safety</span>
                <span className="font-mono text-amber-400 font-bold">{categoryScores.safety}%</span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full" style={{ width: `${categoryScores.safety}%` }}></div>
              </div>
            </div>

            {/* Hallucination */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-300 font-medium">Hallucination & Trustworthiness</span>
                <span className="font-mono text-red-400 font-bold">{categoryScores.hallucination}%</span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div className="bg-red-400 h-full rounded-full" style={{ width: `${categoryScores.hallucination}%` }}></div>
              </div>
            </div>

            {/* Business Alignment */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-300 font-medium">Business Alignment</span>
                <span className="font-mono text-amber-400 font-bold">{categoryScores.business_alignment}%</span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${categoryScores.business_alignment}%` }}></div>
              </div>
            </div>

            {/* Custom / Boundaries */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-300 font-medium">Custom Boundaries</span>
                <span className="font-mono text-red-400 font-bold">{categoryScores.custom}%</span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full rounded-full" style={{ width: `${categoryScores.custom}%` }}></div>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[10px] text-zinc-500 font-mono">
            Grounding checks & canary leakage isolation enabled
          </div>
        </div>
      </div>

      {/* Recent Test Runs Table (Matching Image 3 bottom table) */}
      <div className="bg-[#101923] border border-teal-950 rounded-xl p-5 shadow-lg mb-6">
        <div className="flex items-center justify-between pb-3 border-b border-teal-950/80 mb-4">
          <div>
            <h2 className="text-sm font-bold text-white">Recent Test Runs</h2>
            <p className="text-xs text-zinc-400">CI/CD security scan batches, executed probes, and pass/fail rates</p>
          </div>
          <span className="text-xs text-teal-400 hover:underline cursor-pointer">See All &gt;</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-teal-950 text-zinc-400 font-medium">
                <th className="pb-3 font-semibold">Name</th>
                <th className="pb-3">Executed On</th>
                <th className="pb-3">Probes</th>
                <th className="pb-3 text-center">Result</th>
                <th className="pb-3 text-center">Progress</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-teal-950/60 font-mono">
              {recentRuns.map((r: any, idx: number) => (
                <tr key={idx} className="hover:bg-zinc-900/40 transition">
                  <td className="py-3 font-sans font-medium text-white">{r.name}</td>
                  <td className="py-3 text-zinc-400">{r.executed_on}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[11px] bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {r.probes_label}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-[11px]">
                      <span className="text-emerald-400 font-bold">{r.passed} Passed</span>
                      <span className="text-zinc-600">/</span>
                      <span className="text-red-400 font-bold">{r.failed} Failed</span>
                      {r.error > 0 && <span className="text-zinc-500">({r.error} Err)</span>}
                    </div>
                  </td>
                  <td className="py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-20 bg-zinc-800 h-2 rounded overflow-hidden flex">
                        <div className="bg-teal-400 h-full w-full animate-pulse"></div>
                      </div>
                      <span className="text-[10px] text-teal-300">100%</span>
                    </div>
                  </td>
                  <td className="py-3 text-right">
                    <button className="px-2.5 py-1 text-[11px] rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition">
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Severity-Ranked Vulnerabilities & Probes Detail */}
      <div className="bg-[#101923] border border-teal-950 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-teal-950/80 mb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Bug className="w-4 h-4 text-amber-400" />
              Active Probe Suite & Mitigation Recommendations
            </h2>
            <p className="text-xs text-zinc-400">
              Full breakdown of prompt injection, resume manipulation, and leak vectors
            </p>
          </div>
          <span className="text-xs text-zinc-400 font-mono">6 Probes Evaluated</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testRuns.map((t: any) => (
            <div key={t.id} className="p-4 rounded-xl bg-[#152331] border border-teal-950 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-zinc-400">{t.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    t.attack_success
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {t.status}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-white mb-1">{t.name}</h3>
                <div className="text-[10px] text-zinc-400 bg-black/40 p-2 rounded border border-zinc-800 mb-2 font-mono">
                  {t.payload_preview}
                </div>
              </div>
              <div className="pt-2 border-t border-teal-950 text-[10px]">
                <strong className="text-teal-400 block mb-0.5">Mitigation:</strong>
                <span className="text-zinc-400 leading-snug">{t.mitigation}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
