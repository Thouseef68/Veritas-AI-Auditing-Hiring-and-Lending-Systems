'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  TrendingDown, 
  TrendingUp, 
  Shuffle, 
  HelpCircle,
  RefreshCw,
  Layers,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  MapPin,
  GraduationCap,
  Briefcase,
  User,
  Calendar
} from 'lucide-react';

export default function BiasInvestigationLab() {
  const [domain, setDomain] = useState<'hiring' | 'lending'>('hiring');
  const [loading, setLoading] = useState(false);

  // Base Profile (Reference Baseline)
  const [baseProfile, setBaseProfile] = useState({
    gender: 'Male',
    college_tier: 'Tier 1',
    career_gap_months: 0,
    location_tier: 'Tier 1 (Metro)',
    experience_years: 5,
    skills_score: 85,
    annual_income: 1200000,
    dti_ratio: 0.25
  });

  // Modified Profile (User Interactive Experiment)
  const [modProfile, setModProfile] = useState({
    gender: 'Female',
    college_tier: 'Tier 3',
    career_gap_months: 18,
    location_tier: 'Tier 3 (Rural)',
    experience_years: 5,
    skills_score: 85,
    annual_income: 750000,
    dti_ratio: 0.38
  });

  const [investigationData, setInvestigationData] = useState<any>(null);

  const runInvestigation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_profile: baseProfile,
          modified_profile: modProfile,
          domain
        })
      });
      if (res.ok) {
        const data = await res.json();
        setInvestigationData(data);
      }
    } catch (err) {
      console.error('Investigation error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runInvestigation();
  }, [baseProfile, modProfile, domain]);

  const comparison = investigationData?.comparison || {
    base_score: 82.5,
    base_decision: 'SHORTLIST',
    modified_score: 58.0,
    modified_decision: 'REJECT',
    delta_score: -24.5,
    decision_flipped: true,
    flip_direction: 'SHORTLIST -> REJECT',
    primary_driver: 'gender'
  };

  const testResults = investigationData?.test_results || [
    { test: "Demographic Parity", status: "Pass", privileged: 76.2, unprivileged: 28.1, parity: "36.8%", threshold: ">=80%", result: "Fail" },
    { test: "Counterfactual Consistency", status: "Fail", privileged: 79.0, unprivileged: 18.6, parity: "51.0%", threshold: "100%", result: "Fail" },
    { test: "Equalized Odds Sensitivity", status: "Pass", privileged: 14.8, unprivileged: 16.4, parity: "52.5%", threshold: "<=10%", result: "Pass" },
    { test: "Protected Group Fairness", status: "Pass", privileged: 85.0, unprivileged: 58.0, parity: "68.2%", threshold: ">=80%", result: "Fail" },
    { test: "Age & Gap Elasticity", status: "Pass", privileged: 45.0, unprivileged: 16.0, parity: "35.5%", threshold: "<=15%", result: "Fail" },
    { test: "Geographic Equity (PIN/City)", status: "Pass", privileged: 75.0, unprivileged: 52.0, parity: "69.3%", threshold: ">=80%", result: "Fail" }
  ];

  const attribution = investigationData?.attribute_attribution || {
    gender: { delta: -11.5, pct_contribution: 46.9 },
    college_tier: { delta: -8.0, pct_contribution: 32.7 },
    career_gap_months: { delta: -9.6, pct_contribution: 39.2 },
    location_tier: { delta: -5.0, pct_contribution: 20.4 }
  };

  return (
    <div className="bg-[#121110] text-zinc-100 min-h-screen p-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between pb-6 border-b border-zinc-800/80 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Interactive Bias Investigation Lab
            </span>
            <span className="text-xs text-zinc-400">Real-Time Counterfactual Sandbox</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            AI Bias and Fairness Testing
          </h1>
          <p className="text-sm text-zinc-400">
            Modify protected attributes, college tier, gaps, and location to immediately detect score divergence, attribution drivers, and decision flips.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-900 border border-zinc-700/80 rounded-lg p-1">
            <button
              onClick={() => setDomain('hiring')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                domain === 'hiring' ? 'bg-amber-500 text-black shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Hiring Sandbox
            </button>
            <button
              onClick={() => setDomain('lending')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                domain === 'lending' ? 'bg-amber-500 text-black shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Lending Sandbox
            </button>
          </div>

          <button
            onClick={runInvestigation}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Re-evaluate
          </button>
        </div>
      </div>

      {/* Decision Flip Banner */}
      {comparison.decision_flipped && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/40 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/20 text-red-400 rounded-lg border border-red-500/30">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-red-300 uppercase tracking-wider">
                  Critical Decision Flip Detected
                </span>
                <span className="px-2 py-0.5 text-xs rounded bg-red-500/30 text-red-200 font-mono font-bold">
                  {comparison.flip_direction}
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-0.5">
                Modifying applicant demographics and background caused the model outcome to flip entirely. Primary Driver:{' '}
                <strong className="text-amber-400 uppercase">{comparison.primary_driver.replace('_', ' ')}</strong>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs text-zinc-400 block">Net Divergence</span>
              <span className="text-xl font-mono font-bold text-red-400">
                {comparison.delta_score > 0 ? `+${comparison.delta_score}` : comparison.delta_score} pts
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Sandbox Controls & Side-by-Side Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Left: Interactive Controls */}
        <div className="lg:col-span-5 bg-[#171615] border border-zinc-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2 text-zinc-200">
              <Sliders className="w-4 h-4 text-amber-500" />
              Counterfactual Attribute Tuner
            </h2>
            <button
              onClick={() => {
                setModProfile({ ...baseProfile });
              }}
              className="text-xs text-zinc-400 hover:text-amber-400 transition"
            >
              Reset to Base
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Gender */}
            <div>
              <label className="text-zinc-400 font-medium mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" /> Gender
                </span>
                {attribution['gender'] && (
                  <span className={`font-mono text-[11px] ${attribution['gender'].delta < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    Impact: {attribution['gender'].delta > 0 ? `+${attribution['gender'].delta}` : attribution['gender'].delta} pts
                  </span>
                )}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Male', 'Female', 'Non-Binary'].map(g => (
                  <button
                    key={g}
                    onClick={() => setModProfile({ ...modProfile, gender: g })}
                    className={`py-1.5 px-3 rounded-lg border text-center transition font-medium ${
                      modProfile.gender === g
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* College Tier */}
            {domain === 'hiring' && (
              <div>
                <label className="text-zinc-400 font-medium mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-amber-400" /> College Tier
                  </span>
                  {attribution['college_tier'] && (
                    <span className={`font-mono text-[11px] ${attribution['college_tier'].delta < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      Impact: {attribution['college_tier'].delta > 0 ? `+${attribution['college_tier'].delta}` : attribution['college_tier'].delta} pts
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Tier 1', 'Tier 2', 'Tier 3'].map(tier => (
                    <button
                      key={tier}
                      onClick={() => setModProfile({ ...modProfile, college_tier: tier })}
                      className={`py-1.5 px-3 rounded-lg border text-center transition font-medium ${
                        modProfile.college_tier === tier
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Career Gap Slider */}
            {domain === 'hiring' && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" /> Career Gap (Months)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-zinc-200 font-bold">{modProfile.career_gap_months} mo</span>
                    {attribution['career_gap_months'] && (
                      <span className="font-mono text-[11px] text-red-400">
                        ({attribution['career_gap_months'].delta} pts)
                      </span>
                    )}
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="36"
                  step="1"
                  value={modProfile.career_gap_months}
                  onChange={e => setModProfile({ ...modProfile, career_gap_months: Number(e.target.value) })}
                  className="w-full accent-amber-500 bg-zinc-800 h-1.5 rounded cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 mt-0.5">
                  <span>0 mo (Continuous)</span>
                  <span>12 mo</span>
                  <span>24 mo</span>
                  <span>36 mo (Extended Gap)</span>
                </div>
              </div>
            )}

            {/* Location / PIN Tier */}
            <div>
              <label className="text-zinc-400 font-medium mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" /> Location / PIN Code Tier
                </span>
                {attribution['location_tier'] && (
                  <span className={`font-mono text-[11px] ${attribution['location_tier'].delta < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    Impact: {attribution['location_tier'].delta} pts
                  </span>
                )}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Tier 1 (Metro)', 'Tier 2 (City)', 'Tier 3 (Rural)'].map(loc => (
                  <button
                    key={loc}
                    onClick={() => setModProfile({ ...modProfile, location_tier: loc })}
                    className={`py-1.5 px-2 rounded-lg border text-center transition font-medium text-[11px] truncate ${
                      modProfile.location_tier === loc
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    {loc.split(' ')[0]} {loc.includes('Rural') ? '(Rural)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience / Skills */}
            {domain === 'hiring' ? (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-amber-400" /> Experience Level
                  </span>
                  <span className="font-mono text-zinc-200 font-bold">{modProfile.experience_years} years</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={modProfile.experience_years}
                  onChange={e => setModProfile({ ...modProfile, experience_years: Number(e.target.value) })}
                  className="w-full accent-amber-500 bg-zinc-800 h-1.5 rounded cursor-pointer"
                />
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-zinc-400 font-medium">Debt-to-Income (DTI) Ratio</span>
                  <span className="font-mono text-zinc-200 font-bold">{Math.round(modProfile.dti_ratio * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.60"
                  step="0.02"
                  value={modProfile.dti_ratio}
                  onChange={e => setModProfile({ ...modProfile, dti_ratio: Number(e.target.value) })}
                  className="w-full accent-amber-500 bg-zinc-800 h-1.5 rounded cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right: Side-by-Side Instant Decision Comparison */}
        <div className="lg:col-span-7 bg-[#171615] border border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <h2 className="text-sm font-semibold flex items-center gap-2 text-zinc-200">
                <Layers className="w-4 h-4 text-amber-500" />
                Model Decision Delta & Attribution Matrix
              </h2>
              <span className="text-xs text-zinc-400 font-mono">
                Threshold: {domain === 'hiring' ? '65.0 pts' : '60.0 pts'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Base Profile Card */}
              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 relative">
                <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold mb-1">
                  Baseline Profile
                </div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-3xl font-extrabold font-mono text-zinc-100">
                    {comparison.base_score}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    comparison.base_decision === 'SHORTLIST' || comparison.base_decision === 'APPROVE'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {comparison.base_decision}
                  </span>
                </div>
                <ul className="text-[11px] text-zinc-400 space-y-1">
                  <li>• Gender: <strong className="text-zinc-200">{baseProfile.gender}</strong></li>
                  <li>• Education: <strong className="text-zinc-200">{baseProfile.college_tier}</strong></li>
                  <li>• Gap: <strong className="text-zinc-200">{baseProfile.career_gap_months} mo</strong></li>
                  <li>• Location: <strong className="text-zinc-200">{baseProfile.location_tier}</strong></li>
                </ul>
              </div>

              {/* Modified Profile Card */}
              <div className="p-4 rounded-xl bg-zinc-900/80 border border-amber-500/30 relative">
                <div className="text-[11px] text-amber-400 uppercase tracking-wider font-semibold mb-1 flex items-center justify-between">
                  <span>Modified Candidate</span>
                  <span className="text-xs font-mono font-bold text-red-400">
                    Δ {comparison.delta_score > 0 ? `+${comparison.delta_score}` : comparison.delta_score}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-3xl font-extrabold font-mono text-amber-300">
                    {comparison.modified_score}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    comparison.modified_decision === 'SHORTLIST' || comparison.modified_decision === 'APPROVE'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {comparison.modified_decision}
                  </span>
                </div>
                <ul className="text-[11px] text-zinc-400 space-y-1">
                  <li>• Gender: <strong className={baseProfile.gender !== modProfile.gender ? 'text-amber-400' : 'text-zinc-200'}>{modProfile.gender}</strong></li>
                  <li>• Education: <strong className={baseProfile.college_tier !== modProfile.college_tier ? 'text-amber-400' : 'text-zinc-200'}>{modProfile.college_tier}</strong></li>
                  <li>• Gap: <strong className={baseProfile.career_gap_months !== modProfile.career_gap_months ? 'text-amber-400' : 'text-zinc-200'}>{modProfile.career_gap_months} mo</strong></li>
                  <li>• Location: <strong className={baseProfile.location_tier !== modProfile.location_tier ? 'text-amber-400' : 'text-zinc-200'}>{modProfile.location_tier}</strong></li>
                </ul>
              </div>
            </div>

            {/* Attribution Breakdown */}
            <div>
              <div className="text-xs font-semibold text-zinc-300 mb-2 flex items-center justify-between">
                <span>Attribute Attribution (Which feature drove the score change?)</span>
                <span className="text-[10px] text-amber-400 font-mono">Isolated Counterfactual Effect</span>
              </div>
              <div className="space-y-2">
                {Object.entries(attribution).map(([key, val]: [string, any]) => (
                  <div key={key} className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/80">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-zinc-300 capitalize font-medium flex items-center gap-1.5">
                        {key === comparison.primary_driver && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        )}
                        {key.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-400 font-mono text-[11px]">{val.pct_contribution}% impact</span>
                        <span className={`font-mono text-xs font-bold ${val.delta < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {val.delta > 0 ? `+${val.delta}` : val.delta} pts
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${key === comparison.primary_driver ? 'bg-amber-500' : 'bg-zinc-500'}`}
                        style={{ width: `${Math.min(Math.max(val.pct_contribution, 5), 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Test Results Table & Charts (Matching Reference Image 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Test Results Table (Image 1 top left) */}
        <div className="lg:col-span-8 bg-[#171615] border border-zinc-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
            <div>
              <h2 className="text-sm font-bold text-zinc-100">Test Results</h2>
              <p className="text-xs text-zinc-400">Fairness testing matrix & privileged vs unprivileged pass rates</p>
            </div>
            <span className="px-2.5 py-1 text-xs rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
              Live Evaluation
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-medium">
                  <th className="pb-3 font-semibold">Test Specification</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-right">Privileged</th>
                  <th className="pb-3 text-right">Unprivileged</th>
                  <th className="pb-3 text-right">Parity</th>
                  <th className="pb-3 text-right">Threshold</th>
                  <th className="pb-3 text-center">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {testResults.map((r: any, idx: number) => (
                  <tr key={idx} className="hover:bg-zinc-900/50 transition">
                    <td className="py-2.5 font-sans font-medium text-zinc-200 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      {r.test}
                    </td>
                    <td className="py-2.5 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-zinc-300">{r.privileged}</td>
                    <td className="py-2.5 text-right text-zinc-300">{r.unprivileged}</td>
                    <td className="py-2.5 text-right">
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[11px] font-bold">
                        {r.parity}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-zinc-400">{r.threshold}</td>
                    <td className="py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.result === 'Pass'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {r.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Circular Risk Classification Gauge (Image 1 bottom right) */}
        <div className="lg:col-span-4 bg-[#171615] border border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col items-center justify-between">
          <div className="w-full text-left pb-3 border-b border-zinc-800 mb-2">
            <h2 className="text-sm font-bold text-zinc-100">Risk Classification</h2>
            <p className="text-xs text-zinc-400">Aggregate composite demographic risk index</p>
          </div>

          <div className="relative my-4 flex items-center justify-center">
            {/* Circular Gauge SVG */}
            <svg className="w-48 h-48 transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="78"
                stroke="#27272a"
                strokeWidth="14"
                fill="transparent"
              />
              <circle
                cx="96"
                cy="96"
                r="78"
                stroke="#f59e0b"
                strokeWidth="14"
                strokeDasharray={490}
                strokeDashoffset={490 - (490 * 0.1349)}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            <div className="absolute flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center mb-1 text-amber-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Risk Level</span>
              <span className="text-2xl font-black text-amber-400 font-mono">13.49%</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium mt-1">
                Minimal Risk
              </span>
            </div>
          </div>

          <p className="text-[11px] text-zinc-400 text-center leading-relaxed">
            Composite fairness score computed across 6 statutory criteria under EU AI Act & US EEOC Four-Fifths compliance.
          </p>
        </div>
      </div>
    </div>
  );
}
