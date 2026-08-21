/**
 * Breed baselines as specified in PRD Section 3.1
 */
const BREED_YIELDS = {
  // Indigenous Zebu
  'Gir': 12,
  'Sahiwal': 12,
  'Red Sindhi': 12,
  'Tharparkar': 12,
  'Rathi': 11,
  
  // Exotic / Crossbreed
  'Holstein Friesian': 22,
  'Holstein Friesian Cross': 22,
  'Jersey': 20,
  'Jersey Cross': 22,
  'Crossbreed': 20,

  // Buffalo
  'Murrah': 14,
  'Mehsana': 14,
  'Jaffarabadi': 14,
  'Nili-Ravi': 14,
  'Surti': 12
};

const BASE_PROCUREMENT_RATE = 40.0; // ₹40 / Liter standard baseline

/**
 * Determines seasonal adjustment coefficient S_multiplier
 * Summer (March - June): 0.85
 * Winter (November - February): 1.10
 * Standard / Monsoon (July - October): 1.00
 */
function getSeasonalMultiplier(date = new Date()) {
  const month = new Date(date).getMonth(); // 0 = Jan, 11 = Dec
  if (month >= 2 && month <= 5) {
    return 0.85; // Summer
  } else if (month >= 10 || month <= 1) {
    return 1.10; // Winter
  } else {
    return 1.00; // Standard / Monsoon
  }
}

/**
 * Calculates Maximum Permissible Daily Yield Capacity (Capacity_max) for a farmer
 * Capacity_max = ( Sum( BaseYield(Breed_i) * LactationStatus_i ) ) * S_multiplier
 */
function calculateDynamicCapacity(cattleList = [], seasonMultiplier = null) {
  const multiplier = seasonMultiplier !== null ? seasonMultiplier : getSeasonalMultiplier();
  
  let baseSum = 0;
  for (const cow of cattleList) {
    const isLactating = cow.isLactating !== false ? 1.0 : 0.0;
    const baseYield = Number(cow.baseDailyYield) || BREED_YIELDS[cow.breed] || (cow.type === 'Buffalo' ? 14 : 12);
    baseSum += baseYield * isLactating;
  }

  const dynamicCapacity = Number((baseSum * multiplier).toFixed(2));
  return {
    baseSum,
    multiplier,
    dynamicCapacity
  };
}

/**
 * Dynamic Pricing & Payout Engine
 * Payout (₹) = Volume (L) * BaseRate (₹40) * (FAT% / 4.0) * (SNF% / 8.5)
 * With optional Grade A+ purity bonus (+₹3.00/L)
 */
function calculatePayout({ volumeLiters, fat, snf, purityScore = 100 }) {
  const volume = Number(volumeLiters) || 0;
  const fatVal = Number(fat) || 0;
  const snfVal = Number(snf) || 0;

  let baseRate = BASE_PROCUREMENT_RATE;
  let bonusPerLiter = 0;
  
  // Grade A+ bonus tier (Purity Score 90-100)
  if (purityScore >= 90) {
    bonusPerLiter = 3.00;
  }

  const standardPayout = volume * baseRate * (fatVal / 4.0) * (snfVal / 8.5);
  const bonusAmount = volume * bonusPerLiter;
  const totalPayout = Number((standardPayout + bonusAmount).toFixed(2));

  return {
    baseRate,
    bonusPerLiter,
    standardPayout: Number(standardPayout.toFixed(2)),
    bonusAmount: Number(bonusAmount.toFixed(2)),
    totalPayout
  };
}

/**
 * Validates a milk deposit against biological and physical limits
 */
function validateDeposit({ farmer, volumeLiters, qualityMetrics, seasonMultiplier = null }) {
  const { dynamicCapacity, baseSum, multiplier } = calculateDynamicCapacity(farmer.cattle, seasonMultiplier);
  const volume = Number(volumeLiters);
  
  const flags = [];
  
  // 1. Biological Capacity Exceeded Anomaly
  if (volume > dynamicCapacity) {
    flags.push({
      code: 'CAPACITY_EXCEEDED',
      severity: 'CRITICAL',
      message: `Volume (${volume}L) exceeds maximum dynamic capacity limit (${dynamicCapacity}L) calculated from ${farmer.cattle.length} NDLM registered cattle.`
    });
  }

  // 2. Physical & Chemical Plausibility Checks
  if (qualityMetrics) {
    const fat = Number(qualityMetrics.fat);
    const snf = Number(qualityMetrics.snf);
    const clr = Number(qualityMetrics.clrDensity);

    if (fat < 2.5 || fat > 12.0) {
      flags.push({
        code: 'ABNORMAL_FAT',
        severity: 'HIGH',
        message: `Fat reading ${fat}% is outside biological standard range (2.5% - 12.0%).`
      });
    }

    if (snf < 7.0 || snf > 11.5) {
      flags.push({
        code: 'ABNORMAL_SNF',
        severity: 'HIGH',
        message: `SNF reading ${snf}% is outside biological standard range (7.0% - 11.5%).`
      });
    }

    if (clr < 24.0 || clr > 34.0) {
      flags.push({
        code: 'ABNORMAL_CLR_DENSITY',
        severity: 'HIGH',
        message: `CLR density ${clr} indicates possible liquid adulteration / water addition.`
      });
    }
  }

  return {
    isFlagged: flags.length > 0,
    flags,
    primaryFlagReason: flags.length > 0 ? flags[0].message : null,
    dynamicCapacity,
    baseCapacity: baseSum,
    seasonalMultiplier: multiplier
  };
}

module.exports = {
  BREED_YIELDS,
  BASE_PROCUREMENT_RATE,
  getSeasonalMultiplier,
  calculateDynamicCapacity,
  calculatePayout,
  validateDeposit
};
