/**
 * Application Entry Point
 * Flipping Scarabs - Path of Exile vendor profitability calculator
 */

import { loadAndMergeScarabData, loadPreferences, savePreferences, loadAllItemTypePrices, loadAndMergeEssenceData, getPrimalLifeforcePrice } from './js/services/dataService.js';
import { calculateThreshold, calculateProfitabilityStatus } from './js/services/calculationService.js';
import { calculateExpectedValueForGroup, calculateThresholdForGroup, calculateProfitabilityStatus as calculateEssenceProfitabilityStatus } from './js/services/essenceCalculationService.js';
import { priceUpdateService } from './js/services/priceUpdateService.js';
import { initLeagueService } from './js/services/leagueService.js';
import { Scarab } from './js/models/scarab.js';
import { Essence } from './js/models/essence.js';
import { groupEssencesByRerollType, createRerollGroup } from './js/utils/essenceGroupUtils.js';
import { renderEssenceList, showLoadingState as showEssenceLoadingState } from './js/views/essenceListView.js';
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
let currentEssences = [];
let currentEssenceThresholds = new Map(); // Map of reroll group to threshold
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

  // Show grid view and filter panel for Scarabs
  const gridViewContainer = document.getElementById('grid-view');
  if (gridViewContainer) {
    gridViewContainer.style.display = '';
  }
  
  const filterPanelContainer = document.getElementById('filter-panel');
  if (filterPanelContainer) {
    filterPanelContainer.style.display = '';
  }

  // Load view preference
  currentView = getViewPreference();

  // Render threshold display
  const thresholdContainer = document.getElementById('threshold-display');
  if (thresholdContainer) {
    renderThresholdDisplay(thresholdContainer, threshold, currency, currentConfidencePercentile, handleConfidencePercentileChange, currentTradeMode, handleTradeModeChange);
  }

  // Render filter panel
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
  saveCurrencyPreference(currency);
  
  // Handle Essence category
  if (currentCategory === 'essences') {
    // Update Essence threshold display
    const thresholdContainer = document.getElementById('threshold-display');
    if (thresholdContainer && currentEssenceThresholds.size > 0) {
      // Get reroll cost from first threshold (all have same cost)
      const firstThreshold = Array.from(currentEssenceThresholds.values())[0];
      const rerollCost = firstThreshold.rerollCost;
      renderEssenceThresholdDisplay(thresholdContainer, currentEssenceThresholds, rerollCost, currency);
    }
    
    // Update Essence list view
    const listViewContainer = document.getElementById('list-view');
    if (listViewContainer && currentEssences.length > 0) {
      const selectionPanelContainer = document.getElementById('essence-selection-panel');
      renderEssenceList(listViewContainer, currentEssences, currency, selectionPanelContainer);
    }
    return;
  }
  
  // Handle Scarab category (existing logic)
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
 * Load and process Essence data
 */
async function loadAndProcessEssenceData() {
  try {
    console.log('Loading Essence data...');
    
    // Load Essence prices
    const rawEssenceData = await loadAndMergeEssenceData();
    
    // Load Primal Crystallised Lifeforce price
    const primalLifeforce = await getPrimalLifeforcePrice();
    if (!primalLifeforce || !primalLifeforce.chaosValue) {
      console.error('Primal Crystallised Lifeforce price not available');
      showErrorToast('Cannot calculate Essence thresholds: Primal Crystallised Lifeforce price unavailable');
      return;
    }
    
    const rerollCost = 30 * primalLifeforce.chaosValue;
    console.log(`Reroll cost: ${rerollCost.toFixed(2)} chaos (30 × ${primalLifeforce.chaosValue.toFixed(4)})`);
    
    // Create Essence instances (classification happens in constructor)
    const essences = rawEssenceData
      .map(data => new Essence(data))
      .filter(essence => {
        if (!essence.validate()) {
          console.warn(`Invalid Essence data: ${essence.id}`);
          return false;
        }
        return true;
      });
    
    console.log(`Loaded ${essences.length} Essences`);
    
    // Group Essences by reroll type
    const groupsByType = groupEssencesByRerollType(essences);
    console.log(`Grouped into ${groupsByType.size} reroll groups`);
    
    // Calculate thresholds for each group
    const thresholds = new Map();
    
    groupsByType.forEach((groupEssences, groupType) => {
      // Calculate expected value (equal weighting)
      const expectedValue = calculateExpectedValueForGroup(groupEssences);
      
      // Calculate threshold
      const threshold = calculateThresholdForGroup(expectedValue, rerollCost);
      
      // Store threshold
      thresholds.set(groupType, {
        rerollGroup: groupType,
        value: threshold,
        expectedValue: expectedValue,
        rerollCost: rerollCost,
        calculationMethod: 'equal_weighted_average',
        essenceCount: groupEssences.length,
        calculatedAt: new Date().toISOString()
      });
      
      // Calculate profitability status for each Essence in group
      groupEssences.forEach(essence => {
        essence.expectedValue = expectedValue;
        essence.threshold = threshold;
        essence.profitabilityStatus = calculateEssenceProfitabilityStatus(essence, threshold);
      });
      
      console.log(`${groupType} group: expectedValue=${expectedValue.toFixed(2)}, threshold=${threshold.toFixed(2)}, essences=${groupEssences.length}`);
    });
    
    // Handle Essences without reroll groups
    essences.forEach(essence => {
      if (!essence.hasRerollGroup()) {
        essence.profitabilityStatus = 'unknown';
        console.warn(`Essence without reroll group: ${essence.name}`);
      }
    });
    
    // Filter to only include Essences with valid reroll groups (special, deafening, shrieking)
    const validRerollGroups = ['special', 'deafening', 'shrieking'];
    const filteredEssences = essences.filter(essence => {
      return essence.rerollGroup && validRerollGroups.includes(essence.rerollGroup);
    });
    
    // Count profitability statuses (from filtered Essences)
    const profitableCount = filteredEssences.filter(e => e.profitabilityStatus === 'profitable').length;
    const notProfitableCount = filteredEssences.filter(e => e.profitabilityStatus === 'not_profitable').length;
    const unknownCount = filteredEssences.filter(e => e.profitabilityStatus === 'unknown').length;
    
    console.log(`Essence profitability breakdown: ${profitableCount} profitable, ${notProfitableCount} not profitable, ${unknownCount} unknown`);
    console.log(`Filtered to ${filteredEssences.length} Essences (from ${essences.length} total)`);
    
    // Store in global state (store filtered Essences)
    currentEssences = filteredEssences;
    currentEssenceThresholds = thresholds;
    
    return { essences: filteredEssences, thresholds, rerollCost };
  } catch (error) {
    console.error('Error loading Essence data:', error);
    showErrorToast('Failed to load Essence data');
    throw error;
  }
}

/**
 * Render Essence UI
 */
async function renderEssenceUI(essences, thresholds, rerollCost, currency) {
  // Store in global state
  currentEssences = essences;
  currentEssenceThresholds = thresholds;
  currentCurrency = currency;
  
  // Load selection state from LocalStorage (if available)
  const { loadSelectionState } = await import('./js/views/essenceListView.js');
  loadSelectionState(essences);
  
  // Render Essence list view
  const listViewContainer = document.getElementById('list-view');
  const selectionPanelContainer = document.getElementById('essence-selection-panel');
  if (listViewContainer) {
    renderEssenceList(listViewContainer, essences, currency, selectionPanelContainer);
  }
  
  // Hide grid view and filter panel for Essences (list view only)
  const gridViewContainer = document.getElementById('grid-view');
  if (gridViewContainer) {
    gridViewContainer.style.display = 'none';
  }
  
  const filterPanelContainer = document.getElementById('filter-panel');
  if (filterPanelContainer) {
    filterPanelContainer.style.display = 'none';
  }
  
  // Update threshold display to show Essence thresholds
  const thresholdContainer = document.getElementById('threshold-display');
  if (thresholdContainer) {
    renderEssenceThresholdDisplay(thresholdContainer, thresholds, rerollCost, currency);
  }
}

/**
 * Render Essence threshold display
 */
function renderEssenceThresholdDisplay(container, thresholds, rerollCost, currency) {
  if (!container || !thresholds || thresholds.size === 0) {
    return;
  }
  
  const currencySymbol = currency === 'divine' ? 'Div' : 'c';
  
  let html = `
    <div class="essence-threshold-display">
      <div class="threshold-header">
        <h2>Essence Reroll Thresholds</h2>
        <div class="reroll-cost">
          <strong>Reroll Cost:</strong> 30 Primal Crystallised Lifeforce = ${rerollCost.toFixed(2)} ${currencySymbol}
        </div>
      </div>
      <div class="threshold-groups">
  `;
  
  // Display threshold for each reroll group
  const groupOrder = ['deafening', 'shrieking', 'special'];
  groupOrder.forEach(groupType => {
    const threshold = thresholds.get(groupType);
    if (threshold) {
      const value = currency === 'divine' 
        ? (threshold.value / 150).toFixed(4)
        : threshold.value.toFixed(2);
      const expectedValue = currency === 'divine'
        ? (threshold.expectedValue / 150).toFixed(4)
        : threshold.expectedValue.toFixed(2);
      
      const groupLabel = groupType.charAt(0).toUpperCase() + groupType.slice(1);
      const isProfitable = threshold.value > 0;
      const statusClass = isProfitable ? 'profitable' : 'not-profitable';
      
      html += `
        <div class="threshold-group ${statusClass}">
          <div class="group-header">
            <h3>${groupLabel} Group</h3>
            <span class="essence-count">${threshold.essenceCount} Essences</span>
          </div>
          <div class="threshold-values">
            <div class="threshold-value">
              <label>Threshold:</label>
              <span class="value">${value} ${currencySymbol}</span>
            </div>
            <div class="expected-value">
              <label>Expected Value:</label>
              <span class="value">${expectedValue} ${currencySymbol}</span>
            </div>
          </div>
          <div class="threshold-note">
            ${isProfitable 
              ? 'Essences below this threshold are profitable to reroll' 
              : 'This group is not profitable to reroll'}
          </div>
        </div>
      `;
    }
  });
  
  html += `
      </div>
    </div>
  `;
  
  container.innerHTML = html;
}

/**
 * Handle category change
 * @param {string} category - 'scarabs', 'essences', 'tattoos', 'catalysts', 'temple', 'fossils', 'oils', 'delirium-orbs', 'emblems'
 */
async function handleCategoryChange(category) {
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
  
  // Handle category-specific logic
  if (category === 'essences') {
    try {
      // Show loading state
      const listViewContainer = document.getElementById('list-view');
      if (listViewContainer) {
        showEssenceLoadingState(listViewContainer);
      }
      
      // Load and process Essence data
      const { essences, thresholds, rerollCost } = await loadAndProcessEssenceData();
      
      // Get currency preference
      const preferences = loadPreferences();
      const currency = preferences.currencyPreference || 'chaos';
      
      // Render Essence UI
      await renderEssenceUI(essences, thresholds, rerollCost, currency);
    } catch (error) {
      console.error('Error handling Essence category:', error);
      showErrorToast('Failed to load Essence data');
    }
  } else if (category === 'scarabs') {
    // Reload Scarab UI if we have Scarab data
    if (currentScarabs.length > 0 && currentThreshold) {
      const preferences = loadPreferences();
      const currency = preferences.currencyPreference || 'chaos';
      renderUI(currentScarabs, currentThreshold, currency);
    }
  } else {
    // For other categories, show placeholder
    console.log(`Category changed to: ${category}`);
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
