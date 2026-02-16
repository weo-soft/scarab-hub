/**
 * Fossil Calculation Service
 * Handles expected value calculations, threshold calculations, and profitability analysis for Fossils
 */

/**
 * Calculate expected value for the Fossil reroll group.
 * Uses drop-weight (probability) when available so rare high-value fossils don't inflate the threshold.
 * Falls back to equal weighting when weights are missing or unavailable.
 * @param {Array<Fossil>} fossils - All Fossils in the reroll group
 * @returns {{ expectedValue: number, method: 'weighted' | 'equal_weighted' }} Expected value and method used
 */
export function calculateExpectedValueForGroup(fossils) {
  if (!Array.isArray(fossils) || fossils.length === 0) {
    return { expectedValue: 0, method: 'equal_weighted' };
  }

  // Fossils with valid price data
  const fossilsWithPrices = fossils.filter(f => f.hasPriceData());
  if (fossilsWithPrices.length === 0) {
    return { expectedValue: 0, method: 'equal_weighted' };
  }

  // Use weighted expected value when all fossils with prices also have drop weights
  const fossilsWithWeight = fossilsWithPrices.filter(f => typeof f.hasDropWeight === 'function' && f.hasDropWeight());
  const totalWeight = fossilsWithWeight.reduce((sum, f) => sum + f.dropWeight, 0);

  if (fossilsWithWeight.length === fossilsWithPrices.length && totalWeight > 0) {
    const weightedSum = fossilsWithWeight.reduce(
      (sum, fossil) => sum + (fossil.dropWeight / totalWeight) * fossil.chaosValue,
      0
    );
    return { expectedValue: weightedSum, method: 'weighted' };
  }

  // Fallback: equal weighting (simple average)
  const sum = fossilsWithPrices.reduce((total, fossil) => total + fossil.chaosValue, 0);
  const avg = sum / fossilsWithPrices.length;
  return { expectedValue: avg, method: 'equal_weighted' };
}

/**
 * Calculate threshold for the Fossil reroll group
 * Threshold = Expected Value - Reroll Cost
 * @param {number} expectedValue - Expected value from calculateExpectedValueForGroup
 * @param {number} rerollCost - Cost of 30 Wild Crystallised Lifeforce
 * @returns {number} Threshold value (can be negative if unprofitable)
 */
export function calculateThresholdForGroup(expectedValue, rerollCost) {
  if (expectedValue === null || expectedValue === undefined || isNaN(expectedValue)) {
    return 0;
  }
  if (rerollCost === null || rerollCost === undefined || isNaN(rerollCost)) {
    return expectedValue; // If cost unavailable, threshold equals expected value
  }
  return expectedValue - rerollCost;
}

/**
 * Calculate profitability status for a Fossil
 * @param {Fossil} fossil - Fossil to evaluate
 * @param {number} threshold - Threshold value for the Fossil's reroll group
 * @returns {string} 'profitable' | 'not_profitable' | 'unknown'
 */
export function calculateProfitabilityStatus(fossil, threshold) {
  if (!fossil.hasPriceData()) {
    return 'unknown';
  }

  if (threshold === null || threshold === undefined || isNaN(threshold)) {
    return 'unknown';
  }

  // If Fossil value is below threshold, it's profitable to reroll
  if (fossil.chaosValue < threshold) {
    return 'profitable';
  } else {
    return 'not_profitable';
  }
}

/**
 * Calculate expected outcome for selected Fossils
 * @param {Array<Fossil>} selectedFossils - Fossils selected for rerolling
 * @param {number} expectedValue - Expected value for the Fossil reroll group
 * @returns {object} Expected outcome data
 */
export function calculateExpectedOutcomeForSelected(selectedFossils, expectedValue) {
  if (!Array.isArray(selectedFossils) || selectedFossils.length === 0) {
    return {
      totalInputValue: 0,
      expectedOutputValue: 0,
      netProfitLoss: 0,
      averageProfitLossPerFossil: 0
    };
  }

  let totalInputValue = 0;
  let totalExpectedOutputValue = 0;

  selectedFossils.forEach(fossil => {
    if (fossil.hasPriceData()) {
      totalInputValue += fossil.chaosValue;
      
      // Expected output is the expected value for the group
      if (expectedValue !== null && expectedValue !== undefined && !isNaN(expectedValue)) {
        totalExpectedOutputValue += expectedValue;
      }
    }
  });

  const netProfitLoss = totalExpectedOutputValue - totalInputValue;
  const averageProfitLossPerFossil = selectedFossils.length > 0 
    ? netProfitLoss / selectedFossils.length 
    : 0;

  return {
    totalInputValue,
    expectedOutputValue: totalExpectedOutputValue,
    netProfitLoss,
    averageProfitLossPerFossil
  };
}

