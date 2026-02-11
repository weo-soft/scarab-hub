/**
 * Essence List View
 * Displays Essences in a compact, sortable list format with profitability indicators
 */

import { getProfitabilityColor, getProfitabilityBackgroundColor } from '../utils/colorUtils.js';
import { loadPreferences, savePreferences } from '../services/dataService.js';
import { highlightCellForEssence, clearEssenceHighlight } from './essenceGridView.js';
import { toggle as selectionToggle, has as selectionHas, subscribe as subscribeSelection, getCategoryId } from '../services/selectionState.js';

let currentEssences = [];
let currentCurrency = 'chaos';
let currentSort = { field: 'value', direction: 'asc' };
let selectionUnsubscribeFn = null;

/**
 * Render list view with all Essences
 * @param {HTMLElement} container - Container element
 * @param {Array<Essence>} essences - Array of Essence objects
 * @param {string} currency - 'chaos' or 'divine'
 */
export function renderEssenceList(container, essences, currency = 'chaos') {
  if (!container) {
    console.error('Essence list view: missing container');
    return;
  }

  if (!Array.isArray(essences) || essences.length === 0) {
    container.innerHTML = '<p class="no-results">No Essences to display</p>';
    return;
  }
  
  // Filter to only show Essences with valid reroll groups (special, deafening, shrieking)
  const validRerollGroups = ['special', 'deafening', 'shrieking'];
  const filteredEssences = essences.filter(essence => {
    return essence.rerollGroup && validRerollGroups.includes(essence.rerollGroup);
  });
  
  if (filteredEssences.length === 0) {
    container.innerHTML = '<p class="no-results">No Essences to display</p>';
    return;
  }
  
  // Handle Essences with missing price data
  const essencesWithMissingPrices = filteredEssences.filter(e => !e.hasPriceData());
  if (essencesWithMissingPrices.length > 0) {
    console.warn(`${essencesWithMissingPrices.length} Essences have missing price data`);
  }

  // Store current state (store filtered Essences)
  currentEssences = [...filteredEssences];
  currentCurrency = currency;

  // Sort essences
  const sortedEssences = sortEssences(currentEssences, currentSort, currency);

  const getSortIndicator = (field) => {
    if (currentSort.field !== field) return '';
    return currentSort.direction === 'asc' ? ' ↑' : ' ↓';
  };

  const html = `
    <div class="essence-list-header">
      <div class="essence-header-cell image-cell"></div>
      <div class="essence-header-cell name-cell sortable" data-sort-field="name">
        Name${getSortIndicator('name')}
      </div>
      <div class="essence-header-cell weight-cell sortable" data-sort-field="weight">
        Drop Weight${getSortIndicator('weight')}
      </div>
      <div class="essence-header-cell value-cell sortable" data-sort-field="value">
        Value${getSortIndicator('value')}
      </div>
    </div>
    <div class="essence-list">
      ${sortedEssences.map(essence => renderEssenceItem(essence, currency)).join('')}
    </div>
  `;

  container.innerHTML = html;

  // Attach event listeners
  setupSortListeners(container);
  setupSelectionListeners(container);
  setupListHoverListenersForGrid(container);
  
  // Subscribe to selection changes to update visual state
  if (selectionUnsubscribeFn) {
    selectionUnsubscribeFn();
  }
  selectionUnsubscribeFn = subscribeSelection(() => {
    // Only re-render if we're still on the essences category
    if (getCategoryId() !== 'essences') return;
    
    // Re-render to update selection highlighting
    const container = document.getElementById('list-view');
    if (container && currentEssences.length > 0) {
      renderEssenceList(container, currentEssences, currentCurrency);
    }
  });
}

/**
 * Handle select all
 */
function handleSelectAll() {
  import('../services/selectionState.js').then(({ selectAll }) => {
    const allIds = currentEssences.map(e => e.id);
    selectAll(allIds);
  });
}

/**
 * Handle deselect all
 */
function handleDeselectAll() {
  import('../services/selectionState.js').then(({ clear }) => {
    clear();
  });
}

/**
 * Handle filter by group
 * @param {string} groupType
 */
function handleFilterByGroup(groupType) {
  // Filter view to show only selected group (future enhancement)
  // For now, just log
  console.log(`Filter by group: ${groupType}`);
}

/**
 * Render a single Essence item in the list
 * @param {Essence} essence
 * @param {string} currency
 * @returns {string} HTML string
 */
function renderEssenceItem(essence, currency) {
  const value = essence.chaosValue !== null
    ? (currency === 'divine' ? essence.divineValue : essence.chaosValue)
    : null;
  const valueDisplay = value !== null
    ? `${value.toFixed(2)} ${currency === 'divine' ? 'Div' : 'c'}`
    : 'N/A';
  const weightDisplay = essence.dropWeight != null
    ? (essence.dropWeight * 100).toFixed(2) + '%'
    : 'N/A';
  const status = essence.profitabilityStatus;
  const color = getProfitabilityColor(status);
  const bgColor = getProfitabilityBackgroundColor(status);
  const isSelected = selectionHas(essence.id);
  const selectedClass = isSelected ? 'item-selected' : '';
  const imagePath = `/assets/images/essences/${essence.id}.png`;

  return `
    <div class="essence-item ${selectedClass}" data-essence-id="${essence.id}" 
         style="border-left: 4px solid ${color}; background-color: ${bgColor};">
      <img class="essence-image" src="${imagePath}" alt="${essence.name}" onerror="this.style.display='none'">
      <span class="essence-name">${essence.name}</span>
      <span class="essence-weight">${weightDisplay}</span>
      <span class="essence-value">${valueDisplay}</span>
    </div>
  `;
}

/**
 * Get group label
 * @param {string} group
 * @returns {string}
 */
function getGroupLabel(group) {
  if (!group) return 'Unknown';
  const labels = {
    'deafening': 'Deafening',
    'shrieking': 'Shrieking',
    'special': 'Special'
  };
  return labels[group] || group;
}

/**
 * Sort Essences based on current sort settings
 * @param {Array<Essence>} essences
 * @param {object} sort - { field: string, direction: 'asc' | 'desc' }
 * @param {string} currency
 * @returns {Array<Essence>}
 */
function sortEssences(essences, sort, currency) {
  return essences.sort((a, b) => {
    let aValue, bValue;

    switch (sort.field) {
      case 'value':
        const aVal = currency === 'divine' ? a.divineValue : a.chaosValue;
        const bVal = currency === 'divine' ? b.divineValue : b.chaosValue;
        aValue = aVal === null || aVal === undefined ? Infinity : aVal;
        bValue = bVal === null || bVal === undefined ? Infinity : bVal;
        break;
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'weight':
        aValue = a.dropWeight ?? Infinity;
        bValue = b.dropWeight ?? Infinity;
        break;
      case 'group':
        const groupOrder = { 'deafening': 0, 'shrieking': 1, 'special': 2 };
        aValue = groupOrder[a.rerollGroup] ?? 3;
        bValue = groupOrder[b.rerollGroup] ?? 3;
        break;
      default:
        return 0;
    }

    // Handle items without values
    const aHasValue = aValue !== Infinity;
    const bHasValue = bValue !== Infinity;
    
    if (!aHasValue && !bHasValue) return 0;
    if (!aHasValue) return 1;
    if (!bHasValue) return -1;
    
    // Both have values, sort normally
    if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Setup sort event listeners
 * @param {HTMLElement} container
 */
function setupSortListeners(container) {
  const sortableHeaders = container.querySelectorAll('.essence-header-cell.sortable');
  
  sortableHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const field = header.dataset.sortField;
      if (currentSort.field === field) {
        // Toggle direction
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
      } else {
        // New field, default to ascending
        currentSort.field = field;
        currentSort.direction = 'asc';
      }
      
      // Re-render with new sort
      renderEssenceList(container, currentEssences, currentCurrency);
    });
  });
}

/**
 * Setup hover event listeners for list items to highlight corresponding grid cell
 * @param {HTMLElement} container
 */
function setupListHoverListenersForGrid(container) {
  const essenceItems = container.querySelectorAll('.essence-item[data-essence-id]');
  essenceItems.forEach(item => {
    const essenceId = item.getAttribute('data-essence-id');
    if (!essenceId) return;
    item.addEventListener('mouseenter', () => highlightCellForEssence(essenceId));
    item.addEventListener('mouseleave', () => clearEssenceHighlight());
  });
}

/**
 * Setup selection event listeners
 * @param {HTMLElement} container
 */
function setupSelectionListeners(container) {
  const essenceItems = container.querySelectorAll('.essence-item[data-essence-id]');
  
  essenceItems.forEach(item => {
    const essenceId = item.getAttribute('data-essence-id');
    if (!essenceId) return;
    
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      selectionToggle(essenceId);
    });
  });
}

/**
 * Load selection state from LocalStorage (legacy function, kept for compatibility)
 * @param {Array<Essence>} essences
 */
export function loadSelectionState(essences) {
  // Selection state is now managed by selectionState.js service
  // This function is kept for compatibility but doesn't need to do anything
}

/**
 * Clean up selection subscription (call when switching away from essences category)
 */
export function cleanupSelectionSubscription() {
  if (selectionUnsubscribeFn) {
    selectionUnsubscribeFn();
    selectionUnsubscribeFn = null;
  }
}

/**
 * Show loading state
 * @param {HTMLElement} container
 */
export function showLoadingState(container) {
  if (container) {
    container.innerHTML = '<p class="loading-text">Loading Essences...</p>';
  }
}

/**
 * Handle empty state
 * @param {HTMLElement} container
 */
export function handleEmptyState(container) {
  if (container) {
    container.innerHTML = '<p class="no-results">No Essences available</p>';
  }
}
