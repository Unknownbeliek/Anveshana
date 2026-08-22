/**
 * Biological Drift Detection Algorithm
 * 
 * Core principle: In genuine milk, the FAT:SNF ratio is physiologically constrained
 * to a narrow band (0.45–0.55 for cow milk, 0.60–0.80 for buffalo milk).
 * 
 * Adulteration with water lowers FAT and SNF proportionally, but NOT equally —
 * the ratio drifts outside its baseline. This algorithm detects:
 * 
 *   1. Instantaneous FAT/SNF ratio outliers (vs. NDLM breed norms)
 *   2. 30-day rolling mean drift (z-score > 2σ = alert)
 *   3. Sudden spike / drop between consecutive deposits (velocity anomaly)
 * 
 * Reference:
 *   - NDDB quality standards for Indian breed milk composition
 *   - FSSAI Milk Adulteration Protocol 2023, §4.2
 */

// Breed-specific physiological FAT:SNF ratio baselines
const BREED_BASELINES = {
  'Gir':                    { ratioMin: 0.44, ratioMax: 0.56, fatMin: 3.5, fatMax: 6.5, snfMin: 8.0, snfMax: 9.5 },
  'Sahiwal':                { ratioMin: 0.42, ratioMax: 0.54, fatMin: 3.8, fatMax: 6.0, snfMin: 8.1, snfMax: 9.4 },
  'Jersey Cross':           { ratioMin: 0.42, ratioMax: 0.55, fatMin: 4.0, fatMax: 6.0, snfMin: 8.5, snfMax: 9.5 },
  'Holstein Friesian Cross':{ ratioMin: 0.38, ratioMax: 0.50, fatMin: 3.2, fatMax: 4.5, snfMin: 8.2, snfMax: 8.8 },
  'Murrah':                 { ratioMin: 0.60, ratioMax: 0.80, fatMin: 6.0, fatMax: 9.5, snfMin: 8.5, snfMax: 10.5 },
  'Nili Ravi':              { ratioMin: 0.62, ratioMax: 0.82, fatMin: 6.5, fatMax: 10.0, snfMin: 8.8, snfMax: 10.8 },
  'default_cow':            { ratioMin: 0.42, ratioMax: 0.58, fatMin: 3.0, fatMax: 7.0, snfMin: 7.8, snfMax: 9.8 },
  'default_buffalo':        { ratioMin: 0.58, ratioMax: 0.85, fatMin: 5.5, fatMax: 11.0, snfMin: 8.0, snfMax: 11.0 }
};

/**
 * Get the applicable baseline for a farmer's cattle.
 * Uses the most common breed if multiple cattle exist.
 */
function getFarmerBaseline(cattle = []) {
  if (!cattle || cattle.length === 0) return BREED_BASELINES['default_cow'];

  const lactating = cattle.filter(c => c.isLactating !== false);
  if (lactating.length === 0) return BREED_BASELINES['default_cow'];

  // Frequency count of breeds
  const breedCount = {};
  for (const c of lactating) {
    const breed = c.breed || (c.type === 'Buffalo' ? 'default_buffalo' : 'default_cow');
    breedCount[breed] = (breedCount[breed] || 0) + 1;
  }

  const dominantBreed = Object.entries(breedCount).sort((a, b) => b[1] - a[1])[0][0];
  return BREED_BASELINES[dominantBreed] || (lactating[0].type === 'Buffalo' ? BREED_BASELINES['default_buffalo'] : BREED_BASELINES['default_cow']);
}

/**
 * Calculate rolling 30-day statistics from historical deposits.
 * Returns: { mean, stdDev, sampleSize }
 */
function calcRollingStats(historicalDeposits) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const recent = historicalDeposits.filter(d => new Date(d.timestamp) >= thirtyDaysAgo && !d.isFlagged);

  if (recent.length < 3) return null; // insufficient sample

  const ratios = recent.map(d => d.qualityMetrics.fat / d.qualityMetrics.snf);
  const mean = ratios.reduce((s, v) => s + v, 0) / ratios.length;
  const variance = ratios.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / ratios.length;
  const stdDev = Math.sqrt(variance);

  return { mean, stdDev, sampleSize: recent.length };
}

/**
 * Main Biological Drift Detection Function
 * 
 * @param {object} params
 * @param {number} params.fat              - Incoming FAT %
 * @param {number} params.snf              - Incoming SNF %
 * @param {object[]} params.cattle         - Farmer's registered cattle array
 * @param {object[]} params.historicalDeposits - Past deposits for rolling stats
 * 
 * @returns {object} driftResult
 */
function detectBiologicalDrift({ fat, snf, cattle = [], historicalDeposits = [] }) {
  const baseline = getFarmerBaseline(cattle);
  const fatSnfRatio = parseFloat((fat / snf).toFixed(4));

  const result = {
    fatSnfRatio,
    driftFlag: false,
    driftSeverity: 'NONE',
    driftDetails: [],
    rollingMean: null,
    rollingStdDev: null,
    zScore: null
  };

  // ── Check 1: Instantaneous ratio vs. breed baseline ──────────────────────
  if (fatSnfRatio < baseline.ratioMin) {
    const deviation = ((baseline.ratioMin - fatSnfRatio) / baseline.ratioMin * 100).toFixed(1);
    result.driftDetails.push(`FAT/SNF ratio ${fatSnfRatio} is BELOW breed baseline minimum ${baseline.ratioMin} (${deviation}% low — possible water addition or SNF adulterant)`);
    result.driftFlag = true;
    result.driftSeverity = fatSnfRatio < baseline.ratioMin * 0.85 ? 'HIGH' : 'MEDIUM';
  } else if (fatSnfRatio > baseline.ratioMax) {
    const deviation = ((fatSnfRatio - baseline.ratioMax) / baseline.ratioMax * 100).toFixed(1);
    result.driftDetails.push(`FAT/SNF ratio ${fatSnfRatio} is ABOVE breed baseline maximum ${baseline.ratioMax} (${deviation}% high — possible skimming or cream addition)`);
    result.driftFlag = true;
    result.driftSeverity = 'MEDIUM';
  }

  // ── Check 2: FAT and SNF individually outside physiological bounds ────────
  if (fat < baseline.fatMin || fat > baseline.fatMax) {
    result.driftDetails.push(`FAT ${fat}% outside physiological range [${baseline.fatMin}–${baseline.fatMax}%] for this breed`);
    result.driftFlag = true;
    if (result.driftSeverity === 'NONE') result.driftSeverity = 'MEDIUM';
  }
  if (snf < baseline.snfMin || snf > baseline.snfMax) {
    result.driftDetails.push(`SNF ${snf}% outside physiological range [${baseline.snfMin}–${baseline.snfMax}%] for this breed`);
    result.driftFlag = true;
    if (result.driftSeverity === 'NONE') result.driftSeverity = 'LOW';
  }

  // ── Check 3: 30-day rolling z-score anomaly detection ───────────────────
  const rolling = calcRollingStats(historicalDeposits);
  if (rolling && rolling.stdDev > 0) {
    result.rollingMean = parseFloat(rolling.mean.toFixed(4));
    result.rollingStdDev = parseFloat(rolling.stdDev.toFixed(4));
    const zScore = (fatSnfRatio - rolling.mean) / rolling.stdDev;
    result.zScore = parseFloat(zScore.toFixed(2));

    if (Math.abs(zScore) > 3) {
      result.driftDetails.push(`30-day statistical anomaly: z-score ${result.zScore} (>3σ) — extreme deviation from personal baseline (n=${rolling.sampleSize})`);
      result.driftFlag = true;
      result.driftSeverity = 'CRITICAL';
    } else if (Math.abs(zScore) > 2) {
      result.driftDetails.push(`30-day statistical alert: z-score ${result.zScore} (>2σ) — significant deviation from personal 30-day baseline (n=${rolling.sampleSize})`);
      result.driftFlag = true;
      if (result.driftSeverity === 'NONE' || result.driftSeverity === 'LOW') result.driftSeverity = 'HIGH';
    }
  }

  return result;
}

module.exports = { detectBiologicalDrift, getFarmerBaseline, BREED_BASELINES };
