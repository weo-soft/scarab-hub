/**
 * Delirium Orb Calculation Service
 * Handles expected value calculations, threshold calculations, and profitability analysis for Delirium Orbs.
 * Uses drop weights and excludes the input orb from possible outcomes.
 */

/**
 * Calculate expected value for a specific Delirium Orb when rerolling.
 * The returned orb cannot be the same as the input orb, so we exclude it from calculations.
 * Uses drop-weight (probability) when available.
 * Falls back to equal weighting when weights are missing or unavailable.
 * @param {DeliriumOrb} inputOrb - The Delirium Orb being rerolled
 * @param {Array<DeliriumOrb>} allOrbs - All Delirium Orbs in the reroll group
 * @returns {{ expectedValue: number, method: 'weighted' | 'equal_weighted' }} Expected value and method used
 */
export function calculateExpectedValueForOrb(inputOrb, allOrbs) {
  if (!inputOrb || !Array.isArray(allOrbs) || allOrbs.length === 0) {
    return { expectedValue: 0, method: 'equal_weighted' };
  }

  // Exclude the input orb from possible outcomes (can't reroll into same orb)
  const possibleOutcomes = allOrbs.filter(orb => orb.id !== inputOrb.id);
  
  if (possibleOutcomes.length === 0) {
    return { expectedValue: 0, method: 'equal_weighted' };
  }

  // Filter to orbs with valid price data
  const orbsWithPrices = possibleOutcomes.filter(orb => orb.hasPriceData());
  if (orbsWithPrices.length === 0) {
    return { expectedValue: 0, method: 'equal_weighted' };
  }

  // Use weighted expected value when all orbs with prices also have drop weights
  const orbsWithWeight = orbsWithPrices.filter(orb => typeof orb.hasDropWeight === 'function' && orb.hasDropWeight());
  const totalWeight = orbsWithWeight.reduce((sum, orb) => sum + (orb.dropWeight || 0), 0);

  if (orbsWithWeight.length === orbsWithPrices.length && totalWeight > 0) {
    // Calculate weighted average excluding input orb
    const weightedSum = orbsWithWeight.reduce(
      (sum, orb) => sum + ((orb.dropWeight / totalWeight) * orb.chaosValue),
      0
    );
    return { expectedValue: weightedSum, method: 'weighted' };
  }

  // Fallback: equal weighting (simple average)
  const sum = orbsWithPrices.reduce((total, orb) => total + orb.chaosValue, 0);
  const avg = sum / orbsWithPrices.length;
  return { expectedValue: avg, method: 'equal_weighted' };
}

/**
 * Calculate expected value for all Delirium Orbs in the group.
 * This calculates per-orb expected values (excluding each orb from its own calculation).
 * @param {Array<DeliriumOrb>} deliriumOrbs - All Delirium Orbs in the reroll group
 * @returns {Map<string, { expectedValue: number, method: string }>} Map of orb id to expected value and method
 */
export function calculateExpectedValuesForGroup(deliriumOrbs) {
  const expectedValues = new Map();
  
  deliriumOrbs.forEach(orb => {
    const result = calculateExpectedValueForOrb(orb, deliriumOrbs);
    expectedValues.set(orb.id, result);
  });
  
  return expectedValues;
}

/**
 * Calculate threshold for a specific Delirium Orb
 * Threshold = Expected Value - Reroll Cost
 * @param {number} expectedValue - Expected value from calculateExpectedValueForOrb
 * @param {number} rerollCost - Cost of 30 Primal Lifeforce
 * @returns {number} Threshold value (can be negative if unprofitable)
 */
export function calculateThresholdForOrb(expectedValue, rerollCost) {
  if (expectedValue === null || expectedValue === undefined || isNaN(expectedValue)) {
    return 0;
  }
  if (rerollCost === null || rerollCost === undefined || isNaN(rerollCost)) {
    return expectedValue; // If cost unavailable, threshold equals expected value
  }
  return expectedValue - rerollCost;
}

/**
 * Calculate profitability status for a Delirium Orb
 * @param {DeliriumOrb} orb - Delirium Orb to evaluate
 * @param {number} threshold - Threshold value for this specific orb
 * @returns {string} 'profitable' | 'not_profitable' | 'unknown'
 */
export function calculateProfitabilityStatus(orb, threshold) {
  if (!orb.hasPriceData()) {
    return 'unknown';
  }

  if (threshold === null || threshold === undefined || isNaN(threshold)) {
    return 'unknown';
  }

  // If Delirium Orb value is below threshold, it's profitable to reroll
  if (orb.chaosValue < threshold) {
    return 'profitable';
  } else {
    return 'not_profitable';
  }
}

/**
 * Calculate expected outcome for selected Delirium Orbs
 * @param {Array<DeliriumOrb>} selectedOrbs - Delirium Orbs selected for rerolling
 * @param {Map<string, number>} expectedValuesByOrbId - Map of orb id to expected value
 * @returns {object} Expected outcome data
 */
export function calculateExpectedOutcomeForSelected(selectedOrbs, expectedValuesByOrbId) {
  if (!Array.isArray(selectedOrbs) || selectedOrbs.length === 0) {
    return {
      totalInputValue: 0,
      expectedOutputValue: 0,
      netProfitLoss: 0,
      averageProfitLossPerOrb: 0
    };
  }

  let totalInputValue = 0;
  let totalExpectedOutputValue = 0;

  selectedOrbs.forEach(orb => {
    if (orb.hasPriceData()) {
      totalInputValue += orb.chaosValue;
      
      // Get expected value for this specific orb
      const expectedValueData = expectedValuesByOrbId.get(orb.id);
      const expectedValue = expectedValueData?.expectedValue;
      if (expectedValue !== null && expectedValue !== undefined && !isNaN(expectedValue)) {
        totalExpectedOutputValue += expectedValue;
      }
    }
  });

  const netProfitLoss = totalExpectedOutputValue - totalInputValue;
  const averageProfitLossPerOrb = selectedOrbs.length > 0 
    ? netProfitLoss / selectedOrbs.length 
    : 0;

  return {
    totalInputValue,
    expectedOutputValue: totalExpectedOutputValue,
    netProfitLoss,
    averageProfitLossPerOrb
  };
}
