/**
 * Simulation Panel Component
 * Provides controls and results for vendoring simulations
 */

import { SimulationConfiguration } from '../models/scarab.js';
import {
  createConfiguration,
  validateConfiguration,
  runSimulation,
  cancelSimulation,
  getTransactionHistory,
  getSignificantEvents,
  getYieldCounts,
} from '../services/simulationService.js';
import { renderTransactionHistory, setupTransactionHistoryListeners } from './transactionHistory.js';
import { getProfitLossColor } from '../utils/colorUtils.js';
import { initGridView, clearYieldCounts as clearGridViewYieldCounts, setYieldCounts as setGridViewYieldCounts, setShowCellBackgrounds, getShowCellBackgrounds } from '../views/gridView.js';
import { clearYieldCounts as clearListViewYieldCounts, renderListView } from '../views/listView.js';

let currentScarabs = [];
let currentThreshold = null;
let currentSimulationResult = null;
let simulationGridCanvas = null; // Reference to simulation grid canvas
let allScarabCheckboxes = []; // Store all scarab checkbox data for filtering

/**
 * Initialize simulation panel with data
 * @param {Array<Scarab>} scarabs
 * @param {ExpectedValueThreshold} threshold
 */
export function initSimulationPanel(scarabs, threshold) {
  currentScarabs = scarabs;
  currentThreshold = threshold;
}

/**
 * Render simulation panel
 * @param {HTMLElement} container - Container element
 */
export function renderSimulationPanel(container) {
  if (!container) {
    console.error('Simulation panel: missing container');
    return;
  }

  // Load saved configuration
  const savedConfig = loadConfiguration();
  
  container.innerHTML = `
    <div class="simulation-panel">
      <h2>3-to-1 Trade Simulation</h2>
      
      <div class="simulation-controls">
        <div class="simulation-controls-row">
          <div id="scarab-selection" class="scarab-selection">
            <label>Select Scarabs (min 1):</label>
            <div class="scarab-search-container">
              <input 
                type="text" 
                id="scarab-search" 
                class="scarab-search-input"
                placeholder="Search scarabs..."
                aria-label="Search scarabs"
              />
            </div>
            <div class="scarab-checkboxes" id="scarab-checkboxes"></div>
            <div class="selection-info">
              <span id="selected-count">0 selected</span>
            </div>
          </div>

          <div class="configuration-inputs">
            <div class="input-group">
              <label for="rare-scarab-threshold">Rare Threshold (%):</label>
              <input 
                type="number" 
                id="rare-scarab-threshold" 
                min="0" 
                max="100" 
                step="1"
                value="${(savedConfig?.rareScarabThreshold ?? 0.1) * 100}"
                aria-label="Rare scarab threshold percentage"
              />
              <span class="input-hint">Bottom X% by drop weight</span>
            </div>

            <div class="input-group">
              <label for="transaction-count">Transactions:</label>
              <input 
                type="number" 
                id="transaction-count" 
                min="1" 
                max="1000000" 
                value="${savedConfig?.transactionCount ?? 100}"
                aria-label="Number of vendor transactions"
              />
              <span class="input-hint">1 to 1,000,000</span>
            </div>

            <div class="input-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  id="continue-mode" 
                  ${savedConfig?.continueMode ? 'checked' : ''}
                  aria-label="Continue mode"
                />
                <span>Continue Mode</span>
              </label>
              <span class="input-hint">Continue trading with returned scarabs below threshold</span>
            </div>
          </div>
        </div>

        <div id="validation-errors" class="validation-errors" style="display: none;"></div>

        <div class="simulation-actions">
          <div class="simulation-actions-left">
            <button id="run-simulation" class="run-btn">Run Simulation</button>
            <button id="cancel-simulation" class="cancel-btn" style="display: none;">Cancel</button>
          </div>
          <div id="simulation-progress-container" class="simulation-progress-container">
            <div id="simulation-progress" class="simulation-progress">
              <span id="progress-details">Processing transactions...</span>
            </div>
            <div id="simulation-progress-bar" class="simulation-progress-bar">
              <div class="progress-bar">
                <div id="progress-fill" class="progress-fill" style="width: 0%;"></div>
              </div>
              <div class="progress-text">
                <span id="progress-percent">0%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="simulation-views" class="simulation-views">
        <div class="simulation-views-header">
          <h3>Simulation Views</h3>
        </div>
        <div class="merged-views-container">
          <div id="simulation-grid-view" class="view-container grid-container">
            <canvas id="simulation-grid-canvas"></canvas>
            <button id="toggle-cell-backgrounds" class="settings-btn grid-settings-btn" aria-label="Toggle cell backgrounds" title="Toggle Cell Backgrounds">
              🎨
            </button>
          </div>
          <div class="list-wrapper">
            <div id="simulation-list-view" class="view-container list-container">
              <div id="scarab-list-container" class="scarab-list-container"></div>
            </div>
          </div>
        </div>
      </div>

      <div id="simulation-results" class="simulation-results" style="display: none;"></div>
      <div id="transaction-history-container" class="transaction-history-container" style="display: none;"></div>
    </div>
  `;

  // Attach event listeners
  setupEventListeners(container);
  
  // Initialize grid view if scarabs are available (async, but don't await)
  // Always initialize the views, not just when simulation runs
  if (currentScarabs && currentScarabs.length > 0) {
    initializeSimulationGridView(container).then(() => {
      // After grid is initialized, restore simulation results if they exist
      restoreSimulationResults(container);
    }).catch(err => {
      console.error('Error initializing grid view:', err);
      // Still try to restore results even if grid init fails
      restoreSimulationResults(container);
    });
    
    // Initialize empty list view (will be updated if results exist)
    const scarabListInner = container.querySelector('#scarab-list-container');
    if (scarabListInner && !currentSimulationResult) {
      scarabListInner.innerHTML = '<p class="loading-text">No simulation data yet. Run a simulation to see results.</p>';
    }
  } else {
    // Still try to restore results even if no scarabs
    restoreSimulationResults(container);
  }
}

/**
 * Setup event listeners for simulation panel
 * @param {HTMLElement} container
 */
function setupEventListeners(container) {
  const runButton = container.querySelector('#run-simulation');
  const cancelButton = container.querySelector('#cancel-simulation');
  const transactionInput = container.querySelector('#transaction-count');
  const rareThresholdInput = container.querySelector('#rare-scarab-threshold');
  const scarabCheckboxes = container.querySelector('#scarab-checkboxes');

  // Render scarab checkboxes
  renderScarabCheckboxes(scarabCheckboxes);

  // Handle run simulation
  runButton.addEventListener('click', () => {
    runNewSimulation(container);
  });

  // Handle cancel simulation
  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      cancelSimulation();
      cancelButton.style.display = 'none';
      runButton.disabled = false;
      const progressContainer = container.querySelector('#simulation-progress-container');
      if (progressContainer) {
        progressContainer.style.visibility = 'hidden';
      }
    // Keep views visible on cancel (they're always visible now)
    // Just clear the yield counts
    const viewsContainer = container.querySelector('#simulation-views');
    if (viewsContainer) {
      const scarabListInner = container.querySelector('#scarab-list-container');
      if (scarabListInner) {
        scarabListInner.innerHTML = '<p class="loading-text">Simulation cancelled. Run a new simulation to see results.</p>';
      }
    }
    });
  }

  // Handle input validation
  transactionInput.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    if (value < 1) e.target.value = 1;
    if (value > 1000000) e.target.value = 1000000;
    validateConfigurationUI(container);
  });

  rareThresholdInput.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    if (value < 0) e.target.value = 0;
    if (value > 100) e.target.value = 100;
    validateConfigurationUI(container);
  });

  // Handle scarab selection changes
  scarabCheckboxes.addEventListener('change', () => {
    updateSelectedCount();
    validateConfigurationUI(container);
    // Update stored checkbox states when changed
    updateStoredCheckboxStates();
  });

  // Handle search/filter input
  const searchInput = container.querySelector('#scarab-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filterScarabCheckboxes(e.target.value);
    });
  }
}

/**
 * Render checkboxes for Scarab selection
 * @param {HTMLElement} container
 */
function renderScarabCheckboxes(container) {
  if (!container) return;
  
  if (!currentScarabs || currentScarabs.length === 0) {
    container.innerHTML = '<p>No Scarabs available</p>';
    return;
  }

  // Show all scarabs with valid data for selection
  const validScarabs = currentScarabs.filter(s => s.hasPriceData() && s.hasDropWeight());

  if (validScarabs.length === 0) {
    container.innerHTML = '<p>No valid Scarabs available for selection</p>';
    return;
  }

  // Load saved selection
  const savedConfig = loadConfiguration();
  const savedIds = savedConfig?.selectedScarabIds || [];

  // Store all scarab data for filtering
  allScarabCheckboxes = validScarabs.map(scarab => ({
    scarab,
    isChecked: savedIds.includes(scarab.id)
  }));

  // Render all checkboxes initially
  renderScarabCheckboxHTML(container, allScarabCheckboxes);
}

/**
 * Render scarab checkbox HTML
 * @param {HTMLElement} container - Container element
 * @param {Array} checkboxData - Array of checkbox data objects
 */
function renderScarabCheckboxHTML(container, checkboxData) {
  container.innerHTML = checkboxData.map(item => `
    <label class="scarab-checkbox">
      <input 
        type="checkbox" 
        value="${item.scarab.id}" 
        data-scarab-id="${item.scarab.id}"
        ${item.isChecked ? 'checked' : ''}
      >
      <span>${item.scarab.name} (${item.scarab.chaosValue?.toFixed(2)}c, weight: ${item.scarab.dropWeight})</span>
    </label>
  `).join('');
}

/**
 * Filter scarab checkboxes based on search term
 * @param {string} searchTerm - Search term to filter by
 */
function filterScarabCheckboxes(searchTerm) {
  const container = document.getElementById('scarab-selection');
  if (!container) return;

  const checkboxesContainer = container.querySelector('#scarab-checkboxes');
  if (!checkboxesContainer) return;

  // Update stored states from current DOM before filtering
  updateStoredCheckboxStates();

  const searchLower = searchTerm.toLowerCase().trim();

  if (!searchLower) {
    // Show all checkboxes if search is empty
    renderScarabCheckboxHTML(checkboxesContainer, allScarabCheckboxes);
    return;
  }

  // Filter scarabs based on search term (search in name, id, value, and weight)
  const filtered = allScarabCheckboxes.filter(item => {
    const scarab = item.scarab;
    const nameMatch = scarab.name.toLowerCase().includes(searchLower);
    const idMatch = scarab.id.toLowerCase().includes(searchLower);
    const valueMatch = scarab.chaosValue?.toString().includes(searchLower);
    const weightMatch = scarab.dropWeight?.toString().includes(searchLower);
    
    return nameMatch || idMatch || valueMatch || weightMatch;
  });

  // Render filtered checkboxes
  renderScarabCheckboxHTML(checkboxesContainer, filtered);
}

/**
 * Update stored checkbox states from current DOM state
 */
function updateStoredCheckboxStates() {
  const container = document.getElementById('scarab-selection');
  if (!container) return;

  const checkboxesContainer = container.querySelector('#scarab-checkboxes');
  if (!checkboxesContainer) return;

  // Update stored states based on current DOM
  allScarabCheckboxes.forEach(item => {
    const checkbox = checkboxesContainer.querySelector(`input[data-scarab-id="${item.scarab.id}"]`);
    if (checkbox) {
      item.isChecked = checkbox.checked;
    }
  });
}

/**
 * Update selected count display
 */
function updateSelectedCount() {
  const container = document.getElementById('scarab-selection');
  if (!container) return;

  const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
  const countSpan = container.querySelector('#selected-count');
  
  if (countSpan) {
    countSpan.textContent = `${checkboxes.length} selected`;
    
    // Update color based on selection
    if (checkboxes.length < 1) {
      countSpan.style.color = '#f44336';
    } else {
      countSpan.style.color = '#4caf50';
    }
  }
}

/**
 * Validate configuration and show errors
 * @param {HTMLElement} container
 */
function validateConfigurationUI(container) {
  const config = getConfigurationFromUI(container);
  if (!config) return false;

  const validation = validateConfiguration(createConfiguration(config), currentScarabs);
  const errorContainer = container.querySelector('#validation-errors');
  
  if (!validation.valid) {
    if (errorContainer) {
      errorContainer.textContent = validation.error;
      errorContainer.style.display = 'block';
    }
    return false;
  } else {
    if (errorContainer) {
      errorContainer.style.display = 'none';
    }
    return true;
  }
}

/**
 * Get configuration from UI inputs
 * @param {HTMLElement} container
 * @returns {Object|null}
 */
function getConfigurationFromUI(container) {
  const checkboxes = container.querySelectorAll('#scarab-checkboxes input[type="checkbox"]:checked');
  const selectedIds = Array.from(checkboxes).map(cb => cb.dataset.scarabId);
  
  const transactionCount = parseInt(container.querySelector('#transaction-count').value) || 100;
  const rareThresholdPercent = parseFloat(container.querySelector('#rare-scarab-threshold').value) || 10;
  const rareScarabThreshold = rareThresholdPercent / 100;

  // Calculate breakeven point automatically: (average input value per transaction) × (number of transactions)
  // For user_selected strategy, calculate average since we randomly select 3 from all selected
  let breakevenPoint = 0;
  if (selectedIds.length >= 3) {
    const selectedScarabs = currentScarabs.filter(s => selectedIds.includes(s.id));
    const validScarabs = selectedScarabs.filter(s => s.hasDropWeight() && s.hasPriceData());
    if (validScarabs.length >= 3) {
      // Calculate average value of all selected scarabs, then multiply by 3
      const totalValue = validScarabs.reduce((sum, s) => sum + s.chaosValue, 0);
      const averageValue = totalValue / validScarabs.length;
      const averageInputValuePerTransaction = averageValue * 3;
      breakevenPoint = averageInputValuePerTransaction * transactionCount;
    }
  }

  const continueMode = container.querySelector('#continue-mode')?.checked || false;

  return {
    selectedScarabIds: selectedIds,
    transactionCount,
    breakevenPoint,
    rareScarabThreshold,
    inputScarabStrategy: 'user_selected',
    continueMode,
  };
}

/**
 * Run new simulation using simulationService
 * @param {HTMLElement} container
 */
async function runNewSimulation(container) {
  // Validate configuration
  if (!validateConfigurationUI(container)) {
    return;
  }

  const configData = getConfigurationFromUI(container);
  const config = createConfiguration(configData);
  
  // Save configuration
  saveConfiguration(config);

  const runButton = container.querySelector('#run-simulation');
  const cancelButton = container.querySelector('#cancel-simulation');
  const progressContainer = container.querySelector('#simulation-progress-container');
  const resultsContainer = container.querySelector('#simulation-results');
  const historyContainer = container.querySelector('#transaction-history-container');

  // Disable run button, show progress
  runButton.disabled = true;
  if (cancelButton) cancelButton.style.display = 'inline-block';
  if (progressContainer) progressContainer.style.visibility = 'visible';
  if (resultsContainer) resultsContainer.style.display = 'none';
  if (historyContainer) historyContainer.style.display = 'none';
  
  // Clear yield counts from main views to prevent leakage
  const mainListView = document.getElementById('list-view');
  if (mainListView) {
    clearListViewYieldCounts(mainListView); // Pass container to trigger re-render
  }
  clearGridViewYieldCounts();
  
  // Initialize views (they're always visible now)
  const viewsContainer = container.querySelector('#simulation-views');
  const scarabListInner = container.querySelector('#scarab-list-container');
  if (scarabListInner) {
    scarabListInner.innerHTML = '<p class="loading-text">Waiting for first transaction...</p>';
  }
  
  // Initialize grid view if not already initialized
  await initializeSimulationGridView(container);
  
  // Sync height after views are shown and grid is initialized
  setTimeout(() => {
    syncListWrapperHeight(container);
  }, 100);

  try {
    // Run simulation with progress updates
    const result = await runSimulation(config, currentScarabs, (progress, current, total, yieldCounts, phase, remainingBelowThreshold) => {
      updateProgress(container, progress, current, total, phase, remainingBelowThreshold);
      // Update views in real-time (only simulation views, not main views)
      if (yieldCounts) {
        updateSimulationScarabList(container, yieldCounts);
        // Update simulation grid view with yield counts
        // The simulation grid canvas sets currentCanvas when initialized, so this will update it
        setGridViewYieldCounts(yieldCounts);
      }
    }, currentThreshold);

    currentSimulationResult = result;

    // Hide progress, show results
    if (progressContainer) progressContainer.style.visibility = 'hidden';
    if (cancelButton) cancelButton.style.display = 'none';
    runButton.disabled = false;

    // Keep views visible with final counts
    const viewsContainer = container.querySelector('#simulation-views');
    if (viewsContainer && result) {
      const yieldCountsMap = getYieldCounts(result);
      updateSimulationScarabList(container, yieldCountsMap);
      // Update simulation grid view with final yield counts
      setGridViewYieldCounts(yieldCountsMap);
    }

    // Display results
    displayResults(container, result);
    
    // Save results
    saveSimulationResult(result);

  } catch (error) {
    console.error('Simulation error:', error);
    
    // Show user-friendly error message
    const errorMessage = error.message === 'Simulation cancelled by user' 
      ? 'Simulation was cancelled'
      : `Simulation failed: ${error.message}`;
    
    alert(errorMessage);
    
    // Reset UI
    if (progressContainer) progressContainer.style.visibility = 'hidden';
    if (cancelButton) cancelButton.style.display = 'none';
    runButton.disabled = false;
    
    // Keep views visible on error (they're always visible now)
    // Clear yield counts from main views to prevent leakage
    const viewsContainer = container.querySelector('#simulation-views');
    if (viewsContainer) {
      const scarabListInner = container.querySelector('#scarab-list-container');
      if (scarabListInner) {
        scarabListInner.innerHTML = '<p class="loading-text">Simulation failed. Run a new simulation to see results.</p>';
      }
    }
    clearListViewYieldCounts();
    clearGridViewYieldCounts();
  }
}

/**
 * Update progress indicator
 * @param {HTMLElement} container
 * @param {number} progress - Progress percentage (0-100)
 * @param {number} current - Current transaction number
 * @param {number} total - Total initial transactions
 * @param {string} phase - Current phase: 'initial' or 'continue'
 * @param {number} remainingBelowThreshold - Number of scarabs below threshold remaining (for continue mode)
 */
function updateProgress(container, progress, current, total, phase = 'initial', remainingBelowThreshold = null) {
  const progressFill = container.querySelector('#progress-fill');
  const progressPercent = container.querySelector('#progress-percent');
  const progressDetails = container.querySelector('#progress-details');

  if (progressFill) {
    // For continue mode, show 100% when in continue phase
    const displayProgress = phase === 'continue' ? 100 : progress;
    progressFill.style.width = `${displayProgress}%`;
  }
  if (progressPercent) {
    const displayProgress = phase === 'continue' ? 100 : progress;
    progressPercent.textContent = `${Math.round(displayProgress)}%`;
  }
  if (progressDetails) {
    if (phase === 'continue') {
      const continueCount = current - total;
      let details = `Continue Mode: ${continueCount.toLocaleString()} additional transaction${continueCount !== 1 ? 's' : ''}`;
      if (remainingBelowThreshold !== null) {
        details += ` (${remainingBelowThreshold} scarab${remainingBelowThreshold !== 1 ? 's' : ''} below threshold remaining)`;
      }
      progressDetails.textContent = details;
    } else {
      progressDetails.textContent = `Transaction ${current.toLocaleString()} of ${total.toLocaleString()}`;
    }
  }
}

/**
 * Update simulation scarab list with real-time yield counts
 * @param {HTMLElement} container
 * @param {Map<string, number>} yieldCounts - Map of scarab ID to count
 */
function updateSimulationScarabList(container, yieldCounts) {
  const listContainer = container.querySelector('#scarab-list-container');
  if (!listContainer) return;

  if (!yieldCounts || yieldCounts.size === 0) {
    listContainer.innerHTML = '<p class="loading-text">Waiting for first transaction...</p>';
    return;
  }
  
  // Sync height after updating list
  syncListWrapperHeight(container);

  // Convert yield counts to array and sort by count (descending)
  const scarabEntries = Array.from(yieldCounts.entries())
    .map(([scarabId, count]) => {
      const scarab = currentScarabs.find(s => s.id === scarabId);
      return {
        id: scarabId,
        name: scarab?.name || scarabId,
        count,
        chaosValue: scarab?.chaosValue || null,
        dropWeight: scarab?.dropWeight || null,
        imagePath: `/assets/scarabs/${scarabId}.png`,
      };
    })
    .sort((a, b) => b.count - a.count); // Sort by count descending

  // Calculate total transactions for percentage
  const totalTransactions = Array.from(yieldCounts.values()).reduce((sum, count) => sum + count, 0);

  // Use the same list view structure as main view
  listContainer.innerHTML = `
    <div class="scarab-list-header">
      <div class="scarab-header-cell image-cell"></div>
      <div class="scarab-header-cell name-cell">Name</div>
      <div class="scarab-header-cell value-cell">Value</div>
      <div class="scarab-header-cell yield-cell">Count</div>
      <div class="scarab-header-cell yield-cell">%</div>
    </div>
    <div class="scarab-list">
      ${scarabEntries.map(scarab => `
        <div class="scarab-item compact" data-scarab-id="${scarab.id}">
          <img class="scarab-image" src="${scarab.imagePath}" alt="${scarab.name}" onerror="this.style.display='none'">
          <span class="scarab-name">${scarab.name}</span>
          <span class="scarab-value">
            ${scarab.chaosValue !== null ? `${scarab.chaosValue.toFixed(2)}c` : 'N/A'}
          </span>
          <span class="scarab-yield">${scarab.count.toLocaleString()}</span>
          <span class="scarab-yield">${((scarab.count / totalTransactions) * 100).toFixed(2)}%</span>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Display simulation results
 * @param {HTMLElement} container
 * @param {SimulationResult} result
 */
function displayResults(container, result) {
  const resultsContainer = container.querySelector('#simulation-results');
  if (!resultsContainer) return;

  const profitLoss = result.netProfitLoss;
  const profitLossColor = getProfitLossColor(profitLoss);
  const isProfit = profitLoss > 0;
  const sign = isProfit ? '+' : '';

  // Get significant events
  const events = getSignificantEvents(result);
  const rareScarabEvents = events.filter(e => e.type === 'rare_scarab_return');
  const breakevenEvents = events.filter(e => e.type === 'breakeven_achieved');

  // Get yield counts summary (top 10)
  const yieldCounts = getYieldCounts(result);
  const yieldCountsArray = Array.from(yieldCounts.entries())
    .map(([id, count]) => {
      const scarab = currentScarabs.find(s => s.id === id);
      return { id, name: scarab?.name || id, count, percentage: (count / result.totalTransactions) * 100 };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  resultsContainer.style.display = 'block';
  resultsContainer.innerHTML = `
    <h3>Simulation Results</h3>
    <div class="results-summary">
      <div class="result-item">
        <span class="result-label">Transactions:</span>
        <span class="result-value">${result.totalTransactions.toLocaleString()}</span>
      </div>
      <div class="result-item highlight">
        <span class="result-label">Net Profit/Loss:</span>
        <span class="result-value" style="color: ${profitLossColor}; font-weight: bold;">
          ${sign}${profitLoss.toFixed(2)} chaos
        </span>
      </div>
      <div class="result-item">
        <span class="result-label">Per Transaction:</span>
        <span class="result-value" style="color: ${profitLossColor};">
          ${sign}${result.averageProfitLossPerTransaction.toFixed(4)} chaos
        </span>
      </div>
      <div class="result-item">
        <span class="result-label">Total Input Value:</span>
        <span class="result-value">${result.totalInputValue.toFixed(2)} chaos</span>
      </div>
      <div class="result-item">
        <span class="result-label">Total Output Value:</span>
        <span class="result-value">${result.totalOutputValue.toFixed(2)} chaos</span>
      </div>
      <div class="result-item">
        <span class="result-label">Final Cumulative:</span>
        <span class="result-value" style="color: ${getProfitLossColor(result.finalCumulativeProfitLoss)};">
          ${result.finalCumulativeProfitLoss >= 0 ? '+' : ''}${result.finalCumulativeProfitLoss.toFixed(2)} chaos
        </span>
      </div>
      <div class="result-item">
        <span class="result-label">Execution Time:</span>
        <span class="result-value">${(result.executionTimeMs / 1000).toFixed(2)}s</span>
      </div>
    </div>

    ${events.length > 0 ? `
    <div class="significant-events">
      <h4 class="collapsible-header" data-target="significant-events-content">
        <span class="collapse-icon">▶</span>
        Significant Events (${events.length})
      </h4>
      <div class="events-list" id="significant-events-content" style="display: none;">
        ${rareScarabEvents.length > 0 ? `
        <div class="event-group">
          <strong>Rare Scarab Returns (${rareScarabEvents.length}):</strong>
          <ul>
            ${rareScarabEvents.map(e => {
              const scarab = currentScarabs.find(s => s.id === e.scarabId);
              return `<li>Transaction #${e.transactionNumber.toLocaleString()}: ${scarab?.name || e.scarabId}</li>`;
            }).join('')}
          </ul>
        </div>
        ` : ''}
        ${breakevenEvents.length > 0 ? `
        <div class="event-group">
          <strong>Breakeven Achieved (${breakevenEvents.length}):</strong>
          <ul>
            ${breakevenEvents.map(e => `
              <li>Transaction #${e.transactionNumber.toLocaleString()}: Cumulative ${e.cumulativeProfitLoss >= 0 ? '+' : ''}${e.cumulativeProfitLoss.toFixed(2)}c</li>
            `).join('')}
          </ul>
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}

    <div class="yield-counts-summary">
      <h4>Top Yield Counts</h4>
      <div class="yield-list">
        ${yieldCountsArray.map(y => `
          <div class="yield-item">
            <span class="yield-name">${y.name}:</span>
            <span class="yield-count">${y.count.toLocaleString()} (${y.percentage.toFixed(2)}%)</span>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="results-actions">
      <button id="view-transaction-history" class="view-history-btn">View Transaction History</button>
    </div>
  `;

  // Setup transaction history button
  const historyButton = resultsContainer.querySelector('#view-transaction-history');
  if (historyButton) {
    historyButton.addEventListener('click', () => {
      showTransactionHistory(container, result);
    });
  }
  
  // Setup collapsible significant events
  const collapsibleHeader = resultsContainer.querySelector('.collapsible-header');
  if (collapsibleHeader) {
    collapsibleHeader.addEventListener('click', () => {
      const targetId = collapsibleHeader.getAttribute('data-target');
      const content = resultsContainer.querySelector(`#${targetId}`);
      const icon = collapsibleHeader.querySelector('.collapse-icon');
      
      if (content && icon) {
        const isCollapsed = content.style.display === 'none';
        content.style.display = isCollapsed ? 'block' : 'none';
        icon.textContent = isCollapsed ? '▼' : '▶';
      }
    });
  }
}

/**
 * Show transaction history
 * @param {HTMLElement} container
 * @param {SimulationResult} result
 */
function showTransactionHistory(container, result) {
  const historyContainer = container.querySelector('#transaction-history-container');
  if (!historyContainer) return;

  historyContainer.style.display = 'block';
  historyContainer.innerHTML = '<div id="transaction-history"></div>';

  const historyDiv = historyContainer.querySelector('#transaction-history');
  historyDiv.dataset.currentPage = '1';
  historyDiv.dataset.totalPages = '1';
  
  // Load first page
  let currentPage = 1;
  let currentPageSize = 100;
  let currentFilter = {};
  
  const loadHistory = () => {
    const historyData = getTransactionHistory(result, { 
      page: currentPage, 
      pageSize: currentPageSize,
      filter: currentFilter,
    });
    renderTransactionHistory(historyDiv, historyData.transactions, historyData);
    historyDiv.dataset.currentPage = historyData.page;
    historyDiv.dataset.totalPages = historyData.totalPages;
  };
  
  loadHistory();

  // Setup pagination listeners (need to find the transaction-list div)
  const transactionListDiv = historyDiv.querySelector('#transaction-list') || historyDiv;
  setupTransactionHistoryListeners(transactionListDiv, (page, pageSize) => {
    currentPage = page;
    currentPageSize = pageSize;
    loadHistory();
  }, (transactionNumber) => {
    // Scroll to transaction in history
    const transactionItem = transactionListDiv.querySelector(`[data-transaction-number="${transactionNumber}"]`);
    if (transactionItem) {
      transactionItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      transactionItem.style.backgroundColor = '#ffff00';
      setTimeout(() => {
        transactionItem.style.backgroundColor = '';
      }, 2000);
    }
  });
  
  // Setup search and filter
  const searchInput = historyDiv.closest('.transaction-history').querySelector('#transaction-search');
  const minInput = historyDiv.closest('.transaction-history').querySelector('#min-transaction');
  const maxInput = historyDiv.closest('.transaction-history').querySelector('#max-transaction');
  const clearFiltersBtn = historyDiv.closest('.transaction-history').querySelector('#clear-filters');
  
  const applyFilters = () => {
    currentFilter = {};
    if (searchInput && searchInput.value.trim()) {
      // Filter by scarab ID (partial match)
      const searchTerm = searchInput.value.trim();
      currentFilter.searchTerm = searchTerm;
    }
    if (minInput && minInput.value) {
      const minVal = parseInt(minInput.value);
      if (!isNaN(minVal)) {
        currentFilter.minTransactionNumber = minVal;
      }
    }
    if (maxInput && maxInput.value) {
      const maxVal = parseInt(maxInput.value);
      if (!isNaN(maxVal)) {
        currentFilter.maxTransactionNumber = maxVal;
      }
    }
    currentPage = 1;
    loadHistory();
  };
  
  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }
  if (minInput) {
    minInput.addEventListener('input', applyFilters);
  }
  if (maxInput) {
    maxInput.addEventListener('input', applyFilters);
  }
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (minInput) minInput.value = '';
      if (maxInput) maxInput.value = '';
      currentFilter = {};
      currentPage = 1;
      loadHistory();
    });
  }
}

/**
 * Save configuration to LocalStorage
 * @param {SimulationConfiguration} config
 */
function saveConfiguration(config) {
  try {
    const configData = {
      selectedScarabIds: config.selectedScarabIds,
      // breakevenPoint is now calculated automatically, don't save it
      rareScarabThreshold: config.rareScarabThreshold,
      transactionCount: config.transactionCount,
      inputScarabStrategy: config.inputScarabStrategy,
      continueMode: config.continueMode,
      createdAt: config.createdAt,
    };
    localStorage.setItem('scarabHub_simulationConfig', JSON.stringify(configData));
  } catch (error) {
    console.error('Failed to save configuration:', error);
  }
}

/**
 * Load configuration from LocalStorage
 * @returns {Object|null}
 */
function loadConfiguration() {
  try {
    const configData = localStorage.getItem('scarabHub_simulationConfig');
    if (configData) {
      return JSON.parse(configData);
    }
  } catch (error) {
    console.error('Failed to load configuration:', error);
  }
  return null;
}

/**
 * Save simulation result to LocalStorage
 * @param {SimulationResult} result
 */
function saveSimulationResult(result) {
  try {
    const results = JSON.parse(localStorage.getItem('scarabHub_simulationResults') || '[]');
    
    // Convert Map to object for JSON serialization
    // Also convert transactions array (may be large, so we could optimize this)
    const resultData = {
      simulationId: result.simulationId,
      configuration: {
        selectedScarabIds: result.configuration.selectedScarabIds,
        breakevenPoint: result.configuration.breakevenPoint,
        rareScarabThreshold: result.configuration.rareScarabThreshold,
        transactionCount: result.configuration.transactionCount,
        inputScarabStrategy: result.configuration.inputScarabStrategy,
        createdAt: result.configuration.createdAt,
      },
      yieldCounts: Object.fromEntries(result.yieldCounts),
      totalTransactions: result.totalTransactions,
      totalInputValue: result.totalInputValue,
      totalOutputValue: result.totalOutputValue,
      netProfitLoss: result.netProfitLoss,
      averageProfitLossPerTransaction: result.averageProfitLossPerTransaction,
      finalCumulativeProfitLoss: result.finalCumulativeProfitLoss,
      significantEvents: result.significantEvents.map(e => ({
        type: e.type,
        transactionNumber: e.transactionNumber,
        scarabId: e.scarabId,
        cumulativeProfitLoss: e.cumulativeProfitLoss,
        details: e.details,
      })),
      // Store only transaction metadata for large simulations (not full objects)
      transactions: result.transactions.length > 100000 
        ? result.transactions.map(t => ({
            transactionNumber: t.transactionNumber,
            returnedScarabId: t.returnedScarabId,
            profitLoss: t.profitLoss,
            cumulativeProfitLoss: t.cumulativeProfitLoss,
          }))
        : result.transactions,
      completedAt: result.completedAt,
      executionTimeMs: result.executionTimeMs,
    };
    
    results.push(resultData);
    
    // Keep only last 10 results
    if (results.length > 10) {
      results.shift();
    }
    
    localStorage.setItem('scarabHub_simulationResults', JSON.stringify(results));
  } catch (error) {
    console.error('Failed to save simulation result:', error);
    // If storage quota exceeded, try to clear old results
    if (error.name === 'QuotaExceededError') {
      try {
        localStorage.setItem('scarabHub_simulationResults', JSON.stringify([resultData]));
      } catch (e) {
        console.error('Failed to save even after clearing:', e);
      }
    }
  }
}

/**
 * Initialize grid view for simulation
 * @param {HTMLElement} container
 */
async function initializeSimulationGridView(container) {
  const canvas = container.querySelector('#simulation-grid-canvas');
  if (!canvas) return;
  
  // Check if already initialized
  if (canvas.dataset.initialized === 'true') {
    return;
  }
  
  try {
    // Store reference to simulation canvas
    simulationGridCanvas = canvas;
    
    // Initialize grid view with all scarabs
    await initGridView(canvas, currentScarabs, '/assets/Scarab-tab.png');
    canvas.dataset.initialized = 'true';
    
    // Setup toggle button for cell backgrounds
    const toggleButton = container.querySelector('#toggle-cell-backgrounds');
    if (toggleButton) {
      // Set initial state (should be false for simulation mode)
      const showBackgrounds = getShowCellBackgrounds();
      toggleButton.dataset.showBackgrounds = showBackgrounds;
      toggleButton.title = showBackgrounds ? 'Hide Cell Backgrounds' : 'Show Cell Backgrounds';
      
      toggleButton.addEventListener('click', () => {
        const currentState = toggleButton.dataset.showBackgrounds === 'true';
        const newState = !currentState;
        setShowCellBackgrounds(newState);
        toggleButton.dataset.showBackgrounds = newState;
        toggleButton.title = newState ? 'Hide Cell Backgrounds' : 'Show Cell Backgrounds';
      });
    }
    
    // Sync list wrapper height with grid canvas height (same as main view)
    // Use requestAnimationFrame to ensure canvas is fully rendered
    requestAnimationFrame(() => {
      syncListWrapperHeight(container);
    });
  } catch (error) {
    console.error('Error initializing simulation grid view:', error);
  }
}

/**
 * Sync list wrapper height with grid canvas height
 * @param {HTMLElement} container
 */
function syncListWrapperHeight(container) {
  const canvas = container.querySelector('#simulation-grid-canvas');
  const listWrapper = container.querySelector('.list-wrapper');
  
  if (canvas && listWrapper && canvas.offsetHeight > 0) {
    listWrapper.style.height = `${canvas.offsetHeight}px`;
    listWrapper.style.maxHeight = `${canvas.offsetHeight}px`;
  }
}

/**
 * Restore simulation results when switching back to simulation page
 * @param {HTMLElement} container
 */
function restoreSimulationResults(container) {
  if (!currentSimulationResult) {
    return;
  }

  // Get yield counts from the saved result
  const yieldCountsMap = getYieldCounts(currentSimulationResult);
  
  if (yieldCountsMap && yieldCountsMap.size > 0) {
    // Restore yield counts to grid view
    // The grid should be initialized by now (called after initializeSimulationGridView promise resolves)
    setGridViewYieldCounts(yieldCountsMap);
  }

  // Restore list view with yield counts
  updateSimulationScarabList(container, yieldCountsMap);

  // Restore results display
  displayResults(container, currentSimulationResult);
}

/**
 * Get human-readable strategy label
 * @param {string} strategyType
 * @returns {string}
 */
function getStrategyLabel(strategyType) {
  switch (strategyType) {
    case 'optimized':
      return 'Optimized (Profitable Only)';
    case 'user_chosen':
      return 'User-Chosen';
    case 'random':
      return 'Random';
    default:
      return strategyType;
  }
}

