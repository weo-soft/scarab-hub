/**
 * Delirium Orb Group Utilities
 * Handles reroll group classification and grouping logic for Delirium Orbs
 */

/**
 * Classify a Delirium Orb into a reroll group
 * All Delirium Orbs belong to the same reroll group ('delirium-orb')
 * @param {string} deliriumOrbName - The name of the Delirium Orb
 * @returns {string} 'delirium-orb' (all Delirium Orbs belong to single group)
 */
export function classifyRerollGroup(deliriumOrbName) {
  if (!deliriumOrbName || typeof deliriumOrbName !== 'string') {
    return null;
  }

  // All Delirium Orbs belong to the same reroll group
  return 'delirium-orb';
}

/**
 * Group Delirium Orbs by their reroll group type
 * Since all Delirium Orbs belong to the same group, this is simpler than Essence grouping
 * @param {Array<DeliriumOrb>} deliriumOrbs - Array of Delirium Orb objects
 * @returns {Map<string, Array<DeliriumOrb>>} Map of group type to Delirium Orbs
 */
export function groupDeliriumOrbsByRerollType(deliriumOrbs) {
  const groups = new Map();
  
  deliriumOrbs.forEach(orb => {
    if (!orb.rerollGroup) {
      return; // Skip unclassified Delirium Orbs
    }
    
    if (!groups.has(orb.rerollGroup)) {
      groups.set(orb.rerollGroup, []);
    }
    
    groups.get(orb.rerollGroup).push(orb);
  });
  
  return groups;
}
