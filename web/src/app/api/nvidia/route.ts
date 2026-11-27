import { NextResponse } from 'next/server';

// Allow Vercel Functions to run for up to 300s (Pro plan) so NVIDIA NIM
// reasoning model calls (which can take 60-120s) complete before timeout.
export const maxDuration = 300;

const IS_PROD = process.env.NODE_ENV === 'production';
const FASTAPI_URL = process.env.VERITAS_BACKEND_URL || (IS_PROD ? '' : 'http://127.0.0.1:8000');

function adaptFastApiResponse(fa: any) {
  const prim = fa.primary_evaluation || {};
  const twin = fa.counterfactual_twin_test || {};
  const grp = fa.group_fairness || {};
  const grd = fa.grounding_audit || {};
  const dpdp = fa.dpdp_audit || {};

  return {
    model: fa.model_name,
    adapterType: fa.adapter_type,
    capabilities: fa.capabilities,
    consentRecord: fa.consent_record,
    preInferenceSanitizationEnforced: fa.pre_inference_sanitization_enforced,
    originalEvaluation: {
      score: prim.score,
      decision: prim.decision,
      reasoning: prim.rationale,
      reasoningChain: prim.reasoning_chain || ''
    },
    whyShouldHire: prim.why_positive || [],
    whyShouldNotHire: prim.why_flags || [],
    groundingAudit: {
      groundingScore: grd.grounding_rate,
      ungroundedRate: grd.ungrounded_rate,
      testedClaims: (grd.tested_claims || []).map((tc: any) => ({
        claim: tc.claim,
        status: tc.status,
        confidence: tc.overlap_ratio ?? 0,
        sourceSnippet: (tc.matched_evidence || []).join(', ') || 'No direct keyword match in source text'
      })),
      hallucinationsCount: grd.hallucinations_count ?? 0,
      methodology: grd.methodology
    },
    counterfactualTwinTest: {
      supported: twin.supported,
      twinProfile: twin.twin_profile,
      twinScore: twin.twin_score,
      twinDecision: twin.twin_decision,
      scoreShiftDelta: twin.score_shift_delta,
      signedDelta: twin.signed_delta,
      isolatedAttribution: twin.isolated_attribution || [],
      measuredDisparateImpactRatio: grp.disparate_impact_ratio,
      eeocFourFifthsPass: grp.eeoc_four_fifths_pass,
      explanation: twin.explanation
    },
    pairedStatistics: fa.paired_statistics,
    groupFairness: grp,
    intersectionalFairness: fa.intersectional_fairness,
    ruleExtraction: fa.rule_extraction,
    robustness: fa.robustness,
    privacyCanaryProbe: fa.privacy_canary_probe,
    promptInjectionProbe: fa.prompt_injection_probe,
    ledgerReceipt: fa.ledger_receipt,
    dpdpAudit: {
      compliant: dpdp.compliant,
      violationsCount: dpdp.violations_count,
      violations: (dpdp.findings || []).map((f: any) => `${f.section}: ${f.type}`),
      findings: dpdp.findings || []
    }
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      candidate,
      domain = 'hiring',
      model = process.env.NVIDIA_MODEL || 'nvidia/nemotron-3.5-lightning-30b-a3b',
      adapterType = 'llm',
      endpointUrl = '',
      plantedBiasPoints = 12,
      mitigate = false,
      consentConfirmed = false,
      consentActor = 'web-auditor'
    } = body;

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate / applicant profile required' }, { status: 400 });
    }

    if (domain === 'hiring') {
      const resume = String(candidate.resume_text || candidate.notes || '').trim();
      if (!resume) {
        return NextResponse.json(
          { error: 'Resume text cannot be empty or whitespace-only for hiring audits.' },
          { status: 400 }
        );
      }
    } else {
      const statement = String(candidate.statement_text || candidate.notes || '').trim();
      const income = candidate.monthly_income_inr || candidate.annual_income_inr || candidate.income || candidate.monthly_income;
      if (!statement && !income) {
        return NextResponse.json(
          { error: 'Financial statement or income details cannot be empty for lending audits.' },
          { status: 400 }
        );
      }
    }

    if (!consentConfirmed) {
      return NextResponse.json(
        { error: 'DPDP Act Section 6 explicit consent confirmation is required before running an audit.' },
        { status: 403 }
      );
    }

    if (!FASTAPI_URL) {
      return NextResponse.json(
        {
          error:
            'VERITAS_BACKEND_URL is not configured in production environment variables. Deploy ml_engine/server.py and set VERITAS_BACKEND_URL on Vercel.'
        },
        { status: 503 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 240000); // 240s — allow NVIDIA NIM reasoning model to complete
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (process.env.VERITAS_API_SECRET) {
      headers['X-Veritas-Key'] = process.env.VERITAS_API_SECRET;
    }

    let faRes: Response;
    try {
      faRes = await fetch(`${FASTAPI_URL.replace(/\/$/, '')}/audit/run`, {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          profile: candidate,
          domain,
          adapter_type: adapterType,
          model_name: model,
          endpoint_url: endpointUrl,
          planted_bias_points: plantedBiasPoints,
          mitigate,
          consent_confirmed: Boolean(consentConfirmed),
          consent_actor: consentActor,
          n_cohort_pairs: 6
        })
      });
    } catch (connErr: any) {
      clearTimeout(timeout);
      return NextResponse.json(
        {
          error: `FastAPI audit backend at ${FASTAPI_URL} is unreachable (${connErr?.message || 'connection error'}). Refusing to return a partial audit as a full audit.`
        },
        { status: 503 }
      );
    }
    clearTimeout(timeout);

    if (!faRes.ok) {
      const errDetail = await faRes.text();
      return NextResponse.json(
        { error: `FastAPI audit backend error (${faRes.status}): ${errDetail}` },
        { status: faRes.status }
      );
    }

    const faJson = await faRes.json();
    return NextResponse.json(adaptFastApiResponse(faJson));
  } catch (error: any) {
    console.error('Audit Proxy Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to execute audit' }, { status: 500 });
  }
}
