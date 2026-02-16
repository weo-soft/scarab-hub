/**
 * Catalyst Model
 * Represents a game item (Catalyst) with all attributes needed for profitability analysis
 */

export class Catalyst {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description || '';
    this.dropWeight = data.dropWeight ?? null;
    this.stackSize = data.stackSize || 10;
    
    // Price data (may be null if unavailable)
    this.chaosValue = data.chaosValue ?? null;
    this.divineValue = data.divineValue ?? null;
    
    // Calculated fields (set after threshold calculation)
    this.expectedValue = data.expectedValue ?? 0;
    this.profitabilityStatus = data.profitabilityStatus || 'unknown';
    this.threshold = data.threshold ?? 0;
  }

  /**
   * Validate Catalyst data
   * @returns {boolean} True if valid
   */
  validate() {
    if (!this.id || !this.name) return false;
    if (this.dropWeight !== null && this.dropWeight < 0) return false;
    if (this.chaosValue !== null && this.chaosValue < 0) return false;
    if (this.divineValue !== null && this.divineValue < 0) return false;
    if (this.stackSize <= 0) return false;
    return true;
  }

  /**
   * Check if Catalyst has valid price data
   * @returns {boolean}
   */
  hasPriceData() {
    return this.chaosValue !== null && this.chaosValue >= 0;
  }

  /**
   * Check if Catalyst has valid drop weight
   * @returns {boolean}
   */
  hasDropWeight() {
    return this.dropWeight !== null && this.dropWeight > 0;
  }

  /**
   * Check if Catalyst is Tainted (cannot be received when flipping)
   * @returns {boolean}
   */
  isTainted() {
    return this.id === 'tainted-catalyst' || this.name.toLowerCase().includes('tainted');
  }
}
