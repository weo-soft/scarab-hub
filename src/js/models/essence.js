/**
 * Essence Model
 * Represents a game item (Essence) with all attributes needed for profitability analysis
 */

import { classifyRerollGroup } from '../utils/essenceGroupUtils.js';

export class Essence {
  constructor(data) {
    this.id = data.id || data.detailsId || '';
    this.name = data.name || '';
    
    // Price data (may be null if unavailable)
    this.chaosValue = data.chaosValue ?? null;
    this.divineValue = data.divineValue ?? null;
    
    // Classify reroll group automatically from name
    this.rerollGroup = data.rerollGroup ?? (this.name ? classifyRerollGroup(this.name) : null);
    
    // Calculated fields (set after calculation)
    this.expectedValue = data.expectedValue ?? 0;
    this.profitabilityStatus = data.profitabilityStatus || 'unknown';
    this.threshold = data.threshold ?? 0;
    this.selectedForReroll = data.selectedForReroll ?? false;
  }

  /**
   * Validate Essence data
   * @returns {boolean} True if valid
   */
  validate() {
    if (!this.id || !this.name) return false;
    if (this.chaosValue !== null && this.chaosValue < 0) return false;
    if (this.divineValue !== null && this.divineValue < 0) return false;
    if (this.rerollGroup !== null && !['deafening', 'shrieking', 'special'].includes(this.rerollGroup)) {
      return false;
    }
    return true;
  }

  /**
   * Check if Essence has valid price data
   * @returns {boolean}
   */
  hasPriceData() {
    return this.chaosValue !== null && this.chaosValue >= 0;
  }

  /**
   * Check if Essence has a valid reroll group
   * @returns {boolean}
   */
  hasRerollGroup() {
    return this.rerollGroup !== null && ['deafening', 'shrieking', 'special'].includes(this.rerollGroup);
  }

  /**
   * Toggle selection state for rerolling
   */
  toggleSelection() {
    this.selectedForReroll = !this.selectedForReroll;
  }

  /**
   * Set selection state
   * @param {boolean} selected
   */
  setSelected(selected) {
    this.selectedForReroll = selected;
  }
}
