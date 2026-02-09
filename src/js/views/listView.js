/**
 * List View
 * Displays Scarabs in a compact, sortable list format with profitability indicators
 */

import { getProfitabilityColor, getProfitabilityBackgroundColor } from '../utils/colorUtils.js';
import { highlightCellForScarab, clearHighlight } from './gridView.js';
import { filterScarabs } from '../components/filterPanel.js';
import { showTooltip, hideTooltip, updateTooltipPosition } from '../utils/tooltip.js';
import { toggle as selectionToggle, has as selectionHas } from '../services/selectionState.js';

let currentScarabs = [];
let currentCurrency = 'chaos';
let currentSort = { field: 'value', direction: 'asc' };
let currentFilters = null;
let tooltipTimeout = null; // Shared timeout for all list items
let yieldCounts = new Map(); // Maps scarab ID to yield count from simulation

/**
 * Render list view with all Scarabs
 * @param {HTMLElement} container - Container element
 * @param {Array<Scarab>} scarabs - Array of Scarab objects
 * @param {string} currency - 'chaos' or 'divine'
 * @param {object|null} filters - Filter criteria (optional)
 */
export function renderListView(container, scarabs, currency = 'chaos', filters = null) {
  if (!container) {
    console.error('List view: missing container');
    return;
  }

  if (!Array.isArray(scarabs) || scarabs.length === 0) {
    container.innerHTML = '<p>No Scarabs to display</p>';
    return;
  }

  // Clear yield counts when rendering main list view (not simulation)
  // This prevents simulation data from leaking into the main view
  // The simulation panel uses its own updateSimulationScarabList function
  if (container.id === 'list-view') {
    yieldCounts.clear();
  }

  // Store current state
  currentScarabs = [...scarabs];
  currentCurrency = currency;
  currentFilters = filters;

  // Apply filters if provided
  let displayScarabs = filters ? filterScarabs([...scarabs]) : [...scarabs];

  if (displayScarabs.length === 0) {
    container.innerHTML = '<p class="no-results">No scarabs match the current filters</p>';
    return;
  }

  // Sort scarabs
  const sortedScarabs = sortScarabs(displayScarabs, currentSort, currency);

  const getSortIndicator = (field) => {
    if (currentSort.field !== field) return '';
    return currentSort.direction === 'asc' ? ' ↑' : ' ↓';
  };

  const hasYieldCounts = yieldCounts.size > 0;
  
  const html = `
    <div class="scarab-list-header">
      <div class="scarab-header-cell image-cell"></div>
      <div class="scarab-header-cell name-cell sortable" data-sort-field="name">
        Name${getSortIndicator('name')}
      </div>
      <div class="scarab-header-cell weight-cell sortable" data-sort-field="weight">
        Drop weight${getSortIndicator('weight')}
      </div>
      <div class="scarab-header-cell value-cell sortable" data-sort-field="value">
        Value${getSortIndicator('value')}
      </div>
      ${hasYieldCounts ? `
      <div class="scarab-header-cell yield-cell sortable" data-sort-field="yield">
        Yield Count${getSortIndicator('yield')}
      </div>
      ` : ''}
    </div>
    <div class="scarab-list">
      ${sortedScarabs.map(scarab => renderScarabItem(scarab, currency)).join('')}
    </div>
  `;

  container.innerHTML = html;

  // Attach event listeners
  setupSortListeners(container);
  setupHoverListeners(container);
  setupSelectionListeners(container);
}

/**
 * Setup sort event listeners
 * @param {HTMLElement} container
 */
function setupSortListeners(container) {
  const sortableHeaders = container.querySelectorAll('.scarab-header-cell.sortable');
  
  sortableHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const field = header.getAttribute('data-sort-field');
      
      // If clicking the same field, toggle direction; otherwise set to ascending
      if (currentSort.field === field) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
      } else {
        currentSort.field = field;
        currentSort.direction = 'asc';
      }
      
      renderListView(container, currentScarabs, currentCurrency, currentFilters);
    });
  });
}

/**
 * Setup hover event listeners for list items to highlight grid cells and show tooltip
 * @param {HTMLElement} container
 */
function setupHoverListeners(container) {
  const scarabItems = container.querySelectorAll('.scarab-item[data-scarab-id]');
  
  scarabItems.forEach(item => {
    const scarabId = item.getAttribute('data-scarab-id');
    
    if (!scarabId) return;
    
    // Find the scarab object
    const scarab = currentScarabs.find(s => s.id === scarabId);
    if (!scarab) return;
    
    // Mouse enter: highlight corresponding grid cell and show tooltip
    item.addEventListener('mouseenter', (e) => {
      // Clear any pending hide timeout when entering a new item
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
      }
      
      highlightCellForScarab(scarabId);
      showTooltip(scarab, e.clientX, e.clientY);
    });
    
    // Mouse move: update tooltip position
    item.addEventListener('mousemove', (e) => {
      updateTooltipPosition(e.clientX, e.clientY);
    });
    
    // Mouse leave: clear highlight and hide tooltip
    item.addEventListener('mouseleave', () => {
      clearHighlight();
      
      // Hide tooltip with a small delay to prevent flickering when moving between items
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
      }
      tooltipTimeout = setTimeout(() => {
        hideTooltip();
        tooltipTimeout = null;
      }, 150);
    });
  });
}

/**
 * Setup click listeners for selection (regex search) on list items
 * @param {HTMLElement} container
 */
function setupSelectionListeners(container) {
  const scarabItems = container.querySelectorAll('.scarab-item[data-scarab-id]');
  scarabItems.forEach(item => {
    const scarabId = item.getAttribute('data-scarab-id');
    if (!scarabId) return;
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      selectionToggle(scarabId);
    });
  });
}

/**
 * Sort Scarabs based on current sort settings
 * @param {Array<Scarab>} scarabs
 * @param {object} sort - { field: string, direction: 'asc' | 'desc' }
 * @param {string} currency
 * @returns {Array<Scarab>}
 */
function sortScarabs(scarabs, sort, currency) {
  return scarabs.sort((a, b) => {
    let aValue, bValue;

    switch (sort.field) {
      case 'value':
        const aVal = getScarabValue(a, currency);
        const bVal = getScarabValue(b, currency);
        // Move scarabs without values to the end
        if (aVal === null || aVal === undefined) {
          aValue = Infinity;
        } else {
          aValue = aVal;
        }
        if (bVal === null || bVal === undefined) {
          bValue = Infinity;
        } else {
          bValue = bVal;
        }
        break;
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'status':
        // Order: profitable, not_profitable, unknown
        const statusOrder = { 'profitable': 0, 'not_profitable': 1, 'unknown': 2 };
        aValue = statusOrder[a.profitabilityStatus] ?? 3;
        bValue = statusOrder[b.profitabilityStatus] ?? 3;
        break;
      case 'weight':
        // Sort by dropWeight, move null/undefined to the end
        if (a.dropWeight === null || a.dropWeight === undefined) {
          aValue = Infinity;
        } else {
          aValue = a.dropWeight;
        }
        if (b.dropWeight === null || b.dropWeight === undefined) {
          bValue = Infinity;
        } else {
          bValue = b.dropWeight;
        }
        break;
      default:
        return 0;
    }

    // Handle items without values - always put them at the end
    const aHasValue = aValue !== Infinity;
    const bHasValue = bValue !== Infinity;
    
    if (!aHasValue && !bHasValue) return 0; // Both have no value, maintain order
    if (!aHasValue) return 1; // a has no value, put it after b
    if (!bHasValue) return -1; // b has no value, put it after a
    
    // Both have values, sort normally
    if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Render a single Scarab item in the list (compact single-line format)
 * @param {Scarab} scarab
 * @param {string} currency
 * @returns {string} HTML string
 */
function renderScarabItem(scarab, currency) {
  const value = getScarabValue(scarab, currency);
  const status = scarab.profitabilityStatus;
  const color = getProfitabilityColor(status);
  const bgColor = getProfitabilityBackgroundColor(status);
  const statusLabel = getStatusLabel(status);
  const statusIcon = getStatusIcon(status);
  const imagePath = `/assets/images/scarabs/${scarab.id}.png`;
  const yieldCount = yieldCounts.get(scarab.id);
  const hasYieldCounts = yieldCounts.size > 0;
  const isSelected = selectionHas(scarab.id);

  const weightPercent = scarab.dropWeight != null
    ? (scarab.dropWeight * 100).toFixed(2) + '%'
    : '—';

  return `
    <div class="scarab-item compact ${isSelected ? 'item-selected' : ''}" data-scarab-id="${scarab.id}" 
         style="border-left: 4px solid ${color}; background-color: ${bgColor};">
      <img class="scarab-image" src="${imagePath}" alt="${scarab.name}" onerror="this.style.display='none'">
      <span class="scarab-name">${scarab.name}</span>
      <span class="scarab-weight">${weightPercent}</span>
      <span class="scarab-value">
        ${value !== null ? `${value.toFixed(2)} ${currency === 'divine' ? 'Div' : 'c'}` : 'N/A'}
      </span>
      ${hasYieldCounts ? `
      <span class="scarab-yield">
        ${yieldCount !== undefined && yieldCount !== null ? yieldCount.toLocaleString() : '0'}
      </span>
      ` : ''}
    </div>
  `;
}

/**
 * Set yield counts for display in list view
 * @param {Map<string, number>|Object} counts - Map or object of scarab ID to yield count
 * @param {HTMLElement} container - Optional container to re-render immediately
 */
export function setYieldCounts(counts, container = null) {
  if (counts instanceof Map) {
    yieldCounts = new Map(counts);
  } else if (counts && typeof counts === 'object') {
    yieldCounts = new Map(Object.entries(counts));
  } else {
    yieldCounts = new Map();
  }
  
  // Re-render if container is provided
  if (container) {
    renderListView(container, currentScarabs, currentCurrency, currentFilters);
  }
}

/**
 * Clear yield counts from list view
 * @param {HTMLElement} container - Optional container to re-render immediately
 */
export function clearYieldCounts(container = null) {
  yieldCounts = new Map();
  
  // Re-render if container is provided
  if (container) {
    renderListView(container, currentScarabs, currentCurrency, currentFilters);
  }
}

/**
 * Get status icon
 * @param {string} status
 * @returns {string}
 */
function getStatusIcon(status) {
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
 * Get Scarab value in specified currency
 * @param {Scarab} scarab
 * @param {string} currency
 * @returns {number|null}
 */
function getScarabValue(scarab, currency) {
  if (currency === 'divine') {
    return scarab.divineValue;
  }
  return scarab.chaosValue;
}

/**
 * Get human-readable status label
 * @param {string} status
 * @returns {string}
 */
function getStatusLabel(status) {
  switch (status) {
    case 'profitable':
      return '✓ Profitable to Vendor';
    case 'not_profitable':
      return '✗ Not Profitable';
    case 'unknown':
    default:
      return '? Unknown';
  }
}

/**
 * Update list view with new data
 * @param {HTMLElement} container
 * @param {Array<Scarab>} scarabs
 * @param {string} currency
 * @param {object|null} filters - Filter criteria (optional)
 */
export function updateListView(container, scarabs, currency = 'chaos', filters = null) {
  renderListView(container, scarabs, currency, filters);
}

/**
 * Show loading state
 * @param {HTMLElement} container
 */
export function showLoadingState(container) {
  if (!container) return;
  container.innerHTML = `
    <div class="loading-state">
      <p>Loading Scarab data...</p>
    </div>
  `;
}

/**
 * Show error state
 * @param {HTMLElement} container
 * @param {string} message
 */
export function showErrorState(container, message = 'Failed to load data') {
  if (!container) return;
  container.innerHTML = `
    <div class="error-state">
      <p>${message}</p>
      <button onclick="location.reload()">Reload</button>
    </div>
  `;
}

