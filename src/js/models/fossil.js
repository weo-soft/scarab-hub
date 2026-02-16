/**
 * Fossil Model
 * Represents a game item (Fossil) with all attributes needed for profitability analysis
 */

import { classifyRerollGroup } from '../utils/fossilGroupUtils.js';

export class Fossil {
  constructor(data) {
    this.id = data.id || data.detailsId || '';
    this.name = data.name || '';
    
    // Price data (may be null if unavailable)
    this.chaosValue = data.chaosValue ?? null;
    this.divineValue = data.divineValue ?? null;

    // Drop weight from MLE (probability weight for reroll outcome); null if unavailable
    this.dropWeight = data.dropWeight ?? null;

    // Classify reroll group automatically (all Fossils belong to 'fossil' group)
    this.rerollGroup = data.rerollGroup ?? (this.name ? classifyRerollGroup(this.name) : null);
    
    // Calculated fields (set after calculation)
    this.expectedValue = data.expectedValue ?? 0;
    this.profitabilityStatus = data.profitabilityStatus || 'unknown';
    this.threshold = data.threshold ?? 0;
    this.selectedForReroll = data.selectedForReroll ?? false;
  }

  /**
   * Validate Fossil data
   * @returns {boolean} True if valid
   */
  validate() {
    if (!this.id || !this.name) return false;
    if (this.chaosValue !== null && this.chaosValue < 0) return false;
    if (this.divineValue !== null && this.divineValue < 0) return false;
    if (this.dropWeight !== null && this.dropWeight < 0) return false;
    if (this.rerollGroup !== null && this.rerollGroup !== 'fossil') {
      return false;
    }
    return true;
  }

  /**
   * Check if Fossil has valid price data
   * @returns {boolean}
   */
  hasPriceData() {
    return this.chaosValue !== null && this.chaosValue >= 0;
  }

  /**
   * Check if Fossil has valid drop weight for weighted expected value
   * @returns {boolean}
   */
  hasDropWeight() {
    return this.dropWeight != null && this.dropWeight > 0;
  }

  /**
   * Check if Fossil has a valid reroll group
   * @returns {boolean}
   */
  hasRerollGroup() {
    return this.rerollGroup === 'fossil';
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

