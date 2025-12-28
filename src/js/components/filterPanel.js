/**
 * Filter Panel Component
 * Provides filtering options for scarabs by name and value range
 */

let currentFilters = {
  nameSearch: '',
  minValue: null,
  maxValue: null,
  currency: 'chaos'
};

let onFilterChangeCallback = null;
let isCollapsed = false;

/**
 * Render filter panel
 * @param {HTMLElement} container - Container element
 * @param {string} currency - Current currency ('chaos' or 'divine')
 * @param {Function} onFilterChange - Callback when filters change
 */
export function renderFilterPanel(container, currency = 'chaos', onFilterChange) {
  if (!container) {
    console.error('Filter panel: missing container');
    return;
  }

  onFilterChangeCallback = onFilterChange;
  currentFilters.currency = currency;

  // Load collapsed state from localStorage
  const savedState = localStorage.getItem('filterPanelCollapsed');
  isCollapsed = savedState === 'true';

  const html = `
    <div class="filter-panel ${isCollapsed ? 'collapsed' : ''}">
      <div class="filter-header">
        <div class="filter-header-left">
          <button id="toggle-filter" class="toggle-filter-btn" aria-label="${isCollapsed ? 'Expand' : 'Collapse'} filter panel">
            <span class="toggle-icon">${isCollapsed ? '▼' : '▲'}</span>
          </button>
          <h3 id="filter-title">🔍 Filter Scarabs</h3>
        </div>
        <button id="clear-filters" class="clear-filters-btn" aria-label="Clear all filters">Clear</button>
      </div>
      <div class="filter-controls" ${isCollapsed ? 'style="display: none;"' : ''}>
        <div class="filter-group">
          <label for="filter-name">Search by Name:</label>
          <input 
            type="text" 
            id="filter-name" 
            placeholder="Enter scarab name..." 
            value="${currentFilters.nameSearch}"
            aria-label="Search scarabs by name"
          >
        </div>
        <div class="filter-group value-range">
          <label>Value Range (${currency === 'divine' ? 'Divine' : 'Chaos'}):</label>
          <div class="value-inputs">
            <input 
              type="number" 
              id="filter-min-value" 
              placeholder="Min" 
              value="${currentFilters.minValue !== null ? currentFilters.minValue : ''}"
              aria-label="Minimum value"
            >
            <span class="value-separator">-</span>
            <input 
              type="number" 
              id="filter-max-value" 
              placeholder="Max" 
              value="${currentFilters.maxValue !== null ? currentFilters.maxValue : ''}"
              aria-label="Maximum value"
            >
          </div>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Attach event listeners
  setupFilterListeners(container);
  setupToggleListener(container);
}

/**
 * Setup threshold settings button (called from main.js after filter panel is rendered)
 */
export function setupThresholdSettingsButton() {
  setupThresholdSettingsButtonInternal();
}

/**
 * Setup threshold settings button to open overlay (internal function)
 */
function setupThresholdSettingsButtonInternal() {
  const settingsButton = document.getElementById('open-threshold-settings');
  if (settingsButton) {
    settingsButton.addEventListener('click', (e) => {
      e.stopPropagation();
      const overlay = document.getElementById('threshold-overlay');
      if (overlay) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
      }
    });
  }
  
  // Setup close button
  const closeButton = document.getElementById('close-threshold-overlay');
  if (closeButton) {
    closeButton.addEventListener('click', closeThresholdOverlay);
  }
  
  // Close overlay when clicking outside
  const overlay = document.getElementById('threshold-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeThresholdOverlay();
      }
    });
    
    // Close overlay on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) {
        closeThresholdOverlay();
      }
    });
  }
}

/**
 * Close the threshold overlay
 */
export function closeThresholdOverlay() {
  const overlay = document.getElementById('threshold-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
  }
}

/**
 * Setup toggle listener for collapse/expand
 * @param {HTMLElement} container
 */
function setupToggleListener(container) {
  const toggleButton = container.querySelector('#toggle-filter');
  const filterTitle = container.querySelector('#filter-title');
  const filterControls = container.querySelector('.filter-controls');
  const filterPanel = container.querySelector('.filter-panel');
  
  const toggleCollapse = () => {
    isCollapsed = !isCollapsed;
    
    // Update UI
    if (isCollapsed) {
      filterControls.style.display = 'none';
      filterPanel.classList.add('collapsed');
      toggleButton.querySelector('.toggle-icon').textContent = '▼';
      toggleButton.setAttribute('aria-label', 'Expand filter panel');
    } else {
      filterControls.style.display = '';
      filterPanel.classList.remove('collapsed');
      toggleButton.querySelector('.toggle-icon').textContent = '▲';
      toggleButton.setAttribute('aria-label', 'Collapse filter panel');
    }
    
    // Save state to localStorage
    localStorage.setItem('filterPanelCollapsed', isCollapsed.toString());
  };
  
  if (toggleButton && filterControls && filterPanel) {
    toggleButton.addEventListener('click', toggleCollapse);
    
    // Also allow clicking on the title to toggle
    if (filterTitle) {
      filterTitle.addEventListener('click', toggleCollapse);
    }
  }
}

/**
 * Setup filter event listeners
 * @param {HTMLElement} container
 */
function setupFilterListeners(container) {
  const nameFilter = container.querySelector('#filter-name');
  const minValueFilter = container.querySelector('#filter-min-value');
  const maxValueFilter = container.querySelector('#filter-max-value');
  const clearButton = container.querySelector('#clear-filters');

  // Name search filter (with debounce)
  let nameSearchTimeout = null;
  if (nameFilter) {
    nameFilter.addEventListener('input', (e) => {
      clearTimeout(nameSearchTimeout);
      nameSearchTimeout = setTimeout(() => {
        currentFilters.nameSearch = e.target.value.trim().toLowerCase();
        applyFilters();
      }, 300); // 300ms debounce
    });
  }

  // Value range filters
  if (minValueFilter) {
    minValueFilter.addEventListener('input', (e) => {
      const value = e.target.value.trim();
      currentFilters.minValue = value === '' ? null : parseFloat(value);
      applyFilters();
    });
  }

  if (maxValueFilter) {
    maxValueFilter.addEventListener('input', (e) => {
      const value = e.target.value.trim();
      currentFilters.maxValue = value === '' ? null : parseFloat(value);
      applyFilters();
    });
  }

  // Clear filters button
  if (clearButton) {
    clearButton.addEventListener('click', () => {
      clearFilters(container);
    });
  }
}

/**
 * Apply current filters and notify callback
 */
function applyFilters() {
  // Check if filters are effectively empty
  const hasActiveFilters = currentFilters.nameSearch !== '' || 
                          currentFilters.minValue !== null || 
                          currentFilters.maxValue !== null;
  
  // Notify callback with null if no filters are active, otherwise send current filters
  if (onFilterChangeCallback) {
    onFilterChangeCallback(hasActiveFilters ? currentFilters : null);
  }
}

/**
 * Clear all filters
 * @param {HTMLElement} container
 */
function clearFilters(container) {
  currentFilters = {
    nameSearch: '',
    minValue: null,
    maxValue: null,
    currency: currentFilters.currency
  };

  // Reset UI
  const nameFilter = container.querySelector('#filter-name');
  const minValueFilter = container.querySelector('#filter-min-value');
  const maxValueFilter = container.querySelector('#filter-max-value');

  if (nameFilter) nameFilter.value = '';
  if (minValueFilter) minValueFilter.value = '';
  if (maxValueFilter) maxValueFilter.value = '';

  // Check if filters are effectively empty
  const hasActiveFilters = currentFilters.nameSearch !== '' || 
                          currentFilters.minValue !== null || 
                          currentFilters.maxValue !== null;
  
  // Notify callback with null if no filters are active, otherwise send current filters
  if (onFilterChangeCallback) {
    onFilterChangeCallback(hasActiveFilters ? currentFilters : null);
  }
}

/**
 * Get current filters
 * @returns {object} Current filter state
 */
export function getCurrentFilters() {
  return { ...currentFilters };
}

/**
 * Update filter panel currency
 * @param {HTMLElement} container
 * @param {string} currency
 */
export function updateFilterCurrency(container, currency) {
  currentFilters.currency = currency;
  
  // Update currency label
  const currencyLabel = container.querySelector('.value-range label');
  if (currencyLabel) {
    currencyLabel.textContent = `Value Range (${currency === 'divine' ? 'Divine' : 'Chaos'}):`;
  }
  
  // Clear value filters when currency changes (to avoid confusion)
  currentFilters.minValue = null;
  currentFilters.maxValue = null;
  
  const minValueFilter = container.querySelector('#filter-min-value');
  const maxValueFilter = container.querySelector('#filter-max-value');
  if (minValueFilter) minValueFilter.value = '';
  if (maxValueFilter) maxValueFilter.value = '';
  
  applyFilters();
}

/**
 * Update filter info display
 * @param {HTMLElement} container
 * @param {number} totalCount - Total scarabs
 * @param {number} filteredCount - Filtered scarabs
 */
export function updateFilterInfo(container, totalCount, filteredCount) {
  const infoElement = container.querySelector('#filter-info');
  if (!infoElement) return;

  if (filteredCount === totalCount) {
    infoElement.textContent = `Showing all ${totalCount} scarabs`;
    infoElement.className = 'filter-info';
  } else {
    infoElement.textContent = `Showing ${filteredCount} of ${totalCount} scarabs`;
    infoElement.className = 'filter-info active';
  }
}

/**
 * Filter scarabs based on filter criteria
 * @param {Array<Scarab>} scarabs - Array of Scarab objects
 * @param {object|null} filters - Filter criteria (optional, uses currentFilters if not provided)
 * @returns {Array<Scarab>} Filtered scarabs
 */
export function filterScarabs(scarabs, filters = null) {
  if (!Array.isArray(scarabs)) return [];
  
  // If no filters provided or filters is null, return all scarabs
  const activeFilters = filters || currentFilters;
  if (!activeFilters) return scarabs;

  return scarabs.filter(scarab => {
    // Name search filter
    if (activeFilters.nameSearch) {
      const nameLower = (scarab.name || '').toLowerCase();
      const idLower = (scarab.id || '').toLowerCase();
      const searchLower = activeFilters.nameSearch.toLowerCase();
      
      if (!nameLower.includes(searchLower) && !idLower.includes(searchLower)) {
        return false;
      }
    }

    // Value range filter
    const value = activeFilters.currency === 'divine' 
      ? scarab.divineValue 
      : scarab.chaosValue;

    if (value === null || value === undefined) {
      // If no value data, only include if no value filters are set
      if (activeFilters.minValue !== null || activeFilters.maxValue !== null) {
        return false;
      }
    } else {
      // Check min value
      if (activeFilters.minValue !== null && value < activeFilters.minValue) {
        return false;
      }
      
      // Check max value
      if (activeFilters.maxValue !== null && value > activeFilters.maxValue) {
        return false;
      }
    }

    return true;
  });
}

