/**
 * Color Utilities
 * Provides color coding for profitability indicators
 */

/**
 * Get color for profitability status (Path of Exile theme)
 * @param {string} status - 'profitable' | 'not_profitable' | 'unknown'
 * @returns {string} CSS color value
 */
export function getProfitabilityColor(status) {
  switch (status) {
    case 'profitable':
      return '#4caf50'; // Green (kept for visibility on dark background)
    case 'not_profitable':
      return '#f44336'; // Red (kept for visibility on dark background)
    case 'unknown':
    default:
      return '#888888'; // Muted gray for dark theme
  }
}

/**
 * Get background color for profitability status (dark theme)
 * @param {string} status
 * @returns {string} CSS color value
 */
export function getProfitabilityBackgroundColor(status) {
  switch (status) {
    case 'profitable':
      return 'rgba(76, 175, 80, 0.15)'; // Dark green tint
    case 'not_profitable':
      return 'rgba(244, 67, 54, 0.15)'; // Dark red tint
    case 'unknown':
    default:
      return 'rgba(136, 136, 136, 0.1)'; // Dark gray tint
  }
}

/**
 * Get border color for profitability status (dark theme)
 * @param {string} status
 * @returns {string} CSS color value
 */
export function getProfitabilityBorderColor(status) {
  switch (status) {
    case 'profitable':
      return '#66bb6a'; // Brighter green for dark theme
    case 'not_profitable':
      return '#ef5350'; // Brighter red for dark theme
    case 'unknown':
    default:
      return '#757575'; // Medium gray for dark theme
  }
}

/**
 * Get text color for profit/loss values
 * @param {number} value - Positive = profit, Negative = loss
 * @returns {string} CSS color value
 */
export function getProfitLossColor(value) {
  if (value > 0) {
    return '#4caf50'; // Green for profit
  } else if (value < 0) {
    return '#f44336'; // Red for loss
  } else {
    return '#757575'; // Gray for break-even
  }
}

