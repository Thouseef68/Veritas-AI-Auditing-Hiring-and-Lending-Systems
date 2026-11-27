import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// Robust multi-engine PDF Text Extractor (Python pypdf -> pdf-parse lib -> stream regex)
async function extractPdfBuffer(buffer: Buffer): Promise<string> {
  // Method 1: Python pypdf (100% reliable, handles complex compressed PDFs)
  try {
    const candidatePaths = [
      path.resolve(process.cwd(), 'ml_engine', 'extract_pdf.py'),
      path.resolve(process.cwd(), '..', 'ml_engine', 'extract_pdf.py'),
      path.resolve(__dirname, '..', '..', '..', '..', 'ml_engine', 'extract_pdf.py')
    ];
    const scriptPath = candidatePaths.find(p => fs.existsSync(p));

    if (scriptPath) {
      const py = spawn('python', [scriptPath]);
      let stdout = '';
      let stderr = '';

      const pyPromise = new Promise<string>((resolve) => {
        py.stdout.on('data', (d) => { stdout += d.toString('utf-8'); });
        py.stderr.on('data', (d) => { stderr += d.toString('utf-8'); });
        py.on('close', (code) => {
          if (stdout.trim().length > 10) {
            resolve(stdout.trim());
          } else {
            resolve('');
          }
        });
        py.on('error', () => resolve(''));
      });

      py.stdin.write(buffer);
      py.stdin.end();

      const pyResult = await Promise.race([
        pyPromise,
        new Promise<string>((resolve) => setTimeout(() => resolve(''), 8000))
      ]);

      if (pyResult && pyResult.length > 20 && !pyResult.includes('%PDF-')) {
        return pyResult;
      }
    }
  } catch (pyErr) {
    console.warn('Python pypdf extraction warning:', pyErr);
  }

  // Method 2: Classic pdf-parse internal lib (bypasses debug mode test crash)
  try {
    const pdf = require('pdf-parse/lib/pdf-parse.js');
    const data = await pdf(buffer);
    if (data && data.text && data.text.trim().length > 20) {
      return data.text.trim();
    }
  } catch (pdfErr) {
    console.warn('pdf-parse lib extraction warning:', pdfErr);
  }

  // Method 3: Direct text stream token extraction (extracting literal strings in Tj/TJ blocks)
  try {
    const raw = buffer.toString('latin1');
    const textChunks: string[] = [];
    const tjRegex = /\(([^)]+)\)\s*Tj/g;
    let match;
    while ((match = tjRegex.exec(raw)) !== null) {
      if (match[1] && match[1].trim()) {
        textChunks.push(match[1]);
      }
    }
    const tjArrayRegex = /\[([^\]]+)\]\s*TJ/g;
    while ((match = tjArrayRegex.exec(raw)) !== null) {
      const parts = match[1].match(/\(([^)]+)\)/g);
      if (parts) {
        textChunks.push(parts.map(p => p.slice(1, -1)).join(' '));
      }
    }
    if (textChunks.length > 5) {
      return textChunks.join('\n');
    }
  } catch (streamErr) {
    console.warn('Stream extraction error:', streamErr);
  }

  return '';
}

export async function POST(req: Request) {
  try {
    let action = 'all';
    let githubUrl = '';
    let portfolioUrl = '';
    let companyName = '';
    let targetRole = 'Senior Software Engineer';
    let resumeText = '';
    let fileName = '';

    const contentType = req.headers.get('content-type') || '';

    // Handle multipart form-data (file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      action = (formData.get('action') as string) || 'resume_parse';
      githubUrl = (formData.get('githubUrl') as string) || '';
      portfolioUrl = (formData.get('portfolioUrl') as string) || '';
      companyName = (formData.get('companyName') as string) || '';
      targetRole = (formData.get('targetRole') as string) || 'Senior Software Engineer';

      const file = formData.get('file') as File | null;
      if (file) {
        fileName = file.name;
        if (file.name.toLowerCase().endsWith('.pdf')) {
          const arrayBuf = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuf);
          resumeText = await extractPdfBuffer(buffer);
        } else {
          resumeText = await file.text();
        }
      }
    } else {
      const body = await req.json();
      action = body.action || 'all';
      githubUrl = body.githubUrl || '';
      portfolioUrl = body.portfolioUrl || '';
      companyName = body.companyName || '';
      targetRole = body.targetRole || 'Senior Software Engineer';
      resumeText = body.resumeText || '';
      fileName = body.fileName || '';
    }

    const results: any = {};

    // 1. Clean Resume Text & Detect PII
    if (action === 'resume_parse' || action === 'all') {
      if (resumeText && resumeText.trim().length > 0) {
        // Clean out any PDF structural residual markers
        const cleanResume = resumeText
          .replace(/%PDF-[\d.]+/g, '')
          .replace(/\/K\s*\[[\s\S]*?\]/g, '')
          .replace(/\b\d+\s+\d+\s+obj\b/g, '')
          .replace(/endobj/g, '')
          .replace(/xref[\s\S]*?trailer/g, '')
          .trim();

        // Detect PII exposures
        const aadhaarMatch = cleanResume.match(/\b\d{4}\s\d{4}\s\d{4}\b|\b\d{12}\b/);
        const panMatch = cleanResume.match(/\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/i);
        const phoneMatch = cleanResume.match(/(?:\+91[\s-]?)?[6789]\d{9}\b/);
        const emailMatch = cleanResume.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);

        // Intelligent Candidate Metadata Extractor
        const lines = cleanResume.split('\n').map(l => l.trim()).filter(Boolean);
        let extractedName: string | null = null;
        for (const line of lines.slice(0, 5)) {
          if (!/^(curriculum|resume|page|contact|email|phone|https?|github)/i.test(line) && line.length < 50 && !line.includes('@')) {
            extractedName = line.replace(/[|•,].*$/, '').trim();
            break;
          }
        }

        const ghMatch = cleanResume.match(/(?:github\.com\/)([a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_.-]+)?)/i);
        const portfolioMatch = cleanResume.match(/https?:\/\/([a-zA-Z0-9.-]+\.(?:app|dev|io|me|vercel\.app|github\.io))/i)
          || cleanResume.match(/\b([a-zA-Z0-9-]+\.vercel\.app|[a-zA-Z0-9-]+\.streamlit\.app)\b/i);

        let detectedRole = '';
        if (/machine\s*learning|ai\s*engineer|data\s*scientist/i.test(cleanResume)) {
          detectedRole = 'Machine Learning Engineer';
        } else if (/full\s*stack/i.test(cleanResume)) {
          detectedRole = 'Full Stack Developer';
        } else if (/frontend|react/i.test(cleanResume)) {
          detectedRole = 'Frontend Engineer';
        } else if (/backend|distributed/i.test(cleanResume)) {
          detectedRole = 'Backend Engineer';
        } else if (/software\s*engineer|software\s*developer/i.test(cleanResume)) {
          detectedRole = 'Software Engineer';
        }

        let detectedCollegeTier = '';
        if (/\b(?:iit|bits|nit|iim)\b/i.test(cleanResume)) {
          detectedCollegeTier = 'Tier 1 (IIT / BITS / Top National)';
        } else if (/state\s*university|dayananda|anna\s*university|vtu/i.test(cleanResume)) {
          detectedCollegeTier = 'Tier 2 (Top State University)';
        }

        results.resumeAnalysis = {
          cleanText: cleanResume.length > 20 ? cleanResume : resumeText,
          extractedFields: {
            fullName: extractedName,
            github: ghMatch ? ghMatch[0] : null,
            portfolio: portfolioMatch ? (portfolioMatch[0].startsWith('http') ? portfolioMatch[0] : 'https://' + portfolioMatch[0]) : null,
            targetRole: detectedRole || null,
            collegeTier: detectedCollegeTier || null
          },
          piiExposures: {
            aadhaarFound: !!aadhaarMatch,
            aadhaarValue: aadhaarMatch ? aadhaarMatch[0] : null,
            panFound: !!panMatch,
            panValue: panMatch ? panMatch[0] : null,
            phoneFound: !!phoneMatch,
            emailFound: !!emailMatch,
            maritalStatusFound: /(?:marital status|married|single|divorced)/i.test(cleanResume)
          }
        };
      }
    }

    // 2. GitHub Profile & Repository Auditing
    if (action === 'github' || action === 'all') {
      if (githubUrl && githubUrl.trim().length > 0) {
        let clean = githubUrl.replace(/^https?:\/\/(www\.)?github\.com\//i, '').replace(/\/$/, '');
        const parts = clean.split('/');
        const username = parts[0] || 'developer';
        const repoName = parts.length > 1 ? parts[1] : null;

        let githubData: any = null;
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 3500);

          const ghEndpoint = repoName 
            ? `https://api.github.com/repos/${username}/${repoName}`
            : `https://api.github.com/users/${username}/repos?sort=updated&per_page=6`;

          const ghRes = await fetch(ghEndpoint, {
            headers: { 'User-Agent': 'VeritasAI-Auditor/1.0' },
            signal: controller.signal
          });
          clearTimeout(timeout);

          if (ghRes.ok) {
            githubData = await ghRes.json();
          }
        } catch (e) {
          githubData = null;
        }

        const isLiveFetched = githubData !== null;
        const reposCount = isLiveFetched
          ? (Array.isArray(githubData) ? githubData.length : (githubData?.id ? 1 : 0))
          : null;
        const topLanguages = isLiveFetched && Array.isArray(githubData)
          ? Array.from(new Set(githubData.map((r: any) => r.language).filter(Boolean)))
          : isLiveFetched && githubData?.language
          ? [githubData.language]
          : [];

        results.githubAudit = {
          profile: username,
          targetRepo: repoName || 'Recent Repositories',
          verificationStatus: isLiveFetched ? 'VERIFIED' : 'UNKNOWN',
          verifiedRepositories: reposCount,
          primaryLanguages: topLanguages.slice(0, 4),
          summary: isLiveFetched
            ? `Verified via GitHub API: ${reposCount} public repository match(es)${topLanguages.length ? ` (${topLanguages.slice(0, 3).join(', ')})` : ''}.`
            : 'GitHub API lookup could not be verified (rate-limited, private, or unreachable).',
          algorithmicBiasRisk: {
            riskLevel: 'MEDIUM',
            biasType: 'Commit Continuity Bias (Activity Heatmap Penalty)',
            description: 'Automated hiring bots penalize developers with periods of commit inactivity (e.g., maternity, caregiving, or enterprise NDA repos).',
            remediation: 'Evaluate code architecture rather than daily streak frequency.'
          }
        };
      }
    }

    // 3. Live Website / Portfolio Auditing (with SSRF guard & honest VERIFIED / FAILED / UNKNOWN states)
    if (action === 'website' || action === 'all') {
      if (portfolioUrl && portfolioUrl.trim().length > 0) {
        let cleanUrl = portfolioUrl.trim();
        if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
          cleanUrl = 'https://' + cleanUrl;
        }

        let isBlockedHost = false;
        try {
          const parsed = new URL(cleanUrl);
          const h = parsed.hostname.toLowerCase();
          if (
            !['http:', 'https:'].includes(parsed.protocol) ||
            h === 'localhost' ||
            h === '127.0.0.1' ||
            h === '::1' ||
            h.startsWith('10.') ||
            h.startsWith('192.168.') ||
            h.startsWith('169.254.') ||
            /^172\.(1[6-9]|2\d|3[0-1])\./.test(h)
          ) {
            isBlockedHost = true;
          }
        } catch {
          isBlockedHost = true;
        }

        let verificationStatus: 'VERIFIED' | 'FAILED' | 'UNKNOWN' = 'UNKNOWN';
        let isLive: boolean | null = null;
        let responseTimeMs: number | null = null;
        const sslSecure = cleanUrl.startsWith('https://');

        if (isBlockedHost) {
          verificationStatus = 'FAILED';
          isLive = false;
        } else {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3500);
            const t0 = Date.now();
            const headRes = await fetch(cleanUrl, { method: 'HEAD', redirect: 'manual', signal: controller.signal });
            clearTimeout(timeout);
            responseTimeMs = Date.now() - t0;
            isLive = headRes.ok || headRes.status < 400;
            verificationStatus = isLive ? 'VERIFIED' : 'FAILED';
          } catch {
            isLive = null;
            responseTimeMs = null;
            verificationStatus = 'UNKNOWN';
          }
        }

        results.websiteAudit = {
          url: cleanUrl,
          verificationStatus,
          isOnline: isLive,
          sslEncrypted: sslSecure,
          measuredLatencyMs: responseTimeMs,
          summary:
            verificationStatus === 'VERIFIED'
              ? `VERIFIED LIVE PORTFOLIO: Responded in ${responseTimeMs}ms (${sslSecure ? 'HTTPS' : 'HTTP'}).`
              : verificationStatus === 'FAILED'
              ? 'FAILED VERIFICATION: URL blocked by SSRF policy or returned an error status.'
              : 'UNKNOWN: Portfolio reachability could not be verified (timeout or network block).'
        };
      }
    }

    // 4. Past Company Background & Pedigree Bias Check
    if (action === 'company' || action === 'all') {
      if (companyName && companyName.trim().length > 0) {
        const isFAANG = /(google|amazon|meta|apple|microsoft|netflix)/i.test(companyName);
        const isServiceOrEarly = /(tcs|infosys|wipro|cognizant|hcl|accenture|capgemini|startup|freelance|stealth)/i.test(companyName);

        let pedigreePenaltyRisk = 'LOW';
        let explanation = 'Employer category noted; no measured brand-pedigree penalty applied without counterfactual comparison.';

        if (isServiceOrEarly) {
          pedigreePenaltyRisk = 'POTENTIAL_BIAS_SIGNAL';
          explanation = 'IT services or early-stage employers can trigger heuristic pedigree discounts in some ATS filters; verify via counterfactual twin testing.';
        } else if (isFAANG) {
          pedigreePenaltyRisk = 'POTENTIAL_PREMIUM_SIGNAL';
          explanation = 'Recognized brand employer may receive favorable heuristic weighting; verify via counterfactual twin testing.';
        }

        results.companyPedigreeAudit = {
          evaluatedCompany: companyName,
          targetRole,
          pedigreePenaltyRisk,
          biasFactorName: 'Institutional Pedigree Bias',
          detailedFinding: explanation,
          complianceAction: 'Standardize skills assessment to blind candidate past company names until after technical interview stage.'
        };
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...results
    });
  } catch (error: any) {
    console.error('Error in external audit:', error);
    return NextResponse.json({ error: error.message || 'Failed to perform external audit' }, { status: 500 });
  }
}
