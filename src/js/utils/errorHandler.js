/**
 * Error Handler Utilities
 * Handles missing/invalid data gracefully
 */

/**
 * Validate and sanitize Scarab data
 * @param {object} data - Raw Scarab data
 * @returns {object} Sanitized data
 */
export function sanitizeScarabData(data) {
  const sanitized = { ...data };

  // Clamp negative prices to 0
  if (sanitized.chaosValue !== null && sanitized.chaosValue < 0) {
    console.warn(`Negative chaosValue for ${sanitized.id}, clamping to 0`);
    sanitized.chaosValue = 0;
  }

  if (sanitized.divineValue !== null && sanitized.divineValue < 0) {
    console.warn(`Negative divineValue for ${sanitized.id}, clamping to 0`);
    sanitized.divineValue = 0;
  }

  // Handle invalid dropWeight
  if (sanitized.dropWeight !== null && (isNaN(sanitized.dropWeight) || sanitized.dropWeight < 0)) {
    console.warn(`Invalid dropWeight for ${sanitized.id}, setting to null`);
    sanitized.dropWeight = null;
  }

  return sanitized;
}

/**
 * Handle missing price data
 * @param {Scarab} scarab
 */
export function handleMissingPriceData(scarab) {
  if (!scarab.hasPriceData()) {
    scarab.profitabilityStatus = 'unknown';
    console.warn(`Missing price data for Scarab: ${scarab.id} (${scarab.name})`);
  }
}

/**
 * Handle missing dropWeight
 * @param {Scarab} scarab
 */
export function handleMissingDropWeight(scarab) {
  if (!scarab.hasDropWeight()) {
    console.warn(`Missing or zero dropWeight for Scarab: ${scarab.id} (${scarab.name})`);
  }
}

/**
 * Validate required fields
 * @param {object} data
 * @param {Array<string>} requiredFields
 * @returns {object} { valid: boolean, missingFields: Array<string> }
 */
export function validateRequiredFields(data, requiredFields) {
  const missingFields = requiredFields.filter(field => !data[field]);
  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

