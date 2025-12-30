/**
 * Simulation Service
 * Core simulation engine for 3-to-1 trade simulations with transaction-by-transaction tracking
 */

import { SimulationConfiguration, SimulationTransaction, SimulationResult, SignificantEvent } from '../models/scarab.js';
import { identifyRareScarabs, selectWeightedRandomScarab, checkBreakevenAchieved, selectRandomThree } from '../utils/simulationUtils.js';

/**
 * Create and validate a simulation configuration
 * @param {Object} configData - Configuration data
 * @param {Array<string>} configData.selectedScarabIds - Array of scarab IDs (minimum 1)
 * @param {number} configData.breakevenPoint - Breakeven threshold (>= 0)
 * @param {number} configData.rareScarabThreshold - Drop weight percentile (0-1, default 0.1)
 * @param {number} configData.transactionCount - Number of trades (1 to 1,000,000)
 * @param {string} configData.inputScarabStrategy - Strategy type (optional)
 * @returns {SimulationConfiguration}
 */
export function createConfiguration(configData) {
  const config = new SimulationConfiguration({
    selectedScarabIds: configData.selectedScarabIds || [],
    breakevenPoint: configData.breakevenPoint ?? 0,
    rareScarabThreshold: configData.rareScarabThreshold ?? 0.1,
    transactionCount: configData.transactionCount || 100,
    inputScarabStrategy: configData.inputScarabStrategy || 'user_selected',
    continueMode: configData.continueMode ?? false,
  });
  
  return config;
}

/**
 * Validate simulation configuration
 * @param {SimulationConfiguration} config - Configuration to validate
 * @param {Array<Scarab>} availableScarabs - Available scarabs for validation
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateConfiguration(config, availableScarabs = []) {
  if (!config.selectedScarabIds || config.selectedScarabIds.length < 1) {
    return { valid: false, error: 'At least 1 scarab must be selected' };
  }
  
  if (config.transactionCount <= 0 || config.transactionCount > 1000000) {
    return { valid: false, error: 'Transaction count must be between 1 and 1,000,000' };
  }
  
  if (config.breakevenPoint < 0) {
    return { valid: false, error: 'Breakeven point must be >= 0' };
  }
  
  if (config.rareScarabThreshold < 0 || config.rareScarabThreshold > 1) {
    return { valid: false, error: 'Rare scarab threshold must be between 0 and 1' };
  }
  
  // Validate all selected scarab IDs exist
  if (availableScarabs.length > 0) {
    const availableIds = new Set(availableScarabs.map(s => s.id));
    const invalidIds = config.selectedScarabIds.filter(id => !availableIds.has(id));
    if (invalidIds.length > 0) {
      return { valid: false, error: `Invalid scarab IDs: ${invalidIds.join(', ')}` };
    }
  }
  
  return { valid: true };
}

let currentSimulationCancelled = false;

/**
 * Cancel current simulation
 */
export function cancelSimulation() {
  currentSimulationCancelled = true;
}

/**
 * Run simulation with transaction-by-transaction tracking
 * @param {SimulationConfiguration} config - Simulation configuration
 * @param {Array<Scarab>} allScarabs - All available scarabs
 * @param {Function} progressCallback - Optional callback for progress updates (progress: number, current: number, total: number, phase?: string)
 * @param {ExpectedValueThreshold|null} threshold - Profitability threshold for continue mode (optional)
 * @returns {Promise<SimulationResult>}
 */
export async function runSimulation(config, allScarabs, progressCallback = null, threshold = null) {
  // Reset cancellation flag
  currentSimulationCancelled = false;
  const startTime = Date.now();
  
  // Validate configuration
  const validation = validateConfiguration(config, allScarabs);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  // Filter selected scarabs (for input)
  const selectedScarabs = allScarabs.filter(s => config.selectedScarabIds.includes(s.id));
  const validScarabs = selectedScarabs.filter(s => s.hasDropWeight() && s.hasPriceData());
  
  if (validScarabs.length === 0) {
    throw new Error('No valid scarabs with both drop weight and price data');
  }
  
  // Return pool includes ALL scarabs with drop weights (not just selected ones)
  // The selection only determines which scarabs are used as INPUT
  const allReturnableScarabs = allScarabs.filter(s => s.hasDropWeight() && s.hasPriceData());
  
  if (allReturnableScarabs.length === 0) {
    throw new Error('No scarabs available in return pool (need scarabs with drop weights)');
  }
  
  // Initialize result
  const result = new SimulationResult({
    simulationId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    configuration: config,
    yieldCounts: new Map(),
    totalTransactions: config.transactionCount,
    transactions: [],
    significantEvents: [],
  });
  
  // Calculate rare scarab set
  const rareScarabSet = new Set(identifyRareScarabs(allScarabs, config.rareScarabThreshold).map(s => s.id));
  
  // Calculate breakeven point automatically: (average input value per transaction) × (number of transactions)
  // For user_selected with random selection, calculate average input value across all possible combinations
  let averageInputValuePerTransaction = 0;
  if (config.inputScarabStrategy === 'lowest_value') {
    const lowestScarab = validScarabs.reduce((lowest, s) => 
      (!lowest || s.chaosValue < lowest.chaosValue) ? s : lowest, null
    );
    averageInputValuePerTransaction = lowestScarab ? lowestScarab.chaosValue * 3 : 0;
  } else if (config.inputScarabStrategy === 'optimal_combination') {
    const sortedByRatio = [...validScarabs].sort((a, b) => {
      const ratioA = a.chaosValue / a.dropWeight;
      const ratioB = b.chaosValue / b.dropWeight;
      return ratioA - ratioB;
    });
    const optimalThree = sortedByRatio.slice(0, 3);
    averageInputValuePerTransaction = optimalThree.reduce((sum, s) => sum + s.chaosValue, 0);
  } else {
    // user_selected: calculate average input value from all selected scarabs
    // Since we randomly select 3 each time, use the average value of all selected scarabs
    if (validScarabs.length >= 3) {
      const totalValue = validScarabs.reduce((sum, s) => sum + s.chaosValue, 0);
      const averageValue = totalValue / validScarabs.length;
      averageInputValuePerTransaction = averageValue * 3;
    } else {
      // Fallback: use first 3 if less than 3 selected
      const firstThree = validScarabs.slice(0, 3);
      while (firstThree.length < 3 && validScarabs.length > 0) {
        firstThree.push(validScarabs[0]);
      }
      averageInputValuePerTransaction = firstThree.reduce((sum, s) => sum + s.chaosValue, 0);
    }
  }
  
  const calculatedBreakevenPoint = averageInputValuePerTransaction * config.transactionCount;
  
  // Override config breakeven point with calculated value
  config.breakevenPoint = calculatedBreakevenPoint;
  
  // Initialize tracking variables
  let cumulativeProfitLoss = 0;
  let previousCumulativeProfitLoss = 0;
  let breakevenAchieved = false;
  
  // Track returned scarabs for continue mode
  const returnedScarabs = []; // Array of scarab IDs returned during initial phase
  
  // Process transactions in batches
  const BATCH_SIZE = 10000;
  let processedCount = 0;
  
  // Phase 1: Initial transactions
  for (let batchStart = 0; batchStart < config.transactionCount; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, config.transactionCount);
    const batchSize = batchEnd - batchStart;
    
    // Process batch
    for (let i = 0; i < batchSize; i++) {
      // Check for cancellation
      if (currentSimulationCancelled) {
        throw new Error('Simulation cancelled by user');
      }
      
      const transactionNumber = batchStart + i + 1;
      
      // Select 3 input scarabs based on strategy
      let inputScarabs = [];
      if (config.inputScarabStrategy === 'lowest_value') {
        // Use 3 of the lowest value scarab
        const lowestScarab = validScarabs.reduce((lowest, s) => 
          (!lowest || s.chaosValue < lowest.chaosValue) ? s : lowest, null
        );
        inputScarabs = [lowestScarab, lowestScarab, lowestScarab].filter(Boolean);
      } else if (config.inputScarabStrategy === 'optimal_combination') {
        // Use optimal combination (low value, high weight ratio)
        const sortedByRatio = [...validScarabs].sort((a, b) => {
          const ratioA = a.chaosValue / a.dropWeight;
          const ratioB = b.chaosValue / b.dropWeight;
          return ratioA - ratioB;
        });
        inputScarabs = sortedByRatio.slice(0, 3);
      } else {
        // user_selected: randomly select 3 from all selected scarabs
        if (validScarabs.length === 3) {
          inputScarabs = [...validScarabs];
        } else if (validScarabs.length > 3) {
          inputScarabs = selectRandomThree(validScarabs);
        } else {
          // Fallback: if less than 3, repeat the first one
          inputScarabs = [];
          while (inputScarabs.length < 3 && validScarabs.length > 0) {
            inputScarabs.push(validScarabs[0]);
          }
        }
      }
      
      // Ensure we have exactly 3 scarabs
      while (inputScarabs.length < 3 && validScarabs.length > 0) {
        inputScarabs.push(validScarabs[0]);
      }
      
      if (inputScarabs.length < 3) {
        throw new Error('Not enough valid scarabs for input (need at least 1 valid scarab with price and drop weight data)');
      }
      
      const inputScarabIds = inputScarabs.map(s => s.id);
      const inputValue = inputScarabs.reduce((sum, s) => sum + s.chaosValue, 0);
      
      // Determine return pool based on strategy
      // Input scarabs are ALWAYS excluded from return pool (cannot get back what you put in)
      // Return pool uses ALL scarabs with drop weights, excluding the input scarabs
      const inputScarabIdSet = new Set(inputScarabIds);
      let returnableScarabs = allReturnableScarabs.filter(s => !inputScarabIdSet.has(s.id));
      
      // Ensure we have at least one scarab in the return pool
      if (returnableScarabs.length === 0) {
        throw new Error('No scarabs available in return pool after excluding input scarabs. Please select more scarabs or use a different strategy.');
      }
      
      // Calculate total weight for return pool
      const totalWeight = returnableScarabs.reduce((sum, s) => sum + s.dropWeight, 0);
      
      if (totalWeight <= 0) {
        throw new Error('Total weight must be greater than 0');
      }
      
      // Select returned scarab using weighted random from returnable pool
      const returnedScarab = selectWeightedRandomScarab(returnableScarabs, totalWeight);
      const returnedValue = returnedScarab.chaosValue;
      
      // Calculate profit/loss
      const profitLoss = returnedValue - inputValue;
      cumulativeProfitLoss += profitLoss;
      
      // Create transaction
      const transaction = new SimulationTransaction({
        transactionNumber,
        inputScarabIds,
        returnedScarabId: returnedScarab.id,
        inputValue,
        returnedValue,
        profitLoss,
        cumulativeProfitLoss,
      });
      
      result.transactions.push(transaction);
      
      // Update yield counts
      const currentCount = result.yieldCounts.get(returnedScarab.id) || 0;
      result.yieldCounts.set(returnedScarab.id, currentCount + 1);
      
      // Track returned scarab for continue mode
      if (config.continueMode) {
        returnedScarabs.push(returnedScarab.id);
      }
      
      // Check for significant events
      // Rare scarab detection
      if (rareScarabSet.has(returnedScarab.id)) {
        result.significantEvents.push(new SignificantEvent({
          type: 'rare_scarab_return',
          transactionNumber,
          scarabId: returnedScarab.id,
          details: {
            scarabName: returnedScarab.name,
            dropWeight: returnedScarab.dropWeight,
            chaosValue: returnedScarab.chaosValue,
          },
        }));
      }
      
      // Breakeven detection
      if (!breakevenAchieved && checkBreakevenAchieved(previousCumulativeProfitLoss, cumulativeProfitLoss, config.breakevenPoint)) {
        breakevenAchieved = true;
        result.significantEvents.push(new SignificantEvent({
          type: 'breakeven_achieved',
          transactionNumber,
          cumulativeProfitLoss,
          details: {
            previousCumulative: previousCumulativeProfitLoss,
            currentCumulative: cumulativeProfitLoss,
          },
        }));
      }
      
      previousCumulativeProfitLoss = cumulativeProfitLoss;
    }
    
    processedCount = batchEnd;
    
    // Update progress
    if (progressCallback) {
      const progress = (processedCount / config.transactionCount) * 100;
      // Pass yield counts for real-time updates
      progressCallback(progress, processedCount, config.transactionCount, new Map(result.yieldCounts), 'initial');
    }
    
    // Yield control to browser for UI responsiveness
    if (batchEnd < config.transactionCount) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  // Phase 2: Continue mode - trade with returned scarabs below threshold
  if (config.continueMode && threshold) {
    // Create a map of scarab ID to Scarab object for quick lookup
    const scarabMap = new Map(allScarabs.map(s => [s.id, s]));
    
    // Filter returned scarabs that are below profitability threshold
    const scarabsBelowThreshold = returnedScarabs
      .map(id => scarabMap.get(id))
      .filter(scarab => scarab && scarab.hasPriceData() && scarab.chaosValue < threshold.value);
    
    // Track how many times each scarab is used as input in continue mode
    // This will be used to reduce yield counts (since used scarabs are "consumed")
    const usedScarabsCount = new Map();
    
    // Continue trading until less than 3 scarabs below threshold remain
    let continueTransactionNumber = config.transactionCount;
    
    while (scarabsBelowThreshold.length >= 3) {
      // Check for cancellation
      if (currentSimulationCancelled) {
        throw new Error('Simulation cancelled by user');
      }
      
      continueTransactionNumber++;
      
      // Select 3 scarabs from those below threshold (random selection)
      const selectedForTrade = selectRandomThree(scarabsBelowThreshold);
      
      // Remove selected scarabs from the pool (remove exactly 3 items, one for each selected)
      // We need to remove by reference/identity, not just by ID, since we can have duplicates
      for (const selectedScarab of selectedForTrade) {
        const index = scarabsBelowThreshold.findIndex(s => s === selectedScarab);
        if (index !== -1) {
          scarabsBelowThreshold.splice(index, 1);
        }
      }
      
      const inputScarabIds = selectedForTrade.map(s => s.id);
      
      // Track that these scarabs were used (consumed) in continue mode
      for (const inputScarabId of inputScarabIds) {
        const currentUsed = usedScarabsCount.get(inputScarabId) || 0;
        usedScarabsCount.set(inputScarabId, currentUsed + 1);
        
        // Reduce yield count since this scarab was consumed
        const currentYield = result.yieldCounts.get(inputScarabId) || 0;
        if (currentYield > 0) {
          result.yieldCounts.set(inputScarabId, currentYield - 1);
        }
      }
      const inputValue = selectedForTrade.reduce((sum, s) => sum + s.chaosValue, 0);
      
      // Determine return pool - exclude input scarabs
      const inputScarabIdSet = new Set(inputScarabIds);
      let returnableScarabs = allReturnableScarabs.filter(s => !inputScarabIdSet.has(s.id));
      
      if (returnableScarabs.length === 0) {
        // If no returnable scarabs, break
        break;
      }
      
      // Calculate total weight for return pool
      const totalWeight = returnableScarabs.reduce((sum, s) => sum + s.dropWeight, 0);
      
      if (totalWeight <= 0) {
        break;
      }
      
      // Select returned scarab using weighted random from returnable pool
      const returnedScarab = selectWeightedRandomScarab(returnableScarabs, totalWeight);
      const returnedValue = returnedScarab.chaosValue;
      
      // Calculate profit/loss
      const profitLoss = returnedValue - inputValue;
      cumulativeProfitLoss += profitLoss;
      
      // Create transaction
      const transaction = new SimulationTransaction({
        transactionNumber: continueTransactionNumber,
        inputScarabIds,
        returnedScarabId: returnedScarab.id,
        inputValue,
        returnedValue,
        profitLoss,
        cumulativeProfitLoss,
      });
      
      result.transactions.push(transaction);
      
      // Update yield counts
      const currentCount = result.yieldCounts.get(returnedScarab.id) || 0;
      result.yieldCounts.set(returnedScarab.id, currentCount + 1);
      
      // If returned scarab is below threshold, add it to the pool for further trading
      if (returnedScarab.hasPriceData() && returnedScarab.chaosValue < threshold.value) {
        scarabsBelowThreshold.push(returnedScarab);
      }
      
      // Check for significant events
      if (rareScarabSet.has(returnedScarab.id)) {
        result.significantEvents.push(new SignificantEvent({
          type: 'rare_scarab_return',
          transactionNumber: continueTransactionNumber,
          scarabId: returnedScarab.id,
          details: {
            scarabName: returnedScarab.name,
            dropWeight: returnedScarab.dropWeight,
            chaosValue: returnedScarab.chaosValue,
          },
        }));
      }
      
      // Breakeven detection
      if (!breakevenAchieved && checkBreakevenAchieved(previousCumulativeProfitLoss, cumulativeProfitLoss, config.breakevenPoint)) {
        breakevenAchieved = true;
        result.significantEvents.push(new SignificantEvent({
          type: 'breakeven_achieved',
          transactionNumber: continueTransactionNumber,
          cumulativeProfitLoss,
          details: {
            previousCumulative: previousCumulativeProfitLoss,
            currentCumulative: cumulativeProfitLoss,
          },
        }));
      }
      
      previousCumulativeProfitLoss = cumulativeProfitLoss;
      
      // Update progress periodically (every 100 transactions or at end) for continue mode
      // This ensures UI updates in real-time as scarabs are consumed
      if (continueTransactionNumber % 100 === 0 || scarabsBelowThreshold.length < 3) {
        if (progressCallback) {
          const totalTransactions = continueTransactionNumber;
          const progress = 100; // Initial phase is complete, continue phase is bonus
          // Pass updated yield counts (with consumed scarabs already deducted)
          progressCallback(progress, totalTransactions, config.transactionCount, new Map(result.yieldCounts), 'continue', scarabsBelowThreshold.length);
        }
        // Yield control to browser for UI responsiveness
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    // Update total transactions to include continue phase
    result.totalTransactions = continueTransactionNumber;
  }
  
  // Calculate aggregated results
  result.totalInputValue = result.transactions.reduce((sum, t) => sum + t.inputValue, 0);
  result.totalOutputValue = result.transactions.reduce((sum, t) => sum + t.returnedValue, 0);
  result.netProfitLoss = result.totalOutputValue - result.totalInputValue;
  result.averageProfitLossPerTransaction = result.totalTransactions > 0 
    ? result.netProfitLoss / result.totalTransactions 
    : 0;
  result.finalCumulativeProfitLoss = cumulativeProfitLoss;
  result.completedAt = new Date().toISOString();
  result.executionTimeMs = Date.now() - startTime;
  
  return result;
}

/**
 * Get transaction history with pagination
 * @param {SimulationResult} result - Simulation result
 * @param {Object} options - Pagination options
 * @param {number} options.page - Page number (1-based)
 * @param {number} options.pageSize - Transactions per page
 * @param {Object} options.filter - Filter options
 * @returns {Object} Paginated transaction history
 */
export function getTransactionHistory(result, options = {}) {
  const { page = 1, pageSize = 100, filter = {} } = options;
  
  let transactions = result.transactions;
  
  // Apply filters
  if (filter.scarabId) {
    // Exact match
    transactions = transactions.filter(t => t.returnedScarabId === filter.scarabId);
  } else if (filter.searchTerm) {
    // Partial match on scarab ID
    const searchLower = filter.searchTerm.toLowerCase();
    transactions = transactions.filter(t => 
      t.returnedScarabId.toLowerCase().includes(searchLower)
    );
  }
  if (filter.minTransactionNumber !== undefined && filter.minTransactionNumber !== null) {
    transactions = transactions.filter(t => t.transactionNumber >= filter.minTransactionNumber);
  }
  if (filter.maxTransactionNumber !== undefined && filter.maxTransactionNumber !== null) {
    transactions = transactions.filter(t => t.transactionNumber <= filter.maxTransactionNumber);
  }
  
  // Paginate
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTransactions = transactions.slice(startIndex, endIndex);
  const totalPages = Math.ceil(transactions.length / pageSize);
  
  return {
    transactions: paginatedTransactions,
    totalTransactions: transactions.length,
    page,
    pageSize,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Get significant events from simulation result
 * @param {SimulationResult} result - Simulation result
 * @returns {Array<SignificantEvent>}
 */
export function getSignificantEvents(result) {
  return result.significantEvents || [];
}

/**
 * Get yield counts from simulation result
 * @param {SimulationResult} result - Simulation result
 * @returns {Map<string, number>}
 */
export function getYieldCounts(result) {
  return result.yieldCounts || new Map();
}

