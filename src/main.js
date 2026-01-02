/**
 * Application Entry Point
 * Flipping Scarabs - Path of Exile vendor profitability calculator
 */

import { loadAndMergeScarabData, loadPreferences, savePreferences, loadAllItemTypePrices } from './js/services/dataService.js';
import { calculateThreshold, calculateProfitabilityStatus } from './js/services/calculationService.js';
import { priceUpdateService } from './js/services/priceUpdateService.js';
import { initLeagueService } from './js/services/leagueService.js';
import { Scarab } from './js/models/scarab.js';
import { renderThresholdDisplay } from './js/components/thresholdDisplay.js';
import { renderListView, updateListView, showLoadingState, showErrorState } from './js/views/listView.js';
import { initGridView, updateGridView, setFilteredScarabs, clearFilteredScarabs } from './js/views/gridView.js';
import { 
  renderViewSwitcher, 
  getViewPreference, 
  saveViewPreference,
  updateViewSwitcher,
  getCurrencyPreference,
  saveCurrencyPreference
} from './js/components/viewSwitcher.js';
import { 
  renderFilterPanel, 
  getCurrentFilters, 
  filterScarabs, 
  updateFilterCurrency,
  setupThresholdSettingsButton
} from './js/components/filterPanel.js';
import { 
  renderSimulationPanel,
  initSimulationPanel 
} from './js/components/simulationPanel.js';
import { 
  renderNavigation,
  updateNavigation 
} from './js/components/navigation.js';
import { handleMissingPriceData, handleMissingDropWeight, sanitizeScarabData } from './js/utils/errorHandler.js';
import { hideTooltip } from './js/utils/tooltip.js';
import { initDataStatusOverlay, setOnRefreshCallback } from './js/components/dataStatusOverlay.js';
import { renderLeagueSelector, setOnLeagueChange } from './js/components/leagueSelector.js';
import { showErrorToast, showWarningToast } from './js/utils/toast.js';

// Import debug tools (only in development)
if (import.meta.env.DEV) {
  import('./js/utils/debugCellAnalyzer.js').then(module => {
    console.log('💡 Debug tools available:');
    console.log('   - window.analyzeCells() - Analyze image and detect cell positions');
    console.log('   - window.exportCellConfig(cells) - Export cells as config code');
  });
}

/**
 * Reload scarab data with updated prices
 * @param {Array|null} updatedPrices - Updated price data, or null to reload from service
 */
async function reloadScarabDataWithPrices(updatedPrices) {
  try {
    console.log('Reloading scarab data with updated prices...');
    
    let merged;
    
    if (updatedPrices === null) {
      // League changed, reload from service
      merged = await loadAndMergeScarabData();
    } else {
      // Prices updated, merge with existing details
      // Load details from local (static data)
      const detailsResponse = await fetch('/data/scarabDetails.json');
      if (!detailsResponse.ok) {
        throw new Error('Failed to load Scarab details file');
      }
      const details = await detailsResponse.json();

      // Create a map of prices by detailsId for quick lookup
      const priceMap = new Map();
      updatedPrices.forEach(price => {
        if (price.detailsId) {
          priceMap.set(price.detailsId, price);
        }
      });

      // Merge details with updated prices
      merged = details.map(detail => {
        const price = priceMap.get(detail.id);
        return {
          ...detail,
          chaosValue: price?.chaosValue ?? null,
          divineValue: price?.divineValue ?? null,
        };
      });
    }

    // Sanitize and create Scarab instances
    const scarabs = merged
      .map(data => sanitizeScarabData(data))
      .map(data => new Scarab(data))
      .filter(scarab => {
        if (!scarab.validate()) {
          console.warn(`Invalid Scarab data: ${scarab.id}`);
          return false;
        }
        return true;
      });

    // Handle missing data
    scarabs.forEach(scarab => {
      handleMissingPriceData(scarab);
      handleMissingDropWeight(scarab);
    });

    // Recalculate threshold
    const threshold = calculateThreshold(scarabs, currentConfidencePercentile, 10000, currentTradeMode);
    
    // Recalculate profitability status
    calculateProfitabilityStatus(scarabs, threshold);

    // Update global state
    currentScarabs = scarabs;
    currentThreshold = threshold;

    // Update threshold display
    const thresholdContainer = document.getElementById('threshold-display');
    if (thresholdContainer) {
      renderThresholdDisplay(thresholdContainer, threshold, currentCurrency, currentConfidencePercentile, handleConfidencePercentileChange, currentTradeMode, handleTradeModeChange);
    }

    // Update views
    renderCurrentView();

    // Update league selector (in case it needs refresh)
    const navigationContainer = document.getElementById('navigation');
    if (navigationContainer) {
      const leagueSelectorContainer = navigationContainer.querySelector('#league-selector-container');
      if (leagueSelectorContainer) {
        import('./js/components/leagueSelector.js').then(module => {
          module.updateLeagueSelector(leagueSelectorContainer);
        });
      }
    }

    // Update simulation panel if initialized
    initSimulationPanel(scarabs, threshold);

    console.log(`✓ Scarab data reloaded with updated prices (${scarabs.length} scarabs)`);
  } catch (error) {
    console.error('Error reloading scarab data with updated prices:', error);
    
    // Show error toast if it's a data loading error
    if (error.message && (error.message.includes('Unable to load') || error.message.includes('file not found') || error.message.includes('404'))) {
      const { getSelectedLeague } = await import('./js/services/leagueService.js');
      const league = getSelectedLeague();
      const leagueName = league ? league.name : 'selected league';
      
      showErrorToast(
        `There is insufficient price data for ${leagueName}. ` +
        `Please try another league or check back later.`
      );
    } else {
      showErrorToast('Failed to reload scarab data. Please try again.');
    }
  }
}

/**
 * Initialize application
 */
async function init() {
  // Show loading state
  const listViewContainer = document.getElementById('list-view');
  if (listViewContainer) {
    showLoadingState(listViewContainer);
  }

  try {
    console.log('Loading Scarab data...');
    
    // Initialize league service first
    await initLeagueService();
    
    // Load user preferences
    const preferences = loadPreferences();
    const currency = preferences.currencyPreference || 'chaos';
    currentConfidencePercentile = preferences.confidencePercentile || 0.9;
    currentTradeMode = preferences.tradeMode || 'returnable';

    // Load and merge Scarab data (will use selected league)
    const rawData = await loadAndMergeScarabData();
    
    // Load additional item type prices in parallel
    const additionalItemTypes = ['catalyst', 'deliriumOrb', 'emblem', 'essence', 'fossil', 'lifeforce', 'oil', 'tattoo', 'templeUnique', 'vial'];
    const additionalPrices = await loadAllItemTypePrices(additionalItemTypes);
    
    // Store prices for later use
    window.priceData = {
      scarabs: rawData,
      additional: additionalPrices
    };
    
    // Sanitize and create Scarab instances
    const scarabs = rawData
      .map(data => sanitizeScarabData(data))
      .map(data => new Scarab(data))
      .filter(scarab => {
        // Filter out invalid Scarabs
        if (!scarab.validate()) {
          console.warn(`Invalid Scarab data: ${scarab.id}`);
          return false;
        }
        return true;
      });

    console.log(`Loaded ${scarabs.length} Scarabs`);

    // Handle missing data
    scarabs.forEach(scarab => {
      handleMissingPriceData(scarab);
      handleMissingDropWeight(scarab);
    });

    // Calculate threshold
    console.log('Calculating threshold...');
    const threshold = calculateThreshold(scarabs, currentConfidencePercentile, 10000, currentTradeMode);
    console.log(`Threshold calculated: ${threshold.value.toFixed(2)} chaos (mode: ${currentTradeMode})`);

    // Calculate profitability status for all Scarabs
    calculateProfitabilityStatus(scarabs, threshold);

    // Count profitability statuses
    const profitableCount = scarabs.filter(s => s.profitabilityStatus === 'profitable').length;
    const notProfitableCount = scarabs.filter(s => s.profitabilityStatus === 'not_profitable').length;
    const unknownCount = scarabs.filter(s => s.profitabilityStatus === 'unknown').length;
    
    console.log(`Profitability breakdown: ${profitableCount} profitable, ${notProfitableCount} not profitable, ${unknownCount} unknown`);

    // Render navigation
    const navigationContainer = document.getElementById('navigation');
    if (navigationContainer) {
      renderNavigation(
        navigationContainer, 
        currentCategory, 
        currentPage, 
        handleCategoryChange, 
        handlePageChange,
        (leagueSelectorContainer) => {
          // Render league selector in navigation bar
          renderLeagueSelector(leagueSelectorContainer);
        }
      );
    }

    // Setup header page buttons
    setupHeaderPageButtons();

    // Render UI
    renderUI(scarabs, threshold, currency);

    // Initialize simulation panel (data only, will render when page is shown)
    initSimulationPanel(scarabs, threshold);

    // Set up price update callback to reload data when prices change
    priceUpdateService.setOnPriceUpdate(async (itemType, updatedPrices) => {
      if (itemType === 'scarab') {
        // Existing Scarab update logic
        await reloadScarabDataWithPrices(updatedPrices);
      } else {
        // Update additional item type prices
        if (window.priceData) {
          window.priceData.additional.set(itemType, updatedPrices);
          console.log(`✓ Updated ${itemType} prices (${updatedPrices.length} items)`);
        }
      }
    });

    // Set up data status overlay refresh callback
    setOnRefreshCallback(async (updatedPrices) => {
      await reloadScarabDataWithPrices(updatedPrices);
    });

    // Set up league selector callback
    setOnLeagueChange(async () => {
      await reloadScarabDataWithPrices(null);
      // Reload additional item type prices for new league
      if (window.priceData) {
        const additionalItemTypes = ['catalyst', 'deliriumOrb', 'emblem', 'essence', 'fossil', 'lifeforce', 'oil', 'tattoo', 'templeUnique', 'vial'];
        const updatedAdditionalPrices = await loadAllItemTypePrices(additionalItemTypes);
        window.priceData.additional = updatedAdditionalPrices;
        console.log('✓ Additional item type prices refreshed for new league');
      }
    });

    // Initialize data status overlay
    initDataStatusOverlay();

    // Start automatic price updates
    priceUpdateService.startAutomaticUpdates();

    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    
    // Show error toast
    if (error.message && (error.message.includes('Unable to load') || error.message.includes('file not found') || error.message.includes('404'))) {
      const { getSelectedLeague } = await import('./js/services/leagueService.js');
      const league = getSelectedLeague();
      const leagueName = league ? league.name : 'selected league';
      
      showErrorToast(
        `There is insufficient price data for ${leagueName}. ` +
        `Please try another league or check back later.`
      );
    } else {
      showErrorToast('Failed to load Scarab data. Please refresh the page.');
    }
    
    if (listViewContainer) {
      showErrorState(listViewContainer, 'Failed to load Scarab data. Please refresh the page.');
    } else {
      showError('Failed to load Scarab data. Please refresh the page.');
    }
  }
}

// Global state
let currentScarabs = [];
let currentThreshold = null;
let currentCurrency = 'chaos';
let currentView = 'list';
let currentFilters = null;
let currentPage = 'flipping'; // 'flipping' or 'simulation'
let currentCategory = 'scarabs'; // 'scarabs', 'essences', 'tattoos', 'catalysts', 'temple', 'fossils', 'oils', 'delirium-orbs', 'emblems'
let currentConfidencePercentile = 0.9; // Default 90% confidence
let currentTradeMode = 'returnable'; // Default trade mode: 'returnable', 'lowest_value', or 'optimal_combination'

/**
 * Render the main UI
 * @param {Array<Scarab>} scarabs
 * @param {ExpectedValueThreshold} threshold
 * @param {string} currency
 */
function renderUI(scarabs, threshold, currency) {
  // Store in global state
  currentScarabs = scarabs;
  currentThreshold = threshold;
  currentCurrency = currency;
  
  // Load view preference
  currentView = getViewPreference();

  // Render threshold display
  const thresholdContainer = document.getElementById('threshold-display');
  if (thresholdContainer) {
    renderThresholdDisplay(thresholdContainer, threshold, currency, currentConfidencePercentile, handleConfidencePercentileChange, currentTradeMode, handleTradeModeChange);
  }

  // Render filter panel
  const filterPanelContainer = document.getElementById('filter-panel');
  if (filterPanelContainer) {
    renderFilterPanel(filterPanelContainer, currency, handleFilterChange);
  }

  // Setup threshold settings button (outside filter panel)
  setupThresholdSettingsButton();

  // View switcher is no longer rendered (currency dropdown removed)

  // Render appropriate view
  renderCurrentView();
}

/**
 * Render both views simultaneously (merged layout)
 */
async function renderCurrentView() {
  const listViewContainer = document.getElementById('list-view');
  const gridViewContainer = document.getElementById('grid-view');
  const canvas = document.getElementById('scarab-grid-canvas');

  // Apply filters if active
  let displayScarabs = currentScarabs;
  if (currentFilters) {
    displayScarabs = filterScarabs(currentScarabs);
    
    // Update grid view with filtered scarab IDs for highlighting
    const filteredIds = displayScarabs.map(s => s.id);
    setFilteredScarabs(filteredIds);
  } else {
    clearFilteredScarabs();
  }

  // Always show both views
  if (listViewContainer) {
    listViewContainer.style.display = 'block';
    renderListView(listViewContainer, currentScarabs, currentCurrency, currentFilters);
  }
  
  if (gridViewContainer) {
    gridViewContainer.style.display = 'block';
  }
  
  if (canvas) {
    // Initialize or update grid view
    try {
      // Load image from public assets
      await initGridView(canvas, currentScarabs, '/assets/Scarab-tab.png');
      
      // Apply filter highlights if filters are active
      if (currentFilters && displayScarabs.length > 0) {
        const filteredIds = displayScarabs.map(s => s.id);
        setFilteredScarabs(filteredIds);
      }
      
      // Sync list wrapper height with grid canvas height (filter panel + list view)
      const listWrapper = document.querySelector('.list-wrapper');
      if (listWrapper && canvas.offsetHeight > 0) {
        listWrapper.style.height = `${canvas.offsetHeight}px`;
      }
    } catch (error) {
      console.error('Error rendering grid view:', error);
    }
  }
}

/**
 * Handle view change (no longer used, but kept for compatibility)
 * @param {string} view - 'list' or 'grid'
 */
function handleViewChange(view) {
  // Views are now always shown together, so this is a no-op
  // Kept for compatibility with viewSwitcher component
}

/**
 * Handle filter change
 * @param {object} filters - Filter criteria
 */
function handleFilterChange(filters) {
  currentFilters = filters;
  renderCurrentView();
}

/**
 * Handle confidence percentile change
 * @param {number} confidencePercentile - New confidence percentile (0-1)
 */
function handleConfidencePercentileChange(confidencePercentile) {
  currentConfidencePercentile = confidencePercentile;
  
  // Save preference
  const preferences = loadPreferences();
  preferences.confidencePercentile = confidencePercentile;
  savePreferences(preferences);
  
  // Recalculate threshold with new confidence percentile
  if (currentScarabs.length > 0) {
    console.log(`Recalculating threshold with ${(confidencePercentile * 100).toFixed(0)}% confidence...`);
    const newThreshold = calculateThreshold(currentScarabs, confidencePercentile, 10000, currentTradeMode);
    currentThreshold = newThreshold;
    console.log(`New threshold: ${newThreshold.value.toFixed(2)} chaos`);
    
    // Recalculate profitability status
    calculateProfitabilityStatus(currentScarabs, newThreshold);
    
    // Update threshold display
    const thresholdContainer = document.getElementById('threshold-display');
    if (thresholdContainer) {
      renderThresholdDisplay(thresholdContainer, newThreshold, currentCurrency, confidencePercentile, handleConfidencePercentileChange, currentTradeMode, handleTradeModeChange);
    }
    
    // Update views to reflect new profitability statuses
    renderCurrentView();
    
    // Update simulation panel if on simulation page
    if (currentPage === 'simulation') {
      const simulationPanelContainer = document.getElementById('simulation-panel');
      if (simulationPanelContainer) {
        renderSimulationPanel(simulationPanelContainer);
      }
    }
  }
}

/**
 * Handle trade mode change
 * @param {string} tradeMode - New trade mode ('returnable', 'lowest_value', or 'optimal_combination')
 */
function handleTradeModeChange(tradeMode) {
  currentTradeMode = tradeMode;
  
  // Save preference
  const preferences = loadPreferences();
  preferences.tradeMode = tradeMode;
  savePreferences(preferences);
  
  // Recalculate threshold with new trade mode
  if (currentScarabs.length > 0) {
    console.log(`Recalculating threshold with trade mode: ${tradeMode}...`);
    const newThreshold = calculateThreshold(currentScarabs, currentConfidencePercentile, 10000, tradeMode);
    currentThreshold = newThreshold;
    console.log(`New threshold: ${newThreshold.value.toFixed(2)} chaos (mode: ${tradeMode})`);
    
    // Recalculate profitability status
    calculateProfitabilityStatus(currentScarabs, newThreshold);
    
    // Update threshold display
    const thresholdContainer = document.getElementById('threshold-display');
    if (thresholdContainer) {
      renderThresholdDisplay(thresholdContainer, newThreshold, currentCurrency, currentConfidencePercentile, handleConfidencePercentileChange, tradeMode, handleTradeModeChange);
    }
    
    // Update views to reflect new profitability statuses
    renderCurrentView();
    
    // Update simulation panel if on simulation page
    if (currentPage === 'simulation') {
      const simulationPanelContainer = document.getElementById('simulation-panel');
      if (simulationPanelContainer) {
        renderSimulationPanel(simulationPanelContainer);
      }
    }
  }
}

/**
 * Handle currency change
 * @param {string} currency - 'chaos' or 'divine'
 */
function handleCurrencyChange(currency) {
  currentCurrency = currency;
  
  // Update threshold display (in overlay)
  const thresholdContainer = document.getElementById('threshold-display');
  if (thresholdContainer && currentThreshold) {
    renderThresholdDisplay(thresholdContainer, currentThreshold, currency, currentConfidencePercentile, handleConfidencePercentileChange, currentTradeMode, handleTradeModeChange);
  }
  
  // Update filter panel currency
  const filterPanelContainer = document.getElementById('filter-panel');
  if (filterPanelContainer) {
    updateFilterCurrency(filterPanelContainer, currency);
  }
  
  // Update current view
  renderCurrentView();
  
  // Update simulation panel if on simulation page
  if (currentPage === 'simulation') {
    const simulationPanelContainer = document.getElementById('simulation-panel');
    if (simulationPanelContainer) {
      renderSimulationPanel(simulationPanelContainer);
    }
  }
}

/**
 * Handle category change
 * @param {string} category - 'scarabs', 'essences', 'tattoos', 'catalysts', 'temple', 'fossils', 'oils', 'delirium-orbs', 'emblems'
 */
function handleCategoryChange(category) {
  currentCategory = category;
  
  // Update navigation
  const navigationContainer = document.getElementById('navigation');
  if (navigationContainer) {
    updateNavigation(
      navigationContainer, 
      category, 
      currentPage,
      handleCategoryChange,
      handlePageChange,
      (leagueSelectorContainer) => {
        // Re-render league selector when navigation updates
        renderLeagueSelector(leagueSelectorContainer);
      }
    );
  }
  
  // TODO: Implement category-specific logic
  // For now, this is a placeholder
  console.log(`Category changed to: ${category}`);
  
  // Show placeholder message or load category-specific data
  if (category !== 'scarabs') {
    // For non-scarab categories, show a placeholder
    showWarningToast(`${category.charAt(0).toUpperCase() + category.slice(1)} category is coming soon!`);
  }
}

/**
 * Setup header page buttons (Flipping, Simulation)
 */
function setupHeaderPageButtons() {
  const headerPageButtons = document.getElementById('header-page-buttons');
  if (!headerPageButtons) return;

  const buttons = headerPageButtons.querySelectorAll('.header-page-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const page = btn.dataset.page;
      if (page) {
        handlePageChange(page);
      }
    });
  });

  // Set initial active state
  updateHeaderPageButtons(currentPage);
}

/**
 * Update header page buttons active state
 * @param {string} activePage - 'flipping' or 'simulation'
 */
function updateHeaderPageButtons(activePage) {
  const headerPageButtons = document.getElementById('header-page-buttons');
  if (!headerPageButtons) return;

  const buttons = headerPageButtons.querySelectorAll('.header-page-btn');
  buttons.forEach(btn => {
    if (btn.dataset.page === activePage) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

/**
 * Handle page change
 * @param {string} page - 'flipping' or 'simulation'
 */
function handlePageChange(page) {
  currentPage = page;
  
  // Update navigation
  const navigationContainer = document.getElementById('navigation');
  if (navigationContainer) {
    updateNavigation(
      navigationContainer, 
      currentCategory, 
      page,
      handleCategoryChange,
      handlePageChange,
      (leagueSelectorContainer) => {
        // Re-render league selector when navigation updates
        renderLeagueSelector(leagueSelectorContainer);
      }
    );
  }

  // Update header page buttons
  updateHeaderPageButtons(page);
  
  // Show/hide pages
  const flippingPage = document.getElementById('flipping-page');
  const simulationPage = document.getElementById('simulation-page');
  
  if (flippingPage && simulationPage) {
    if (page === 'flipping') {
      flippingPage.classList.add('active');
      simulationPage.classList.remove('active');
    } else if (page === 'simulation') {
      flippingPage.classList.remove('active');
      simulationPage.classList.add('active');
      
      // Render simulation panel when switching to simulation page
      const simulationPanelContainer = document.getElementById('simulation-panel');
      if (simulationPanelContainer) {
        renderSimulationPanel(simulationPanelContainer);
      }
    }
  }
}

/**
 * Show error message to user
 * @param {string} message
 */
function showError(message) {
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = `
      <div class="error-message">
        <h2>Error</h2>
        <p>${message}</p>
        <button onclick="location.reload()">Reload Page</button>
      </div>
    `;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
