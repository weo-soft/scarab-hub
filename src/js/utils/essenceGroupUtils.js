/**
 * Essence Group Utilities
 * Handles reroll group classification and grouping logic
 */

/**
 * Classify an Essence into a reroll group based on its name
 * @param {string} essenceName - The name of the Essence
 * @returns {string|null} 'deafening' | 'shrieking' | 'special' | null
 */
export function classifyRerollGroup(essenceName) {
  if (!essenceName || typeof essenceName !== 'string') {
    return null;
  }

  // Special group (exact match) - check first for precedence
  const specialGroup = [
    'Essence of Horror',
    'Essence of Hysteria',
    'Essence of Insanity',
    'Essence of Delirium'
  ];
  
  if (specialGroup.includes(essenceName)) {
    return 'special';
  }

  // Deafening group (starts with "Deafening Essence of")
  if (essenceName.startsWith('Deafening Essence of')) {
    return 'deafening';
  }

  // Shrieking group (starts with "Shrieking Essence of")
  if (essenceName.startsWith('Shrieking Essence of')) {
    return 'shrieking';
  }

  // Unknown/unclassified (should not occur in practice)
  return null;
}

/**
 * Group Essences by their reroll group type
 * @param {Array<Essence>} essences - Array of Essence objects
 * @returns {Map<string, Array<Essence>>} Map of group type to Essences
 */
export function groupEssencesByRerollType(essences) {
  const groups = new Map();
  
  essences.forEach(essence => {
    if (!essence.rerollGroup) {
      return; // Skip unclassified Essences
    }
    
    if (!groups.has(essence.rerollGroup)) {
      groups.set(essence.rerollGroup, []);
    }
    
    groups.get(essence.rerollGroup).push(essence);
  });
  
  return groups;
}

/**
 * Create a RerollGroup object
 * @param {string} type - 'deafening' | 'shrieking' | 'special'
 * @param {Array<Essence>} essences - Essences in this group
 * @param {number} expectedValue - Calculated expected value
 * @param {number} threshold - Calculated threshold
 * @param {number} rerollCost - Cost of 30 Primal Crystallised Lifeforce
 * @returns {object} RerollGroup object
 */
export function createRerollGroup(type, essences, expectedValue, threshold, rerollCost) {
  return {
    type,
    essences: [...essences],
    expectedValue,
    threshold,
    rerollCost,
    essenceCount: essences.length
  };
}
