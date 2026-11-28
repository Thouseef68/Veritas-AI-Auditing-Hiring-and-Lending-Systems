'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  Search, 
  RefreshCw, 
  Layers, 
  Bell, 
  Database, 
  Calendar,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  Plus
} from 'lucide-react';

interface MonitoringProps {
  activeEvaluation?: any;
  onBackToAuditor?: () => void;
}

export default function ContinuousModelMonitoring({
  activeEvaluation,
  onBackToAuditor
}: MonitoringProps) {
  const [loading, setLoading] = useState(false);
  const [monitoringData, setMonitoringData] = useState<any>(null);
  const [selectedModel, setSelectedModel] = useState<string>("techhire-screening-v2");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/monitoring');
      if (res.ok) {
        const data = await res.json();
        setMonitoringData(data);
      }
    } catch (err) {
      console.error('Monitoring fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const models = monitoringData?.models || [
    { id: "techhire-screening-v2", name: "TechHire Resume Screener v2", last_data_update: "Sep 30, 2026", critical_alerts: 2, high_alerts: 1, status: "Active" },
    { id: "fincorp-credit-evaluator", name: "FinCorp Credit Underwriting", last_data_update: "Sep 30, 2026", critical_alerts: 1, high_alerts: 0, status: "Warning" },
    { id: "ecommerce-purchase-risk", name: "Ecommerce Purchase Risk", last_data_update: "Sep 30, 2026", critical_alerts: 3, high_alerts: 2, status: "Critical" },
    { id: "grocery-dynamic-pricing", name: "Grocery Dynamic Pricing", last_data_update: "Sep 30, 2026", critical_alerts: 0, high_alerts: 0, status: "Healthy" }
  ];

  const timeSeries = monitoringData?.time_series || [
    { date: "Sep 24", techhire_resumes: 520, fincorp_loans: 1050, ecommerce_risk: 1520, prediction_drift: 0.04, label_drift: 0.02, f1: 0.88 },
    { date: "Sep 25", techhire_resumes: 480, fincorp_loans: 1040, ecommerce_risk: 1500, prediction_drift: 0.05, label_drift: 0.03, f1: 0.87 },
    { date: "Sep 26", techhire_resumes: 500, fincorp_loans: 1080, ecommerce_risk: 1540, prediction_drift: 0.07, label_drift: 0.04, f1: 0.86 },
    { date: "Sep 27", techhire_resumes: 510, fincorp_loans: 1060, ecommerce_risk: 1560, prediction_drift: 0.11, label_drift: 0.06, f1: 0.85 },
    { date: "Sep 28", techhire_resumes: 490, fincorp_loans: 1090, ecommerce_risk: 1600, prediction_drift: 0.14, label_drift: 0.09, f1: 0.82 },
    { date: "Sep 29", techhire_resumes: 530, fincorp_loans: 820, ecommerce_risk: 1650, prediction_drift: 0.18, label_drift: 0.13, f1: 0.80 },
    { date: "Sep 30", techhire_resumes: 540, fincorp_loans: 650, ecommerce_risk: 1720, prediction_drift: 0.23, label_drift: 0.17, f1: 0.77 }
  ];

  const monitors = monitoringData?.monitors || {
    label_drift: { score: 0.17, threshold: 0.15, status: "Warning" },
    f1_performance: { score: 0.77, threshold: 0.85, status: "Degraded" },
    percent_of_nulls: { score: 0.012, threshold: 0.05, status: "Healthy" },
    prediction_drift: { score: 0.23, threshold: 0.20, status: "Critical Drift Alert" }
  };

  const emergingPatterns = monitoringData?.emerging_bias_patterns || [
    {
      pattern_id: "PAT-001",
      name: "Career Gap Penalty Creep",
      attribute: "career_gap_months",
      severity: "High",
      detected_at: "Sep 29, 2026",
      delta_effect: "-14.2% score reduction for gaps > 6 months",
      regulatory_flag: "DPDP Section 9 & EU AI Act Annex III High-Risk Employment"
    },
    {
      pattern_id: "PAT-002",
      name: "Geographic PIN Exclusion Drift",
      attribute: "location_tier / pincode",
      severity: "Critical",
      detected_at: "Sep 30, 2026",
      delta_effect: "DIR dropped to 0.54 for Tier 3 rural applicants",
      regulatory_flag: "Fair Housing & Equal Credit Opportunity Act (ECOA) Proxy Redlining"
    },
    {
      pattern_id: "PAT-003",
      name: "Hallucinated Credential Sensitivity",
      attribute: "resume_text / skills",
      severity: "Medium",
      detected_at: "Sep 28, 2026",
      delta_effect: "18% false positive boost on unverified buzzwords",
      regulatory_flag: "Veritas AI Grounding Safety Standard"
    }
  ];

  const filteredModels = models.filter((m: any) => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-[#0e0e17] text-zinc-100 min-h-screen p-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between pb-6 border-b border-indigo-950/60 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Deepchecks Continuous Governance Engine
            </span>
            <span className="text-xs text-zinc-400">Time-Series Bias & Drift Tracking</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Continuous Model Monitoring
          </h1>
          <p className="text-sm text-zinc-400">
            Track prediction volume, label drift, grounding accuracy, and emerging bias patterns over time across audit runs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Streaming Ingestion Active
          </div>
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Live Stream Event Banner if Active Evaluation Passed */}
      {activeEvaluation && (
        <div className="mb-6 p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/40 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <div>
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">
                Live Audit Event Ingested Into Telemetry
              </span>
              <p className="text-xs text-zinc-300">
                Evaluation Score: <strong className="text-white">{activeEvaluation.score || activeEvaluation.originalEvaluation?.score} pts</strong> | 
                Decision: <strong className="text-white">{activeEvaluation.decision || activeEvaluation.originalEvaluation?.decision}</strong> | 
                Timestamp: <span className="font-mono text-zinc-400">Just Now (Batch Synced)</span>
              </p>
            </div>
          </div>
          {onBackToAuditor && (
            <button
              onClick={onBackToAuditor}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 border border-indigo-500/40 transition"
            >
              ← Back to Hiring/Lending Auditor
            </button>
          )}
        </div>
      )}

      {/* Main Layout: Left Models List + Right Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Left Models Sidebar */}
        <div className="lg:col-span-4 bg-[#141422] border border-indigo-950 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-indigo-950 mb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                Models Inventory
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-red-400 font-mono">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>5 Critical</span>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search model..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-[#1b1b2f] border border-indigo-950/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Models Item List */}
            <div className="space-y-2">
              {filteredModels.map((m: any) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedModel(m.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                    selectedModel === m.id
                      ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md'
                      : 'bg-[#18182b] border-indigo-950/60 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-200">{m.name}</h3>
                    <p className="text-[10px] text-zinc-500">Last data update: {m.last_data_update}</p>
                  </div>
                  {m.critical_alerts > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                      {m.critical_alerts}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      0
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-indigo-950/80 flex justify-between items-center text-xs text-zinc-400">
            <span>Audit Checkpoint: <strong>Sep 30, 2026</strong></span>
            <span className="text-indigo-400 font-mono">100% verified</span>
          </div>
        </div>

        {/* Right Area: Prediction Data Status Line Chart */}
        <div className="lg:col-span-8 bg-[#141422] border border-indigo-950 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-indigo-950 mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Prediction Data Status</h2>
              <p className="text-xs text-zinc-400">Inference request volume & drift curves over the last 7 days</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2.5 h-0.5 bg-cyan-400 rounded"></span> FinCorp Loans
              </span>
              <span className="flex items-center gap-1.5 text-purple-400">
                <span className="w-2.5 h-0.5 bg-purple-400 rounded"></span> TechHire Resumes
              </span>
              <span className="flex items-center gap-1.5 text-indigo-400">
                <span className="w-2.5 h-0.5 bg-indigo-400 rounded"></span> Ecommerce Risk
              </span>
            </div>
          </div>

          {/* Line Chart Representation matching Image 2 */}
          <div className="h-44 w-full flex items-end justify-between gap-2 pt-6 px-2 relative border-b border-indigo-950">
            {timeSeries.map((d: any, i: number) => {
              const techHeight = (d.techhire_resumes / 2000) * 100;
              const finHeight = (d.fincorp_loans / 2000) * 100;
              const ecomHeight = (d.ecommerce_risk / 2000) * 100;

              return (
                <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  <div className="w-full flex justify-center gap-1 items-end h-full">
                    {/* FinCorp bar */}
                    <div 
                      className="w-1.5 bg-cyan-400/80 rounded-t transition-all group-hover:bg-cyan-300"
                      style={{ height: `${finHeight}%` }}
                    ></div>
                    {/* TechHire bar */}
                    <div 
                      className="w-1.5 bg-purple-500/80 rounded-t transition-all group-hover:bg-purple-300"
                      style={{ height: `${techHeight}%` }}
                    ></div>
                    {/* Ecom bar */}
                    <div 
                      className="w-1.5 bg-indigo-500/80 rounded-t transition-all group-hover:bg-indigo-300"
                      style={{ height: `${ecomHeight}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-2 font-mono">{d.date}</span>

                  {/* Tooltip on hover */}
                  <div className="absolute -top-12 hidden group-hover:flex flex-col bg-zinc-900 border border-zinc-700 px-2 py-1 rounded shadow text-[10px] z-10 whitespace-nowrap">
                    <span>{d.date}: {d.techhire_resumes + d.fincorp_loans + d.ecommerce_risk} requests</span>
                    <span className="text-red-400 font-mono">Drift: {d.prediction_drift}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-[11px] text-zinc-500 mt-2 px-1 font-mono">
            <span>Volume range: 500 - 2,000 req/day</span>
            <span>Prediction Drift Peak: <strong>0.23 (Sep 30)</strong></span>
          </div>
        </div>
      </div>

      {/* Monitors Row (Image 2 bottom cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Monitor 1: Label Drift */}
        <div className="bg-[#141422] border border-indigo-950 rounded-xl p-4 shadow">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-zinc-400 font-medium">Label Drift</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {monitors.label_drift.status}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold font-mono text-zinc-100">{monitors.label_drift.score}</span>
            <span className="text-xs text-zinc-500 font-mono">threshold: {monitors.label_drift.threshold}</span>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-amber-400 h-full" style={{ width: `${(monitors.label_drift.score / 0.3) * 100}%` }}></div>
          </div>
        </div>

        {/* Monitor 2: F1 Performance */}
        <div className="bg-[#141422] border border-indigo-950 rounded-xl p-4 shadow">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-zinc-400 font-medium">F1 Performance</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
              {monitors.f1_performance.status}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold font-mono text-zinc-100">{monitors.f1_performance.score}</span>
            <span className="text-xs text-zinc-500 font-mono">target: &gt; {monitors.f1_performance.threshold}</span>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-red-400 h-full" style={{ width: `${monitors.f1_performance.score * 100}%` }}></div>
          </div>
        </div>

        {/* Monitor 3: Percent of Nulls */}
        <div className="bg-[#141422] border border-indigo-950 rounded-xl p-4 shadow">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-zinc-400 font-medium">Percent of Nulls</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {monitors.percent_of_nulls.status}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold font-mono text-zinc-100">{(monitors.percent_of_nulls.score * 100).toFixed(1)}%</span>
            <span className="text-xs text-zinc-500 font-mono">limit: &lt; 5.0%</span>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-400 h-full" style={{ width: `${(monitors.percent_of_nulls.score / 0.05) * 100}%` }}></div>
          </div>
        </div>

        {/* Monitor 4: Prediction Drift Score (Foreground Callout Card from Image 2) */}
        <div className="bg-[#1b1733] border border-purple-500/40 rounded-xl p-4 shadow-lg relative">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-purple-300 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
              Prediction Drift Score
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/30 text-red-200 border border-red-500/40">
              Drift Alert
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-black font-mono text-purple-200">{monitors.prediction_drift.score}</span>
            <span className="text-xs text-zinc-400 font-mono">threshold: 0.20</span>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-purple-400 h-full" style={{ width: `${Math.min((monitors.prediction_drift.score / 0.3) * 100, 100)}%` }}></div>
          </div>
        </div>
      </div>

      {/* Emerging Bias Patterns Across Audit Runs */}
      <div className="bg-[#141422] border border-indigo-950 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-indigo-950 mb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Emerging Bias Patterns Across Continuous Audit Runs
            </h2>
            <p className="text-xs text-zinc-400">
              Automated drift detectors identified systemic disparate impact emerging over longitudinal batches
            </p>
          </div>
          <span className="text-xs text-zinc-400 font-mono">3 Patterns Detected</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {emergingPatterns.map((pat: any) => (
            <div key={pat.pattern_id} className="p-4 rounded-xl bg-[#18182b] border border-indigo-950/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-zinc-500">{pat.pattern_id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    pat.severity === 'Critical'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : pat.severity === 'High'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                  }`}>
                    {pat.severity}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-zinc-200 mb-1">{pat.name}</h3>
                <p className="text-[11px] text-zinc-400 mb-2">{pat.delta_effect}</p>
              </div>
              <div className="pt-2 border-t border-indigo-950/60">
                <span className="text-[10px] text-indigo-400 block font-mono">{pat.regulatory_flag}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
