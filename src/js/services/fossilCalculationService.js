/**
 * Fossil Calculation Service
 * Handles expected value calculations, threshold calculations, and profitability analysis for Fossils
 */

/**
 * Calculate expected value for the Fossil reroll group using equal weighting
 * @param {Array<Fossil>} fossils - All Fossils in the reroll group
 * @returns {number} Expected value (average of all Fossil prices)
 */
export function calculateExpectedValueForGroup(fossils) {
  if (!Array.isArray(fossils) || fossils.length === 0) {
    return 0;
  }

  // Filter to only Fossils with valid price data
  const fossilsWithPrices = fossils.filter(f => f.hasPriceData());
  
  if (fossilsWithPrices.length === 0) {
    return 0;
  }

  // Equal weighting: simple average
  const sum = fossilsWithPrices.reduce((total, fossil) => total + fossil.chaosValue, 0);
  return sum / fossilsWithPrices.length;
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

