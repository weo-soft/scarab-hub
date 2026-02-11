/**
 * Fossil List View
 * Displays Fossils in a compact, sortable list format with profitability indicators
 */

import { getProfitabilityColor, getProfitabilityBackgroundColor } from '../utils/colorUtils.js';
import { loadPreferences, savePreferences } from '../services/dataService.js';
import { highlightCellForFossil, clearFossilHighlight } from './fossilGridView.js';
import { toggle as selectionToggle, has as selectionHas, subscribe as subscribeSelection, getCategoryId } from '../services/selectionState.js';

let currentFossils = [];
let currentCurrency = 'chaos';
let currentSort = { field: 'value', direction: 'asc' };
let selectionUnsubscribeFn = null;

/**
 * Render list view with all Fossils
 * @param {HTMLElement} container - Container element
 * @param {Array<Fossil>} fossils - Array of Fossil objects
 * @param {string} currency - 'chaos' or 'divine'
 */
export function renderFossilList(container, fossils, currency = 'chaos') {
  if (!container) {
    console.error('Fossil list view: missing container');
    return;
  }

  if (!Array.isArray(fossils) || fossils.length === 0) {
    container.innerHTML = '<p class="no-results">No Fossils to display</p>';
    return;
  }
  
  // Filter to only show Fossils with valid reroll group (fossil)
  const filteredFossils = fossils.filter(fossil => {
    return fossil.rerollGroup === 'fossil';
  });
  
  if (filteredFossils.length === 0) {
    container.innerHTML = '<p class="no-results">No Fossils to display</p>';
    return;
  }
  
  // Handle Fossils with missing price data
  const fossilsWithMissingPrices = filteredFossils.filter(f => !f.hasPriceData());
  if (fossilsWithMissingPrices.length > 0) {
    console.warn(`${fossilsWithMissingPrices.length} Fossils have missing price data`);
  }

  // Store current state (store filtered Fossils)
  currentFossils = [...filteredFossils];
  currentCurrency = currency;

  // Sort fossils
  const sortedFossils = sortFossils(currentFossils, currentSort, currency);

  const getSortIndicator = (field) => {
    if (currentSort.field !== field) return '';
    return currentSort.direction === 'asc' ? ' ↑' : ' ↓';
  };

  const html = `
    <div class="fossil-list-header">
      <div class="fossil-header-cell image-cell"></div>
      <div class="fossil-header-cell name-cell sortable" data-sort-field="name">
        Name${getSortIndicator('name')}
      </div>
      <div class="fossil-header-cell drop-weight-cell sortable" data-sort-field="dropWeight">
        Drop Weight${getSortIndicator('dropWeight')}
      </div>
      <div class="fossil-header-cell value-cell sortable" data-sort-field="value">
        Value${getSortIndicator('value')}
      </div>
    </div>
    <div class="fossil-list">
      ${sortedFossils.map(fossil => renderFossilItem(fossil, currency)).join('')}
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
    // Only re-render if we're still on the fossils category
    if (getCategoryId() !== 'fossils') return;
    
    // Re-render to update selection highlighting
    const container = document.getElementById('list-view');
    if (container && currentFossils.length > 0) {
      renderFossilList(container, currentFossils, currentCurrency);
    }
  });
}

/**
 * Handle select all
 */
function handleSelectAll() {
  import('../services/selectionState.js').then(({ selectAll }) => {
    const allIds = currentFossils.map(f => f.id);
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
 * Render a single Fossil item in the list
 * @param {Fossil} fossil
 * @param {string} currency
 * @returns {string} HTML string
 */
function renderFossilItem(fossil, currency) {
  const value = fossil.chaosValue !== null 
    ? (currency === 'divine' ? fossil.divineValue : fossil.chaosValue)
    : null;
  const status = fossil.profitabilityStatus;
  const color = getProfitabilityColor(status);
  const bgColor = getProfitabilityBackgroundColor(status);
  const dropWeightDisplay = fossil.dropWeight != null
    ? (fossil.dropWeight * 100).toFixed(2) + '%'
    : 'N/A';
  const isSelected = selectionHas(fossil.id);
  const selectedClass = isSelected ? 'item-selected' : '';
  const imagePath = `/assets/images/fossils/${fossil.id}.png`;

  return `
    <div class="fossil-item ${selectedClass}" data-fossil-id="${fossil.id}" 
         style="border-left: 4px solid ${color}; background-color: ${bgColor};">
      <img class="fossil-image" src="${imagePath}" alt="${fossil.name}" onerror="this.style.display='none'">
      <span class="fossil-name">${fossil.name}</span>
      <span class="fossil-drop-weight">${dropWeightDisplay}</span>
      <span class="fossil-value">
        ${value !== null ? `${value.toFixed(2)} ${currency === 'divine' ? 'Div' : 'c'}` : 'N/A'}
      </span>
    </div>
  `;
}

/**
 * Sort Fossils based on current sort settings
 * @param {Array<Fossil>} fossils
 * @param {object} sort - { field: string, direction: 'asc' | 'desc' }
 * @param {string} currency
 * @returns {Array<Fossil>}
 */
function sortFossils(fossils, sort, currency) {
  return fossils.sort((a, b) => {
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
      case 'dropWeight':
        aValue = a.dropWeight == null ? Infinity : a.dropWeight;
        bValue = b.dropWeight == null ? Infinity : b.dropWeight;
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
  const sortableHeaders = container.querySelectorAll('.fossil-header-cell.sortable');
  
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
      renderFossilList(container, currentFossils, currentCurrency);
    });
  });
}

/**
 * Setup hover event listeners for list items to highlight corresponding grid cell
 * @param {HTMLElement} container
 */
function setupListHoverListenersForGrid(container) {
  const fossilItems = container.querySelectorAll('.fossil-item[data-fossil-id]');
  fossilItems.forEach(item => {
    const fossilId = item.getAttribute('data-fossil-id');
    if (!fossilId) return;
    item.addEventListener('mouseenter', () => highlightCellForFossil(fossilId));
    item.addEventListener('mouseleave', () => clearFossilHighlight());
  });
}

/**
 * Setup selection event listeners
 * @param {HTMLElement} container
 */
function setupSelectionListeners(container) {
  const fossilItems = container.querySelectorAll('.fossil-item[data-fossil-id]');
  
  fossilItems.forEach(item => {
    const fossilId = item.getAttribute('data-fossil-id');
    if (!fossilId) return;
    
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      selectionToggle(fossilId);
    });
  });
}

/**
 * Load selection state from LocalStorage (legacy function, kept for compatibility)
 * @param {Array<Fossil>} fossils
 */
export function loadSelectionState(fossils) {
  // Selection state is now managed by selectionState.js service
  // This function is kept for compatibility but doesn't need to do anything
}

/**
 * Clean up selection subscription (call when switching away from fossils category)
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
    container.innerHTML = '<p class="loading-text">Loading Fossils...</p>';
  }
}

/**
 * Handle empty state
 * @param {HTMLElement} container
 */
export function handleEmptyState(container) {
  if (container) {
    container.innerHTML = '<p class="no-results">No Fossils available</p>';
  }
}

