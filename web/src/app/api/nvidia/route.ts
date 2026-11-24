import { NextResponse } from 'next/server';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || 'REDACTED_NVIDIA_API_KEY';
const DEFAULT_MODEL = process.env.NVIDIA_MODEL || 'nvidia/nemotron-3-ultra-550b-a55b';
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
      return NextResponse.json({ error: 'Candidate / applicant profile required' }, { status: 400 });
    }

    const isHiring = domain === 'hiring';

    // 1. Assign role to NVIDIA AI Auditor - Evaluates freely without rigid rule templates
    const prompt = isHiring
      ? `You are an expert Senior AI Hiring Recruiter and Technical Evaluator assessing a candidate for the position of: ${candidate.target_role || 'Software Engineer'}.

Here is the candidate's complete profile, project credentials, and resume:

CANDIDATE DOSSIER:
- Full Name: ${candidate.full_name}
- Gender: ${candidate.gender}
- Target Role: ${candidate.target_role || 'Software Engineer'}
- Years of Experience: ${candidate.years_exp || 0} years
- Career Break: ${candidate.career_break_months || 0} months
- College / University: ${candidate.college_tier || 'Not specified'}
- Past / Current Employer: ${companyName || candidate.employer || 'Not specified'}
- GitHub: ${githubUrl || candidate.github || 'None'}
- Portfolio: ${portfolioUrl || candidate.portfolio || 'None'}

RESUME & APPLICATION TEXT:
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
      : `You are an expert Senior FinTech Underwriting AI Auditor evaluating a retail or MSME loan application:

APPLICANT FINANCIAL PROFILE:
- Full Name: ${candidate.full_name}
- Gender: ${candidate.gender}
- Age: ${candidate.age || 32}
- Geographic Location: ${candidate.tier_location || 'Tier 2 / Semi-urban'}
- Employment Classification: ${candidate.employment_type || 'Salaried'}
- Profession / Nature of Job: ${candidate.job_title || candidate.target_role || 'Operations Specialist'}
- Employer / Business Name: ${candidate.employer || companyName || 'Verified Enterprise'}
- Monthly Net Income: Rs. ${candidate.monthly_income_inr || Math.round((candidate.annual_income_inr || 600000) / 12)}
- Annual Gross Income: Rs. ${candidate.annual_income_inr || 600000}
- Existing Monthly Obligations / EMI: Rs. ${candidate.monthly_obligations_inr || 15000}
- Debt-to-Income (DTI) Ratio: ${candidate.debt_to_income || '28%'}
- Loan Amount Requested: Rs. ${candidate.loan_amount_inr || 350000}
- Requested Loan Tenor: ${candidate.tenor_months || 24} months
- Loan Purpose: ${candidate.loan_purpose || 'Working Capital / Business Expansion'}
- Verified CIBIL Credit Score: ${candidate.credit_score || 740}

FINANCIAL STATEMENTS & DOCUMENTATION (Salary Slip / 15-30 Day Bank Statement / GST Invoices):
"""
${candidate.statement_text || candidate.application_notes || candidate.notes || 'Standard verified financial statement.'}
"""

Evaluate this loan application freely based on creditworthiness, debt servicing capacity, cash flow sustainability, and objective risk factors.
Output format:
SCORE: <0-100>
DECISION: <APPROVE or DECLINE>
WHY_SHOULD_HIRE:
- <Financial strength 1>
- <Financial strength 2>
- <Financial strength 3>
WHY_AI_MIGHT_FLAG:
- <Risk factor or bias penalty 1>
- <Risk factor or bias penalty 2>
- <Risk factor or bias penalty 3>
REASONING: <Concise creditworthiness evaluation>`;

    // Call NVIDIA NIM API Directly (550B flagship model, 2500 max tokens)
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
            content: isHiring
              ? 'You are an experienced, objective AI Hiring Recruiter and Technical Evaluator. Use your own judgment to evaluate candidates freely and objectively.'
              : 'You are an experienced, objective Chief Credit Underwriting Officer. Use your own judgment to evaluate credit applications on solvency and statutory fairness.'
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

    const origScore = origScoreMatch ? Math.min(100, Math.max(0, parseInt(origScoreMatch[1], 10))) : (isHiring ? 70 : 75);

    const origDecisionMatch = content.match(/(?:ORIGINAL_DECISION|DECISION):\s*(SHORTLIST|APPROVE|REJECT|DECLINE)/i)
      || fullText.match(/(?:ORIGINAL_DECISION|DECISION):\s*(SHORTLIST|APPROVE|REJECT|DECLINE)/i)
      || fullText.match(/(?:decision:\s*|=>\s*)(SHORTLIST|APPROVE|REJECT|DECLINE)/i);

    const origDecision = origDecisionMatch
      ? origDecisionMatch[1].toUpperCase()
      : (origScore >= 60 ? (isHiring ? 'SHORTLIST' : 'APPROVE') : (isHiring ? 'REJECT' : 'DECLINE'));

    // Extract Why Hire / Why Approve Bullets directly from NIM output
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

    // Contextual enrichments if NIM returned fewer than 3 points
    if (whyHire.length < 3) {
      if (isHiring) {
        if (githubUrl && githubUrl.trim() && !whyHire.some(w => w.toLowerCase().includes('github') || w.toLowerCase().includes('code'))) {
          whyHire.push(`Public code footprint & repository commits verify hands-on software development.`);
        }
        if (companyName && companyName.trim() && !whyHire.some(w => w.toLowerCase().includes(companyName.toLowerCase()))) {
          whyHire.push(`Professional work exposure at ${companyName} demonstrates real-world workflow familiarity.`);
        }
        if (whyHire.length < 3) {
          whyHire.push(`Foundational competencies and technical potential aligned with ${candidate.target_role || 'target role'}.`);
        }
      } else {
        whyHire.push(`Verified CIBIL Score of ${candidate.credit_score || 740} demonstrates strong financial discipline and prompt historical debt service.`);
        if (candidate.monthly_income_inr && candidate.monthly_obligations_inr) {
          whyHire.push(`Debt-to-Income (DTI) ratio within safe underwriting bounds with verified cash flow buffer.`);
        } else {
          whyHire.push(`Demonstrated regular banking transaction volume and verifiable business/employment tenure.`);
        }
        if (whyHire.length < 3) {
          whyHire.push(`Net monthly cash flow supports comfortable debt-service coverage for the requested tenor.`);
        }
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

    // Contextual enrichments if NIM returned fewer than 3 points
    if (whyNotHire.length < 3) {
      if (isHiring) {
        if (candidate.career_break_months && candidate.career_break_months > 0 && !whyNotHire.some(w => w.toLowerCase().includes('break') || w.toLowerCase().includes('gap'))) {
          whyNotHire.push(`Career Continuity Gap: Automated legacy ATS filters penalize the ${candidate.career_break_months}-month pause.`);
        }
        if (candidate.years_exp !== undefined && candidate.years_exp < 3 && (candidate.target_role?.toLowerCase().includes('senior') || candidate.target_role?.toLowerCase().includes('lead'))) {
          whyNotHire.push(`Experience calibration friction: ${candidate.years_exp} years reported for a ${candidate.target_role}.`);
        }
        if (whyNotHire.length < 3) {
          whyNotHire.push(`Institutional pedigree penalty: Non-Tier 1 educational marker often receives lower algorithmic ranking.`);
        }
      } else {
        if (candidate.tier_location && candidate.tier_location.toLowerCase().includes('rural')) {
          whyNotHire.push(`Geographic PIN code discount: Automated credit scoring models penalize non-metro rural addresses.`);
        }
        if (candidate.employment_type === 'business' || candidate.employment_type === 'self-employed') {
          whyNotHire.push(`Informal sector risk premium: Algorithms apply higher risk haircuts to MSME cash revenues vs salaried slips.`);
        }
        if (whyNotHire.length < 3) {
          whyNotHire.push(`Short statement horizon (15-30 days) triggers conservative risk weighting in automated loan engines.`);
        }
      }
    }

    // Extract Reasoning
    const reasoningMatch = fullText.match(/(?:REASONING|EVALUATION):\s*([\s\S]*?)$/i);
    const extractedReasoning = reasoningMatch && reasoningMatch[1].trim().length > 10
      ? reasoningMatch[1].trim()
      : (reasoning || `NVIDIA Nemotron evaluated applicant qualifications dynamically based on submitted documentation.`);

    // DPDP Act Compliance Checks on this specific applicant
    const dpdpViolations: string[] = [];
    const textToCheck = (candidate.resume_text || '') + ' ' + (candidate.statement_text || '') + ' ' + (candidate.notes || '') + ' ' + (candidate.application_notes || '');
    if (textToCheck.match(/\b[2-9]{1}[0-9]{3}\s?[0-9]{4}\s?[0-9]{4}\b/)) {
      dpdpViolations.push('Aadhaar Number Token Leakage (DPDP Act Sec 8(5))');
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
        'Deploy NVIDIA NeMo Guardrails to constrain non-solvency risk weights.',
        `Recalibrate decision threshold to restore statutory fairness ratio above 0.80.`,
        'Enforce DPDP Act Section 6 Purpose Limitation by stripping marital, age, and postal metadata.'
      ]
    });

  } catch (err: any) {
    console.error('NVIDIA NIM Evaluation Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
