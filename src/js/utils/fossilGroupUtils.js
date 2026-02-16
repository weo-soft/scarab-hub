/**
 * Fossil Group Utilities
 * Handles reroll group classification and grouping logic for Fossils
 */

/**
 * Classify a Fossil into a reroll group
 * All Fossils belong to the same reroll group ('fossil')
 * @param {string} fossilName - The name of the Fossil
 * @returns {string} 'fossil' (all Fossils belong to single group)
 */
export function classifyRerollGroup(fossilName) {
  if (!fossilName || typeof fossilName !== 'string') {
    return null;
  }

  // All Fossils belong to the same reroll group
  // No classification logic needed (simpler than Essence's multiple groups)
  return 'fossil';
}

/**
 * Group Fossils by their reroll group type
 * Since all Fossils belong to the same group, this is simpler than Essence grouping
 * @param {Array<Fossil>} fossils - Array of Fossil objects
 * @returns {Map<string, Array<Fossil>>} Map of group type to Fossils
 */
export function groupFossilsByRerollType(fossils) {
  const groups = new Map();
  
  fossils.forEach(fossil => {
    if (!fossil.rerollGroup) {
      return; // Skip unclassified Fossils
    }
    
    if (!groups.has(fossil.rerollGroup)) {
      groups.set(fossil.rerollGroup, []);
    }
    
    groups.get(fossil.rerollGroup).push(fossil);
  });
  
  return groups;
}

/**
 * Create a RerollGroup object for Fossils
 * @param {string} type - 'fossil' (single group for all Fossils)
 * @param {Array<Fossil>} fossils - Fossils in this group
 * @param {number} expectedValue - Calculated expected value
 * @param {number} threshold - Calculated threshold
 * @param {number} rerollCost - Cost of 30 Wild Crystallised Lifeforce
 * @returns {object} RerollGroup object
 */
export function createRerollGroup(type, fossils, expectedValue, threshold, rerollCost) {
  return {
    type,
    fossils: [...fossils],
    expectedValue,
    threshold,
    rerollCost,
    fossilCount: fossils.length
  };
}

