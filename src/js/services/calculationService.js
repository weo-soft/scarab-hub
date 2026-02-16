/**
 * Calculation Service
 * Handles expected value and threshold calculations
 */

import { Scarab, ExpectedValueThreshold } from '../models/scarab.js';
import { Catalyst } from '../models/catalyst.js';
import { Tattoo } from '../models/tattoo.js';

/**
 * Calculate variance of expected value
 * Formula: Variance = Σ(probability_i × (value_i - mean)²)
 * 
 * @param {Array<Scarab>} scarabs - Valid scarabs with dropWeight and price data
 * @param {number} totalWeight - Total weight of all scarabs
 * @param {number} mu - Expected value (mean)
 * @returns {number} Variance
 */
export function computeVariance(scarabs, totalWeight, mu) {
  let variance = 0;

  for (const scarab of scarabs) {
    const probability = scarab.dropWeight / totalWeight;
    const diff = scarab.chaosValue - mu;
    variance += probability * diff * diff;
  }

  return variance;
}

/**
 * Get z-score for a given confidence percentile (one-tailed lower bound)
 * For 90th percentile: z ≈ 1.28155
 * This represents the number of standard deviations to subtract from the mean
 * to get the lower bound of the confidence interval.
 * 
 * @param {number} percentile - Confidence percentile (0-1), e.g., 0.9 for 90%
 * @returns {number} Z-score
 */
function getZScore(percentile) {
  // Standard z-scores for common confidence percentiles (one-tailed)
  // These are the z-scores for the lower bound (10th, 5th, 1st percentiles)
  const zScores = {
    0.80: 0.84162,  // 80th percentile (20% lower bound)
    0.85: 1.03643,  // 85th percentile (15% lower bound)
    0.90: 1.28155,  // 90th percentile (10% lower bound) - DEFAULT
    0.95: 1.64485,  // 95th percentile (5% lower bound)
    0.99: 2.32635,  // 99th percentile (1% lower bound)
  };
  
  // Return exact match if available
  if (zScores[percentile]) {
    return zScores[percentile];
  }
  
  // Linear interpolation for percentiles between known values
  const sortedPercentiles = Object.keys(zScores).map(Number).sort((a, b) => a - b);
  
  // If below minimum, use minimum z-score
  if (percentile < sortedPercentiles[0]) {
    return zScores[sortedPercentiles[0]];
  }
  
  // If above maximum, use maximum z-score
  if (percentile > sortedPercentiles[sortedPercentiles.length - 1]) {
    return zScores[sortedPercentiles[sortedPercentiles.length - 1]];
  }
  
  // Find the two closest percentiles for interpolation
  let lowerPercentile = sortedPercentiles[0];
  let upperPercentile = sortedPercentiles[sortedPercentiles.length - 1];
  
  for (let i = 0; i < sortedPercentiles.length - 1; i++) {
    if (percentile >= sortedPercentiles[i] && percentile <= sortedPercentiles[i + 1]) {
      lowerPercentile = sortedPercentiles[i];
      upperPercentile = sortedPercentiles[i + 1];
      break;
    }
  }
  
  // Linear interpolation
  const lowerZ = zScores[lowerPercentile];
  const upperZ = zScores[upperPercentile];
  const ratio = (percentile - lowerPercentile) / (upperPercentile - lowerPercentile);
  
  return lowerZ + (upperZ - lowerZ) * ratio;
}

/**
 * Find the lowest value scarab from valid scarabs
 * @param {Array<Scarab>} validScarabs
 * @returns {Scarab|null}
 */
function findLowestValueScarab(validScarabs) {
  if (validScarabs.length === 0) return null;
  
  return validScarabs.reduce((lowest, scarab) => {
    if (!lowest) return scarab;
    if (scarab.chaosValue < lowest.chaosValue) return scarab;
    return lowest;
  }, null);
}

/**
 * Find optimal combination of scarabs for input (low value, high weighting)
 * Returns the scarab that minimizes (value / weight) ratio
 * @param {Array<Scarab>} validScarabs
 * @returns {Scarab|null}
 */
function findOptimalInputScarab(validScarabs) {
  if (validScarabs.length === 0) return null;
  
  return validScarabs.reduce((optimal, scarab) => {
    if (!optimal) return scarab;
    
    // Calculate value-to-weight ratio (lower is better)
    const optimalRatio = optimal.chaosValue / optimal.dropWeight;
    const scarabRatio = scarab.chaosValue / scarab.dropWeight;
    
    if (scarabRatio < optimalRatio) return scarab;
    return optimal;
  }, null);
}

/**
 * Calculate expected value threshold from Scarab data using confidence percentile
 * Formula: Expected Value = Σ(weight_i / total_weight × price_i)
 * Threshold = (Expected Value - z × standard_error) / 3
 * where standard_error = σ / √n (standard error of the mean for n trades)
 * 
 * This ensures that scarabs below the threshold have the specified certainty of being profitable
 * when a large number of trades are performed (due to the law of large numbers).
 * 
 * Uses the sampling distribution of the mean: X̄ ~ N(μ, σ²/n)
 * Lower bound: μ - z × (σ / √n)
 * 
 * Trade modes:
 * - 'returnable': Input scarabs can be returned (current behavior)
 * - 'lowest_value': Three of the same lowest value scarab are used, excluded from return pool
 * - 'optimal_combination': Optimal combination (low value, high weighting) used, excluded from return pool
 * 
 * @param {Array<Scarab>} scarabs
 * @param {number} confidencePercentile - Confidence level (0-1), default 0.9 for 90th percentile
 * @param {number} numberOfTrades - Number of trades to consider (default: 10000)
 * @param {string} tradeMode - Trade mode: 'returnable', 'lowest_value', or 'optimal_combination' (default: 'returnable')
 * @returns {ExpectedValueThreshold}
 */
export function calculateThreshold(scarabs, confidencePercentile = 0.9, numberOfTrades = 10000, tradeMode = 'returnable') {
  // Filter scarabs with valid dropWeight and price data
  const validScarabs = scarabs.filter(
    scarab => scarab.hasDropWeight() && scarab.hasPriceData()
  );

  if (validScarabs.length === 0) {
    throw new Error('No valid Scarabs with both dropWeight and price data');
  }

  // Determine which scarabs are used as input based on trade mode
  let inputScarabs = [];
  let returnableScarabs = validScarabs;

  if (tradeMode === 'lowest_value') {
    const lowestScarab = findLowestValueScarab(validScarabs);
    if (lowestScarab) {
      inputScarabs = [lowestScarab];
      // Exclude input scarabs from return pool
      returnableScarabs = validScarabs.filter(s => s.id !== lowestScarab.id);
    }
  } else if (tradeMode === 'optimal_combination') {
    const optimalScarab = findOptimalInputScarab(validScarabs);
    if (optimalScarab) {
      inputScarabs = [optimalScarab];
      // Exclude input scarabs from return pool
      returnableScarabs = validScarabs.filter(s => s.id !== optimalScarab.id);
    }
  }
  // For 'returnable' mode, inputScarabs remains empty and returnableScarabs = validScarabs

  // Ensure we have enough scarabs in the return pool
  if (returnableScarabs.length === 0) {
    throw new Error('No scarabs available in return pool after excluding input scarabs');
  }

  // Calculate total weight from returnable scarabs only
  const totalWeight = returnableScarabs.reduce(
    (sum, scarab) => sum + scarab.dropWeight,
    0
  );

  if (totalWeight <= 0) {
    throw new Error('Total weight must be greater than 0');
  }

  // Calculate expected value using weighted average (only from returnable scarabs)
  const expectedValue = returnableScarabs.reduce((sum, scarab) => {
    const probability = scarab.dropWeight / totalWeight;
    const value = scarab.chaosValue;
    return sum + (probability * value);
  }, 0);

  // Calculate variance and standard deviation (population parameters)
  // Use returnable scarabs for variance calculation
  const variance = computeVariance(returnableScarabs, totalWeight, expectedValue);
  const populationStandardDeviation = Math.sqrt(variance);

  // Calculate standard error for the sampling distribution
  // For n trades, we consider the mean outcome: X̄ ~ N(μ, σ²/n)
  // Standard error of the mean: SE = σ / √n
  // This accounts for the fact that variance of the mean decreases with more trades
  const standardError = populationStandardDeviation / Math.sqrt(numberOfTrades);
  
  // Note: The standard error represents the uncertainty in the MEAN outcome over n trades.
  // For profitability, we want to ensure that the mean outcome exceeds 3×threshold.
  // With large n, the standard error is small, making the threshold higher.

  // Get z-score for the desired confidence percentile
  // For 90th percentile: z ≈ 1.28 (one-tailed lower bound)
  const zScore = getZScore(confidencePercentile);

  // Calculate coefficient of variation using standard error (for debugging/logging)
  // CV = std_error / mean. Shows relative variance after accounting for sample size
  const coefficientOfVariation = expectedValue > 0 
    ? standardError / expectedValue 
    : Infinity;

  // Calculate the lower bound of the confidence interval using standard error
  // This represents the value below which only (1 - confidencePercentile) of outcomes fall
  // For 90% confidence: we want the 10th percentile (lower bound) = mean - 1.28 × (σ / √n)
  // This uses the sampling distribution of the mean, not the population distribution
  // 
  // With a large number of trades, the standard error (σ/√n) is small enough that
  // this approach works correctly even with high variance. No fallback needed.
  const lowerBoundExpectedValue = expectedValue - (zScore * standardError);
  
  // With sufficient number of trades, the lower bound should always be positive.
  // If it's negative, it means numberOfTrades is too small for the variance level.
  if (lowerBoundExpectedValue < 0) {
    console.warn(`Lower bound is negative (${lowerBoundExpectedValue.toFixed(4)}). This suggests numberOfTrades (${numberOfTrades}) may be too small for the variance level. Consider increasing numberOfTrades.`);
  }

  // Log detailed calculation for debugging
  console.log('Threshold Calculation Details:', {
    tradeMode: tradeMode,
    inputScarabs: inputScarabs.map(s => s.name).join(', ') || 'none (returnable)',
    returnableScarabsCount: returnableScarabs.length,
    expectedValue: expectedValue.toFixed(4),
    variance: variance.toFixed(4),
    populationStandardDeviation: populationStandardDeviation.toFixed(4),
    numberOfTrades: numberOfTrades,
    standardError: standardError.toFixed(4),
    coefficientOfVariation: coefficientOfVariation.toFixed(4),
    zScore: zScore.toFixed(4),
    confidencePercentile: confidencePercentile,
    lowerBoundExpectedValue: lowerBoundExpectedValue.toFixed(4),
    rawThreshold: (lowerBoundExpectedValue / 3).toFixed(4)
  });

  // Threshold is the maximum input value where lower bound expected value > 3 × input
  // Solving: lower_bound_EV > 3 × threshold => threshold = lower_bound_EV / 3
  // This ensures 90% certainty that the trade will be profitable
  // Ensure threshold doesn't go negative (shouldn't happen with the safeguard above, but keep it)
  const rawThreshold = lowerBoundExpectedValue / 3;
  const threshold = Math.max(0, rawThreshold);
  
  // Log warning if threshold was still clamped to 0 (shouldn't happen with safeguard)
  if (rawThreshold < 0) {
    console.warn(`Threshold calculation resulted in negative value (${rawThreshold.toFixed(4)}), clamped to 0. This indicates extremely high variance.`);
  }

  return new ExpectedValueThreshold(
    threshold, 
    totalWeight, 
    returnableScarabs.length,
    expectedValue,
    variance,
    populationStandardDeviation,
    confidencePercentile,
    numberOfTrades,
    standardError,
    tradeMode
  );
}

/**
 * Calculate profitability status for all Scarabs based on threshold
 * @param {Array<Scarab>} scarabs
 * @param {ExpectedValueThreshold} threshold
 */
export function calculateProfitabilityStatus(scarabs, threshold) {
  scarabs.forEach(scarab => {
    if (!scarab.hasPriceData()) {
      scarab.profitabilityStatus = 'unknown';
      return;
    }

    if (scarab.chaosValue < threshold.value) {
      scarab.profitabilityStatus = 'profitable';
    } else {
      scarab.profitabilityStatus = 'not_profitable';
    }
  });
}

/**
 * Calculate threshold for Catalysts (excludes Tainted Catalysts from return pool)
 * @param {Array<Catalyst>} catalysts
 * @param {number} confidencePercentile - Confidence level (0-1), default 0.9 for 90th percentile
 * @param {number} numberOfTrades - Number of trades to consider (default: 10000)
 * @param {string} tradeMode - Trade mode: 'returnable', 'lowest_value', or 'optimal_combination' (default: 'returnable')
 * @returns {ExpectedValueThreshold}
 */
export function calculateCatalystThreshold(catalysts, confidencePercentile = 0.9, numberOfTrades = 10000, tradeMode = 'returnable') {
  // Filter catalysts with valid dropWeight and price data
  const validCatalysts = catalysts.filter(
    catalyst => catalyst.hasDropWeight() && catalyst.hasPriceData()
  );

  if (validCatalysts.length === 0) {
    throw new Error('No valid Catalysts with both dropWeight and price data');
  }

  // Exclude Tainted Catalysts from return pool (they cannot be received when flipping)
  const returnableCatalysts = validCatalysts.filter(catalyst => !catalyst.isTainted());

  if (returnableCatalysts.length === 0) {
    throw new Error('No returnable Catalysts available (all are Tainted)');
  }

  // Determine which catalysts are used as input based on trade mode
  let inputCatalysts = [];
  let finalReturnableCatalysts = returnableCatalysts;

  if (tradeMode === 'lowest_value') {
    const lowestCatalyst = findLowestValueCatalyst(returnableCatalysts);
    if (lowestCatalyst) {
      inputCatalysts = [lowestCatalyst];
      // Exclude input catalysts from return pool
      finalReturnableCatalysts = returnableCatalysts.filter(c => c.id !== lowestCatalyst.id);
    }
  } else if (tradeMode === 'optimal_combination') {
    const optimalCatalyst = findOptimalInputCatalyst(returnableCatalysts);
    if (optimalCatalyst) {
      inputCatalysts = [optimalCatalyst];
      // Exclude input catalysts from return pool
      finalReturnableCatalysts = returnableCatalysts.filter(c => c.id !== optimalCatalyst.id);
    }
  }
  // For 'returnable' mode, inputCatalysts remains empty and finalReturnableCatalysts = returnableCatalysts

  // Ensure we have enough catalysts in the return pool
  if (finalReturnableCatalysts.length === 0) {
    throw new Error('No catalysts available in return pool after excluding input catalysts');
  }

  // Calculate total weight from returnable catalysts only
  const totalWeight = finalReturnableCatalysts.reduce(
    (sum, catalyst) => sum + catalyst.dropWeight,
    0
  );

  if (totalWeight <= 0) {
    throw new Error('Total weight must be greater than 0');
  }

  // Calculate expected value using weighted average (only from returnable catalysts)
  const expectedValue = finalReturnableCatalysts.reduce((sum, catalyst) => {
    const probability = catalyst.dropWeight / totalWeight;
    const value = catalyst.chaosValue;
    return sum + (probability * value);
  }, 0);

  // Calculate variance and standard deviation (population parameters)
  const variance = computeVariance(finalReturnableCatalysts, totalWeight, expectedValue);
  const populationStandardDeviation = Math.sqrt(variance);

  // Calculate standard error for the sampling distribution
  const standardError = populationStandardDeviation / Math.sqrt(numberOfTrades);
  
  // Get z-score for the desired confidence percentile
  const zScore = getZScore(confidencePercentile);

  // Calculate coefficient of variation
  const coefficientOfVariation = expectedValue > 0 
    ? standardError / expectedValue 
    : Infinity;

  // Calculate the lower bound of the confidence interval
  const lowerBoundExpectedValue = expectedValue - (zScore * standardError);
  
  if (lowerBoundExpectedValue < 0) {
    console.warn(`Lower bound is negative (${lowerBoundExpectedValue.toFixed(4)}). This suggests numberOfTrades (${numberOfTrades}) may be too small for the variance level.`);
  }

  // Log detailed calculation for debugging
  console.log('Catalyst Threshold Calculation Details:', {
    tradeMode: tradeMode,
    inputCatalysts: inputCatalysts.map(c => c.name).join(', ') || 'none (returnable)',
    returnableCatalystsCount: finalReturnableCatalysts.length,
    taintedExcluded: validCatalysts.length - returnableCatalysts.length,
    expectedValue: expectedValue.toFixed(4),
    variance: variance.toFixed(4),
    populationStandardDeviation: populationStandardDeviation.toFixed(4),
    numberOfTrades: numberOfTrades,
    standardError: standardError.toFixed(4),
    coefficientOfVariation: coefficientOfVariation.toFixed(4),
    zScore: zScore.toFixed(4),
    confidencePercentile: confidencePercentile,
    lowerBoundExpectedValue: lowerBoundExpectedValue.toFixed(4),
    rawThreshold: (lowerBoundExpectedValue / 3).toFixed(4)
  });

  // Threshold is the maximum input value where lower bound expected value > 3 × input
  const rawThreshold = lowerBoundExpectedValue / 3;
  const threshold = Math.max(0, rawThreshold);
  
  if (rawThreshold < 0) {
    console.warn(`Threshold calculation resulted in negative value (${rawThreshold.toFixed(4)}), clamped to 0.`);
  }

  return new ExpectedValueThreshold(
    threshold, 
    totalWeight, 
    finalReturnableCatalysts.length,
    expectedValue,
    variance,
    populationStandardDeviation,
    confidencePercentile,
    numberOfTrades,
    standardError,
    tradeMode
  );
}

/**
 * Find the lowest value catalyst from valid catalysts
 * @param {Array<Catalyst>} validCatalysts
 * @returns {Catalyst|null}
 */
function findLowestValueCatalyst(validCatalysts) {
  if (validCatalysts.length === 0) return null;
  
  return validCatalysts.reduce((lowest, catalyst) => {
    if (!lowest) return catalyst;
    if (catalyst.chaosValue < lowest.chaosValue) return catalyst;
    return lowest;
  }, null);
}

/**
 * Find optimal combination of catalysts for input (low value, high weighting)
 * Returns the catalyst that minimizes (value / weight) ratio
 * @param {Array<Catalyst>} validCatalysts
 * @returns {Catalyst|null}
 */
function findOptimalInputCatalyst(validCatalysts) {
  if (validCatalysts.length === 0) return null;
  
  return validCatalysts.reduce((optimal, catalyst) => {
    if (!optimal) return catalyst;
    
    // Calculate value-to-weight ratio (lower is better)
    const optimalRatio = optimal.chaosValue / optimal.dropWeight;
    const catalystRatio = catalyst.chaosValue / catalyst.dropWeight;
    
    if (catalystRatio < optimalRatio) return catalyst;
    return optimal;
  }, null);
}

/**
 * Calculate profitability status for all Catalysts based on threshold
 * @param {Array<Catalyst>} catalysts
 * @param {ExpectedValueThreshold} threshold
 */
export function calculateCatalystProfitabilityStatus(catalysts, threshold) {
  catalysts.forEach(catalyst => {
    if (!catalyst.hasPriceData()) {
      catalyst.profitabilityStatus = 'unknown';
      return;
    }

    if (catalyst.chaosValue < threshold.value) {
      catalyst.profitabilityStatus = 'profitable';
    } else {
      catalyst.profitabilityStatus = 'not_profitable';
    }
  });
}

/**
 * Calculate threshold for Tattoos (excludes Journey Tattoos from return pool)
 * @param {Array<Tattoo>} tattoos
 * @param {number} confidencePercentile - Confidence level (0-1), default 0.9 for 90th percentile
 * @param {number} numberOfTrades - Number of trades to consider (default: 10000)
 * @param {string} tradeMode - Trade mode: 'returnable', 'lowest_value', or 'optimal_combination' (default: 'returnable')
 * @returns {ExpectedValueThreshold}
 */
export function calculateTattooThreshold(tattoos, confidencePercentile = 0.9, numberOfTrades = 10000, tradeMode = 'returnable') {
  // Filter tattoos with valid dropWeight and price data
  const validTattoos = tattoos.filter(
    tattoo => tattoo.hasDropWeight() && tattoo.hasPriceData()
  );

  if (validTattoos.length === 0) {
    throw new Error('No valid Tattoos with both dropWeight and price data');
  }

  // Exclude Journey Tattoos from return pool (they cannot be received when flipping)
  const returnableTattoos = validTattoos.filter(tattoo => !tattoo.isJourneyTattoo());

  if (returnableTattoos.length === 0) {
    throw new Error('No returnable Tattoos available (all are Journey Tattoos)');
  }

  // Determine which tattoos are used as input based on trade mode
  let inputTattoos = [];
  let finalReturnableTattoos = returnableTattoos;

  if (tradeMode === 'lowest_value') {
    const lowestTattoo = findLowestValueTattoo(returnableTattoos);
    if (lowestTattoo) {
      inputTattoos = [lowestTattoo];
      // Exclude input tattoos from return pool
      finalReturnableTattoos = returnableTattoos.filter(t => t.id !== lowestTattoo.id);
    }
  } else if (tradeMode === 'optimal_combination') {
    const optimalTattoo = findOptimalInputTattoo(returnableTattoos);
    if (optimalTattoo) {
      inputTattoos = [optimalTattoo];
      // Exclude input tattoos from return pool
      finalReturnableTattoos = returnableTattoos.filter(t => t.id !== optimalTattoo.id);
    }
  }
  // For 'returnable' mode, inputTattoos remains empty and finalReturnableTattoos = returnableTattoos

  // Ensure we have enough tattoos in the return pool
  if (finalReturnableTattoos.length === 0) {
    throw new Error('No tattoos available in return pool after excluding input tattoos');
  }

  // Calculate total weight from returnable tattoos only
  const totalWeight = finalReturnableTattoos.reduce(
    (sum, tattoo) => sum + tattoo.dropWeight,
    0
  );

  if (totalWeight <= 0) {
    throw new Error('Total weight must be greater than 0');
  }

  // Calculate expected value using weighted average (only from returnable tattoos)
  const expectedValue = finalReturnableTattoos.reduce((sum, tattoo) => {
    const probability = tattoo.dropWeight / totalWeight;
    const value = tattoo.chaosValue;
    return sum + (probability * value);
  }, 0);

  // Calculate variance and standard deviation (population parameters)
  const variance = computeVariance(finalReturnableTattoos, totalWeight, expectedValue);
  const populationStandardDeviation = Math.sqrt(variance);

  // Calculate standard error for the sampling distribution
  const standardError = populationStandardDeviation / Math.sqrt(numberOfTrades);
  
  // Get z-score for the desired confidence percentile
  const zScore = getZScore(confidencePercentile);

  // Calculate coefficient of variation
  const coefficientOfVariation = expectedValue > 0 
    ? standardError / expectedValue 
    : Infinity;

  // Calculate the lower bound of the confidence interval
  const lowerBoundExpectedValue = expectedValue - (zScore * standardError);
  
  if (lowerBoundExpectedValue < 0) {
    console.warn(`Lower bound is negative (${lowerBoundExpectedValue.toFixed(4)}). This suggests numberOfTrades (${numberOfTrades}) may be too small for the variance level.`);
  }

  // Log detailed calculation for debugging
  console.log('Tattoo Threshold Calculation Details:', {
    tradeMode: tradeMode,
    inputTattoos: inputTattoos.map(t => t.name).join(', ') || 'none (returnable)',
    returnableTattoosCount: finalReturnableTattoos.length,
    journeyExcluded: validTattoos.length - returnableTattoos.length,
    expectedValue: expectedValue.toFixed(4),
    variance: variance.toFixed(4),
    populationStandardDeviation: populationStandardDeviation.toFixed(4),
    numberOfTrades: numberOfTrades,
    standardError: standardError.toFixed(4),
    coefficientOfVariation: coefficientOfVariation.toFixed(4),
    zScore: zScore.toFixed(4),
    confidencePercentile: confidencePercentile,
    lowerBoundExpectedValue: lowerBoundExpectedValue.toFixed(4),
    rawThreshold: (lowerBoundExpectedValue / 3).toFixed(4)
  });

  // Threshold is the maximum input value where lower bound expected value > 3 × input
  const rawThreshold = lowerBoundExpectedValue / 3;
  const threshold = Math.max(0, rawThreshold);
  
  if (rawThreshold < 0) {
    console.warn(`Threshold calculation resulted in negative value (${rawThreshold.toFixed(4)}), clamped to 0.`);
  }

  return new ExpectedValueThreshold(
    threshold, 
    totalWeight, 
    finalReturnableTattoos.length,
    expectedValue,
    variance,
    populationStandardDeviation,
    confidencePercentile,
    numberOfTrades,
    standardError,
    tradeMode
  );
}

/**
 * Find the lowest value tattoo from valid tattoos
 * @param {Array<Tattoo>} validTattoos
 * @returns {Tattoo|null}
 */
function findLowestValueTattoo(validTattoos) {
  if (validTattoos.length === 0) return null;
  
  return validTattoos.reduce((lowest, tattoo) => {
    if (!lowest) return tattoo;
    if (tattoo.chaosValue < lowest.chaosValue) return tattoo;
    return lowest;
  }, null);
}

/**
 * Find optimal combination of tattoos for input (low value, high weighting)
 * Returns the tattoo that minimizes (value / weight) ratio
 * @param {Array<Tattoo>} validTattoos
 * @returns {Tattoo|null}
 */
function findOptimalInputTattoo(validTattoos) {
  if (validTattoos.length === 0) return null;
  
  return validTattoos.reduce((optimal, tattoo) => {
    if (!optimal) return tattoo;
    
    // Calculate value-to-weight ratio (lower is better)
    const optimalRatio = optimal.chaosValue / optimal.dropWeight;
    const tattooRatio = tattoo.chaosValue / tattoo.dropWeight;
    
    if (tattooRatio < optimalRatio) return tattoo;
    return optimal;
  }, null);
}

/**
 * Calculate profitability status for all Tattoos based on threshold
 * @param {Array<Tattoo>} tattoos
 * @param {ExpectedValueThreshold} threshold
 */
export function calculateTattooProfitabilityStatus(tattoos, threshold) {
  tattoos.forEach(tattoo => {
    if (!tattoo.hasPriceData()) {
      tattoo.profitabilityStatus = 'unknown';
      return;
    }

    if (tattoo.chaosValue < threshold.value) {
      tattoo.profitabilityStatus = 'profitable';
    } else {
      tattoo.profitabilityStatus = 'not_profitable';
    }
  });
}

/**
 * Calculate simulation results for optimized strategy
 * Only uses profitable Scarabs
 * 
 * @param {Array<Scarab>} scarabs
 * @param {ExpectedValueThreshold} threshold
 * @param {number} transactionCount
 * @returns {object} Simulation results
 */
export function calculateOptimizedStrategy(scarabs, threshold, transactionCount) {
  const profitableScarabs = scarabs.filter(
    s => s.profitabilityStatus === 'profitable' && s.hasPriceData()
  );

  if (profitableScarabs.length === 0) {
    throw new Error('No profitable Scarabs available for optimized strategy');
  }

  // Calculate average input value (using profitable Scarabs only)
  const avgInputValue = profitableScarabs.reduce(
    (sum, s) => sum + s.chaosValue,
    0
  ) / profitableScarabs.length;

  // Use threshold calculation for expected output
  const expectedOutputValue = threshold.value * 3;

  const totalInputValue = avgInputValue * 3 * transactionCount;
  const totalOutputValue = expectedOutputValue * transactionCount;
  const netProfitLoss = totalOutputValue - totalInputValue;

  return {
    totalInputValue,
    expectedOutputValue,
    netProfitLoss,
    profitLossPerTransaction: netProfitLoss / transactionCount,
  };
}

/**
 * Calculate simulation results for user-chosen strategy
 * 
 * @param {Array<Scarab>} selectedScarabs
 * @param {ExpectedValueThreshold} threshold
 * @param {number} transactionCount
 * @returns {object} Simulation results
 */
export function calculateUserChosenStrategy(selectedScarabs, threshold, transactionCount) {
  if (selectedScarabs.length < 1) {
    throw new Error('User-chosen strategy requires at least 1 selected Scarab');
  }

  // Calculate average input value from selected Scarabs
  const avgInputValue = selectedScarabs.reduce(
    (sum, s) => sum + (s.chaosValue || 0),
    0
  ) / selectedScarabs.length;

  const expectedOutputValue = threshold.value * 3;

  const totalInputValue = avgInputValue * 3 * transactionCount;
  const totalOutputValue = expectedOutputValue * transactionCount;
  const netProfitLoss = totalOutputValue - totalInputValue;

  return {
    totalInputValue,
    expectedOutputValue,
    netProfitLoss,
    profitLossPerTransaction: netProfitLoss / transactionCount,
  };
}

/**
 * Calculate simulation results for random strategy
 * Uses all available Scarabs with equal probability
 * 
 * @param {Array<Scarab>} scarabs
 * @param {ExpectedValueThreshold} threshold
 * @param {number} transactionCount
 * @returns {object} Simulation results
 */
export function calculateRandomStrategy(scarabs, threshold, transactionCount) {
  const validScarabs = scarabs.filter(s => s.hasPriceData());

  if (validScarabs.length === 0) {
    throw new Error('No valid Scarabs with price data for random strategy');
  }

  // Calculate average input value across all valid Scarabs
  const avgInputValue = validScarabs.reduce(
    (sum, s) => sum + s.chaosValue,
    0
  ) / validScarabs.length;

  const expectedOutputValue = threshold.value * 3;

  const totalInputValue = avgInputValue * 3 * transactionCount;
  const totalOutputValue = expectedOutputValue * transactionCount;
  const netProfitLoss = totalOutputValue - totalInputValue;

  return {
    totalInputValue,
    expectedOutputValue,
    netProfitLoss,
    profitLossPerTransaction: netProfitLoss / transactionCount,
  };
}

