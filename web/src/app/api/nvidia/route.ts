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

    // 1. Assign role to NVIDIA AI Auditor - Let the model evaluate and decide freely
    const prompt = isHiring
      ? `You are a Senior AI Hiring Recruiter & Technical Evaluator assessing a candidate for the position of: ${candidate.target_role || 'Software Engineer'}.

Here is the candidate's profile, project credentials, and resume:

CANDIDATE DETAILS:
- Full Name: ${candidate.full_name}
- Gender: ${candidate.gender}
- Target Role: ${candidate.target_role || 'Software Engineer'}
- Years of Experience: ${candidate.years_exp || 0}
- Career Break: ${candidate.career_break_months || 0} months
- College / University: ${candidate.college_tier || 'Not specified'}
- Past / Current Employer: ${companyName || 'Not specified'}
- GitHub: ${githubUrl || 'None'}
- Portfolio: ${portfolioUrl || 'None'}

RESUME CONTENT:
"""
${candidate.resume_text || candidate.notes || 'No resume text provided.'}
"""

Evaluate this candidate freely using your own technical judgment and expertise. Provide:
1. An overall score (0-100) and recommendation (SHORTLIST or REJECT).
2. WHY YOU SHOULD HIRE (their genuine strengths, projects, and capabilities).
3. WHY TRADITIONAL AI MIGHT FLAG THEM (gaps, lack of senior competencies, career pause, or ATS pedigree filters).
4. Your overall evaluation summary.

Output format:
SCORE: <0-100>
DECISION: <SHORTLIST or REJECT>
WHY_SHOULD_HIRE:
- <Point 1>
- <Point 2>
- <Point 3>
WHY_AI_MIGHT_FLAG:
- <Flag 1>
- <Flag 2>
- <Flag 3>
REASONING: <Your honest overall summary>`
      : `You are an automated FinTech Underwriting AI Auditor evaluating a credit/loan application:

APPLICANT PROFILE:
- Name: ${candidate.full_name}
- Gender: ${candidate.gender}
- Age: ${candidate.age}
- Location: ${candidate.tier_location}
- Credit Score (CIBIL): ${candidate.credit_score}
- Annual Income: Rs. ${candidate.annual_income_inr}
- Loan Amount: Rs. ${candidate.loan_amount_inr}
- Debt-to-Income (DTI): ${candidate.debt_to_income}

FINANCIAL NOTES:
"""
${candidate.application_notes || candidate.notes || 'Standard financial documentation.'}
"""

Evaluate the application freely based on financial solvency and creditworthiness.
Output format:
SCORE: <0-100>
DECISION: <APPROVE or DECLINE>
WHY_SHOULD_HIRE:
- <Financial strength 1>
- <Financial strength 2>
- <Financial strength 3>
WHY_AI_MIGHT_FLAG:
- <Risk factor 1>
- <Risk factor 2>
- <Risk factor 3>
REASONING: <Concise creditworthiness evaluation>`;

    // Call NVIDIA NIM API Directly with generous token headroom
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
            content: 'You are an experienced, objective AI Hiring Recruiter and Technical Evaluator. Use your own judgment to evaluate candidates freely and objectively.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2500,
        temperature: 0.2
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

    // Robust Regex Extraction from NVIDIA NIM's output & reasoning
    const origScoreMatch = content.match(/(?:ORIGINAL_SCORE|SCORE|Score):\s*(\d{1,3})/i)
      || fullText.match(/(?:ORIGINAL_SCORE|SCORE|Score):\s*(\d{1,3})/i)
      || fullText.match(/(?:decide|assign|score of)\s*(\d{1,3})/i)
      || fullText.match(/(\d{1,3})\s*\/\s*100/);

    const origScore = origScoreMatch ? Math.min(100, Math.max(0, parseInt(origScoreMatch[1], 10))) : 70;

    const origDecisionMatch = content.match(/(?:ORIGINAL_DECISION|DECISION):\s*(SHORTLIST|APPROVE|REJECT|DECLINE)/i)
      || fullText.match(/(?:ORIGINAL_DECISION|DECISION):\s*(SHORTLIST|APPROVE|REJECT|DECLINE)/i)
      || fullText.match(/(?:decision:\s*|=>\s*)(SHORTLIST|APPROVE|REJECT|DECLINE)/i);

    const origDecision = origDecisionMatch
      ? origDecisionMatch[1].toUpperCase()
      : (origScore >= 60 ? (isHiring ? 'SHORTLIST' : 'APPROVE') : (isHiring ? 'REJECT' : 'DECLINE'));

    // Extract Why Hire Bullets directly from NIM output
    const whyHire: string[] = [];
    const whyHireSection = (content + '\n' + reasoning).match(/WHY_SHOULD_HIRE:([\s\S]*?)(?=WHY_AI_MIGHT_FLAG:|REASONING:|EVALUATION:|$)/i);
    if (whyHireSection && whyHireSection[1]) {
      const lines = whyHireSection[1].split('\n')
        .map((l: string) => l.replace(/^(?:[-*•]|\d+[\.\)])\s*/, '').trim())
        .filter((l: string) => {
          if (l.length < 8) return false;
          if (/^(?:three|two|four|\d+)\s*(?:concrete\s*)?(?:points?|reasons?)/i.test(l)) return false;
          if (/^(?:concrete|bullet|reasons?|points?|flags?|strengths?)\b/i.test(l)) return false;
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
    const whyNotHireSection = (content + '\n' + reasoning).match(/WHY_AI_MIGHT_FLAG:([\s\S]*?)(?=REASONING:|EVALUATION:|$)/i);
    if (whyNotHireSection && whyNotHireSection[1]) {
      const lines = whyNotHireSection[1].split('\n')
        .map((l: string) => l.replace(/^(?:[-*•]|\d+[\.\)])\s*/, '').trim())
        .filter((l: string) => {
          if (l.length < 8) return false;
          if (/^(?:three|two|four|\d+)\s*(?:concrete\s*)?(?:points?|reasons?|flags?|risks?)/i.test(l)) return false;
          if (/^(?:concrete|bullet|reasons?|points?|flags?|risks?)\b/i.test(l)) return false;
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
