/**
 * Scarab Model
 * Represents a game item (Scarab) with all attributes needed for profitability analysis
 */

export class Scarab {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description || '';
    this.dropWeight = data.dropWeight ?? null;
    this.dropLevel = data.dropLevel || 0;
    this.limit = data.limit || 1;
    this.dropEnabled = data.dropEnabledd ?? data.dropEnabled ?? true;
    
    // Price data (may be null if unavailable)
    this.chaosValue = data.chaosValue ?? null;
    this.divineValue = data.divineValue ?? null;
    
    // Calculated fields (set after threshold calculation)
    this.expectedValue = data.expectedValue ?? 0;
    this.profitabilityStatus = data.profitabilityStatus || 'unknown';
    this.threshold = data.threshold ?? 0;
  }

  /**
   * Validate Scarab data
   * @returns {boolean} True if valid
   */
  validate() {
    if (!this.id || !this.name) return false;
    if (this.dropWeight !== null && this.dropWeight < 0) return false;
    if (this.chaosValue !== null && this.chaosValue < 0) return false;
    if (this.divineValue !== null && this.divineValue < 0) return false;
    if (this.dropLevel < 0) return false;
    if (this.limit <= 0) return false;
    return true;
  }

  /**
   * Check if Scarab has valid price data
   * @returns {boolean}
   */
  hasPriceData() {
    return this.chaosValue !== null && this.chaosValue >= 0;
  }

  /**
   * Check if Scarab has valid drop weight
   * @returns {boolean}
   */
  hasDropWeight() {
    return this.dropWeight !== null && this.dropWeight > 0;
  }
}

/**
 * ExpectedValueThreshold Model
 * Represents the calculated economic threshold that separates profitable from unprofitable vendoring
 */
export class ExpectedValueThreshold {
  constructor(value, totalWeight, scarabCount, expectedValue = null, variance = null, standardDeviation = null, confidencePercentile = null, numberOfTrades = null, standardError = null, tradeMode = 'returnable') {
    this.value = value;
    this.calculationMethod = 'weighted_average_with_confidence_interval';
    this.totalWeight = totalWeight;
    this.calculatedAt = new Date().toISOString();
    this.scarabCount = scarabCount;
    
    // Variance and confidence interval statistics
    this.expectedValue = expectedValue;
    this.variance = variance;
    this.standardDeviation = standardDeviation; // Population standard deviation
    this.confidencePercentile = confidencePercentile; // e.g., 0.9 for 90th percentile
    this.numberOfTrades = numberOfTrades; // Number of trades considered
    this.standardError = standardError; // Standard error of the mean (σ / √n)
    this.tradeMode = tradeMode; // 'returnable', 'lowest_value', or 'optimal_combination'
  }

  /**
   * Validate threshold data
   * @returns {boolean}
   */
  validate() {
    return this.value >= 0 && this.totalWeight > 0 && this.scarabCount > 0;
  }
}

/**
 * Simulation Model
 * Represents a vendoring simulation scenario with strategy and results
 */
export class Simulation {
  constructor(strategyType, selectedScarabs, transactionCount) {
    this.id = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.strategyType = strategyType; // 'optimized' | 'user_chosen' | 'random'
    this.selectedScarabs = selectedScarabs || [];
    this.transactionCount = transactionCount;
    this.expectedProfitLoss = 0;
    this.createdAt = new Date().toISOString();
    this.results = {
      totalInputValue: 0,
      expectedOutputValue: 0,
      netProfitLoss: 0,
      profitLossPerTransaction: 0,
    };
  }

  /**
   * Validate simulation parameters
   * @returns {object} { valid: boolean, error?: string }
   */
  validate() {
    if (this.transactionCount <= 0 || this.transactionCount > 10000) {
      return { valid: false, error: 'Transaction count must be between 1 and 10000' };
    }
    if (this.strategyType === 'user_chosen') {
      if (!this.selectedScarabs || this.selectedScarabs.length < 3) {
        return { valid: false, error: 'User-chosen strategy requires at least 3 selected Scarabs' };
      }
    }
    return { valid: true };
  }
}

