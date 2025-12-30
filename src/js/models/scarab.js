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
 * Simulation Configuration Model
 * Represents user-defined simulation parameters
 */
export class SimulationConfiguration {
  constructor(data) {
    this.selectedScarabIds = data.selectedScarabIds || [];
    this.breakevenPoint = data.breakevenPoint ?? 0;
    this.rareScarabThreshold = data.rareScarabThreshold ?? 0.1;
    this.transactionCount = data.transactionCount || 100;
    this.inputScarabStrategy = data.inputScarabStrategy || 'user_selected';
    this.continueMode = data.continueMode ?? false;
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  /**
   * Validate configuration
   * @returns {object} { valid: boolean, error?: string }
   */
  validate() {
    if (this.selectedScarabIds.length < 1) {
      return { valid: false, error: 'At least 1 scarab must be selected' };
    }
    if (this.transactionCount <= 0 || this.transactionCount > 1000000) {
      return { valid: false, error: 'Transaction count must be between 1 and 1,000,000' };
    }
    if (this.breakevenPoint < 0) {
      return { valid: false, error: 'Breakeven point must be >= 0' };
    }
    if (this.rareScarabThreshold < 0 || this.rareScarabThreshold > 1) {
      return { valid: false, error: 'Rare scarab threshold must be between 0 and 1' };
    }
    return { valid: true };
  }
}

/**
 * Simulation Transaction Model
 * Represents a single 3-to-1 trade transaction
 */
export class SimulationTransaction {
  constructor(data) {
    this.transactionNumber = data.transactionNumber;
    this.inputScarabIds = data.inputScarabIds || [];
    this.returnedScarabId = data.returnedScarabId;
    this.inputValue = data.inputValue ?? 0;
    this.returnedValue = data.returnedValue ?? 0;
    this.profitLoss = data.profitLoss ?? 0;
    this.cumulativeProfitLoss = data.cumulativeProfitLoss ?? 0;
  }
}

/**
 * Significant Event Model
 * Represents a notable occurrence during simulation
 */
export class SignificantEvent {
  constructor(data) {
    this.type = data.type; // 'rare_scarab_return' | 'breakeven_achieved'
    this.transactionNumber = data.transactionNumber;
    this.scarabId = data.scarabId || null;
    this.cumulativeProfitLoss = data.cumulativeProfitLoss ?? null;
    this.details = data.details || {};
  }
}

/**
 * Simulation Result Model
 * Represents aggregated simulation results
 */
export class SimulationResult {
  constructor(data) {
    this.simulationId = data.simulationId || `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.configuration = data.configuration;
    // Convert yieldCounts to Map if it's an object (from localStorage)
    this.yieldCounts = data.yieldCounts instanceof Map 
      ? data.yieldCounts 
      : (data.yieldCounts ? new Map(Object.entries(data.yieldCounts)) : new Map());
    this.totalTransactions = data.totalTransactions || 0;
    this.totalInputValue = data.totalInputValue ?? 0;
    this.totalOutputValue = data.totalOutputValue ?? 0;
    this.netProfitLoss = data.netProfitLoss ?? 0;
    this.averageProfitLossPerTransaction = data.averageProfitLossPerTransaction ?? 0;
    this.finalCumulativeProfitLoss = data.finalCumulativeProfitLoss ?? 0;
    this.significantEvents = data.significantEvents || [];
    this.transactions = data.transactions || [];
    this.completedAt = data.completedAt || null;
    this.executionTimeMs = data.executionTimeMs ?? 0;
    
    // Initial phase values (before continue mode) - only set if continue mode was used
    this.initialPhaseTransactions = data.initialPhaseTransactions ?? null;
    this.initialPhaseTotalInputValue = data.initialPhaseTotalInputValue ?? null;
    this.initialPhaseTotalOutputValue = data.initialPhaseTotalOutputValue ?? null;
    this.initialPhaseNetProfitLoss = data.initialPhaseNetProfitLoss ?? null;
    this.initialPhaseCumulativeProfitLoss = data.initialPhaseCumulativeProfitLoss ?? null;
    // Convert initialPhaseYieldCounts to Map if it's an object (from localStorage)
    this.initialPhaseYieldCounts = data.initialPhaseYieldCounts 
      ? (data.initialPhaseYieldCounts instanceof Map 
          ? data.initialPhaseYieldCounts 
          : new Map(Object.entries(data.initialPhaseYieldCounts)))
      : null;
  }
}

/**
 * Simulation Model
 * Represents a vendoring simulation scenario with strategy and results
 * @deprecated Use SimulationConfiguration and SimulationResult instead
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
      if (!this.selectedScarabs || this.selectedScarabs.length < 1) {
        return { valid: false, error: 'User-chosen strategy requires at least 1 selected Scarab' };
      }
    }
    return { valid: true };
  }
}

