/**
 * Application Entry Point
 * Flipping Scarabs - Path of Exile vendor profitability calculator
 */

import { loadAndMergeScarabData, loadPreferences, savePreferences, loadAllItemTypePrices, loadFullEssenceData, getPrimalLifeforcePrice, loadAndMergeFossilData, getWildLifeforcePrice, loadAndMergeCatalystData, loadFullFossilData, loadFullOilData, loadAndMergeDeliriumOrbData, loadFullDeliriumOrbData, loadFullEmblemData, loadFullTattooData, loadTempleUpgradeData } from './js/services/dataService.js';
import { calculateThreshold, calculateProfitabilityStatus, calculateCatalystThreshold, calculateCatalystProfitabilityStatus, calculateTattooThreshold, calculateTattooProfitabilityStatus } from './js/services/calculationService.js';
import { calculateExpectedValueForGroup, calculateThresholdForGroup, calculateProfitabilityStatus as calculateEssenceProfitabilityStatus } from './js/services/essenceCalculationService.js';
import { calculateExpectedValueForGroup as calculateFossilExpectedValueForGroup, calculateThresholdForGroup as calculateFossilThresholdForGroup, calculateProfitabilityStatus as calculateFossilProfitabilityStatus } from './js/services/fossilCalculationService.js';
import { calculateExpectedValuesForGroup, calculateThresholdForOrb, calculateProfitabilityStatus as calculateDeliriumOrbProfitabilityStatus } from './js/services/deliriumOrbCalculationService.js';
import { priceUpdateService } from './js/services/priceUpdateService.js';
import { initLeagueService } from './js/services/leagueService.js';
import { Scarab } from './js/models/scarab.js';
import { Catalyst } from './js/models/catalyst.js';
import { Tattoo } from './js/models/tattoo.js';
import { Essence } from './js/models/essence.js';
import { Fossil } from './js/models/fossil.js';
import { DeliriumOrb } from './js/models/deliriumOrb.js';
import { groupEssencesByRerollType, createRerollGroup } from './js/utils/essenceGroupUtils.js';
import { groupFossilsByRerollType, createRerollGroup as createFossilRerollGroup } from './js/utils/fossilGroupUtils.js';
import { groupDeliriumOrbsByRerollType } from './js/utils/deliriumOrbGroupUtils.js';
import { renderEssenceList, showLoadingState as showEssenceLoadingState } from './js/views/essenceListView.js';
import { renderFossilList, showLoadingState as showFossilLoadingState } from './js/views/fossilListView.js';
import { renderTempleUpgradeList } from './js/views/templeUpgradeListView.js';
import { renderThresholdDisplay } from './js/components/thresholdDisplay.js';
import { getProfitabilityColor, getProfitabilityBackgroundColor } from './js/utils/colorUtils.js';
import { renderListView, updateListView, showLoadingState, showErrorState } from './js/views/listView.js';
import { initGridView, updateGridView, setFilteredScarabs, clearFilteredScarabs, teardownGridView } from './js/views/gridView.js';
import { initEssenceGridView, teardownEssenceGridView } from './js/views/essenceGridView.js';
import { initCatalystGridView, teardownCatalystGridView, highlightCellForCatalyst, clearCatalystHighlight } from './js/views/catalystGridView.js';
import { initFossilGridView, teardownFossilGridView } from './js/views/fossilGridView.js';
import { initOilGridView, teardownOilGridView, highlightCellForOil, clearOilHighlight } from './js/views/oilGridView.js';
import { initDeliriumOrbGridView, teardownDeliriumOrbGridView, highlightCellForDeliriumOrb, clearDeliriumOrbHighlight } from './js/views/deliriumOrbGridView.js';
import { initEmblemGridView, teardownEmblemGridView, highlightCellForEmblem, clearEmblemHighlight } from './js/views/emblemGridView.js';
import { ESSENCE_GRID_CONFIG, CATALYSTS_GRID_CONFIG, FOSSILS_GRID_CONFIG, OILS_GRID_CONFIG, DELIRIUM_ORBS_GRID_CONFIG, EMBLEMS_GRID_CONFIG } from './js/config/gridConfig.js';
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
import { initRouter, navigateTo, parseRoute } from './js/services/router.js';
import { handleMissingPriceData, handleMissingDropWeight, sanitizeScarabData } from './js/utils/errorHandler.js';
import { hideTooltip } from './js/utils/tooltip.js';
import { initDataStatusOverlay, setOnRefreshCallback } from './js/components/dataStatusOverlay.js';
import { renderLeagueSelector, setOnLeagueChange } from './js/components/leagueSelector.js';
import { showErrorToast, showWarningToast } from './js/utils/toast.js';
import { setCategory as setSelectionCategory, subscribe as subscribeSelection } from './js/services/selectionState.js';
import { buildCategoryItemNames, loadSusById } from './js/utils/categoryItemNames.js';
import { renderRegexSearchDisplay } from './js/components/regexSearchDisplay.js';
import { renderWelcomePage } from './js/components/welcomePage.js';

// Import debug tools (only in development)
if (import.meta.env.DEV) {
  import('./js/utils/debugCellAnalyzer.js').then(module => {
    console.log('💡 Debug tools available:');
    console.log('   - window.analyzeCells() - Analyze image and detect cell positions');
    console.log('   - window.exportCellConfig(cells) - Export cells as config code');
  });
}

/**
 * Setup hover on list rows to highlight the corresponding grid cell
 * @param {HTMLElement} container - List view container
 * @param {string} itemSelector - CSS selector for list rows (e.g. '.catalyst-list-row')
 * @param {function(string): void} highlightFn - Called with item id on mouseenter
 * @param {function(): void} clearFn - Called on mouseleave
 */
function setupListHoverHighlight(container, itemSelector, highlightFn, clearFn) {
  if (!container) return;
  const items = container.querySelectorAll(`${itemSelector}[data-id]`);
  items.forEach(item => {
    const id = item.getAttribute('data-id');
    if (!id) return;
    item.addEventListener('mouseenter', () => highlightFn(id));
    item.addEventListener('mouseleave', () => clearFn());
  });
}

/**
 * Setup sortable list headers: click toggles/sets sort and calls reRender
 * @param {HTMLElement} container - List view container
 * @param {string} headerSelector - Selector for sortable header cells (e.g. '.catalyst-list-header .sortable')
 * @param {object} currentSort - { field: string, direction: 'asc'|'desc' }
 * @param {function(string): void} setSort - Called with new field; should update sort state (toggle direction if same field)
 * @param {function(): void} reRender - Called after sort change to re-render the list
 */
function setupListSort(container, headerSelector, currentSort, setSort, reRender) {
  if (!container) return;
  const headers = container.querySelectorAll(headerSelector);
  headers.forEach(header => {
    const field = header.getAttribute('data-sort-field');
    if (!field) return;
    header.addEventListener('click', () => {
      if (currentSort.field === field) {
        setSort(field, currentSort.direction === 'asc' ? 'desc' : 'asc');
      } else {
        setSort(field, 'asc');
      }
      reRender();
    });
  });
}

function getListSortIndicator(currentSort, field) {
  if (currentSort.field !== field) return '';
  return currentSort.direction === 'asc' ? ' ↑' : ' ↓';
}

/**
 * Reload scarab data with updated prices
 * @param {Array|null} updatedPrices - Updated price data, or null to reload from service
 */
async function reloadScarabDataWithPrices(updatedPrices) {
  try {
    console.log('Reloading scarab data with updated prices...');
    
    let merged;
    
    // Load details from scarabs.json, weights from poedata.dev MLE, and merge with prices
    merged = await loadAndMergeScarabData(updatedPrices === null ? null : updatedPrices);

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
  // Parse initial route FIRST to determine what loading state to show
  // Don't set currentCategory/currentPage here - let the router set them so categoryChanged is true
  const initialRoute = parseRoute();
  
  // Initialize league service first (required for all data loading)
  try {
    await initLeagueService();
  } catch (error) {
    console.error('Failed to initialize league service:', error);
    showErrorToast('Failed to initialize league service. Please refresh the page.');
    return;
  }
  
  // Load user preferences
  const preferences = loadPreferences();
  currentConfidencePercentile = preferences.confidencePercentile || 0.9;
  currentTradeMode = preferences.tradeMode || 'returnable';
  
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
    // Reload additional item type prices for new league
    if (window.priceData) {
      const additionalItemTypes = ['catalyst', 'deliriumOrb', 'emblem', 'essence', 'fossil', 'lifeforce', 'oil', 'tattoo', 'templeUnique', 'vial'];
      const updatedAdditionalPrices = await loadAllItemTypePrices(additionalItemTypes);
      window.priceData.additional = updatedAdditionalPrices;
      console.log('✓ Additional item type prices refreshed for new league');
    }
    
    // Reload data based on current category
    if (currentCategory === 'essences') {
      // Reload Essence data for new league
      try {
        const { essences, thresholds, rerollCost, allEssences } = await loadAndProcessEssenceData();
        const preferences = loadPreferences();
        const currency = preferences.currencyPreference || 'chaos';
        await renderEssenceUI(essences, thresholds, rerollCost, currency, allEssences);
      } catch (error) {
        console.error('Error reloading Essence data after league change:', error);
        showErrorToast('Failed to reload Essence data for new league');
      }
    } else if (currentCategory === 'fossils') {
      // Reload Fossil data for new league
      try {
        const { fossils, threshold, rerollCost, wildLifeforce } = await loadAndProcessFossilData();
        const preferences = loadPreferences();
        const currency = preferences.currencyPreference || 'chaos';
        await renderFossilUI(fossils, threshold, rerollCost, currency, wildLifeforce);
      } catch (error) {
        console.error('Error reloading Fossil data after league change:', error);
        showErrorToast('Failed to reload Fossil data for new league');
      }
    } else if (currentCategory === 'delirium-orbs') {
      // Reload Delirium Orb data for new league
      try {
        const { deliriumOrbs, rerollCost, primalLifeforce } = await loadAndProcessDeliriumOrbData();
        const preferences = loadPreferences();
        const currency = preferences.currencyPreference || 'chaos';
        await renderDeliriumOrbUI(deliriumOrbs, currency, rerollCost, primalLifeforce);
      } catch (error) {
        console.error('Error reloading Delirium Orb data after league change:', error);
        showErrorToast('Failed to reload Delirium Orb data for new league');
      }
    } else if (currentCategory === 'scarabs') {
      // Reload Scarab data for new league
      await reloadScarabDataWithPrices(null);
    }
    // For other categories, data will be loaded when category is selected
  });

  // Initialize data status overlay
  initDataStatusOverlay();

  // Start automatic price updates
  priceUpdateService.startAutomaticUpdates();
  
  // Handle root route (welcome page) - skip category data loading
  if (initialRoute.category === null || initialRoute.page === null) {
    // Render navigation first
    const navigationContainer = document.getElementById('navigation');
    if (navigationContainer) {
      renderNavigation(
        navigationContainer, 
        null, // null category means home is active
        'flipping',
        (leagueSelectorContainer) => {
          renderLeagueSelector(leagueSelectorContainer);
        }
      );
    }
    
    // Initialize router which will render welcome page
    try {
      initRouter(async (category, page) => {
        try {
          await handleRouteChange(category, page);
        } catch (error) {
          console.error('Error in handleRouteChange:', error);
          showErrorToast('Error loading page. Please refresh.');
        }
      });
    } catch (error) {
      console.error('Error initializing router:', error);
      showErrorToast('Error initializing router. Please refresh the page.');
    }
    
    console.log('Application initialized successfully (welcome page)');
    return; // Exit early for root route - category data will load when navigating
  }
  
  // Show appropriate loading state based on route
  const listViewContainer = document.getElementById('list-view');
  if (listViewContainer) {
    if (initialRoute.category === 'scarabs') {
      showLoadingState(listViewContainer);
    } else if (initialRoute.category === 'essences') {
      showEssenceLoadingState(listViewContainer);
    } else if (initialRoute.category === 'fossils') {
      showFossilLoadingState(listViewContainer);
    } else if (initialRoute.category === 'catalysts') {
      listViewContainer.innerHTML = '<p class="loading-message">Loading Catalysts...</p>';
    } else if (initialRoute.category === 'oils') {
      listViewContainer.innerHTML = '<p class="loading-message">Loading Oils...</p>';
    } else if (initialRoute.category === 'delirium-orbs') {
      listViewContainer.innerHTML = '<p class="loading-message">Loading Delirium Orbs...</p>';
    } else if (initialRoute.category === 'emblems') {
      listViewContainer.innerHTML = '<p class="loading-message">Loading Emblems...</p>';
    } else if (initialRoute.category === 'tattoos') {
      listViewContainer.innerHTML = '<p class="loading-message">Loading Tattoos...</p>';
    } else if (initialRoute.category === 'temple') {
      listViewContainer.innerHTML = '<p class="loading-message">Loading Temple upgrades...</p>';
    }
  }
  
  // Set header visibility based on initial route (but don't set currentCategory/currentPage yet)
  const headerContent = document.querySelector('.header-content');
  if (headerContent) {
    if (initialRoute.category === 'scarabs') {
      headerContent.style.display = '';
    } else {
      headerContent.style.display = 'none';
    }
  }

  try {
    // Initialize league service first
    await initLeagueService();
    
    // Load user preferences
    const preferences = loadPreferences();
    const currency = preferences.currencyPreference || 'chaos';
    currentConfidencePercentile = preferences.confidencePercentile || 0.9;
    currentTradeMode = preferences.tradeMode || 'returnable';

    // Load and merge Scarab data (will use selected league)
    // Load this even if not on scarabs page, as it might be needed later
    if (initialRoute.category === 'scarabs') {
      console.log('Loading Scarab data...');
    }
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

    // Render navigation (use initialRoute for initial render, router will update it)
    const navigationContainer = document.getElementById('navigation');
    if (navigationContainer) {
      renderNavigation(
        navigationContainer, 
        initialRoute.category, 
        initialRoute.page,
        (leagueSelectorContainer) => {
          // Render league selector in navigation bar
          renderLeagueSelector(leagueSelectorContainer);
        }
      );
    }

    // Setup header page buttons
    setupHeaderPageButtons();

    // Initialize simulation panel (data only, will render when page is shown)
    initSimulationPanel(scarabs, threshold);
    
    // Only render scarabs UI if route is scarabs, otherwise router will handle it
    if (initialRoute.category === 'scarabs') {
      renderUI(scarabs, threshold, currency);
    }

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
  
  // Initialize router after all setup is complete
  // This will handle the initial route and set up hashchange listeners
  try {
    initRouter(async (category, page) => {
      try {
        await handleRouteChange(category, page);
      } catch (error) {
        console.error('Error in handleRouteChange:', error);
        // Show error toast but don't block initialization
        showErrorToast('Error loading category data. Please refresh the page.');
      }
    });
  } catch (error) {
    console.error('Error initializing router:', error);
    showErrorToast('Error initializing router. Please refresh the page.');
  }
}

// Global state
let currentScarabs = [];
let currentThreshold = null;
let currentEssences = [];
let currentEssenceThresholds = new Map(); // Map of reroll group to threshold
let currentFossils = [];
let currentFossilThreshold = null; // Single threshold for all Fossils (single reroll group)
let currentCatalysts = [];
let currentOils = [];
let currentDeliriumOrbs = [];
let currentEmblems = [];
let currentTattoos = [];
let currentCatalystSort = { field: 'name', direction: 'asc' };
let currentOilSort = { field: 'name', direction: 'asc' };
let currentDeliriumOrbSort = { field: 'name', direction: 'asc' };
let currentEmblemSort = { field: 'name', direction: 'asc' };
let currentTattooSort = { field: 'name', direction: 'asc' };
let currentCurrency = 'chaos';
let currentView = 'list';
let currentFilters = null;
let currentPage = 'flipping'; // 'flipping' or 'simulation'
let currentCategory = 'scarabs'; // 'scarabs', 'essences', 'tattoos', 'catalysts', 'temple', 'fossils', 'oils', 'delirium-orbs', 'emblems'
let currentConfidencePercentile = 0.9; // Default 90% confidence
let currentTradeMode = 'returnable'; // Default trade mode: 'returnable', 'lowest_value', or 'optimal_combination'
let selectionSubscriptionActive = false;
let selectionUnsubscribeFn = null; // Store unsubscribe function for selection subscription
/** Cache SUS data by category: { susById, groups } for regex builder */
const susCacheByCategory = new Map();

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

  // Clear list view container first to remove any previous category's content
  const listViewContainer = document.getElementById('list-view');
  if (listViewContainer) {
    listViewContainer.innerHTML = '';
  }

  // Show grid view and filter panel for Scarabs
  const gridViewContainer = document.getElementById('grid-view');
  if (gridViewContainer) {
    gridViewContainer.style.display = '';
  }
  
  const filterPanelContainer = document.getElementById('filter-panel');
  if (filterPanelContainer) {
    filterPanelContainer.style.display = '';
  }
  
  // Clear canvas before re-initializing to remove any previous category's grid
  const canvas = document.getElementById('scarab-grid-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
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
  try {
    renderCurrentView().catch(error => {
      console.error('Error rendering current view:', error);
      // Clear loading state even if there's an error
      const listViewContainer = document.getElementById('list-view');
      if (listViewContainer) {
        showErrorState(listViewContainer, 'Error rendering view. Please refresh the page.');
      }
    });
  } catch (error) {
    console.error('Error calling renderCurrentView:', error);
    // Clear loading state even if there's an error
    const listViewContainer = document.getElementById('list-view');
    if (listViewContainer) {
      showErrorState(listViewContainer, 'Error rendering view. Please refresh the page.');
    }
  }
}

/**
 * Clear and hide the regex search display (used when switching away from scarabs)
 */
function clearRegexDisplay() {
  const regexSearchContainer = document.getElementById('regex-search-display');
  if (regexSearchContainer) {
    regexSearchContainer.style.display = 'none';
    regexSearchContainer.innerHTML = '';
  }
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

  // Regex search: for scarabs, set selection category and show regex display (use SUS tokens when available)
  const regexSearchContainer = document.getElementById('regex-search-display');
  if (currentCategory === 'scarabs' && currentScarabs.length > 0) {
    // Preserve existing selections when switching back to scarabs (don't clear)
    setSelectionCategory('scarabs', false);
    if (regexSearchContainer) {
      regexSearchContainer.style.display = 'block';
      let susData = susCacheByCategory.get('scarabs');
      if (susData === undefined) {
        susData = await loadSusById('scarabs');
        susCacheByCategory.set('scarabs', susData);
      }
      const categoryNames = buildCategoryItemNames(
        'scarabs',
        currentScarabs,
        susData.susById,
        susData.groups
      );
      categoryNames.profitableIds = currentScarabs
        .filter(s => s.profitabilityStatus === 'profitable')
        .map(s => s.id);
      renderRegexSearchDisplay(regexSearchContainer, categoryNames);
    }
    if (!selectionSubscriptionActive) {
      selectionUnsubscribeFn = subscribeSelection(() => {
        // Only render scarab view if we're still on the scarabs category
        if (currentCategory === 'scarabs') {
          renderCurrentView();
        }
      });
      selectionSubscriptionActive = true;
    }
  } else {
    // Unsubscribe from selection changes when not on scarabs category
    if (selectionUnsubscribeFn) {
      selectionUnsubscribeFn();
      selectionUnsubscribeFn = null;
      selectionSubscriptionActive = false;
    }
    // Clear regex display when not on scarabs category
    clearRegexDisplay();
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
    try {
      // Tear down all grid views (including scarab grid) before re-initializing
      teardownGridView(canvas);
      teardownEssenceGridView(canvas);
      teardownCatalystGridView(canvas);
      teardownFossilGridView(canvas);
      teardownOilGridView(canvas);
      teardownDeliriumOrbGridView(canvas);
      teardownEmblemGridView(canvas);
      await initGridView(canvas, currentScarabs, '/assets/images/stashTabs/scarab-tab.png');
      
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
async function handleCurrencyChange(currency) {
  currentCurrency = currency;
  saveCurrencyPreference(currency);
  
  // Handle Essence category
  if (currentCategory === 'essences') {
    // Hide/show selection panels
    const essenceSelectionPanel = document.getElementById('essence-selection-panel');
    const fossilSelectionPanel = document.getElementById('fossil-selection-panel');
    if (essenceSelectionPanel) {
      essenceSelectionPanel.style.display = '';
    }
    if (fossilSelectionPanel) {
      fossilSelectionPanel.style.display = 'none';
    }
    
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
  
  // Handle Fossil category
  if (currentCategory === 'fossils') {
    // Hide/show selection panels
    const essenceSelectionPanel = document.getElementById('essence-selection-panel');
    const fossilSelectionPanel = document.getElementById('fossil-selection-panel');
    if (essenceSelectionPanel) {
      essenceSelectionPanel.style.display = 'none';
    }
    if (fossilSelectionPanel) {
      fossilSelectionPanel.style.display = '';
    }
    
    // Update Fossil threshold display
    const thresholdContainer = document.getElementById('threshold-display');
    if (thresholdContainer && currentFossilThreshold) {
      const rerollCost = currentFossilThreshold.rerollCost;
      // Use stored wildLifeforce price from threshold data if available
      const wildLifeforce = currentFossilThreshold.wildLifeforcePrice ? {
        chaosValue: currentFossilThreshold.wildLifeforcePrice
      } : null;
      renderFossilThresholdDisplay(thresholdContainer, currentFossilThreshold, rerollCost, currency, wildLifeforce);
    }
    
    // Update Fossil list view
    const listViewContainer = document.getElementById('list-view');
    if (listViewContainer && currentFossils.length > 0) {
      const selectionPanelContainer = document.getElementById('fossil-selection-panel');
      renderFossilList(listViewContainer, currentFossils, currency, selectionPanelContainer);
    }
    return;
  }
  
  // Handle Catalyst category (re-render list with new currency)
  if (currentCategory === 'catalysts') {
    const listViewContainer = document.getElementById('list-view');
    if (listViewContainer && currentCatalysts.length > 0) {
      renderCatalystList(listViewContainer);
    }
    return;
  }

  // Handle Oil category (re-render list with new currency)
  if (currentCategory === 'oils') {
    const listViewContainer = document.getElementById('list-view');
    if (listViewContainer && currentOils.length > 0) {
      renderOilList(listViewContainer);
    }
    return;
  }

  if (currentCategory === 'delirium-orbs' && currentDeliriumOrbs.length > 0) {
    // Reload Delirium Orb data to recalculate with new currency
    try {
      const { deliriumOrbs, rerollCost, primalLifeforce } = await loadAndProcessDeliriumOrbData();
      await renderDeliriumOrbUI(deliriumOrbs, currency, rerollCost, primalLifeforce);
    } catch (error) {
      console.error('Error reloading Delirium Orb data:', error);
    }
    return;
  }

  if (currentCategory === 'emblems' && currentEmblems.length > 0) {
    const listViewContainer = document.getElementById('list-view');
    if (listViewContainer) {
      renderEmblemList(listViewContainer);
    }
    return;
  }

  if (currentCategory === 'tattoos' && currentTattoos.length > 0) {
    const listViewContainer = document.getElementById('list-view');
    if (listViewContainer) renderTattooList(listViewContainer);
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
    
    // Load full Essence list from essences.json merged with prices (so grid can show every essence in correct slot)
    const rawEssenceData = await loadFullEssenceData();
    
    // Load Primal Crystallised Lifeforce price
    const primalLifeforce = await getPrimalLifeforcePrice();
    if (!primalLifeforce || !primalLifeforce.chaosValue) {
      console.error('Primal Crystallised Lifeforce price not available');
      showErrorToast('Cannot calculate Essence thresholds: Primal Crystallised Lifeforce price unavailable');
      return;
    }
    
    const rerollCost = 30 * primalLifeforce.chaosValue;
    console.log(`Reroll cost: ${rerollCost.toFixed(2)} chaos (30 × ${primalLifeforce.chaosValue.toFixed(4)})`);
    
    // Grid: every item from the details file is displayed. Price never gates display.
    const allEssences = rawEssenceData.map(data => new Essence(data));
    console.log(`Loaded ${allEssences.length} Essences for grid (all from details file)`);
    
    // Validation and price only affect calculation and cell color, not whether an item is shown
    const validEssences = allEssences.filter(essence => {
      if (!essence.validate()) {
        console.warn(`Essence excluded from threshold calculation: ${essence.id}`);
        return false;
      }
      return true;
    });
    
    // Group by reroll type and calculate thresholds (only for valid essences; price drives calculation)
    const groupsByType = groupEssencesByRerollType(validEssences);
    console.log(`Grouped into ${groupsByType.size} reroll groups for calculation`);
    
    const thresholds = new Map();
    
    groupsByType.forEach((groupEssences, groupType) => {
      const expectedValue = calculateExpectedValueForGroup(groupEssences);
      const threshold = calculateThresholdForGroup(expectedValue, rerollCost);
      
      thresholds.set(groupType, {
        rerollGroup: groupType,
        value: threshold,
        expectedValue: expectedValue,
        rerollCost: rerollCost,
        calculationMethod: 'mle_weighted',
        essenceCount: groupEssences.length,
        calculatedAt: new Date().toISOString()
      });
      
      groupEssences.forEach(essence => {
        essence.expectedValue = expectedValue;
        essence.threshold = threshold;
        essence.profitabilityStatus = calculateEssenceProfitabilityStatus(essence, threshold);
      });
      
      console.log(`${groupType} group: expectedValue=${expectedValue.toFixed(2)}, threshold=${threshold.toFixed(2)}, essences=${groupEssences.length}`);
    });
    
    // Set profitability status for all essences: calculated for groups, 'unknown' for others (determines cell color only)
    allEssences.forEach(essence => {
      if (!essence.hasRerollGroup()) {
        essence.profitabilityStatus = 'unknown';
      }
    });
    
    // List view: only essences with valid reroll groups
    const validRerollGroups = ['special', 'deafening', 'shrieking'];
    const filteredEssences = validEssences.filter(essence =>
      essence.rerollGroup && validRerollGroups.includes(essence.rerollGroup)
    );
    
    const profitableCount = filteredEssences.filter(e => e.profitabilityStatus === 'profitable').length;
    const notProfitableCount = filteredEssences.filter(e => e.profitabilityStatus === 'not_profitable').length;
    const unknownCount = filteredEssences.filter(e => e.profitabilityStatus === 'unknown').length;
    
    console.log(`Essence profitability breakdown: ${profitableCount} profitable, ${notProfitableCount} not profitable, ${unknownCount} unknown`);
    console.log(`List view: ${filteredEssences.length} Essences (grid shows all ${allEssences.length})`);
    
    currentEssences = filteredEssences;
    currentEssenceThresholds = thresholds;
    
    // Grid always gets every essence from the details file; price only affects cell color
    return { essences: filteredEssences, thresholds, rerollCost, allEssences };
  } catch (error) {
    console.error('Error loading Essence data:', error);
    showErrorToast('Failed to load Essence data');
    throw error;
  }
}

/**
 * Render Essence UI
 * @param {Array} essences - Filtered essences for list/threshold (deafening, shrieking, special)
 * @param {Map} thresholds - Threshold data
 * @param {number} rerollCost - Reroll cost
 * @param {string} currency - Currency preference
 * @param {Array} [allEssences] - All essences for grid (all tiers); if omitted, uses essences
 */
async function renderEssenceUI(essences, thresholds, rerollCost, currency, allEssences = null) {
  // Store in global state
  currentEssences = essences;
  currentEssenceThresholds = thresholds;
  currentCurrency = currency;
  
  // Clear regex display (only for scarabs)
  clearRegexDisplay();
  
  // Load selection state from LocalStorage (if available)
  const { loadSelectionState } = await import('./js/views/essenceListView.js');
  loadSelectionState(essences);
  
  // Render Essence list view
  const listViewContainer = document.getElementById('list-view');
  const selectionPanelContainer = document.getElementById('essence-selection-panel');
  if (listViewContainer) {
    renderEssenceList(listViewContainer, essences, currency, selectionPanelContainer);
  }
  
  // Show grid view for Essences (use all essences so every slot shows the correct essence in the right position)
  const gridViewContainer = document.getElementById('grid-view');
  const gridCanvas = document.getElementById('scarab-grid-canvas');
  if (gridViewContainer) {
    gridViewContainer.style.display = 'block';
  }
  if (gridCanvas) {
    try {
      teardownGridView(gridCanvas);
      teardownCatalystGridView(gridCanvas);
      teardownFossilGridView(gridCanvas);
      teardownOilGridView(gridCanvas);
      teardownDeliriumOrbGridView(gridCanvas);
      teardownEmblemGridView(gridCanvas);
      const gridEssences = allEssences && allEssences.length > 0 ? allEssences : essences;
      await initEssenceGridView(gridCanvas, gridEssences, ESSENCE_GRID_CONFIG.tabImagePath);
      const listWrapper = document.querySelector('.list-wrapper');
      if (listWrapper && gridCanvas.offsetHeight > 0) {
        listWrapper.style.height = `${gridCanvas.offsetHeight}px`;
      }
    } catch (err) {
      console.error('Error initializing essence grid view:', err);
    }
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
              ? 'Essences below this threshold should be rerolled' 
              : 'This group should be kept (not rerolled)'}
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
 * Load and process Fossil data
 */
async function loadAndProcessFossilData() {
  try {
    console.log('Loading Fossil data...');
    
    // Load Fossil prices
    const rawFossilData = await loadAndMergeFossilData();
    
    // Load Wild Crystallised Lifeforce price
    const wildLifeforce = await getWildLifeforcePrice();
    if (!wildLifeforce || !wildLifeforce.chaosValue) {
      console.error('Wild Crystallised Lifeforce price not available');
      showErrorToast('Cannot calculate Fossil thresholds: Wild Crystallised Lifeforce price unavailable');
      return;
    }
    
    const rerollCost = 30 * wildLifeforce.chaosValue;
    console.log(`Reroll cost: ${rerollCost.toFixed(2)} chaos (30 × ${wildLifeforce.chaosValue.toFixed(4)})`);
    
    // Create Fossil instances (classification happens in constructor)
    const fossils = rawFossilData
      .map(data => new Fossil(data))
      .filter(fossil => {
        if (!fossil.validate()) {
          console.warn(`Invalid Fossil data: ${fossil.id}`);
          return false;
        }
        return true;
      });
    
    console.log(`Loaded ${fossils.length} Fossils`);
    
    // Group Fossils by reroll type (all belong to 'fossil' group)
    const groupsByType = groupFossilsByRerollType(fossils);
    console.log(`Grouped into ${groupsByType.size} reroll groups`);
    
    // Calculate threshold for the single Fossil group
    const fossilGroup = groupsByType.get('fossil');
    if (!fossilGroup || fossilGroup.length === 0) {
      console.error('No Fossils found in reroll group');
      showErrorToast('No valid Fossils found');
      return;
    }
    
    // Calculate expected value (weighted by drop probability when MLE weights available)
    const { expectedValue, method } = calculateFossilExpectedValueForGroup(fossilGroup);
    
    // Calculate threshold
    const threshold = calculateFossilThresholdForGroup(expectedValue, rerollCost);
    
    // Store threshold
    const calculationMethod = method === 'weighted' ? 'weighted_average' : 'equal_weighted_average';
    const thresholdData = {
      rerollGroup: 'fossil',
      value: threshold,
      expectedValue: expectedValue,
      rerollCost: rerollCost,
      calculationMethod,
      fossilCount: fossilGroup.length,
      calculatedAt: new Date().toISOString(),
      wildLifeforcePrice: wildLifeforce.chaosValue
    };
    
    // Calculate profitability status for each Fossil
    fossilGroup.forEach(fossil => {
      fossil.expectedValue = expectedValue;
      fossil.threshold = threshold;
      fossil.profitabilityStatus = calculateFossilProfitabilityStatus(fossil, threshold);
    });
    
    console.log(`Fossil group: expectedValue=${expectedValue.toFixed(2)}, threshold=${threshold.toFixed(2)}, fossils=${fossilGroup.length}`);
    
    // Handle Fossils without reroll groups
    fossils.forEach(fossil => {
      if (!fossil.hasRerollGroup()) {
        fossil.profitabilityStatus = 'unknown';
        console.warn(`Fossil without reroll group: ${fossil.name}`);
      }
    });
    
    // Filter to only include Fossils with valid reroll group (fossil)
    const filteredFossils = fossils.filter(fossil => {
      return fossil.rerollGroup === 'fossil';
    });
    
    // Count profitability statuses (from filtered Fossils)
    const profitableCount = filteredFossils.filter(f => f.profitabilityStatus === 'profitable').length;
    const notProfitableCount = filteredFossils.filter(f => f.profitabilityStatus === 'not_profitable').length;
    const unknownCount = filteredFossils.filter(f => f.profitabilityStatus === 'unknown').length;
    
    console.log(`Fossil profitability breakdown: ${profitableCount} profitable, ${notProfitableCount} not profitable, ${unknownCount} unknown`);
    console.log(`Filtered to ${filteredFossils.length} Fossils (from ${fossils.length} total)`);
    
    // Store in global state (store filtered Fossils)
    currentFossils = filteredFossils;
    currentFossilThreshold = thresholdData;
    
    return { fossils: filteredFossils, threshold: thresholdData, rerollCost, wildLifeforce };
  } catch (error) {
    console.error('Error loading Fossil data:', error);
    showErrorToast('Failed to load Fossil data');
    throw error;
  }
}

/**
 * Load and process Delirium Orb data
 */
async function loadAndProcessDeliriumOrbData() {
  try {
    console.log('Loading Delirium Orb data...');
    
    // Load Delirium Orb prices and weights
    const rawDeliriumOrbData = await loadAndMergeDeliriumOrbData();
    
    // Load Primal Lifeforce price
    const primalLifeforce = await getPrimalLifeforcePrice();
    if (!primalLifeforce || !primalLifeforce.chaosValue) {
      console.error('Primal Lifeforce price not available');
      showErrorToast('Cannot calculate Delirium Orb thresholds: Primal Lifeforce price unavailable');
      return;
    }
    
    const rerollCost = 30 * primalLifeforce.chaosValue;
    console.log(`Reroll cost: ${rerollCost.toFixed(2)} chaos (30 × ${primalLifeforce.chaosValue.toFixed(4)})`);
    
    // Create Delirium Orb instances (classification happens in constructor)
    const deliriumOrbs = rawDeliriumOrbData
      .map(data => new DeliriumOrb(data))
      .filter(orb => {
        if (!orb.validate()) {
          console.warn(`Invalid Delirium Orb data: ${orb.id}`);
          return false;
        }
        return true;
      });
    
    console.log(`Loaded ${deliriumOrbs.length} Delirium Orbs`);
    
    // Group Delirium Orbs by reroll type (all belong to 'delirium-orb' group)
    const groupsByType = groupDeliriumOrbsByRerollType(deliriumOrbs);
    console.log(`Grouped into ${groupsByType.size} reroll groups`);
    
    // Calculate threshold for the single Delirium Orb group
    const orbGroup = groupsByType.get('delirium-orb');
    if (!orbGroup || orbGroup.length === 0) {
      console.error('No Delirium Orbs found in reroll group');
      showErrorToast('No valid Delirium Orbs found');
      return;
    }
    
    // Calculate expected values for each orb (excluding the orb itself from its calculation)
    const expectedValuesByOrbId = calculateExpectedValuesForGroup(orbGroup);
    
    // Calculate threshold and profitability status for each orb
    orbGroup.forEach(orb => {
      const expectedValueData = expectedValuesByOrbId.get(orb.id);
      const expectedValue = expectedValueData?.expectedValue ?? 0;
      const threshold = calculateThresholdForOrb(expectedValue, rerollCost);
      
      orb.expectedValue = expectedValue;
      orb.threshold = threshold;
      orb.profitabilityStatus = calculateDeliriumOrbProfitabilityStatus(orb, threshold);
    });
    
    console.log(`Delirium Orb group: ${orbGroup.length} orbs processed`);
    
    // Handle Delirium Orbs without reroll groups
    deliriumOrbs.forEach(orb => {
      if (!orb.hasRerollGroup()) {
        orb.profitabilityStatus = 'unknown';
        console.warn(`Delirium Orb without reroll group: ${orb.name}`);
      }
    });
    
    // Filter to only include Delirium Orbs with valid reroll group (delirium-orb)
    const filteredOrbs = deliriumOrbs.filter(orb => {
      return orb.rerollGroup === 'delirium-orb';
    });
    
    // Count profitability statuses (from filtered Orbs)
    const profitableCount = filteredOrbs.filter(o => o.profitabilityStatus === 'profitable').length;
    const notProfitableCount = filteredOrbs.filter(o => o.profitabilityStatus === 'not_profitable').length;
    const unknownCount = filteredOrbs.filter(o => o.profitabilityStatus === 'unknown').length;
    
    console.log(`Delirium Orb profitability breakdown: ${profitableCount} profitable, ${notProfitableCount} not profitable, ${unknownCount} unknown`);
    console.log(`Filtered to ${filteredOrbs.length} Delirium Orbs (from ${deliriumOrbs.length} total)`);
    
    // Store in global state (store filtered Orbs)
    currentDeliriumOrbs = filteredOrbs;
    
    return { deliriumOrbs: filteredOrbs, rerollCost, primalLifeforce, expectedValuesByOrbId };
  } catch (error) {
    console.error('Error loading Delirium Orb data:', error);
    showErrorToast('Failed to load Delirium Orb data');
    throw error;
  }
}

/**
 * Render Fossil UI
 * @param {Array} fossils - Fossil instances for list/threshold
 * @param {Object} threshold - Threshold data
 * @param {number} rerollCost - Reroll cost
 * @param {string} currency - Currency preference
 * @param {Object} [wildLifeforce] - Wild lifeforce price
 * @param {Array<Object>} [gridFossils] - Full fossil data for grid (details + weights + prices); when provided, grid is shown
 */
async function renderFossilUI(fossils, threshold, rerollCost, currency, wildLifeforce, gridFossils = null) {
  // Store in global state
  currentFossils = fossils;
  currentFossilThreshold = threshold;
  currentCurrency = currency;
  
  // Clear regex display (only for scarabs)
  clearRegexDisplay();
  
  // Load selection state from LocalStorage (if available)
  const { loadSelectionState } = await import('./js/views/fossilListView.js');
  loadSelectionState(fossils);
  
  // Hide/show selection panels based on category
  const essenceSelectionPanel = document.getElementById('essence-selection-panel');
  const fossilSelectionPanel = document.getElementById('fossil-selection-panel');
  if (essenceSelectionPanel) {
    essenceSelectionPanel.style.display = 'none';
  }
  if (fossilSelectionPanel) {
    fossilSelectionPanel.style.display = '';
  }
  
  // Render Fossil list view
  const listViewContainer = document.getElementById('list-view');
  if (listViewContainer) {
    renderFossilList(listViewContainer, fossils, currency, fossilSelectionPanel);
  }
  
  const gridViewContainer = document.getElementById('grid-view');
  const gridCanvas = document.getElementById('scarab-grid-canvas');
  if (gridFossils && gridFossils.length > 0 && gridViewContainer && gridCanvas) {
    gridViewContainer.style.display = 'block';
    try {
      // Enrich grid fossils with profitability status (reroll indicator) using current threshold
      const thresholdValue = threshold?.value;
      gridFossils.forEach((fossil) => {
        const hasPrice = fossil.chaosValue != null && !isNaN(fossil.chaosValue) && fossil.chaosValue >= 0;
        if (!hasPrice || thresholdValue == null || isNaN(thresholdValue)) {
          fossil.profitabilityStatus = 'unknown';
        } else {
          fossil.profitabilityStatus = fossil.chaosValue < thresholdValue ? 'profitable' : 'not_profitable';
        }
      });

      teardownGridView(gridCanvas);
      teardownEssenceGridView(gridCanvas);
      teardownCatalystGridView(gridCanvas);
      teardownOilGridView(gridCanvas);
      teardownDeliriumOrbGridView(gridCanvas);
      teardownEmblemGridView(gridCanvas);
      await initFossilGridView(gridCanvas, gridFossils, FOSSILS_GRID_CONFIG.tabImagePath);
      const listWrapper = document.querySelector('.list-wrapper');
      if (listWrapper && gridCanvas.offsetHeight > 0) {
        listWrapper.style.height = `${gridCanvas.offsetHeight}px`;
      }
    } catch (err) {
      console.error('Error initializing fossil grid view:', err);
    }
  } else if (gridViewContainer) {
    gridViewContainer.style.display = 'none';
  }
  
  const filterPanelContainer = document.getElementById('filter-panel');
  if (filterPanelContainer) {
    filterPanelContainer.style.display = 'none';
  }
  
  // Update threshold display to show Fossil threshold
  const thresholdContainer = document.getElementById('threshold-display');
  if (thresholdContainer) {
    renderFossilThresholdDisplay(thresholdContainer, threshold, rerollCost, currency, wildLifeforce);
  }
}

/**
 * Render Fossil threshold display
 * @param {HTMLElement} container - Container element
 * @param {object} threshold - Threshold data object
 * @param {number} rerollCost - Total reroll cost
 * @param {string} currency - 'chaos' or 'divine'
 * @param {object|null} wildLifeforce - Wild Crystallised Lifeforce price object
 */
function renderFossilThresholdDisplay(container, threshold, rerollCost, currency, wildLifeforce = null) {
  if (!container || !threshold) {
    return;
  }
  
  const currencySymbol = currency === 'divine' ? 'Div' : 'c';
  const value = currency === 'divine' 
    ? (threshold.value / 150).toFixed(4)
    : threshold.value.toFixed(2);
  const expectedValue = currency === 'divine'
    ? (threshold.expectedValue / 150).toFixed(4)
    : threshold.expectedValue.toFixed(2);
  const costDisplay = currency === 'divine'
    ? (rerollCost / 150).toFixed(4)
    : rerollCost.toFixed(2);
  
  // Calculate Wild Crystallised Lifeforce price display
  let wildLifeforcePriceDisplay = '';
  if (wildLifeforce && wildLifeforce.chaosValue) {
    const wildPrice = currency === 'divine'
      ? (wildLifeforce.chaosValue / 150).toFixed(4)
      : wildLifeforce.chaosValue.toFixed(4);
    wildLifeforcePriceDisplay = `
      <div class="calculation-breakdown">
        <div class="breakdown-item">
          <span class="breakdown-label">Wild Crystallised Lifeforce price:</span>
          <span class="breakdown-value">${wildPrice} ${currencySymbol}</span>
        </div>
        <div class="breakdown-item">
          <span class="breakdown-label">Reroll cost (30 × price):</span>
          <span class="breakdown-value">30 × ${wildPrice} ${currencySymbol} = ${costDisplay} ${currencySymbol}</span>
        </div>
      </div>
    `;
  } else if (threshold.wildLifeforcePrice) {
    // Fallback to stored price if available
    const wildPrice = currency === 'divine'
      ? (threshold.wildLifeforcePrice / 150).toFixed(4)
      : threshold.wildLifeforcePrice.toFixed(4);
    wildLifeforcePriceDisplay = `
      <div class="calculation-breakdown">
        <div class="breakdown-item">
          <span class="breakdown-label">Wild Crystallised Lifeforce price:</span>
          <span class="breakdown-value">${wildPrice} ${currencySymbol}</span>
        </div>
        <div class="breakdown-item">
          <span class="breakdown-label">Reroll cost (30 × price):</span>
          <span class="breakdown-value">30 × ${wildPrice} ${currencySymbol} = ${costDisplay} ${currencySymbol}</span>
        </div>
      </div>
    `;
  }
  
  const isProfitable = threshold.value > 0;
  const statusClass = isProfitable ? 'profitable' : 'not-profitable';
  
  const html = `
    <div class="fossil-threshold-display">
      <div class="threshold-header">
        <h2>Fossil Reroll Threshold</h2>
        <div class="reroll-cost">
          <strong>Reroll Cost:</strong> 30 Wild Crystallised Lifeforce = ${costDisplay} ${currencySymbol}
        </div>
      </div>
      <div class="threshold-group ${statusClass}">
        <div class="group-header">
          <h3>Fossil Group</h3>
          <span class="fossil-count">${threshold.fossilCount} Fossils</span>
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
        <div class="calculation-details">
          <div class="calculation-method">
            <strong>Calculation Method:</strong> ${threshold.calculationMethod === 'weighted_average' ? 'Drop-weight (probability) weighted average' : 'Equal-weighted average'}
          </div>
          <div class="calculation-formula">
            <strong>Formula:</strong> Expected Value - Reroll Cost = Threshold
          </div>
          <div class="calculation-steps">
            <div class="formula-step">
              <span class="step-label">Step 1:</span>
              <span class="step-value">Expected Value = ${threshold.calculationMethod === 'weighted_average' ? 'Sum of (drop weight × price) / total weight' : `Average of all ${threshold.fossilCount} Fossil prices`} = ${expectedValue} ${currencySymbol}</span>
            </div>
            <div class="formula-step">
              <span class="step-label">Step 2:</span>
              <span class="step-value">Reroll Cost = 30 × Wild Crystallised Lifeforce = ${costDisplay} ${currencySymbol}</span>
            </div>
            <div class="formula-step">
              <span class="step-label">Step 3:</span>
              <span class="step-value">Threshold = ${expectedValue} ${currencySymbol} - ${costDisplay} ${currencySymbol} = ${value} ${currencySymbol}</span>
            </div>
          </div>
          ${wildLifeforcePriceDisplay}
        </div>
        <div class="threshold-note">
          ${isProfitable 
            ? 'Fossils below this threshold should be rerolled' 
            : 'Fossils should be kept (not rerolled)'}
        </div>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
}

function sortCatalysts(catalysts, sort, currency) {
  return [...catalysts].sort((a, b) => {
    let aVal, bVal;
    if (sort.field === 'name') {
      aVal = (a.name || '').toLowerCase();
      bVal = (b.name || '').toLowerCase();
      return sort.direction === 'asc' ? (aVal < bVal ? -1 : aVal > bVal ? 1 : 0) : (aVal > bVal ? -1 : aVal < bVal ? 1 : 0);
    }
    if (sort.field === 'weight') {
      aVal = a.dropWeight != null ? a.dropWeight : -1;
      bVal = b.dropWeight != null ? b.dropWeight : -1;
    } else {
      aVal = currency === 'divine' ? (a.divineValue ?? -Infinity) : (a.chaosValue ?? -Infinity);
      bVal = currency === 'divine' ? (b.divineValue ?? -Infinity) : (b.chaosValue ?? -Infinity);
    }
    if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
    return 0;
  });
}

function sortOils(oils, sort, currency) {
  return [...oils].sort((a, b) => {
    let aVal, bVal;
    if (sort.field === 'name') {
      aVal = (a.name || '').toLowerCase();
      bVal = (b.name || '').toLowerCase();
      return sort.direction === 'asc' ? (aVal < bVal ? -1 : aVal > bVal ? 1 : 0) : (aVal > bVal ? -1 : aVal < bVal ? 1 : 0);
    }
    if (sort.field === 'dropWeight') {
      aVal = a.dropWeight != null ? a.dropWeight : Infinity;
      bVal = b.dropWeight != null ? b.dropWeight : Infinity;
    } else {
      aVal = currency === 'divine' ? (a.divineValue ?? -Infinity) : (a.chaosValue ?? -Infinity);
      bVal = currency === 'divine' ? (b.divineValue ?? -Infinity) : (b.chaosValue ?? -Infinity);
    }
    if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
    return 0;
  });
}

function sortDeliriumOrbs(items, sort, currency) {
  return [...items].sort((a, b) => {
    let aVal, bVal;
    if (sort.field === 'name') {
      aVal = (a.name || '').toLowerCase();
      bVal = (b.name || '').toLowerCase();
      return sort.direction === 'asc' ? (aVal < bVal ? -1 : aVal > bVal ? 1 : 0) : (aVal > bVal ? -1 : aVal < bVal ? 1 : 0);
    }
    if (sort.field === 'dropWeight') {
      aVal = a.dropWeight != null ? a.dropWeight : Infinity;
      bVal = b.dropWeight != null ? b.dropWeight : Infinity;
    } else {
      aVal = currency === 'divine' ? (a.divineValue ?? -Infinity) : (a.chaosValue ?? -Infinity);
      bVal = currency === 'divine' ? (b.divineValue ?? -Infinity) : (b.chaosValue ?? -Infinity);
    }
    if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
    return 0;
  });
}

function sortEmblems(items, sort, currency) {
  return [...items].sort((a, b) => {
    let aVal, bVal;
    if (sort.field === 'name') {
      aVal = (a.name || '').toLowerCase();
      bVal = (b.name || '').toLowerCase();
      return sort.direction === 'asc' ? (aVal < bVal ? -1 : aVal > bVal ? 1 : 0) : (aVal > bVal ? -1 : aVal < bVal ? 1 : 0);
    }
    if (sort.field === 'dropWeight') {
      aVal = a.dropWeight != null ? a.dropWeight : Infinity;
      bVal = b.dropWeight != null ? b.dropWeight : Infinity;
    } else {
      aVal = currency === 'divine' ? (a.divineValue ?? -Infinity) : (a.chaosValue ?? -Infinity);
      bVal = currency === 'divine' ? (b.divineValue ?? -Infinity) : (b.chaosValue ?? -Infinity);
    }
    if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
    return 0;
  });
}

function sortTattoos(items, sort, currency) {
  return [...items].sort((a, b) => {
    let aVal, bVal;
    if (sort.field === 'name') {
      aVal = (a.name || '').toLowerCase();
      bVal = (b.name || '').toLowerCase();
      return sort.direction === 'asc' ? (aVal < bVal ? -1 : aVal > bVal ? 1 : 0) : (aVal > bVal ? -1 : aVal < bVal ? 1 : 0);
    }
    if (sort.field === 'dropWeight') {
      aVal = a.dropWeight != null ? a.dropWeight : Infinity;
      bVal = b.dropWeight != null ? b.dropWeight : Infinity;
    } else {
      aVal = currency === 'divine' ? (a.divineValue ?? -Infinity) : (a.chaosValue ?? -Infinity);
      bVal = currency === 'divine' ? (b.divineValue ?? -Infinity) : (b.chaosValue ?? -Infinity);
    }
    if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
    return 0;
  });
}

function renderCatalystList(container) {
  if (!container || currentCatalysts.length === 0) return;
  const currency = currentCurrency;
  const currencySymbol = currency === 'divine' ? 'Div' : 'c';
  const sorted = sortCatalysts(currentCatalysts, currentCatalystSort, currency);
  const rows = sorted.map((c) => {
    const value = currency === 'divine' ? (c.divineValue != null ? c.divineValue.toFixed(4) : '—') : (c.chaosValue != null ? c.chaosValue.toFixed(2) : '—');
    const weightStr = c.dropWeight != null ? (c.dropWeight * 100).toFixed(2) + '%' : '—';
    const status = c.profitabilityStatus || 'unknown';
    const color = getProfitabilityColor(status);
    const bgColor = getProfitabilityBackgroundColor(status);
    const imagePath = `/assets/images/catalysts/${c.id}.png`;
    return `<div class="catalyst-list-row" data-id="${c.id}" style="border-left: 4px solid ${color}; background-color: ${bgColor};">
      <img class="catalyst-image" src="${imagePath}" alt="${c.name}" onerror="this.style.display='none'">
      <span class="catalyst-name">${c.name}</span>
      <span class="catalyst-weight">${weightStr}</span>
      <span class="catalyst-value">${value} ${currencySymbol}</span>
    </div>`;
  });
  const s = currentCatalystSort;
  container.innerHTML = `
    <div class="catalyst-list-header">
      <div class="catalyst-header-cell image-cell"></div>
      <div class="catalyst-header-cell name-cell sortable" data-sort-field="name">Name${getListSortIndicator(s, 'name')}</div>
      <div class="catalyst-header-cell weight-cell sortable" data-sort-field="weight">Drop weight${getListSortIndicator(s, 'weight')}</div>
      <div class="catalyst-header-cell value-cell sortable" data-sort-field="value">Value (${currencySymbol})${getListSortIndicator(s, 'value')}</div>
    </div>
    <div class="catalyst-list">${rows.join('')}</div>
  `;
  setupListHoverHighlight(container, '.catalyst-list-row', highlightCellForCatalyst, clearCatalystHighlight);
  setupListSort(container, '.catalyst-list-header .sortable', currentCatalystSort, (field, direction) => {
    currentCatalystSort.field = field;
    currentCatalystSort.direction = direction;
  }, () => renderCatalystList(container));
}

function renderOilList(container) {
  if (!container || currentOils.length === 0) return;
  const currency = currentCurrency;
  const currencySymbol = currency === 'divine' ? 'Div' : 'c';
  const sorted = sortOils(currentOils, currentOilSort, currency);
  const rows = sorted.map((o) => {
    const value = currency === 'divine' ? (o.divineValue != null ? o.divineValue.toFixed(4) : '—') : (o.chaosValue != null ? o.chaosValue.toFixed(2) : '—');
    const weightStr = o.dropWeight != null ? (o.dropWeight * 100).toFixed(2) + '%' : '—';
    const imagePath = `/assets/images/oils/${o.id}.png`;
    return `<div class="oil-list-row" data-id="${o.id}">
      <img class="oil-image" src="${imagePath}" alt="${o.name}" onerror="this.style.display='none'">
      <span class="oil-name">${o.name}</span>
      <span class="oil-weight">${weightStr}</span>
      <span class="oil-value">${value} ${currencySymbol}</span>
    </div>`;
  });
  const s = currentOilSort;
  container.innerHTML = `
    <div class="oil-list-header">
      <div class="oil-header-cell image-cell"></div>
      <div class="oil-header-cell name-cell sortable" data-sort-field="name">Name${getListSortIndicator(s, 'name')}</div>
      <div class="oil-header-cell weight-cell sortable" data-sort-field="dropWeight">Drop Weight${getListSortIndicator(s, 'dropWeight')}</div>
      <div class="oil-header-cell value-cell sortable" data-sort-field="value">Value (${currencySymbol})${getListSortIndicator(s, 'value')}</div>
    </div>
    <div class="oil-list">${rows.join('')}</div>
  `;
  setupListHoverHighlight(container, '.oil-list-row', highlightCellForOil, clearOilHighlight);
  setupListSort(container, '.oil-list-header .sortable', currentOilSort, (field, direction) => {
    currentOilSort.field = field;
    currentOilSort.direction = direction;
  }, () => renderOilList(container));
}

function renderDeliriumOrbList(container) {
  if (!container || currentDeliriumOrbs.length === 0) return;
  const currency = currentCurrency;
  const currencySymbol = currency === 'divine' ? 'Div' : 'c';
  const sorted = sortDeliriumOrbs(currentDeliriumOrbs, currentDeliriumOrbSort, currency);
  const rows = sorted.map((o) => {
    const value = currency === 'divine' ? (o.divineValue != null ? o.divineValue.toFixed(4) : '—') : (o.chaosValue != null ? o.chaosValue.toFixed(2) : '—');
    const weightStr = o.dropWeight != null ? (o.dropWeight * 100).toFixed(2) + '%' : '—';
    const imagePath = `/assets/images/deliriumOrbs/${o.id}.png`;
    const status = o.profitabilityStatus || 'unknown';
    const color = getProfitabilityColor(status);
    const bgColor = getProfitabilityBackgroundColor(status);
    return `<div class="delirium-orb-list-row" data-id="${o.id}" style="border-left: 4px solid ${color}; background-color: ${bgColor};">
      <img class="delirium-orb-image" src="${imagePath}" alt="${o.name}" onerror="this.style.display='none'">
      <span class="delirium-orb-name">${o.name}</span>
      <span class="delirium-orb-weight">${weightStr}</span>
      <span class="delirium-orb-value">${value} ${currencySymbol}</span>
    </div>`;
  });
  const s = currentDeliriumOrbSort;
  container.innerHTML = `
    <div class="delirium-orb-list-header">
      <div class="delirium-orb-header-cell image-cell"></div>
      <div class="delirium-orb-header-cell name-cell sortable" data-sort-field="name">Name${getListSortIndicator(s, 'name')}</div>
      <div class="delirium-orb-header-cell weight-cell sortable" data-sort-field="dropWeight">Drop Weight${getListSortIndicator(s, 'dropWeight')}</div>
      <div class="delirium-orb-header-cell value-cell sortable" data-sort-field="value">Value (${currencySymbol})${getListSortIndicator(s, 'value')}</div>
    </div>
    <div class="delirium-orb-list">${rows.join('')}</div>
  `;
  setupListHoverHighlight(container, '.delirium-orb-list-row', highlightCellForDeliriumOrb, clearDeliriumOrbHighlight);
  setupListSort(container, '.delirium-orb-list-header .sortable', currentDeliriumOrbSort, (field, direction) => {
    currentDeliriumOrbSort.field = field;
    currentDeliriumOrbSort.direction = direction;
  }, () => renderDeliriumOrbList(container));
}

function renderEmblemList(container) {
  if (!container || currentEmblems.length === 0) return;
  const currency = currentCurrency;
  const currencySymbol = currency === 'divine' ? 'Div' : 'c';
  const sorted = sortEmblems(currentEmblems, currentEmblemSort, currency);
  const rows = sorted.map((o) => {
    const value = currency === 'divine' ? (o.divineValue != null ? o.divineValue.toFixed(4) : '—') : (o.chaosValue != null ? o.chaosValue.toFixed(2) : '—');
    const weightStr = o.dropWeight != null ? (o.dropWeight * 100).toFixed(2) + '%' : '—';
    const imagePath = `/assets/images/legionEmblems/${o.id}.png`;
    return `<div class="emblem-list-row" data-id="${o.id}">
      <img class="emblem-image" src="${imagePath}" alt="${o.name}" onerror="this.style.display='none'">
      <span class="emblem-name">${o.name}</span>
      <span class="emblem-weight">${weightStr}</span>
      <span class="emblem-value">${value} ${currencySymbol}</span>
    </div>`;
  });
  const s = currentEmblemSort;
  container.innerHTML = `
    <div class="emblem-list-header">
      <div class="emblem-header-cell image-cell"></div>
      <div class="emblem-header-cell name-cell sortable" data-sort-field="name">Name${getListSortIndicator(s, 'name')}</div>
      <div class="emblem-header-cell weight-cell sortable" data-sort-field="dropWeight">Drop Weight${getListSortIndicator(s, 'dropWeight')}</div>
      <div class="emblem-header-cell value-cell sortable" data-sort-field="value">Value (${currencySymbol})${getListSortIndicator(s, 'value')}</div>
    </div>
    <div class="emblem-list">${rows.join('')}</div>
  `;
  setupListHoverHighlight(container, '.emblem-list-row', highlightCellForEmblem, clearEmblemHighlight);
  setupListSort(container, '.emblem-list-header .sortable', currentEmblemSort, (field, direction) => {
    currentEmblemSort.field = field;
    currentEmblemSort.direction = direction;
  }, () => renderEmblemList(container));
}

function renderTattooList(container) {
  if (!container || currentTattoos.length === 0) return;
  const currency = currentCurrency;
  const currencySymbol = currency === 'divine' ? 'Div' : 'c';
  const sorted = sortTattoos(currentTattoos, currentTattooSort, currency);
  const rows = sorted.map((t) => {
    const value = currency === 'divine' ? (t.divineValue != null ? t.divineValue.toFixed(4) : '—') : (t.chaosValue != null ? t.chaosValue.toFixed(2) : '—');
    const weightStr = t.dropWeight != null ? (t.dropWeight * 100).toFixed(2) + '%' : '—';
    const imagePath = `/assets/images/tattoos/${t.id}.png`;
    const status = t.profitabilityStatus || 'unknown';
    const color = getProfitabilityColor(status);
    const bgColor = getProfitabilityBackgroundColor(status);
    return `<div class="tattoo-list-row" data-id="${t.id}" style="border-left: 4px solid ${color}; background-color: ${bgColor};">
      <img class="tattoo-image" src="${imagePath}" alt="${t.name}" onerror="this.style.display='none'">
      <span class="tattoo-name">${t.name}</span>
      <span class="tattoo-weight">${weightStr}</span>
      <span class="tattoo-value">${value} ${currencySymbol}</span>
    </div>`;
  });
  const s = currentTattooSort;
  container.innerHTML = `
    <div class="tattoo-list-header">
      <div class="tattoo-header-cell image-cell"></div>
      <div class="tattoo-header-cell name-cell sortable" data-sort-field="name">Name${getListSortIndicator(s, 'name')}</div>
      <div class="tattoo-header-cell weight-cell sortable" data-sort-field="dropWeight">Drop Weight${getListSortIndicator(s, 'dropWeight')}</div>
      <div class="tattoo-header-cell value-cell sortable" data-sort-field="value">Value (${currencySymbol})${getListSortIndicator(s, 'value')}</div>
    </div>
    <div class="tattoo-list">${rows.join('')}</div>
  `;
  setupListSort(container, '.tattoo-list-header .sortable', currentTattooSort, (field, direction) => {
    currentTattooSort.field = field;
    currentTattooSort.direction = direction;
  }, () => renderTattooList(container));
}

/**
 * Render Catalyst UI (list + grid view)
 * @param {Array<Object>} catalysts - Merged catalyst data (id, name, description, chaosValue, divineValue, dropWeight)
 * @param {string} currency - 'chaos' or 'divine'
 */
async function renderCatalystUI(catalysts, currency) {
  // Convert to Catalyst instances
  const catalystInstances = catalysts
    .map(data => new Catalyst(data))
    .filter(catalyst => {
      if (!catalyst.validate()) {
        console.warn(`Invalid Catalyst data: ${catalyst.id}`);
        return false;
      }
      return true;
    });

  // Calculate threshold (excludes Tainted Catalysts from return pool)
  let threshold = null;
  try {
    threshold = calculateCatalystThreshold(catalystInstances, 0.9, 10000, 'returnable');
    console.log(`Catalyst threshold calculated: ${threshold.value.toFixed(2)} chaos`);
    
    // Calculate profitability status for all Catalysts
    calculateCatalystProfitabilityStatus(catalystInstances, threshold);
  } catch (error) {
    console.error('Error calculating Catalyst threshold:', error);
    // Set all to unknown if calculation fails
    catalystInstances.forEach(catalyst => {
      catalyst.profitabilityStatus = 'unknown';
    });
  }

  currentCatalysts = catalystInstances;
  currentCurrency = currency;

  // Clear regex display (only for scarabs)
  clearRegexDisplay();

  const listViewContainer = document.getElementById('list-view');
  if (listViewContainer) {
    renderCatalystList(listViewContainer);
  }

  const gridViewContainer = document.getElementById('grid-view');
  const gridCanvas = document.getElementById('scarab-grid-canvas');
  if (gridViewContainer) {
    gridViewContainer.style.display = 'block';
  }
  if (gridCanvas) {
    try {
      teardownGridView(gridCanvas);
      teardownEssenceGridView(gridCanvas);
      teardownFossilGridView(gridCanvas);
      teardownOilGridView(gridCanvas);
      teardownDeliriumOrbGridView(gridCanvas);
      teardownEmblemGridView(gridCanvas);
      await initCatalystGridView(gridCanvas, catalystInstances, CATALYSTS_GRID_CONFIG.tabImagePath);
      const listWrapper = document.querySelector('.list-wrapper');
      if (listWrapper && gridCanvas.offsetHeight > 0) {
        listWrapper.style.height = `${gridCanvas.offsetHeight}px`;
      }
    } catch (err) {
      console.error('Error initializing catalyst grid view:', err);
    }
  }

  const filterPanelContainer = document.getElementById('filter-panel');
  if (filterPanelContainer) {
    filterPanelContainer.style.display = 'none';
  }

  const thresholdContainer = document.getElementById('threshold-display');
  if (thresholdContainer) {
    if (threshold) {
      renderThresholdDisplay(thresholdContainer, threshold, currency, 0.9, null, 'returnable', null);
    } else {
      thresholdContainer.innerHTML = '<div class="catalyst-threshold-note">Catalysts: drop weights from <a href="https://poedata.dev/data/catalysts/calculations/mle.json" target="_blank" rel="noopener">poedata.dev MLE</a>. Unable to calculate threshold.</div>';
    }
  }
}

/**
 * Render Oil UI (list + grid view)
 * @param {Array<Object>} oils - Merged oil data (id, name, tier, chaosValue, divineValue, helpText)
 * @param {string} currency - 'chaos' or 'divine'
 */
async function renderOilUI(oils, currency) {
  currentOils = oils;
  currentCurrency = currency;

  // Clear regex display (only for scarabs)
  clearRegexDisplay();

  const listViewContainer = document.getElementById('list-view');
  if (listViewContainer) {
    renderOilList(listViewContainer);
  }

  const gridViewContainer = document.getElementById('grid-view');
  const gridCanvas = document.getElementById('scarab-grid-canvas');
  if (gridViewContainer) {
    gridViewContainer.style.display = 'block';
  }
  if (gridCanvas) {
    try {
      teardownGridView(gridCanvas);
      teardownEssenceGridView(gridCanvas);
      teardownCatalystGridView(gridCanvas);
      teardownFossilGridView(gridCanvas);
      teardownDeliriumOrbGridView(gridCanvas);
      teardownEmblemGridView(gridCanvas);
      await initOilGridView(gridCanvas, oils, OILS_GRID_CONFIG.tabImagePath);
      const listWrapper = document.querySelector('.list-wrapper');
      if (listWrapper && gridCanvas.offsetHeight > 0) {
        listWrapper.style.height = `${gridCanvas.offsetHeight}px`;
      }
    } catch (err) {
      console.error('Error initializing oil grid view:', err);
    }
  }

  const filterPanelContainer = document.getElementById('filter-panel');
  if (filterPanelContainer) {
    filterPanelContainer.style.display = 'none';
  }

  const thresholdContainer = document.getElementById('threshold-display');
  if (thresholdContainer) {
    thresholdContainer.innerHTML = '<div class="oil-threshold-note">Oils: ordered by tier (itemOrderConfig).</div>';
  }
}

/**
 * Render Delirium Orb UI (list + grid view)
 * @param {Array} items - Delirium Orb instances
 * @param {string} currency - Currency preference
 * @param {number} rerollCost - Reroll cost
 * @param {Object} primalLifeforce - Primal Lifeforce price object
 */
async function renderDeliriumOrbUI(items, currency, rerollCost = null, primalLifeforce = null) {
  currentDeliriumOrbs = items;
  currentCurrency = currency;

  // Clear regex display (only for scarabs)
  clearRegexDisplay();

  const listViewContainer = document.getElementById('list-view');
  if (listViewContainer) {
    renderDeliriumOrbList(listViewContainer);
  }

  const gridViewContainer = document.getElementById('grid-view');
  const gridCanvas = document.getElementById('scarab-grid-canvas');
  if (gridViewContainer) gridViewContainer.style.display = 'block';
  if (gridCanvas) {
    try {
      teardownGridView(gridCanvas);
      teardownEssenceGridView(gridCanvas);
      teardownCatalystGridView(gridCanvas);
      teardownFossilGridView(gridCanvas);
      teardownOilGridView(gridCanvas);
      teardownEmblemGridView(gridCanvas);
      await initDeliriumOrbGridView(gridCanvas, items, DELIRIUM_ORBS_GRID_CONFIG.tabImagePath);
      const listWrapper = document.querySelector('.list-wrapper');
      if (listWrapper && gridCanvas.offsetHeight > 0) listWrapper.style.height = `${gridCanvas.offsetHeight}px`;
    } catch (err) {
      console.error('Error initializing delirium orb grid view:', err);
    }
  }

  const filterPanelContainer = document.getElementById('filter-panel');
  if (filterPanelContainer) filterPanelContainer.style.display = 'none';
  const thresholdContainer = document.getElementById('threshold-display');
  if (thresholdContainer) {
    if (rerollCost != null && primalLifeforce != null) {
      const currencySymbol = currency === 'divine' ? 'Div' : 'c';
      const costDisplay = currency === 'divine' 
        ? (rerollCost / (window.divinePrice || 153)).toFixed(4) 
        : rerollCost.toFixed(2);
      thresholdContainer.innerHTML = `
        <div class="oil-threshold-note">
          <strong>Delirium Orbs</strong><br>
          <strong>Reroll Cost:</strong> 30 Primal Lifeforce = ${costDisplay} ${currencySymbol}
        </div>
      `;
    } else {
      thresholdContainer.innerHTML = '<div class="oil-threshold-note">Delirium Orbs</div>';
    }
  }
}

/**
 * Render Emblem UI (list + grid view)
 */
async function renderEmblemUI(items, currency) {
  currentEmblems = items;
  currentCurrency = currency;

  // Clear regex display (only for scarabs)
  clearRegexDisplay();

  const listViewContainer = document.getElementById('list-view');
  if (listViewContainer) {
    renderEmblemList(listViewContainer);
  }

  const gridViewContainer = document.getElementById('grid-view');
  const gridCanvas = document.getElementById('scarab-grid-canvas');
  if (gridViewContainer) gridViewContainer.style.display = 'block';
  if (gridCanvas) {
    try {
      teardownGridView(gridCanvas);
      teardownEssenceGridView(gridCanvas);
      teardownCatalystGridView(gridCanvas);
      teardownFossilGridView(gridCanvas);
      teardownOilGridView(gridCanvas);
      teardownDeliriumOrbGridView(gridCanvas);
      await initEmblemGridView(gridCanvas, items, EMBLEMS_GRID_CONFIG.tabImagePath);
      const listWrapper = document.querySelector('.list-wrapper');
      if (listWrapper && gridCanvas.offsetHeight > 0) listWrapper.style.height = `${gridCanvas.offsetHeight}px`;
    } catch (err) {
      console.error('Error initializing emblem grid view:', err);
    }
  }

  const filterPanelContainer = document.getElementById('filter-panel');
  if (filterPanelContainer) filterPanelContainer.style.display = 'none';
  const thresholdContainer = document.getElementById('threshold-display');
  if (thresholdContainer) thresholdContainer.innerHTML = '<div class="oil-threshold-note">Legion Emblems</div>';
}

/**
 * Render Tattoo UI (list view)
 * @param {Array<Object>} items - Merged tattoo data (id, name, description, chaosValue, divineValue, dropWeight)
 * @param {string} currency - 'chaos' or 'divine'
 */
async function renderTattooUI(items, currency) {
  // Convert to Tattoo instances
  const tattooInstances = items
    .map(data => new Tattoo(data))
    .filter(tattoo => {
      if (!tattoo.validate()) {
        console.warn(`Invalid Tattoo data: ${tattoo.id}`);
        return false;
      }
      return true;
    });

  // Calculate threshold (excludes Journey Tattoos from return pool)
  let threshold = null;
  try {
    threshold = calculateTattooThreshold(tattooInstances, 0.9, 10000, 'returnable');
    console.log(`Tattoo threshold calculated: ${threshold.value.toFixed(2)} chaos`);
    
    // Calculate profitability status for all Tattoos
    calculateTattooProfitabilityStatus(tattooInstances, threshold);
  } catch (error) {
    console.error('Error calculating Tattoo threshold:', error);
    // Set all to unknown if calculation fails
    tattooInstances.forEach(tattoo => {
      tattoo.profitabilityStatus = 'unknown';
    });
  }

  currentTattoos = tattooInstances;
  currentCurrency = currency;

  // Clear regex display (only for scarabs)
  clearRegexDisplay();

  const listViewContainer = document.getElementById('list-view');
  if (listViewContainer) renderTattooList(listViewContainer);

  const gridViewContainer = document.getElementById('grid-view');
  if (gridViewContainer) gridViewContainer.style.display = 'none';

  const filterPanelContainer = document.getElementById('filter-panel');
  if (filterPanelContainer) filterPanelContainer.style.display = 'none';
  
  const thresholdContainer = document.getElementById('threshold-display');
  if (thresholdContainer) {
    if (threshold) {
      renderThresholdDisplay(thresholdContainer, threshold, currency, 0.9, null, 'returnable', null);
    } else {
      thresholdContainer.innerHTML = '<div class="oil-threshold-note">Tattoos: Unable to calculate threshold.</div>';
    }
  }
}

/**
 * Render Temple Upgrade UI
 * @param {Array} combinations - Array of upgrade combinations
 * @param {string} currency - Currency preference ('chaos' | 'divine')
 */
async function renderTempleUpgradeUI(combinations, currency) {
  // Clear regex display (only for scarabs)
  clearRegexDisplay();
  
  const listViewContainer = document.getElementById('list-view');
  if (listViewContainer) {
    renderTempleUpgradeList(listViewContainer, combinations, currency);
  }
  
  // Hide grid view and filter panel
  const gridViewContainer = document.getElementById('grid-view');
  if (gridViewContainer) {
    gridViewContainer.style.display = 'none';
  }
  
  const filterPanelContainer = document.getElementById('filter-panel');
  if (filterPanelContainer) {
    filterPanelContainer.style.display = 'none';
  }
  
  const thresholdContainer = document.getElementById('threshold-display');
  if (thresholdContainer) {
    thresholdContainer.innerHTML = '<div class="temple-threshold-note">Temple Upgrades</div>';
  }
}

/**
 * Handle route change (category and/or page)
 * @param {string|null} category - 'scarabs', 'essences', 'tattoos', 'catalysts', 'temple', 'fossils', 'oils', 'delirium-orbs', 'emblems', or null for root
 * @param {string|null} page - 'flipping' or 'simulation', or null for root
 */
async function handleRouteChange(category, page) {
  // Handle root route (welcome page)
  if (category === null || page === null) {
    // Set currentCategory to null to mark we're on root
    currentCategory = null;
    currentPage = null;
    
    // Show welcome page
    const welcomePage = document.getElementById('welcome-page');
    const flippingPage = document.getElementById('flipping-page');
    const simulationPage = document.getElementById('simulation-page');
    
    if (welcomePage) {
      welcomePage.classList.add('active');
      renderWelcomePage(welcomePage);
    }
    if (flippingPage) flippingPage.classList.remove('active');
    if (simulationPage) simulationPage.classList.remove('active');
    
    // Hide header content on welcome page
    const headerContent = document.querySelector('.header-content');
    if (headerContent) {
      headerContent.style.display = 'none';
    }
    
    // Update navigation (home icon should be active)
    const navigationContainer = document.getElementById('navigation');
    if (navigationContainer) {
      updateNavigation(
        navigationContainer, 
        null, // null category means home is active
        'flipping',
        (leagueSelectorContainer) => {
          renderLeagueSelector(leagueSelectorContainer);
        }
      );
    }
    
    return;
  }
  
  // Check if we're coming from root before updating state
  const comingFromRoot = currentCategory === null;
  
  // Update current state
  // If coming from root (currentCategory is null), always treat as category change
  const categoryChanged = comingFromRoot || currentCategory !== category;
  const pageChanged = comingFromRoot || currentPage === null || currentPage !== page;
  
  // Unsubscribe from selection changes if switching away from scarabs
  if (categoryChanged && currentCategory === 'scarabs' && selectionUnsubscribeFn) {
    selectionUnsubscribeFn();
    selectionUnsubscribeFn = null;
    selectionSubscriptionActive = false;
  }
  
  currentCategory = category;
  currentPage = page;
  
  // Hide welcome page if it's visible
  const welcomePage = document.getElementById('welcome-page');
  if (welcomePage) {
    welcomePage.classList.remove('active');
  }
  
  // Ensure flipping page is shown (in case we're coming from root)
  const flippingPage = document.getElementById('flipping-page');
  const simulationPage = document.getElementById('simulation-page');
  if (flippingPage && simulationPage) {
    if (page === 'flipping') {
      flippingPage.classList.add('active');
      simulationPage.classList.remove('active');
    } else if (page === 'simulation') {
      flippingPage.classList.remove('active');
      simulationPage.classList.add('active');
    }
  }
  
  // Show/hide header content (title and page buttons) based on category
  // Only show for scarabs category
  const headerContent = document.querySelector('.header-content');
  if (headerContent) {
    if (category === 'scarabs') {
      headerContent.style.display = '';
    } else {
      headerContent.style.display = 'none';
    }
  }
  
  // Update selection category if category changed
  // Preserve existing selections when switching back to a category (don't clear)
  if (categoryChanged) {
    setSelectionCategory(category, false);
  }

  // Update navigation
  const navigationContainer = document.getElementById('navigation');
  if (navigationContainer) {
    updateNavigation(
      navigationContainer, 
      category, 
      page,
      (leagueSelectorContainer) => {
        // Re-render league selector when navigation updates
        renderLeagueSelector(leagueSelectorContainer);
      }
    );
  }
  
  // Handle page change if needed
  if (pageChanged) {
    handlePageChangeLogic(page);
  }
  
  // Handle category change if needed
  // Always load data when coming from root
  if (categoryChanged || comingFromRoot) {
    await handleCategoryChangeLogic(category);
  }
}

/**
 * Handle category change logic (separated for reuse)
 * @param {string} category - 'scarabs', 'essences', 'tattoos', 'catalysts', 'temple', 'fossils', 'oils', 'delirium-orbs', 'emblems'
 */
async function handleCategoryChangeLogic(category) {
  // Handle category-specific logic
  if (category === 'essences') {
    try {
      // Show loading state
      const listViewContainer = document.getElementById('list-view');
      if (listViewContainer) {
        showEssenceLoadingState(listViewContainer);
      }
      
      // Load and process Essence data
      const { essences, thresholds, rerollCost, allEssences } = await loadAndProcessEssenceData();
      
      // Get currency preference
      const preferences = loadPreferences();
      const currency = preferences.currencyPreference || 'chaos';
      
      // Render Essence UI (grid uses allEssences so every slot is filled correctly)
      await renderEssenceUI(essences, thresholds, rerollCost, currency, allEssences);
    } catch (error) {
      console.error('Error handling Essence category:', error);
      showErrorToast('Failed to load Essence data');
    }
  } else if (category === 'fossils') {
    try {
      // Show loading state
      const listViewContainer = document.getElementById('list-view');
      if (listViewContainer) {
        showFossilLoadingState(listViewContainer);
      }
      
      // Load and process Fossil data (threshold + list)
      const { fossils, threshold, rerollCost, wildLifeforce } = await loadAndProcessFossilData();
      
      // Load full fossil data (details + MLE weights + prices) for grid view
      const gridFossils = await loadFullFossilData().catch(() => []);
      
      // Get currency preference
      const preferences = loadPreferences();
      const currency = preferences.currencyPreference || 'chaos';
      
      // Render Fossil UI (list + threshold + grid when gridFossils available)
      await renderFossilUI(fossils, threshold, rerollCost, currency, wildLifeforce, gridFossils);
    } catch (error) {
      console.error('Error handling Fossil category:', error);
      showErrorToast('Failed to load Fossil data');
    }
  } else if (category === 'scarabs') {
    // Load Scarab data if not already loaded
    if (currentScarabs.length === 0 || !currentThreshold) {
      try {
        // Show loading state
        const listViewContainer = document.getElementById('list-view');
        if (listViewContainer) {
          showLoadingState(listViewContainer);
        }
        
        console.log('Loading Scarab data...');
        const rawData = await loadAndMergeScarabData();
        
        // Load additional item type prices in parallel if not already loaded
        if (!window.priceData || !window.priceData.additional) {
          const additionalItemTypes = ['catalyst', 'deliriumOrb', 'emblem', 'essence', 'fossil', 'lifeforce', 'oil', 'tattoo', 'templeUnique', 'vial'];
          const additionalPrices = await loadAllItemTypePrices(additionalItemTypes);
          window.priceData = {
            scarabs: rawData,
            additional: additionalPrices
          };
        } else {
          window.priceData.scarabs = rawData;
        }
        
        // Sanitize and create Scarab instances
        const scarabs = rawData
          .map(data => sanitizeScarabData(data))
          .map(data => new Scarab(data))
          .filter(scarab => {
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
        const preferences = loadPreferences();
        const threshold = calculateThreshold(scarabs, currentConfidencePercentile, 10000, currentTradeMode);
        console.log(`Threshold calculated: ${threshold.value.toFixed(2)} chaos`);

        // Calculate profitability status for all Scarabs
        calculateProfitabilityStatus(scarabs, threshold);

        // Update global state
        currentScarabs = scarabs;
        currentThreshold = threshold;
        
        // Initialize simulation panel
        initSimulationPanel(scarabs, threshold);
        
        // Render UI
        const currency = preferences.currencyPreference || 'chaos';
        renderUI(scarabs, threshold, currency);
      } catch (error) {
        console.error('Error loading Scarab data:', error);
        showErrorToast('Failed to load Scarab data');
        const listViewContainer = document.getElementById('list-view');
        if (listViewContainer) {
          showErrorState(listViewContainer, 'Failed to load Scarab data. Please refresh the page.');
        }
      }
    } else {
      // Reload Scarab UI if we already have Scarab data
      const preferences = loadPreferences();
      const currency = preferences.currencyPreference || 'chaos';
      renderUI(currentScarabs, currentThreshold, currency);
    }
  } else if (category === 'catalysts') {
    try {
      const listViewContainer = document.getElementById('list-view');
      if (listViewContainer) {
        listViewContainer.innerHTML = '<p class="loading-message">Loading Catalysts...</p>';
      }
      const catalysts = await loadAndMergeCatalystData();
      const preferences = loadPreferences();
      const currency = preferences.currencyPreference || 'chaos';
      await renderCatalystUI(catalysts, currency);
    } catch (error) {
      console.error('Error handling Catalysts category:', error);
      showErrorToast('Failed to load Catalyst data');
    }
  } else if (category === 'oils') {
    try {
      const listViewContainer = document.getElementById('list-view');
      if (listViewContainer) {
        listViewContainer.innerHTML = '<p class="loading-message">Loading Oils...</p>';
      }
      const oils = await loadFullOilData();
      const preferences = loadPreferences();
      const currency = preferences.currencyPreference || 'chaos';
      await renderOilUI(oils, currency);
    } catch (error) {
      console.error('Error handling Oils category:', error);
      showErrorToast('Failed to load Oil data');
    }
  } else if (category === 'delirium-orbs') {
    try {
      const listViewContainer = document.getElementById('list-view');
      if (listViewContainer) {
        listViewContainer.innerHTML = '<p class="loading-message">Loading Delirium Orbs...</p>';
      }
      const { deliriumOrbs, rerollCost, primalLifeforce } = await loadAndProcessDeliriumOrbData();
      const preferences = loadPreferences();
      const currency = preferences.currencyPreference || 'chaos';
      await renderDeliriumOrbUI(deliriumOrbs, currency, rerollCost, primalLifeforce);
    } catch (error) {
      console.error('Error handling Delirium Orbs category:', error);
      showErrorToast('Failed to load Delirium Orb data');
    }
  } else if (category === 'emblems') {
    try {
      const listViewContainer = document.getElementById('list-view');
      if (listViewContainer) {
        listViewContainer.innerHTML = '<p class="loading-message">Loading Emblems...</p>';
      }
      const items = await loadFullEmblemData();
      const preferences = loadPreferences();
      const currency = preferences.currencyPreference || 'chaos';
      await renderEmblemUI(items, currency);
    } catch (error) {
      console.error('Error handling Emblems category:', error);
      showErrorToast('Failed to load Emblem data');
    }
  } else if (category === 'tattoos') {
    try {
      const listViewContainer = document.getElementById('list-view');
      if (listViewContainer) {
        listViewContainer.innerHTML = '<p class="loading-message">Loading Tattoos...</p>';
      }
      const items = await loadFullTattooData();
      const preferences = loadPreferences();
      const currency = preferences.currencyPreference || 'chaos';
      await renderTattooUI(items, currency);
    } catch (error) {
      console.error('Error handling Tattoos category:', error);
      showErrorToast('Failed to load Tattoo data');
    }
  } else if (category === 'temple') {
    try {
      const listViewContainer = document.getElementById('list-view');
      if (listViewContainer) {
        listViewContainer.innerHTML = '<p class="loading-message">Loading Temple upgrades...</p>';
      }
      const { combinations } = await loadTempleUpgradeData();
      const preferences = loadPreferences();
      const currency = preferences.currencyPreference || 'chaos';
      await renderTempleUpgradeUI(combinations, currency);
    } catch (error) {
      console.error('Error handling Temple category:', error);
      showErrorToast('Failed to load Temple upgrade data');
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
        // Update URL when page button is clicked
        navigateTo(currentCategory, page);
        // handleRouteChange will be called by the router
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
  // Update URL when page changes
  navigateTo(currentCategory, page);
  // handleRouteChange will be called by the router
}

/**
 * Handle page change logic (separated for reuse)
 * @param {string} page - 'flipping' or 'simulation'
 */
function handlePageChangeLogic(page) {
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
