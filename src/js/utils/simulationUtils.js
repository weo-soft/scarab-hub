/**
 * Simulation Utilities
 * Helper functions for simulation operations
 */

/**
 * Identify rare scarabs based on drop weight percentile threshold
 * @param {Array<Scarab>} scarabs - All scarabs to analyze
 * @param {number} threshold - Percentile threshold (0-1, e.g., 0.1 for bottom 10%)
 * @returns {Array<Scarab>} Array of rare scarabs
 */
export function identifyRareScarabs(scarabs, threshold = 0.1) {
  // Filter scarabs with valid drop weights
  const validScarabs = scarabs.filter(s => s.hasDropWeight());
  
  if (validScarabs.length === 0) {
    return [];
  }
  
  // Sort by drop weight (ascending - lower weight = rarer)
  const sortedScarabs = [...validScarabs].sort((a, b) => a.dropWeight - b.dropWeight);
  
  // Calculate cutoff index (bottom X percentile)
  const cutoffIndex = Math.floor(sortedScarabs.length * threshold);
  
  // Return scarabs in the bottom percentile
  return sortedScarabs.slice(0, cutoffIndex);
}

/**
 * Select a scarab using weighted random selection based on drop weights
 * @param {Array<Scarab>} scarabs - Available scarabs with drop weights
 * @param {number} totalWeight - Total weight of all scarabs (pre-calculated for efficiency)
 * @returns {Scarab} Selected scarab
 */
export function selectWeightedRandomScarab(scarabs, totalWeight) {
  if (scarabs.length === 0) {
    throw new Error('No scarabs available for selection');
  }
  
  if (totalWeight <= 0) {
    throw new Error('Total weight must be greater than 0');
  }
  
  // Generate random number between 0 and totalWeight
  const random = Math.random() * totalWeight;
  
  // Find the scarab that corresponds to this random value
  let cumulativeWeight = 0;
  for (const scarab of scarabs) {
    cumulativeWeight += scarab.dropWeight;
    if (random <= cumulativeWeight) {
      return scarab;
    }
  }
  
  // Fallback to last scarab (shouldn't happen, but safety check)
  return scarabs[scarabs.length - 1];
}

/**
 * Check if breakeven point has been achieved
 * @param {number} previousCumulative - Previous cumulative profit/loss
 * @param {number} currentCumulative - Current cumulative profit/loss
 * @param {number} breakevenPoint - Breakeven threshold (typically 0)
 * @returns {boolean} True if breakeven was just achieved
 */
export function checkBreakevenAchieved(previousCumulative, currentCumulative, breakevenPoint = 0) {
  // Breakeven achieved when:
  // 1. Previous cumulative was below breakeven point
  // 2. Current cumulative is at or above breakeven point
  return previousCumulative < breakevenPoint && currentCumulative >= breakevenPoint;
}

/**
 * Randomly select 3 unique scarabs from an array
 * @param {Array<Scarab>} scarabs - Array of scarabs to choose from
 * @returns {Array<Scarab>} Array of 3 randomly selected scarabs
 */
export function selectRandomThree(scarabs) {
  if (scarabs.length < 3) {
    throw new Error('Need at least 3 scarabs to select from');
  }
  
  // If exactly 3, return all of them
  if (scarabs.length === 3) {
    return [...scarabs];
  }
  
  // Create a copy of the array to avoid mutating the original
  const available = [...scarabs];
  const selected = [];
  
  // Randomly select 3 unique scarabs
  for (let i = 0; i < 3; i++) {
    const randomIndex = Math.floor(Math.random() * available.length);
    selected.push(available[randomIndex]);
    available.splice(randomIndex, 1);
  }
  
  return selected;
}

