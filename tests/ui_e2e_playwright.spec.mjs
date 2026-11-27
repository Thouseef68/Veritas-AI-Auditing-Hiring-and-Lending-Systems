/**
 * Playwright / Node E2E UI & API Test Suite for VERITAS AI.
 * Validates:
 * 1. Document upload and parsing endpoint (/api/external-audit).
 * 2. Empty/whitespace resume rejection (/api/nvidia -> 400).
 * 3. Consent enforcement (/api/nvidia -> 403).
 * 4. Full hiring audit pipeline execution (/api/nvidia -> 200).
 * 5. Lending solvency evaluation with normalized income and DTI.
 */

import fs from 'fs';
import path from 'path';

const FRONTEND_URL = process.env.VERITAS_FRONTEND_URL || 'https://veritas-ai-auditor.vercel.app';

async function runTest(name, fn) {
  process.stdout.write(`[TEST] ${name} ... `);
  const t0 = Date.now();
  try {
    await fn();
    console.log(`PASS (${Date.now() - t0}ms)`);
    return { name, status: 'PASS', ms: Date.now() - t0 };
  } catch (err) {
    console.log(`FAIL (${Date.now() - t0}ms): ${err.message}`);
    return { name, status: 'FAIL', ms: Date.now() - t0, error: err.message };
  }
}

async function main() {
  console.log(`\n==================================================`);
  console.log(`VERITAS AI — End-to-End UI & Integration Test Suite`);
  console.log(`Target: ${FRONTEND_URL}`);
  console.log(`==================================================\n`);

  const results = [];

  // 1. Resume Document Upload & Text Parsing
  results.push(
    await runTest('POST /api/external-audit resume upload & text extraction', async () => {
      const sampleResume = `THOUSEEF F\nBengaluru, India | 8015228296\nBCA Dayananda Sagar University (2027)\nSkills: Python, PyTorch, XGBoost, FastAPI, Qiskit\nProjects: Real-time fraud detection engine with Redis and XGBoost.`;
      const formData = new FormData();
      formData.append('file', new Blob([sampleResume], { type: 'text/plain' }), 'Thouseef_Resume.txt');
      formData.append('action', 'resume_parse');

      const res = await fetch(`${FRONTEND_URL}/api/external-audit`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }
      const data = await res.json();
      if (!data.resumeAnalysis?.cleanText) {
        throw new Error('Response did not contain resumeAnalysis.cleanText');
      }
      if (!data.resumeAnalysis.cleanText.includes('XGBoost')) {
        throw new Error('Extracted text missing expected skill "XGBoost"');
      }
    })
  );

  // 2. Empty Resume Rejection
  results.push(
    await runTest('POST /api/nvidia rejects empty or whitespace-only resume', async () => {
      const res = await fetch(`${FRONTEND_URL}/api/nvidia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate: { full_name: 'Test', resume_text: '   ' },
          domain: 'hiring',
          consentConfirmed: true,
        }),
      });

      if (res.status !== 400) {
        throw new Error(`Expected status 400, got ${res.status}`);
      }
      const data = await res.json();
      if (!data.error || !data.error.includes('empty')) {
        throw new Error(`Expected empty resume error message, got: ${JSON.stringify(data)}`);
      }
    })
  );

  // 3. Consent Gate Rejection
  results.push(
    await runTest('POST /api/nvidia blocks audit when consentConfirmed is false', async () => {
      const res = await fetch(`${FRONTEND_URL}/api/nvidia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate: { full_name: 'Test', resume_text: 'Experienced developer.' },
          domain: 'hiring',
          consentConfirmed: false,
        }),
      });

      if (res.status !== 403) {
        throw new Error(`Expected status 403, got ${res.status}`);
      }
      const data = await res.json();
      if (!data.error || !data.error.includes('consent')) {
        throw new Error(`Expected consent error message, got: ${JSON.stringify(data)}`);
      }
    })
  );

  // 4. Complete Hiring Audit Flow (PlantedBiasModelAdapter)
  results.push(
    await runTest('POST /api/nvidia full hiring audit workflow (ml_model)', async () => {
      const res = await fetch(`${FRONTEND_URL}/api/nvidia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate: {
            full_name: 'Aditi Sen',
            gender: 'Female',
            years_exp: 5,
            career_break_months: 8,
            college_tier: 'Tier 2 (Top State University)',
            github: 'https://github.com/aditisen/cloud',
            portfolio: 'https://aditi.dev',
            resume_text: '5 years experience with React, Node.js, Python, and cloud systems.',
          },
          domain: 'hiring',
          adapterType: 'ml_model',
          consentConfirmed: true,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }
      const data = await res.json();
      if (typeof data.originalEvaluation?.score !== 'number') {
        throw new Error('Missing originalEvaluation.score number');
      }
      if (!data.originalEvaluation?.decision) {
        throw new Error('Missing originalEvaluation.decision');
      }
      if (!data.counterfactualTwinTest?.supported) {
        throw new Error('Expected counterfactualTwinTest.supported == true');
      }
      if (!data.groundingAudit) {
        throw new Error('Missing groundingAudit');
      }
      if (!data.dpdpAudit) {
        throw new Error('Missing dpdpAudit');
      }
    })
  );

  // 5. Lending Audit Solvency Flow
  results.push(
    await runTest('POST /api/nvidia lending solvency evaluation with income & DTI', async () => {
      const res = await fetch(`${FRONTEND_URL}/api/nvidia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate: {
            full_name: 'Synthetic Borrower',
            credit_score: 750,
            income: 850000,
            dti: '28%',
            monthly_obligations: 19800,
            employment_type: 'Salaried',
            tier_location: 'Tier 1 (Metro)',
            statement_text: 'Applicant credit score 750, monthly income Rs. 70,833, DTI 28%.',
          },
          domain: 'lending',
          adapterType: 'ml_model',
          consentConfirmed: true,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }
      const data = await res.json();
      if (data.originalEvaluation?.decision !== 'APPROVE') {
        throw new Error(`Expected decision APPROVE, got ${data.originalEvaluation?.decision}`);
      }
      if (data.originalEvaluation?.score < 65) {
        throw new Error(`Expected score >= 65, got ${data.originalEvaluation?.score}`);
      }
    })
  );

  const passed = results.filter((r) => r.status === 'PASS').length;
  console.log(`\nResults: ${passed}/${results.length} passed.`);
  fs.writeFileSync('test-reports/ui_e2e_results.json', JSON.stringify(results, null, 2));

  if (passed !== results.length) {
    process.exit(1);
  }
}

main();
