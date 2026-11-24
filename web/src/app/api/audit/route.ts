import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      domain = 'lending', 
      threshold = 0.50, 
      sensitiveAttr = 'gender', 
      privGroup = 'Male', 
      unprivGroup = 'Female',
      customRecords = null
    } = body;

    let records = customRecords;

    if (!records || !Array.isArray(records) || records.length === 0) {
      const fileName = domain === 'lending' ? 'fincorp_loans.json' : 'techhire_resumes.json';
      const filePath = path.join(process.cwd(), 'public', 'data', fileName);

      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: 'Dataset file not found' }, { status: 404 });
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      records = JSON.parse(fileContent);
    }

    // Grouping
    const privRecords = records.filter((r: any) => String(r[sensitiveAttr]).toLowerCase() === String(privGroup).toLowerCase());
    const unprivRecords = records.filter((r: any) => String(r[sensitiveAttr]).toLowerCase() === String(unprivGroup).toLowerCase());

    // If exact match didn't find both, fallback to case-insensitive or default
    const actualPriv = privRecords.length > 0 ? privRecords : records.filter((r: any) => r.gender === 'Male' || r.gender === 'male');
    const actualUnpriv = unprivRecords.length > 0 ? unprivRecords : records.filter((r: any) => r.gender === 'Female' || r.gender === 'female');

    if (actualPriv.length === 0 || actualUnpriv.length === 0) {
      return NextResponse.json({ 
        error: `Could not find records for both ${privGroup} and ${unprivGroup}. Please verify sensitive attribute column.` 
      }, { status: 400 });
    }

    const evaluateGroup = (group: any[]) => {
      const total = group.length;
      let positives = 0;
      let tp = 0, fp = 0, fn = 0, tn = 0;

      for (const r of group) {
        // Support flexible column names from user CSV
        let rawScore = r.simulated_model_score ?? r.score ?? r.Score ?? (r.credit_score ? r.credit_score / 850 : null) ?? (r.skills_score ? r.skills_score / 100 : null);
        if (rawScore === null) {
          rawScore = (r.approved_historically || r.approved || r.Approved || r.shortlisted) ? 0.75 : 0.35;
        }
        if (rawScore > 1.0) rawScore = rawScore / 100.0; // scale 0-100 to 0-1

        const predicted = rawScore >= threshold ? 1 : 0;
        const actual = (r.qualified_merit ?? r.qualified ?? r.merit ?? r.target ?? 1) ? 1 : 0;

        if (predicted === 1) positives++;

        if (predicted === 1 && actual === 1) tp++;
        else if (predicted === 1 && actual === 0) fp++;
        else if (predicted === 0 && actual === 1) fn++;
        else tn++;
      }

      const selectionRate = total > 0 ? positives / total : 0;
      const actualPos = tp + fn;
      const actualNeg = fp + tn;
      const tpr = actualPos > 0 ? tp / actualPos : 0;
      const fpr = actualNeg > 0 ? fp / actualNeg : 0;
      const accuracy = total > 0 ? (tp + tn) / total : 0;

      return {
        total,
        positives,
        selectionRate: Number(selectionRate.toFixed(4)),
        tpr: Number(tpr.toFixed(4)),
        fpr: Number(fpr.toFixed(4)),
        accuracy: Number(accuracy.toFixed(4)),
        tp, fp, fn, tn
      };
    };

    const privStats = evaluateGroup(actualPriv);
    const unprivStats = evaluateGroup(actualUnpriv);

    // 1. Disparate Impact Ratio (80% Rule)
    const disparateImpactRatio = privStats.selectionRate > 0 
      ? Number((unprivStats.selectionRate / privStats.selectionRate).toFixed(3)) 
      : 1.0;

    let diStatus = 'COMPLIANT';
    let severity = 'green';
    if (disparateImpactRatio < 0.65) {
      diStatus = 'CRITICAL VIOLATION (< 0.65)';
      severity = 'red';
    } else if (disparateImpactRatio < 0.80) {
      diStatus = 'NON-COMPLIANT (Fails 80% Rule)';
      severity = 'amber';
    } else {
      diStatus = 'COMPLIANT (Passes 80% Rule)';
      severity = 'green';
    }

    // 2. Demographic Parity Difference
    const demographicParityDiff = Number(Math.abs(privStats.selectionRate - unprivStats.selectionRate).toFixed(4));

    // 3. Equal Opportunity Difference
    const equalOpportunityDiff = Number(Math.abs(privStats.tpr - unprivStats.tpr).toFixed(4));

    // 4. Average Odds Difference
    const avgOddsDiff = Number((0.5 * (Math.abs(privStats.fpr - unprivStats.fpr) + Math.abs(privStats.tpr - unprivStats.tpr))).toFixed(4));

    // Counterfactual Flip Rate
    let flipCount = 0;
    const penaltyOffset = 0.12;
    for (const r of actualUnpriv) {
      let score = r.simulated_model_score ?? r.score ?? (r.credit_score ? r.credit_score / 850 : 0.5);
      if (score > 1.0) score = score / 100.0;
      if (score < threshold && (score + penaltyOffset) >= threshold) {
        flipCount++;
      }
    }
    const flipRate = actualUnpriv.length > 0 ? Number((flipCount / actualUnpriv.length).toFixed(3)) : 0;

    // Pareto Optimal Threshold Sweep
    const sweepSteps = [0.34, 0.38, 0.42, 0.46, 0.50, 0.54, 0.58, 0.62, 0.66, 0.70];
    let bestThreshold = 0.50;
    let bestScore = -999;
    let bestDi = disparateImpactRatio;
    let bestAcc = 0.75;

    const curve = sweepSteps.map(t => {
      let privPos = 0, unprivPos = 0;
      let totTp = 0, totTn = 0;
      for (const r of records) {
        let score = r.simulated_model_score ?? r.score ?? (r.credit_score ? r.credit_score / 850 : 0.5);
        if (score > 1.0) score = score / 100.0;
        const pred = score >= t ? 1 : 0;
        const act = (r.qualified_merit ?? r.qualified ?? 1) ? 1 : 0;
        if (pred === act) {
          if (pred === 1) totTp++; else totTn++;
        }
        if (String(r[sensitiveAttr]).toLowerCase() === String(privGroup).toLowerCase() && pred === 1) privPos++;
        if (String(r[sensitiveAttr]).toLowerCase() === String(unprivGroup).toLowerCase() && pred === 1) unprivPos++;
      }
      const privSr = actualPriv.length > 0 ? privPos / actualPriv.length : 0;
      const unprivSr = actualUnpriv.length > 0 ? unprivPos / actualUnpriv.length : 0;
      const di = privSr > 0 ? Number((unprivSr / privSr).toFixed(3)) : 1.0;
      const acc = Number(((totTp + totTn) / records.length).toFixed(4));

      const fairnessPenalty = Math.max(0, 0.80 - di) * 3.0;
      const objective = acc - fairnessPenalty;

      if (objective > bestScore) {
        bestScore = objective;
        bestThreshold = t;
        bestDi = di;
        bestAcc = acc;
      }

      return {
        threshold: t,
        disparateImpact: di,
        accuracy: acc
      };
    });

    return NextResponse.json({
      domain,
      isCustomData: !!customRecords,
      sensitiveAttr,
      privGroup,
      unprivGroup,
      threshold,
      totalAudited: records.length,
      metrics: {
        disparateImpactRatio,
        diStatus,
        severity,
        demographicParityDiff,
        equalOpportunityDiff,
        avgOddsDiff,
        flipRate,
        flipCount
      },
      privStats,
      unprivStats,
      mitigation: {
        calibratedThreshold: bestThreshold,
        calibratedDisparateImpact: bestDi,
        calibratedAccuracy: bestAcc,
        gainPercent: Number(((bestDi - disparateImpactRatio) / (disparateImpactRatio || 1) * 100).toFixed(1)),
        curve
      },
      sampleCandidates: records.slice(0, 15)
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
