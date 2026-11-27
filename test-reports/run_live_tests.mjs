import fs from "fs";

const FRONTEND = "https://veritas-ai-auditor.vercel.app";
const BACKEND = "https://veritas-ai-backend-thouseef68s-projects.vercel.app";

const REDACTED_RESUME = `[REDACTED CANDIDATE]
Bengaluru, India | [REDACTED PHONE] | [REDACTED EMAIL]
SUMMARY: BCA student (graduating June 2027) focused on AI and machine learning, quantum image encoding manuscript submitted to Springer Nature. IBM SkillsBuild AI & ML Intern (2025): Random Forest and XGBoost at ~92% accuracy, cut false positives by 15%.
PROJECTS: Real-Time Graph-Based Financial Fraud Detection Engine (XGBoost, Redis, TreeSHAP, PR-AUC 0.9990); EmailGuard AI (DeBERTa-v3, XGBoost, 98.33% accuracy); Agentic RAG Research Assistant (LangGraph, ChromaDB, FastAPI, RAGAS); SupplyChainIQ (CatBoost, FastAPI, React).
EDUCATION: BCA, Dayananda Sagar University, Bengaluru (Expected June 2027); Diploma in CSE, Perumal Polytechnic College (2024, 90.8%).
SKILLS: Python, SQL, PyTorch, XGBoost, CatBoost, Scikit-learn, LangGraph, RAG, Qiskit, FastAPI, Redis, ChromaDB, GCP.`;

async function timedFetch(url, options = {}) {
  const t0 = Date.now();
  try {
    const res = await fetch(url, options);
    const ms = Date.now() - t0;
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return { status: res.status, ms, ok: res.ok, json, textPreview: text.slice(0, 300) };
  } catch (err) {
    return { status: 0, ms: Date.now() - t0, ok: false, error: err.message };
  }
}

async function main() {
  const out = {};

  // 1. Live LLM Call #1
  out.llm_run_1 = await timedFetch(`${FRONTEND}/api/nvidia`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      domain: "hiring",
      adapterType: "llm",
      consentConfirmed: true,
      candidate: {
        name: "[REDACTED]",
        gender: "Male",
        college: "Dayananda Sagar University",
        college_tier: "Tier 2",
        career_gap_months: 0,
        location: "Bengaluru",
        location_tier: "Metro",
        resume_text: REDACTED_RESUME,
      },
    }),
  });

  // 2. Live LLM Call #2 (Repeatability)
  out.llm_run_2 = await timedFetch(`${FRONTEND}/api/nvidia`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      domain: "hiring",
      adapterType: "llm",
      consentConfirmed: true,
      candidate: {
        name: "[REDACTED]",
        gender: "Male",
        college: "Dayananda Sagar University",
        college_tier: "Tier 2",
        career_gap_months: 0,
        location: "Bengaluru",
        location_tier: "Metro",
        resume_text: REDACTED_RESUME,
      },
    }),
  });

  // 3. Consent Denied
  out.consent_denied = await timedFetch(`${FRONTEND}/api/nvidia`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      domain: "hiring",
      adapterType: "ml_model",
      consentConfirmed: false,
      candidate: { name: "[REDACTED]", resume_text: REDACTED_RESUME },
    }),
  });

  // 4. Empty Resume
  out.empty_resume = await timedFetch(`${FRONTEND}/api/nvidia`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      domain: "hiring",
      adapterType: "ml_model",
      consentConfirmed: true,
      candidate: { name: "[REDACTED]", resume_text: "" },
    }),
  });

  // 5. Backend Auth: Missing X-Veritas-Key
  out.backend_no_key = await timedFetch(`${BACKEND}/audit/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain: "hiring", adapter_type: "ml_model", consent_confirmed: true, profile: { name: "Test" } }),
  });

  // 6. Backend Auth: Invalid X-Veritas-Key
  out.backend_bad_key = await timedFetch(`${BACKEND}/audit/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Veritas-Key": "invalid-secret-key" },
    body: JSON.stringify({ domain: "hiring", adapter_type: "ml_model", consent_confirmed: true, profile: { name: "Test" } }),
  });

  // 7. Backend History (check if unauthenticated or protected)
  out.backend_history_no_key = await timedFetch(`${BACKEND}/audit/history`);

  fs.writeFileSync("test-reports/live_test_results.json", JSON.stringify(out, null, 2));
  console.log("LIVE TESTS COMPLETED. Saved to test-reports/live_test_results.json");
}

main();
