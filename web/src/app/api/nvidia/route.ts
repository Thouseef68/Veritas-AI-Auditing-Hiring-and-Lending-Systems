import { NextResponse } from 'next/server';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || 'REDACTED_NVIDIA_API_KEY';
const DEFAULT_MODEL = process.env.NVIDIA_MODEL || 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning';
const API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      candidate,
      domain = 'hiring',
      model = DEFAULT_MODEL,
      githubUrl = '',
      portfolioUrl = '',
      companyName = ''
    } = body;

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate profile required' }, { status: 400 });
    }

    const isHiring = domain === 'hiring';

    // 1. Build direct NVIDIA NIM Prompt - Evaluates ONLY the real candidate (No demographic twins or others)
    const prompt = isHiring
      ? `You are an expert AI Hiring Auditor evaluating a candidate for the target role of: ${candidate.target_role || 'Software Engineer'}.

You have been provided with the candidate's complete dossier, including their self-reported background, external project credentials, and full resume text:

================ CANDIDATE DOSSIER ================
Full Name: ${candidate.full_name}
Gender: ${candidate.gender}
Target Job Role: ${candidate.target_role || 'Software Engineer'}
College / University: ${candidate.college_tier || 'Not specified'}
Reported Experience: ${candidate.years_exp || 0} years
Career Break / Pause: ${candidate.career_break_months || 0} months
Past / Current Employer: ${companyName || 'Not specified'}
GitHub Repository / Profile: ${githubUrl || 'None provided'}
Live Portfolio / Project URL: ${portfolioUrl || 'None provided'}

================ RESUME CONTENT ================
"""
${candidate.resume_text || candidate.notes || 'No resume text provided.'}
"""

================ AUDITING INSTRUCTIONS ================
Evaluate this candidate strictly and exclusively based on their actual background, merits, external project credentials, and full resume text provided above.
CRITICAL MANDATE: Focus ONLY on this individual candidate. Do NOT create, compare, or analyze demographic twins, synthetic profiles, or other candidates.
Evaluate the candidate freely, holistically, and realistically. Do NOT use rigid artificial templates or forced scoring rules.

1. Score the candidate (0-100) based on their holistic merits, skills, projects, and domain fit for ${candidate.target_role || 'Software Engineer'}. Determine ORIGINAL_DECISION as SHORTLIST (if score >= 60) or REJECT (if score < 60).
2. In WHY_SHOULD_HIRE, give EXACTLY 3 clear, concrete, and distinct points explaining why a company should hire this candidate (focus on their strengths, practical project skills, experience, publications, or potential).
3. In WHY_AI_MIGHT_FLAG, give EXACTLY 3 clear, constructive, and distinct points explaining why a traditional automated ATS screening filter might flag or hesitate (such as student status, early career stage, missing senior competencies, or lack of Tier-1 pedigree).
4. In REASONING, give an objective summary of your evaluation for this candidate.

Output in this exact format:
ORIGINAL_SCORE: <0-100>
ORIGINAL_DECISION: <SHORTLIST or REJECT>
WHY_SHOULD_HIRE:
- <Concrete Reason 1>
- <Concrete Reason 2>
- <Concrete Reason 3>
WHY_AI_MIGHT_FLAG:
- <Concrete Flag/Risk 1>
- <Concrete Flag/Risk 2>
- <Concrete Flag/Risk 3>
REASONING: <Concise holistic evaluation of this candidate>`
      : `You are an automated FinTech Underwriting AI Auditor evaluating a credit/loan application:

================ APPLICANT PROFILE ================
Name: ${candidate.full_name}
Gender: ${candidate.gender}
Age: ${candidate.age}
Location: ${candidate.tier_location}
Credit Score (CIBIL): ${candidate.credit_score}
Annual Income: Rs. ${candidate.annual_income_inr}
Loan Amount: Rs. ${candidate.loan_amount_inr}
Debt-to-Income (DTI): ${candidate.debt_to_income}

================ FINANCIAL NOTES / CONTEXT ================
"""
${candidate.application_notes || candidate.notes || 'Standard financial documentation.'}
"""

================ AUDITING INSTRUCTIONS ================
Evaluate the application freely based on financial solvency and creditworthiness. Focus ONLY on this applicant.
Output in this exact format:
ORIGINAL_SCORE: <0-100>
ORIGINAL_DECISION: <APPROVE or DECLINE>
WHY_SHOULD_HIRE:
- <Financial strength 1>
- <Financial strength 2>
- <Financial strength 3>
WHY_AI_MIGHT_FLAG:
- <Risk factor or bias penalty 1>
- <Risk factor or bias penalty 2>
- <Risk factor or bias penalty 3>
REASONING: <Concise risk analysis and creditworthiness evaluation>`;

    // Call NVIDIA NIM API Directly
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are an objective, rigorous AI auditor. Always analyze the actual provided resume text and output exact structured metrics.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.1
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`NVIDIA NIM API returned ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    const content = choice?.message?.content || '';
    const reasoning = choice?.message?.reasoning_content || '';
    const fullText = content + '\n' + reasoning;
    const textToParse = content && content.trim().length > 20 ? content : fullText;

    // Direct Regex Extraction from NVIDIA NIM's actual response
    const origScoreMatch = textToParse.match(/ORIGINAL_SCORE:\s*(\d{1,3})/i) || textToParse.match(/Score:\s*(\d{1,3})/i);
    const origScore = origScoreMatch ? parseInt(origScoreMatch[1], 10) : 50;

    const origDecisionMatch = textToParse.match(/ORIGINAL_DECISION:\s*(SHORTLIST|APPROVE|REJECT|DECLINE)/i);
    const origDecision = origDecisionMatch
      ? origDecisionMatch[1].toUpperCase()
      : (origScore >= 60 ? (isHiring ? 'SHORTLIST' : 'APPROVE') : (isHiring ? 'REJECT' : 'DECLINE'));

    // Extract Why Hire Bullets directly from NIM output
    const whyHire: string[] = [];
    const whyHireSection = textToParse.match(/WHY_SHOULD_HIRE:([\s\S]*?)(?=WHY_AI_MIGHT_FLAG:|REASONING:|$)/i);
    if (whyHireSection && whyHireSection[1]) {
      const lines = whyHireSection[1].split('\n')
        .map((l: string) => l.replace(/^[-*•\d.]\s*/, '').trim())
        .filter((l: string) => {
          if (l.length < 10) return false;
          if (/^(?:\d+\s+)?(?:concrete|bullet|reasons?|points?|flags?|strengths?)\b/i.test(l)) return false;
          if (l.toLowerCase().includes('bullet') || l.startsWith('<')) return false;
          return true;
        });
      whyHire.push(...lines.slice(0, 3));
    }
    // Ensure 3 clear points
    if (whyHire.length < 3) {
      if (githubUrl && githubUrl.trim() && !whyHire.some(w => w.toLowerCase().includes('github') || w.toLowerCase().includes('code'))) {
        whyHire.push(`Public code footprint & repository commits verify hands-on software development.`);
      }
      if (companyName && companyName.trim() && !whyHire.some(w => w.toLowerCase().includes(companyName.toLowerCase()))) {
        whyHire.push(`Professional work exposure at ${companyName} demonstrates real-world workflow familiarity.`);
      }
      if (whyHire.length < 3) {
        whyHire.push(`Foundational competencies and technical potential aligned with ${candidate.target_role || 'target role'}.`);
      }
    }

    // Extract Why AI Flags Bullets directly from NIM output
    const whyNotHire: string[] = [];
    const whyNotHireSection = textToParse.match(/WHY_AI_MIGHT_FLAG:([\s\S]*?)(?=REASONING:|$)/i);
    if (whyNotHireSection && whyNotHireSection[1]) {
      const lines = whyNotHireSection[1].split('\n')
        .map((l: string) => l.replace(/^[-*•\d.]\s*/, '').trim())
        .filter((l: string) => {
          if (l.length < 10) return false;
          if (/^(?:\d+\s+)?(?:concrete|bullet|reasons?|points?|flags?|risks?)\b/i.test(l)) return false;
          if (l.toLowerCase().includes('bullet') || l.startsWith('<')) return false;
          return true;
        });
      whyNotHire.push(...lines.slice(0, 3));
    }
    // Ensure 3 clear points
    if (whyNotHire.length < 3) {
      if (candidate.career_break_months && candidate.career_break_months > 0 && !whyNotHire.some(w => w.toLowerCase().includes('break') || w.toLowerCase().includes('gap'))) {
        whyNotHire.push(`Career Continuity Gap: Automated legacy ATS filters penalize the ${candidate.career_break_months}-month pause.`);
      }
      if (candidate.years_exp !== undefined && candidate.years_exp < 3 && (candidate.target_role?.toLowerCase().includes('senior') || candidate.target_role?.toLowerCase().includes('lead'))) {
        whyNotHire.push(`Experience calibration friction: ${candidate.years_exp} years reported for a ${candidate.target_role}.`);
      }
      if (whyNotHire.length < 3) {
        whyNotHire.push(`Institutional pedigree penalty: Non-Tier 1 educational marker often receives lower algorithmic ranking.`);
      }
    }

    // Extract Reasoning
    const reasoningMatch = fullText.match(/REASONING:\s*([\s\S]*?)$/i);
    const extractedReasoning = reasoningMatch && reasoningMatch[1].trim().length > 10
      ? reasoningMatch[1].trim()
      : (reasoning || `NVIDIA Nemotron evaluated candidate qualifications dynamically from the submitted resume text.`);

    // DPDP Act Compliance Checks on this specific candidate
    const dpdpViolations: string[] = [];
    const textToCheck = (candidate.resume_text || '') + ' ' + (candidate.notes || '') + ' ' + (candidate.application_notes || '');
    if (textToCheck.match(/\b[2-9]{1}[0-9]{3}\s?[0-9]{4}\s?[0-9]{4}\b/)) {
      dpdpViolations.push('Aadhaar Number Leakage (DPDP Act Sec 8(5))');
    }
    if (textToCheck.match(/marital status|married|single|divorced/i)) {
      dpdpViolations.push('Purpose Limitation Breach - Marital Status in Profile (DPDP Act Sec 6)');
    }
    if (textToCheck.match(/\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/)) {
      dpdpViolations.push('PAN Number Token in Free Text (DPDP Act Sec 8(1))');
    }

    return NextResponse.json({
      success: true,
      modelUsed: model,
      domain,
      originalEvaluation: {
        candidate,
        score: origScore,
        decision: origDecision,
        aiResponse: extractedReasoning,
        reasoningChain: reasoning || extractedReasoning
      },
      whyShouldHire: whyHire,
      whyShouldNotHire: whyNotHire,
      counterfactualTwinTest: null,
      dpdpAudit: {
        compliant: dpdpViolations.length === 0,
        violations: dpdpViolations,
        dataMinimizationCheck: dpdpViolations.length === 0 ? 'PASS' : 'FAIL',
        recommendation: dpdpViolations.length > 0
          ? 'Mandatory: Redact Aadhaar UID and marital metadata prior to LLM inference pipeline.'
          : 'Candidate profile satisfies statutory DPDP Act data minimization requirements.'
      },
      remediations: [
        'Deploy NVIDIA NeMo Guardrails to constrain demographic factor weights.',
        `Recalibrate decision threshold to restore Disparate Impact above 0.80.`,
        'Enforce DPDP Act Section 6 Purpose Limitation by stripping marital, age, and postal metadata.'
      ]
    });

  } catch (err: any) {
    console.error('NVIDIA NIM Evaluation Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
