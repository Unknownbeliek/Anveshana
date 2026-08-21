/**
 * Computes Dynamic Farm Purity Score (0-100) and Grade Tier as specified in PRD Section 3.3
 */
function calculatePurityScore({
  recentDeposits = [],
  cattleList = [],
  recentFlagsCount = 0
}) {
  // 1. S_volume (max 30 points)
  // Evaluates stability of volume deposits vs expected yield
  let sVolume = 30.0;
  if (recentDeposits.length > 0) {
    const volumes = recentDeposits.map(d => d.volumeLiters);
    const avgVol = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    // Check for extreme standard deviations or sudden 3x spikes
    const variance = volumes.reduce((acc, v) => acc + Math.pow(v - avgVol, 2), 0) / volumes.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = avgVol > 0 ? stdDev / avgVol : 0;
    
    // Penalize erratic volatility
    if (coefficientOfVariation > 0.4) {
      sVolume = Math.max(10, 30 - (coefficientOfVariation - 0.4) * 40);
    }
  }

  // 2. S_quality (max 35 points)
  // Consistency of Fat >= 3.5%, SNF >= 8.5%, CLR within 28-32
  let sQuality = 35.0;
  if (recentDeposits.length > 0) {
    let qualityPassCount = 0;
    for (const dep of recentDeposits) {
      const q = dep.qualityMetrics || {};
      const fatPass = (q.fat >= 3.5);
      const snfPass = (q.snf >= 8.5);
      const clrPass = (q.clrDensity >= 28 && q.clrDensity <= 32);
      if (fatPass && snfPass && clrPass) {
        qualityPassCount++;
      }
    }
    const qualityRatio = qualityPassCount / recentDeposits.length;
    sQuality = Number((35.0 * qualityRatio).toFixed(1));
  }

  // 3. S_anomaly (max 20 points)
  // Clean streak deduction: 20 - 5 * (Total Flags in last 30 days)
  const sAnomaly = Math.max(0, 20 - (5 * recentFlagsCount));

  // 4. S_compliance (max 15 points)
  // Fully tagged active cattle with valid 12-digit Indian NDLM ear tags
  let sCompliance = 15.0;
  if (cattleList.length === 0) {
    sCompliance = 0;
  } else {
    const validTags = cattleList.filter(c => /^[0-9]{12}$/.test(c.earTagId)).length;
    sCompliance = Number((15.0 * (validTags / cattleList.length)).toFixed(1));
  }

  const rawScore = sVolume + sQuality + sAnomaly + sCompliance;
  const score = Math.min(100, Math.max(0, Number(rawScore.toFixed(1))));

  let grade = 'Grade A';
  let badgeColor = '#10B981'; // Emerald
  let tierDescription = 'Standard Market Rate';
  let procurementStatus = 'APPROVED';

  if (score >= 90) {
    grade = 'Grade A+';
    badgeColor = '#3B82F6'; // Electric Blue / Emerald
    tierDescription = 'Premium Rate Tier (+₹3.00/L bonus eligible)';
    procurementStatus = 'PREMIUM_APPROVED';
  } else if (score >= 75) {
    grade = 'Grade A';
    badgeColor = '#10B981'; // Emerald
    tierDescription = 'Standard Market Rate';
    procurementStatus = 'APPROVED';
  } else if (score >= 60) {
    grade = 'Grade B';
    badgeColor = '#F59E0B'; // Amber
    tierDescription = 'Standard Market Rate (Watchlist Monitoring)';
    procurementStatus = 'WATCHLIST';
  } else {
    grade = 'Grade C';
    badgeColor = '#EF4444'; // Crimson
    tierDescription = 'Procurement Restricted (Physical Audit Required)';
    procurementStatus = 'RESTRICTED';
  }

  return {
    score,
    grade,
    badgeColor,
    tierDescription,
    procurementStatus,
    breakdown: {
      volumeStability: Number(sVolume.toFixed(1)),
      qualityConsistency: Number(sQuality.toFixed(1)),
      anomalyCleanStreak: Number(sAnomaly.toFixed(1)),
      ndlmCompliance: Number(sCompliance.toFixed(1))
    }
  };
}

module.exports = {
  calculatePurityScore
};
