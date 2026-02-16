/**
 * Tattoo Model
 * Represents a game item (Tattoo) with all attributes needed for profitability analysis
 */

export class Tattoo {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description || '';
    this.dropWeight = data.dropWeight ?? null;
    this.stackSize = data.stackSize || 10;
    this.dropRequired = data.dropRequired || '';
    this.replaces = data.replaces || '';
    
    // Price data (may be null if unavailable)
    this.chaosValue = data.chaosValue ?? null;
    this.divineValue = data.divineValue ?? null;
    
    // Calculated fields (set after threshold calculation)
    this.expectedValue = data.expectedValue ?? 0;
    this.profitabilityStatus = data.profitabilityStatus || 'unknown';
    this.threshold = data.threshold ?? 0;
  }

  /**
   * Validate Tattoo data
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
   * Check if Tattoo has valid price data
   * @returns {boolean}
   */
  hasPriceData() {
    return this.chaosValue !== null && this.chaosValue >= 0;
  }

  /**
   * Check if Tattoo has valid drop weight
   * @returns {boolean}
   */
  hasDropWeight() {
    return this.dropWeight !== null && this.dropWeight > 0;
  }

  /**
   * Check if Tattoo is a Journey Tattoo (cannot be received when flipping)
   * @returns {boolean}
   */
  isJourneyTattoo() {
    return this.id.startsWith('journey-tattoo-of-') || this.name.toLowerCase().startsWith('journey tattoo');
  }
}
