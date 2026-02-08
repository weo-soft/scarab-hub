/**
 * Essence Calculation Service
 * Handles expected value calculations, threshold calculations, and profitability analysis for Essences.
 * Uses MLE drop weights from poedata.dev (Deafening tier); same weight applies to all tiers per type.
 */

/**
 * Calculate expected value for a reroll group using MLE weights from poedata.dev.
 * Essences without a weight (e.g. special essences) use weight 1 so they still contribute.
 * @param {Array<Essence>} essences - All Essences in the reroll group
 * @returns {number} Weighted expected value (sum(value * weight) / sum(weight))
 */
export function calculateExpectedValueForGroup(essences) {
  if (!Array.isArray(essences) || essences.length === 0) {
    return 0;
  }

  const essencesWithPrices = essences.filter(e => e.hasPriceData());
  if (essencesWithPrices.length === 0) {
    return 0;
  }

  let weightedSum = 0;
  let totalWeight = 0;
  for (const essence of essencesWithPrices) {
    const w = essence.dropWeight != null && essence.dropWeight > 0 ? essence.dropWeight : 1;
    weightedSum += essence.chaosValue * w;
    totalWeight += w;
  }
  if (totalWeight <= 0) return 0;
  return weightedSum / totalWeight;
}

/**
 * Calculate threshold for a reroll group
 * Threshold = Expected Value - Reroll Cost
 * @param {number} expectedValue - Expected value from calculateExpectedValueForGroup
 * @param {number} rerollCost - Cost of 30 Primal Crystallised Lifeforce
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
 * Calculate profitability status for an Essence
 * @param {Essence} essence - Essence to evaluate
 * @param {number} threshold - Threshold value for the Essence's reroll group
 * @returns {string} 'profitable' | 'not_profitable' | 'unknown'
 */
export function calculateProfitabilityStatus(essence, threshold) {
  if (!essence.hasPriceData()) {
    return 'unknown';
  }

  if (threshold === null || threshold === undefined || isNaN(threshold)) {
    return 'unknown';
  }

  // If Essence value is below threshold, it's profitable to reroll
  if (essence.chaosValue < threshold) {
    return 'profitable';
  } else {
    return 'not_profitable';
  }
}

/**
 * Calculate expected outcome for selected Essences
 * @param {Array<Essence>} selectedEssences - Essences selected for rerolling
 * @param {Map<string, number>} thresholdsByGroup - Map of reroll group to threshold value
 * @returns {object} Expected outcome data
 */
export function calculateExpectedOutcomeForSelected(selectedEssences, thresholdsByGroup) {
  if (!Array.isArray(selectedEssences) || selectedEssences.length === 0) {
    return {
      totalInputValue: 0,
      expectedOutputValue: 0,
      netProfitLoss: 0,
      averageProfitLossPerEssence: 0
    };
  }

  let totalInputValue = 0;
  let totalExpectedOutputValue = 0;

  selectedEssences.forEach(essence => {
    if (essence.hasPriceData()) {
      totalInputValue += essence.chaosValue;
      
      // Get threshold for this Essence's reroll group
      const threshold = thresholdsByGroup.get(essence.rerollGroup);
      if (threshold !== null && threshold !== undefined && !isNaN(threshold)) {
        // Expected output is the threshold value (average of group)
        // We need to get the expected value, not threshold
        // For now, use threshold + rerollCost approximation
        // This should be improved to use actual expected value
        totalExpectedOutputValue += threshold;
      }
    }
  });

  const netProfitLoss = totalExpectedOutputValue - totalInputValue;
  const averageProfitLossPerEssence = selectedEssences.length > 0 
    ? netProfitLoss / selectedEssences.length 
    : 0;

  return {
    totalInputValue,
    expectedOutputValue: totalExpectedOutputValue,
    netProfitLoss,
    averageProfitLossPerEssence
  };
}
