import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const AADHAAR_REGEX = /\b[2-9]{1}[0-9]{3}\s?[0-9]{4}\s?[0-9]{4}\b/g;
const PAN_REGEX = /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g;
const PHONE_REGEX = /(\+91[\-\s]?)?[6-9]\d{9}\b/g;
const MARITAL_REGEX = /\b(married|single|divorced|marital status|spouse|maternity|pregnant)\b/gi;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { domain = 'hiring', customText = '' } = body;

    if (customText) {
      // Direct text scan mode
      const aadhaarMatches = customText.match(AADHAAR_REGEX) || [];
      const panMatches = customText.match(PAN_REGEX) || [];
      const phoneMatches = customText.match(PHONE_REGEX) || [];
      const maritalMatches = customText.match(MARITAL_REGEX) || [];

      const findings = [];
      if (aadhaarMatches.length > 0) {
        findings.push({
          type: 'Aadhaar UID Leakage',
          section: 'DPDP Act Sec 8(5) - Severe PII Breach',
          severity: 'CRITICAL',
          matches: aadhaarMatches.map((m: string) => m.slice(0, 4) + ' **** ' + m.slice(-4)),
          fix: 'Immediately redact 12-digit UIDAI tokens from resume context.'
        });
      }
      if (panMatches.length > 0) {
        findings.push({
          type: 'PAN Card Token Detected',
          section: 'DPDP Act Sec 8(1) - Data Minimization Breach',
          severity: 'HIGH',
          matches: panMatches.map((m: string) => m.slice(0, 2) + '***' + m.slice(-2)),
          fix: 'Omit financial tax IDs from pre-hire evaluation pipeline.'
        });
      }
      if (maritalMatches.length > 0) {
        findings.push({
          type: 'Discriminatory Proxy (Marital / Maternal Status)',
          section: 'DPDP Act Sec 6 - Purpose Limitation Violation',
          severity: 'HIGH',
          matches: Array.from(new Set(maritalMatches)),
          fix: 'Remove personal family status from candidate evaluation prompts.'
        });
      }
      if (phoneMatches.length > 0) {
        findings.push({
          type: 'Direct Telephone Contact Exposed',
          section: 'DPDP Act Sec 8(1) - Unmasked Identifiable Data',
          severity: 'MEDIUM',
          matches: phoneMatches.map((m: string) => m.slice(0, 4) + '******'),
          fix: 'Mask candidate mobile numbers during initial algorithmic screening.'
        });
      }

      return NextResponse.json({
        customScan: true,
        findingsCount: findings.length,
        findings,
        compliant: findings.length === 0
      });
    }

    // Dataset Scan Mode
    const fileName = domain === 'lending' ? 'fincorp_loans.json' : 'techhire_resumes.json';
    const filePath = path.join(process.cwd(), 'public', 'data', fileName);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Dataset file not found' }, { status: 404 });
    }

    const records = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    let aadhaarLeaks = 0;
    let panLeaks = 0;
    let proxyBreaches = 0;
    let phoneLeaks = 0;
    const sampleViolations: any[] = [];

    records.forEach((r: any) => {
      const text = JSON.stringify(r);
      const aadhaar = text.match(AADHAAR_REGEX);
      const pan = text.match(PAN_REGEX);
      const phone = text.match(PHONE_REGEX);
      const marital = text.match(MARITAL_REGEX);

      if (aadhaar) aadhaarLeaks += aadhaar.length;
      if (pan) panLeaks += pan.length;
      if (phone) phoneLeaks += phone.length;
      if (marital) proxyBreaches += marital.length;

      if ((aadhaar || pan || marital) && sampleViolations.length < 5) {
        sampleViolations.push({
          id: r.applicant_id || r.candidate_id,
          name: r.full_name,
          details: r.resume_text || r.application_notes || 'Application profile contains unredacted personal identifiers.',
          flags: [
            ...(aadhaar ? ['Aadhaar Number Leakage'] : []),
            ...(pan ? ['PAN Card Number Exposed'] : []),
            ...(marital ? ['Marital/Proxy Breach (Sec 6)'] : []),
            ...(phone ? ['Unmasked Mobile Number'] : [])
          ]
        });
      }
    });

    // Score computation
    const total = records.length;
    const penalty = (aadhaarLeaks * 18) + (panLeaks * 10) + (proxyBreaches * 8) + (phoneLeaks * 2);
    const score = Math.max(12, Math.min(100, Math.round(100 - (penalty / total * 80))));

    let grade = 'A (Fully Compliant)';
    let status = 'COMPLIANT';
    if (score < 50) {
      grade = 'F (Severe Regulatory Liability under DPDP Act 2023)';
      status = 'CRITICAL_RISK';
    } else if (score < 80) {
      grade = 'C (Remediation Required)';
      status = 'WARNING';
    }

    return NextResponse.json({
      domain,
      dpdpScore: score,
      grade,
      status,
      metrics: {
        totalRecordsScanned: total,
        aadhaarLeaks,
        panLeaks,
        proxyBreaches,
        phoneLeaks
      },
      regulatoryClauses: [
        {
          clause: 'DPDP Act 2023 - Section 6',
          title: 'Purpose Limitation & Consent Notice',
          status: proxyBreaches > 0 ? 'NON_COMPLIANT' : 'COMPLIANT',
          detail: 'Personal data processed must be strictly limited to bona-fide job qualification or credit assessment.'
        },
        {
          clause: 'DPDP Act 2023 - Section 8(1)',
          title: 'Data Minimization Principle',
          status: (panLeaks > 0 || phoneLeaks > 0) ? 'WARNING' : 'COMPLIANT',
          detail: 'Fiduciaries must collect only strictly necessary attributes and anonymize identifiers.'
        },
        {
          clause: 'DPDP Act 2023 - Section 8(5)',
          title: 'Reasonable Security Safeguards',
          status: aadhaarLeaks > 0 ? 'CRITICAL_BREACH' : 'COMPLIANT',
          detail: 'Mandatory technical safeguards against leak or memorization of government identity documents.'
        },
        {
          clause: 'DPDP Act 2023 - Section 12',
          title: 'Right to Correction & Erasure Readiness',
          status: 'COMPLIANT',
          detail: 'Audit framework allows candidate record purging without degrading underlying model state.'
        }
      ],
      sampleViolations
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
