/**
 * Temple Upgrade List View
 * Displays unique item upgrade combinations in the Incursion Temple
 */

import { showUniqueTooltip, showVialTooltip, showTempleRoomTooltip, hideTooltip } from '../utils/tooltip.js';
import { getProfitabilityColor, getProfitabilityBackgroundColor, getProfitLossColor } from '../utils/colorUtils.js';

/**
 * Render temple upgrade combinations list
 * @param {HTMLElement} container - Container element
 * @param {Array} combinations - Array of upgrade combinations
 * @param {string} currency - Currency preference ('chaos' | 'divine')
 */
export function renderTempleUpgradeList(container, combinations, currency) {
  if (!container) {
    console.error('Temple upgrade list: missing container');
    return;
  }
  
  const temple = {
    name: 'Chronicle of Atzoatl',
    imagePath: '/assets/images/Chronicle_of_Atzoatl.png'
  };
  
  // Sort combinations by profitability (profitable first, then by profit amount)
  const sortedCombinations = [...combinations].sort((a, b) => {
    // First sort by profitability status
    const statusOrder = { 'profitable': 0, 'not_profitable': 1, 'unknown': 2 };
    const aStatus = statusOrder[a.profitabilityStatus] ?? 3;
    const bStatus = statusOrder[b.profitabilityStatus] ?? 3;
    if (aStatus !== bStatus) {
      return aStatus - bStatus;
    }
    
    // Then sort by profit amount (descending for profitable, ascending for not profitable)
    const aProfit = currency === 'divine' ? (a.profitDivine ?? -Infinity) : (a.profitChaos ?? -Infinity);
    const bProfit = currency === 'divine' ? (b.profitDivine ?? -Infinity) : (b.profitChaos ?? -Infinity);
    
    if (a.profitabilityStatus === 'profitable') {
      return bProfit - aProfit; // Descending for profitable
    } else {
      return aProfit - bProfit; // Ascending for not profitable
    }
  });
  
  const html = `
    <div class="temple-upgrade-list">
      <div class="temple-upgrade-header">
        <h2>Temple Upgrade Combinations</h2>
        <p>Combine base unique items with vials in the Chronicle of Atzoatl to create upgraded versions.</p>
      </div>
      <div class="temple-upgrade-combinations">
        ${sortedCombinations.map(combo => renderCombination(combo, temple, currency)).join('')}
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  
  // Attach tooltip handlers
  attachTooltipHandlers(container, combinations, temple);
}

/**
 * Render a single upgrade combination
 * @param {Object} combo - Upgrade combination object
 * @param {Object} temple - Temple item object
 * @param {string} currency - Currency preference ('chaos' | 'divine')
 * @returns {string} HTML string
 */
function renderCombination(combo, temple, currency) {
  const baseUniqueImage = getUniqueImagePath(combo.baseUnique);
  const vialImage = getVialImagePath(combo.vial);
  const upgradedUniqueImage = getUniqueImagePath(combo.upgradedUnique);
  
  // Get profitability styling
  const status = combo.profitabilityStatus || 'unknown';
  const borderColor = getProfitabilityColor(status);
  const bgColor = getProfitabilityBackgroundColor(status);
  
  // Calculate profit display
  const profit = currency === 'divine' ? combo.profitDivine : combo.profitChaos;
  const totalCost = currency === 'divine' ? combo.totalCostDivine : combo.totalCostChaos;
  const profitColor = profit !== null ? getProfitLossColor(profit) : '#888888';
  const currencySymbol = currency === 'divine' ? 'Div' : 'c';
  
  // Format profit display
  let profitDisplay = 'N/A';
  if (profit !== null && profit !== undefined) {
    const sign = profit >= 0 ? '+' : '';
    profitDisplay = `${sign}${profit.toFixed(2)} ${currencySymbol}`;
  }
  
  // Format cost display
  let costDisplay = 'N/A';
  if (totalCost !== null && totalCost !== undefined) {
    costDisplay = `${totalCost.toFixed(2)} ${currencySymbol}`;
  }
  
  // Status label
  const statusLabel = getUpgradeStatusLabel(status);
  const statusIcon = getUpgradeStatusIcon(status);
  
  return `
    <div class="temple-upgrade-combination" 
         data-combination-id="${combo.id}"
         style="border-left: 4px solid ${borderColor}; background-color: ${bgColor};">
      <div class="upgrade-combination-content">
        <div class="upgrade-components-row">
          <div class="upgrade-component base-unique" 
               data-unique-id="${combo.baseUnique.detailsId}"
               data-component-type="unique">
            <img src="${baseUniqueImage}" 
                 alt="${combo.baseUnique.name}" 
                 onerror="this.style.display='none'"
                 class="component-image" />
            <span class="component-name">${escapeHtml(combo.baseUnique.name)}</span>
            ${combo.baseUnique.chaosValue !== null ? `<span class="component-price">${formatPrice(combo.baseUnique, currency)} ${currencySymbol}</span>` : ''}
          </div>
          <span class="upgrade-operator">+</span>
          <div class="upgrade-component vial" 
               data-vial-id="${combo.vial.detailsId}"
               data-component-type="vial">
            <img src="${vialImage}" 
                 alt="${combo.vial.name}" 
                 onerror="this.style.display='none'"
                 class="component-image" />
            <span class="component-name">${escapeHtml(combo.vial.name)}</span>
            ${combo.vial.chaosValue !== null ? `<span class="component-price">${formatPrice(combo.vial, currency)} ${currencySymbol}</span>` : ''}
          </div>
          <span class="upgrade-operator">+</span>
          <div class="upgrade-component temple" 
               data-component-type="temple">
            <img src="${temple.imagePath}" 
                 alt="${temple.name}" 
                 onerror="this.style.display='none'"
                 class="component-image" />
            <span class="component-name">${escapeHtml(temple.name)}</span>
          </div>
          <span class="upgrade-operator">=</span>
          <div class="upgrade-component upgraded-unique" 
               data-unique-id="${combo.upgradedUnique.detailsId}"
               data-component-type="unique">
            <img src="${upgradedUniqueImage}" 
                 alt="${combo.upgradedUnique.name}" 
                 onerror="this.style.display='none'"
                 class="component-image" />
            <span class="component-name">${escapeHtml(combo.upgradedUnique.name)}</span>
            ${combo.upgradedUnique.chaosValue !== null ? `<span class="component-price">${formatPrice(combo.upgradedUnique, currency)} ${currencySymbol}</span>` : ''}
          </div>
          <div class="profitability-status-inline">
            <span class="status-icon">${statusIcon}</span>
          </div>
        </div>
        <div class="profitability-details-column">
          <div class="profit-detail">
            <span class="profit-label">Cost:</span>
            <span class="profit-value">${costDisplay}</span>
          </div>
          <div class="profit-detail">
            <span class="profit-label">Profit:</span>
            <span class="profit-value" style="color: ${profitColor};">${profitDisplay}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Format price for display
 * @param {Object} item - Item with chaosValue and divineValue
 * @param {string} currency - 'chaos' | 'divine'
 * @returns {string} Formatted price
 */
function formatPrice(item, currency) {
  const value = currency === 'divine' ? item.divineValue : item.chaosValue;
  if (value === null || value === undefined) return 'N/A';
  return value.toFixed(currency === 'divine' ? 2 : 1);
}

/**
 * Get status icon for upgrade profitability
 * @param {string} status - Profitability status
 * @returns {string} Icon character
 */
function getUpgradeStatusIcon(status) {
  switch (status) {
    case 'profitable':
      return '✓';
    case 'not_profitable':
      return '✗';
    case 'unknown':
    default:
      return '?';
  }
}

/**
 * Get status label for upgrade profitability
 * @param {string} status - Profitability status
 * @returns {string} Status label
 */
function getUpgradeStatusLabel(status) {
  switch (status) {
    case 'profitable':
      return 'Worth Upgrading';
    case 'not_profitable':
      return 'Not Worth Upgrading';
    case 'unknown':
    default:
      return 'Unknown';
  }
}

/**
 * Get image path for unique item
 * @param {Object} unique - Unique item object
 * @returns {string} Image path
 */
function getUniqueImagePath(unique) {
  // Use detailsId directly as the image filename
  // e.g., "apeps-slumber-vaal-spirit-shield" -> "apeps-slumber-vaal-spirit-shield.png"
  return `/assets/images/uniques/${unique.detailsId}.png`;
}

/**
 * Get image path for vial
 * @param {Object} vial - Vial item object
 * @returns {string} Image path
 */
function getVialImagePath(vial) {
  return `/assets/images/vials/${vial.detailsId}.png`;
}

/**
 * Attach tooltip handlers to components
 * @param {HTMLElement} container - Container element
 * @param {Array} combinations - Array of upgrade combinations
 * @param {Object} temple - Temple item object
 */
function attachTooltipHandlers(container, combinations, temple) {
  const components = container.querySelectorAll('.upgrade-component');
  
  components.forEach(component => {
    const type = component.dataset.componentType;
    const uniqueId = component.dataset.uniqueId;
    const vialId = component.dataset.vialId;
    
    component.addEventListener('mouseenter', (e) => {
      const { clientX, clientY } = e;
      
      if (type === 'unique' && uniqueId) {
        const unique = findUniqueById(combinations, uniqueId);
        if (unique) showUniqueTooltip(unique, clientX, clientY);
      } else if (type === 'vial' && vialId) {
        const vial = findVialById(combinations, vialId);
        if (vial) showVialTooltip(vial, clientX, clientY);
      } else if (type === 'temple') {
        showTempleRoomTooltip(temple, clientX, clientY);
      }
    });
    
    component.addEventListener('mouseleave', () => {
      hideTooltip();
    });
  });
}

/**
 * Find unique item by detailsId from combinations
 * @param {Array} combinations - Array of upgrade combinations
 * @param {string} detailsId - Unique item detailsId
 * @returns {Object|null} Unique item or null
 */
function findUniqueById(combinations, detailsId) {
  for (const combo of combinations) {
    if (combo.baseUnique.detailsId === detailsId) return combo.baseUnique;
    if (combo.upgradedUnique.detailsId === detailsId) return combo.upgradedUnique;
  }
  return null;
}

/**
 * Find vial by detailsId from combinations
 * @param {Array} combinations - Array of upgrade combinations
 * @param {string} detailsId - Vial detailsId
 * @returns {Object|null} Vial or null
 */
function findVialById(combinations, detailsId) {
  for (const combo of combinations) {
    if (combo.vial.detailsId === detailsId) return combo.vial;
  }
  return null;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
