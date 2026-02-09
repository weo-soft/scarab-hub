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
 * Show tooltip for an essence (grid view)
 * @param {Essence} essence - The essence to display
 * @param {number} x - Mouse X position (screen coordinates)
 * @param {number} y - Mouse Y position (screen coordinates)
 */
export function showEssenceTooltip(essence, x, y) {
  if (!essence) {
    hideTooltip();
    return;
  }
  initTooltip();
  currentScarab = essence;
  tooltipElement.innerHTML = buildEssenceTooltipContent(essence);
  positionTooltip(x, y);
  tooltipElement.style.display = 'block';
  requestAnimationFrame(() => tooltipElement.classList.add('visible'));
}

/**
 * Show tooltip for a catalyst (grid view)
 * @param {Object} catalyst - Catalyst item (id, name, description, chaosValue, divineValue, dropWeight)
 * @param {number} x - Mouse X position (screen coordinates)
 * @param {number} y - Mouse Y position (screen coordinates)
 */
export function showCatalystTooltip(catalyst, x, y) {
  if (!catalyst) {
    hideTooltip();
    return;
  }
  initTooltip();
  currentScarab = catalyst;
  tooltipElement.innerHTML = buildCatalystTooltipContent(catalyst);
  positionTooltip(x, y);
  tooltipElement.style.display = 'block';
  requestAnimationFrame(() => tooltipElement.classList.add('visible'));
}

/**
 * Build tooltip HTML content for a catalyst
 * @param {Object} catalyst
 * @returns {string} HTML content
 */
function buildCatalystTooltipContent(catalyst) {
  const parts = [];
  parts.push(`<div class="tooltip-name">${escapeHtml(catalyst.name)}</div>`);
  if (catalyst.description) {
    parts.push(`<div class="tooltip-description">${escapeHtml(catalyst.description)}</div>`);
  }
  parts.push('<div class="tooltip-separator"></div>');
  parts.push('<div class="tooltip-prices">');
  if (catalyst.chaosValue != null) {
    parts.push(`<div class="tooltip-price-item"><span class="tooltip-price-label">Chaos:</span><span class="tooltip-price-value">${formatPrice(catalyst.chaosValue)}</span></div>`);
  }
  if (catalyst.divineValue != null) {
    parts.push(`<div class="tooltip-price-item"><span class="tooltip-price-label">Divine:</span><span class="tooltip-price-value">${formatPrice(catalyst.divineValue)}</span></div>`);
  }
  if (catalyst.chaosValue == null && catalyst.divineValue == null) {
    parts.push(`<div class="tooltip-price-item"><span class="tooltip-price-unavailable">Price data unavailable</span></div>`);
  }
  parts.push('</div>');
  if (catalyst.dropWeight != null) {
    parts.push('<div class="tooltip-separator"></div>');
    parts.push(`<div class="tooltip-details"><div class="tooltip-detail-item">Drop weight: ${(catalyst.dropWeight * 100).toFixed(2)}%</div></div>`);
  }
  return parts.join('');
}

/**
 * Show tooltip for a fossil (grid view)
 * @param {Object} fossil - Fossil item (id, name, description, chaosValue, divineValue, dropWeight)
 * @param {number} x - Mouse X position (screen coordinates)
 * @param {number} y - Mouse Y position (screen coordinates)
 */
export function showFossilTooltip(fossil, x, y) {
  if (!fossil) {
    hideTooltip();
    return;
  }
  initTooltip();
  currentScarab = fossil;
  tooltipElement.innerHTML = buildFossilTooltipContent(fossil);
  positionTooltip(x, y);
  tooltipElement.style.display = 'block';
  requestAnimationFrame(() => tooltipElement.classList.add('visible'));
}

/**
 * Build tooltip HTML content for a fossil
 * @param {Object} fossil
 * @returns {string} HTML content
 */
function buildFossilTooltipContent(fossil) {
  const parts = [];
  parts.push(`<div class="tooltip-name">${escapeHtml(fossil.name)}</div>`);
  if (fossil.description) {
    parts.push(`<div class="tooltip-description">${escapeHtml(fossil.description)}</div>`);
  }
  parts.push('<div class="tooltip-separator"></div>');
  parts.push('<div class="tooltip-prices">');
  if (fossil.chaosValue != null) {
    parts.push(`<div class="tooltip-price-item"><span class="tooltip-price-label">Chaos:</span><span class="tooltip-price-value">${formatPrice(fossil.chaosValue)}</span></div>`);
  }
  if (fossil.divineValue != null) {
    parts.push(`<div class="tooltip-price-item"><span class="tooltip-price-label">Divine:</span><span class="tooltip-price-value">${formatPrice(fossil.divineValue)}</span></div>`);
  }
  if (fossil.chaosValue == null && fossil.divineValue == null) {
    parts.push(`<div class="tooltip-price-item"><span class="tooltip-price-unavailable">Price data unavailable</span></div>`);
  }
  parts.push('</div>');
  if (fossil.dropWeight != null) {
    parts.push('<div class="tooltip-separator"></div>');
    parts.push(`<div class="tooltip-details"><div class="tooltip-detail-item">Drop weight: ${(fossil.dropWeight * 100).toFixed(2)}%</div></div>`);
  }
  if (fossil.profitabilityStatus && fossil.profitabilityStatus !== 'unknown') {
    parts.push('<div class="tooltip-separator"></div>');
    const statusClass = fossil.profitabilityStatus === 'profitable' ? 'profitable' : 'not-profitable';
    const statusText = fossil.profitabilityStatus === 'profitable' ? '✓ Profitable' : '✗ Not Profitable';
    parts.push(`<div class="tooltip-status ${statusClass}">${statusText}</div>`);
  }
  return parts.join('');
}

/**
 * Show tooltip for an oil (grid view)
 * @param {Object} oil - Oil item (id, name, tier, chaosValue, divineValue, helpText)
 * @param {number} x - Mouse X position (screen coordinates)
 * @param {number} y - Mouse Y position (screen coordinates)
 */
export function showOilTooltip(oil, x, y) {
  if (!oil) {
    hideTooltip();
    return;
  }
  initTooltip();
  currentScarab = oil;
  tooltipElement.innerHTML = buildOilTooltipContent(oil);
  positionTooltip(x, y);
  tooltipElement.style.display = 'block';
  requestAnimationFrame(() => tooltipElement.classList.add('visible'));
}

/**
 * Build tooltip HTML content for an oil
 * @param {Object} oil
 * @returns {string} HTML content
 */
function buildOilTooltipContent(oil) {
  const parts = [];
  parts.push(`<div class="tooltip-name">${escapeHtml(oil.name)}</div>`);
  if (oil.helpText) {
    parts.push(`<div class="tooltip-description">${escapeHtml(oil.helpText)}</div>`);
  }
  if (oil.tier != null && oil.tier > 0) {
    parts.push('<div class="tooltip-separator"></div>');
    parts.push(`<div class="tooltip-details"><div class="tooltip-detail-item">Tier ${oil.tier}</div></div>`);
  }
  parts.push('<div class="tooltip-separator"></div>');
  parts.push('<div class="tooltip-prices">');
  if (oil.chaosValue != null) {
    parts.push(`<div class="tooltip-price-item"><span class="tooltip-price-label">Chaos:</span><span class="tooltip-price-value">${formatPrice(oil.chaosValue)}</span></div>`);
  }
  if (oil.divineValue != null) {
    parts.push(`<div class="tooltip-price-item"><span class="tooltip-price-label">Divine:</span><span class="tooltip-price-value">${formatPrice(oil.divineValue)}</span></div>`);
  }
  if (oil.chaosValue == null && oil.divineValue == null) {
    parts.push(`<div class="tooltip-price-item"><span class="tooltip-price-unavailable">Price data unavailable</span></div>`);
  }
  parts.push('</div>');
  return parts.join('');
}

/**
 * Show tooltip for a delirium orb (grid view)
 */
export function showDeliriumOrbTooltip(item, x, y) {
  if (!item) {
    hideTooltip();
    return;
  }
  initTooltip();
  currentScarab = item;
  tooltipElement.innerHTML = buildDeliriumOrbTooltipContent(item);
  positionTooltip(x, y);
  tooltipElement.style.display = 'block';
  requestAnimationFrame(() => tooltipElement.classList.add('visible'));
}

function buildDeliriumOrbTooltipContent(item) {
  const parts = [];
  parts.push(`<div class="tooltip-name">${escapeHtml(item.name)}</div>`);
  if (item.helpText) {
    parts.push(`<div class="tooltip-description">${escapeHtml(item.helpText)}</div>`);
  }
  parts.push('<div class="tooltip-separator"></div>');
  parts.push('<div class="tooltip-prices">');
  if (item.chaosValue != null) {
    parts.push(`<div class="tooltip-price-item"><span class="tooltip-price-label">Chaos:</span><span class="tooltip-price-value">${formatPrice(item.chaosValue)}</span></div>`);
  }
  if (item.divineValue != null) {
    parts.push(`<div class="tooltip-price-item"><span class="tooltip-price-label">Divine:</span><span class="tooltip-price-value">${formatPrice(item.divineValue)}</span></div>`);
  }
  if (item.chaosValue == null && item.divineValue == null) {
    parts.push(`<div class="tooltip-price-item"><span class="tooltip-price-unavailable">Price data unavailable</span></div>`);
  }
  parts.push('</div>');
  return parts.join('');
}

/**
 * Show tooltip for a legion emblem (grid view)
 */
export function showEmblemTooltip(item, x, y) {
  if (!item) {
    hideTooltip();
    return;
  }
  initTooltip();
  currentScarab = item;
  tooltipElement.innerHTML = buildEmblemTooltipContent(item);
  positionTooltip(x, y);
  tooltipElement.style.display = 'block';
  requestAnimationFrame(() => tooltipElement.classList.add('visible'));
}

function buildEmblemTooltipContent(item) {
  const parts = [];
  parts.push(`<div class="tooltip-name">${escapeHtml(item.name)}</div>`);
  if (item.helpText) {
    parts.push(`<div class="tooltip-description">${escapeHtml(item.helpText)}</div>`);
  }
  parts.push('<div class="tooltip-separator"></div>');
  parts.push('<div class="tooltip-prices">');
  if (item.chaosValue != null) {
    parts.push(`<div class="tooltip-price-item"><span class="tooltip-price-label">Chaos:</span><span class="tooltip-price-value">${formatPrice(item.chaosValue)}</span></div>`);
  }
  if (item.divineValue != null) {
    parts.push(`<div class="tooltip-price-item"><span class="tooltip-price-label">Divine:</span><span class="tooltip-price-value">${formatPrice(item.divineValue)}</span></div>`);
  }
  if (item.chaosValue == null && item.divineValue == null) {
    parts.push(`<div class="tooltip-price-item"><span class="tooltip-price-unavailable">Price data unavailable</span></div>`);
  }
  parts.push('</div>');
  return parts.join('');
}

/**
 * Build tooltip HTML content for an essence
 * @param {Essence} essence
 * @returns {string} HTML content
 */
function buildEssenceTooltipContent(essence) {
  const parts = [];
  parts.push(`<div class="tooltip-name">${escapeHtml(essence.name)}</div>`);
  parts.push('<div class="tooltip-separator"></div>');
  parts.push('<div class="tooltip-prices">');
  if (essence.chaosValue !== null && essence.chaosValue !== undefined) {
    parts.push(`<div class="tooltip-price-item"><span class="tooltip-price-label">Chaos:</span><span class="tooltip-price-value">${formatPrice(essence.chaosValue)}</span></div>`);
  }
  if (essence.divineValue !== null && essence.divineValue !== undefined) {
    parts.push(`<div class="tooltip-price-item"><span class="tooltip-price-label">Divine:</span><span class="tooltip-price-value">${formatPrice(essence.divineValue)}</span></div>`);
  }
  if ((essence.chaosValue === null || essence.chaosValue === undefined) &&
      (essence.divineValue === null || essence.divineValue === undefined)) {
    parts.push(`<div class="tooltip-price-item"><span class="tooltip-price-unavailable">Price data unavailable</span></div>`);
  }
  parts.push('</div>');
  if (essence.profitabilityStatus && essence.profitabilityStatus !== 'unknown') {
    parts.push('<div class="tooltip-separator"></div>');
    const statusClass = essence.profitabilityStatus === 'profitable' ? 'profitable' : 'not-profitable';
    const statusText = essence.profitabilityStatus === 'profitable' ? '✓ Profitable' : '✗ Not Profitable';
    parts.push(`<div class="tooltip-status ${statusClass}">${statusText}</div>`);
  }
  return parts.join('');
}

/**
 * Update tooltip position
 * @param {number} x - Mouse X position (screen coordinates)
 * @param {number} y - Mouse Y position (screen coordinates)
 */
export function updateTooltipPosition(x, y) {
  if (!tooltipElement) return;
  if (!currentScarab) return;
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
    const weightPercent = (scarab.dropWeight * 100).toFixed(2);
    details.push(`Drop Weight: ${weightPercent}%`);
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
 * Show tooltip for a unique item
 * @param {Object} unique - Unique item object
 * @param {number} x - Mouse X position (screen coordinates)
 * @param {number} y - Mouse Y position (screen coordinates)
 */
export function showUniqueTooltip(unique, x, y) {
  if (!unique) {
    hideTooltip();
    return;
  }
  initTooltip();
  tooltipElement.innerHTML = buildUniqueTooltipContent(unique);
  positionTooltip(x, y);
  tooltipElement.style.display = 'block';
  requestAnimationFrame(() => tooltipElement.classList.add('visible'));
}

/**
 * Build tooltip HTML content for unique item
 * @param {Object} unique - Unique item object
 * @returns {string} HTML content
 */
function buildUniqueTooltipContent(unique) {
  const parts = [];
  parts.push(`<div class="tooltip-name">${escapeHtml(unique.name)}</div>`);
  parts.push(`<div class="tooltip-base-type">${escapeHtml(unique.baseType)}</div>`);
  
  if (unique.levelRequired) {
    parts.push(`<div class="tooltip-level">Level ${unique.levelRequired}</div>`);
  }
  
  parts.push('<div class="tooltip-separator"></div>');
  
  if (unique.implicitModifiers && unique.implicitModifiers.length > 0) {
    parts.push('<div class="tooltip-modifiers">');
    unique.implicitModifiers.forEach(mod => {
      parts.push(`<div class="tooltip-modifier implicit">${escapeHtml(mod.text)}</div>`);
    });
    parts.push('</div>');
  }
  
  if (unique.explicitModifiers && unique.explicitModifiers.length > 0) {
    parts.push('<div class="tooltip-modifiers">');
    unique.explicitModifiers.forEach(mod => {
      parts.push(`<div class="tooltip-modifier explicit">${escapeHtml(mod.text)}</div>`);
    });
    parts.push('</div>');
  }
  
  if (unique.flavourText) {
    parts.push('<div class="tooltip-separator"></div>');
    parts.push(`<div class="tooltip-flavour">${escapeHtml(unique.flavourText)}</div>`);
  }
  
  return parts.join('');
}

/**
 * Show tooltip for a vial
 * @param {Object} vial - Vial item object
 * @param {number} x - Mouse X position (screen coordinates)
 * @param {number} y - Mouse Y position (screen coordinates)
 */
export function showVialTooltip(vial, x, y) {
  if (!vial) {
    hideTooltip();
    return;
  }
  initTooltip();
  tooltipElement.innerHTML = buildVialTooltipContent(vial);
  positionTooltip(x, y);
  tooltipElement.style.display = 'block';
  requestAnimationFrame(() => tooltipElement.classList.add('visible'));
}

/**
 * Build tooltip HTML content for vial
 * @param {Object} vial - Vial item object
 * @returns {string} HTML content
 */
function buildVialTooltipContent(vial) {
  const parts = [];
  parts.push(`<div class="tooltip-name">${escapeHtml(vial.name)}</div>`);
  
  if (vial.flavourText) {
    parts.push(`<div class="tooltip-flavour">${escapeHtml(vial.flavourText)}</div>`);
  }
  
  if (vial.stackSize) {
    parts.push('<div class="tooltip-separator"></div>');
    parts.push(`<div class="tooltip-details"><div class="tooltip-detail-item">Stack Size: ${vial.stackSize}</div></div>`);
  }
  
  return parts.join('');
}

/**
 * Show tooltip for temple room
 * @param {Object} temple - Temple item object
 * @param {number} x - Mouse X position (screen coordinates)
 * @param {number} y - Mouse Y position (screen coordinates)
 */
export function showTempleRoomTooltip(temple, x, y) {
  if (!temple) {
    hideTooltip();
    return;
  }
  initTooltip();
  tooltipElement.innerHTML = buildTempleRoomTooltipContent(temple);
  positionTooltip(x, y);
  tooltipElement.style.display = 'block';
  requestAnimationFrame(() => tooltipElement.classList.add('visible'));
}

/**
 * Build tooltip HTML content for temple room
 * @param {Object} temple - Temple item object
 * @returns {string} HTML content
 */
function buildTempleRoomTooltipContent(temple) {
  const parts = [];
  parts.push(`<div class="tooltip-name">${escapeHtml(temple.name)}</div>`);
  parts.push('<div class="tooltip-separator"></div>');
  parts.push('<div class="tooltip-description">Required for upgrading unique items at the Altar of Sacrifice</div>');
  return parts.join('');
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

