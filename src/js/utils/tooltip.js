/**
 * Tooltip Utility
 * Creates and manages tooltips for displaying scarab details
 */

let tooltipElement = null;
let currentScarab = null;

/**
 * Initialize tooltip system
 * Creates the tooltip DOM element if it doesn't exist
 */
function initTooltip() {
  if (tooltipElement) return;
  
  tooltipElement = document.createElement('div');
  tooltipElement.id = 'scarab-tooltip';
  tooltipElement.className = 'scarab-tooltip';
  tooltipElement.style.display = 'none';
  document.body.appendChild(tooltipElement);
}

/**
 * Show tooltip for a scarab
 * @param {Scarab} scarab - The scarab to display
 * @param {number} x - Mouse X position (screen coordinates)
 * @param {number} y - Mouse Y position (screen coordinates)
 */
export function showTooltip(scarab, x, y) {
  if (!scarab) {
    hideTooltip();
    return;
  }
  
  initTooltip();
  
  currentScarab = scarab;
  
  // Build tooltip content
  const content = buildTooltipContent(scarab);
  tooltipElement.innerHTML = content;
  
  // Position tooltip
  positionTooltip(x, y);
  
  // Show tooltip
  tooltipElement.style.display = 'block';
  
  // Add a small delay to prevent flickering
  requestAnimationFrame(() => {
    tooltipElement.classList.add('visible');
  });
}

/**
 * Hide tooltip
 */
export function hideTooltip() {
  if (!tooltipElement) return;
  
  tooltipElement.classList.remove('visible');
  tooltipElement.style.display = 'none';
  currentScarab = null;
}

/**
 * Update tooltip position
 * @param {number} x - Mouse X position (screen coordinates)
 * @param {number} y - Mouse Y position (screen coordinates)
 */
export function updateTooltipPosition(x, y) {
  if (!tooltipElement || !currentScarab) return;
  
  positionTooltip(x, y);
}

/**
 * Position tooltip near mouse cursor
 * @param {number} x - Mouse X position (screen coordinates)
 * @param {number} y - Mouse Y position (screen coordinates)
 */
function positionTooltip(x, y) {
  if (!tooltipElement) return;
  
  const tooltipRect = tooltipElement.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Offset from cursor
  const offsetX = 15;
  const offsetY = 15;
  
  let left = x + offsetX;
  let top = y + offsetY;
  
  // Adjust if tooltip would go off screen
  if (left + tooltipRect.width > viewportWidth) {
    left = x - tooltipRect.width - offsetX;
  }
  
  if (top + tooltipRect.height > viewportHeight) {
    top = y - tooltipRect.height - offsetY;
  }
  
  // Ensure tooltip stays within viewport
  left = Math.max(10, Math.min(left, viewportWidth - tooltipRect.width - 10));
  top = Math.max(10, Math.min(top, viewportHeight - tooltipRect.height - 10));
  
  tooltipElement.style.left = `${left}px`;
  tooltipElement.style.top = `${top}px`;
}

/**
 * Build tooltip HTML content
 * @param {Scarab} scarab - The scarab to display
 * @returns {string} HTML content
 */
function buildTooltipContent(scarab) {
  const parts = [];
  
  // Name
  parts.push(`<div class="tooltip-name">${escapeHtml(scarab.name)}</div>`);
  
  // Description
  if (scarab.description) {
    parts.push(`<div class="tooltip-description">${escapeHtml(scarab.description)}</div>`);
  }
  
  // Separator
  parts.push('<div class="tooltip-separator"></div>');
  
  // Price section
  parts.push('<div class="tooltip-prices">');
  
  if (scarab.chaosValue !== null && scarab.chaosValue !== undefined) {
    parts.push(`<div class="tooltip-price-item">`);
    parts.push(`<span class="tooltip-price-label">Chaos:</span>`);
    parts.push(`<span class="tooltip-price-value">${formatPrice(scarab.chaosValue)}</span>`);
    parts.push(`</div>`);
  }
  
  if (scarab.divineValue !== null && scarab.divineValue !== undefined) {
    parts.push(`<div class="tooltip-price-item">`);
    parts.push(`<span class="tooltip-price-label">Divine:</span>`);
    parts.push(`<span class="tooltip-price-value">${formatPrice(scarab.divineValue)}</span>`);
    parts.push(`</div>`);
  }
  
  if ((scarab.chaosValue === null || scarab.chaosValue === undefined) && 
      (scarab.divineValue === null || scarab.divineValue === undefined)) {
    parts.push(`<div class="tooltip-price-item">`);
    parts.push(`<span class="tooltip-price-unavailable">Price data unavailable</span>`);
    parts.push(`</div>`);
  }
  
  parts.push('</div>');
  
  // Additional details
  const details = [];
  
  if (scarab.dropWeight !== null && scarab.dropWeight !== undefined) {
    details.push(`Drop Weight: ${scarab.dropWeight}`);
  }
  
  if (scarab.dropLevel) {
    details.push(`Drop Level: ${scarab.dropLevel}`);
  }
  
  if (scarab.limit) {
    details.push(`Limit: ${scarab.limit}`);
  }
  
  if (details.length > 0) {
    parts.push('<div class="tooltip-separator"></div>');
    parts.push('<div class="tooltip-details">');
    details.forEach(detail => {
      parts.push(`<div class="tooltip-detail-item">${escapeHtml(detail)}</div>`);
    });
    parts.push('</div>');
  }
  
  // Profitability status
  if (scarab.profitabilityStatus && scarab.profitabilityStatus !== 'unknown') {
    parts.push('<div class="tooltip-separator"></div>');
    const statusClass = scarab.profitabilityStatus === 'profitable' ? 'profitable' : 'not-profitable';
    const statusText = scarab.profitabilityStatus === 'profitable' ? '✓ Profitable' : '✗ Not Profitable';
    parts.push(`<div class="tooltip-status ${statusClass}">${statusText}</div>`);
  }
  
  return parts.join('');
}

/**
 * Format price value
 * @param {number} value - Price value
 * @returns {string} Formatted price
 */
function formatPrice(value) {
  if (value === null || value === undefined) return 'N/A';
  
  // Format to 2 decimal places, but remove trailing zeros
  const formatted = value.toFixed(2).replace(/\.?0+$/, '');
  return formatted;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Cleanup tooltip (remove from DOM)
 */
export function cleanupTooltip() {
  if (tooltipElement && tooltipElement.parentNode) {
    tooltipElement.parentNode.removeChild(tooltipElement);
    tooltipElement = null;
    currentScarab = null;
  }
}

