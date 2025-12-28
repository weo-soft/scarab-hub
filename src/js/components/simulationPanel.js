/**
 * Simulation Panel Component
 * Provides controls and results for vendoring simulations
 */

import { Simulation } from '../models/scarab.js';
import {
  calculateOptimizedStrategy,
  calculateUserChosenStrategy,
  calculateRandomStrategy,
} from '../services/calculationService.js';
import { getProfitLossColor } from '../utils/colorUtils.js';

let currentScarabs = [];
let currentThreshold = null;

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

  container.innerHTML = `
    <div class="simulation-panel">
      <h2>Vendoring Simulation</h2>
      <p class="simulation-description">
        Explore long-term outcomes of different vendoring strategies
      </p>
      
      <div class="simulation-controls">
        <div class="strategy-selector">
          <label>Strategy:</label>
          <select id="strategy-type" aria-label="Select simulation strategy">
            <option value="optimized">Optimized (only profitable Scarabs)</option>
            <option value="user_chosen">User-Chosen (select specific Scarabs)</option>
            <option value="random">Random (all Scarabs equally likely)</option>
          </select>
        </div>

        <div id="scarab-selection" class="scarab-selection" style="display: none;">
          <label>Select Scarabs to Vendor (minimum 3):</label>
          <div class="scarab-checkboxes" id="scarab-checkboxes"></div>
          <div class="selection-info">
            <span id="selected-count">0 selected</span>
          </div>
        </div>

        <div class="transaction-input">
          <label for="transaction-count">Number of Transactions:</label>
          <input 
            type="number" 
            id="transaction-count" 
            min="1" 
            max="10000" 
            value="100"
            aria-label="Number of vendor transactions"
          />
        </div>

        <button id="run-simulation" class="run-btn">Run Simulation</button>
      </div>

      <div id="simulation-results" class="simulation-results" style="display: none;"></div>
    </div>
  `;

  // Attach event listeners
  setupEventListeners(container);
}

/**
 * Setup event listeners for simulation panel
 * @param {HTMLElement} container
 */
function setupEventListeners(container) {
  const strategySelect = container.querySelector('#strategy-type');
  const transactionInput = container.querySelector('#transaction-count');
  const runButton = container.querySelector('#run-simulation');
  const scarabSelection = container.querySelector('#scarab-selection');
  const scarabCheckboxes = container.querySelector('#scarab-checkboxes');

  // Handle strategy change
  strategySelect.addEventListener('change', (e) => {
    const strategy = e.target.value;
    if (strategy === 'user_chosen') {
      scarabSelection.style.display = 'block';
      renderScarabCheckboxes(scarabCheckboxes);
    } else {
      scarabSelection.style.display = 'none';
    }
  });

  // Handle run simulation
  runButton.addEventListener('click', () => {
    runSimulation(container);
  });

  // Handle transaction count validation
  transactionInput.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    if (value < 1) e.target.value = 1;
    if (value > 10000) e.target.value = 10000;
  });
}

/**
 * Render checkboxes for Scarab selection
 * @param {HTMLElement} container
 */
function renderScarabCheckboxes(container) {
  if (!currentScarabs || currentScarabs.length === 0) {
    container.innerHTML = '<p>No Scarabs available</p>';
    return;
  }

  // Only show profitable Scarabs for selection
  const profitableScarabs = currentScarabs.filter(
    s => s.profitabilityStatus === 'profitable' && s.hasPriceData()
  );

  if (profitableScarabs.length === 0) {
    container.innerHTML = '<p>No profitable Scarabs available for selection</p>';
    return;
  }

  container.innerHTML = profitableScarabs.map(scarab => `
    <label class="scarab-checkbox">
      <input type="checkbox" value="${scarab.id}" data-scarab-id="${scarab.id}">
      <span>${scarab.name} (${scarab.chaosValue?.toFixed(2)}c)</span>
    </label>
  `).join('');

  // Update selected count on change
  const checkboxes = container.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', updateSelectedCount);
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
    
    // Validate minimum
    if (checkboxes.length < 3) {
      countSpan.style.color = '#f44336';
    } else {
      countSpan.style.color = '#4caf50';
    }
  }
}

/**
 * Run simulation
 * @param {HTMLElement} container
 */
function runSimulation(container) {
  const strategySelect = container.querySelector('#strategy-type');
  const transactionInput = container.querySelector('#transaction-count');
  const resultsContainer = container.querySelector('#simulation-results');

  const strategyType = strategySelect.value;
  const transactionCount = parseInt(transactionInput.value) || 100;

  // Validate transaction count
  if (transactionCount < 1 || transactionCount > 10000) {
    alert('Transaction count must be between 1 and 10000');
    return;
  }

  let selectedScarabs = [];
  if (strategyType === 'user_chosen') {
    const checkboxes = container.querySelectorAll('#scarab-checkboxes input[type="checkbox"]:checked');
    const selectedIds = Array.from(checkboxes).map(cb => cb.dataset.scarabId);
    selectedScarabs = currentScarabs.filter(s => selectedIds.includes(s.id));

    if (selectedScarabs.length < 3) {
      alert('Please select at least 3 Scarabs for user-chosen strategy');
      return;
    }
  }

  // Create simulation
  const simulation = new Simulation(strategyType, selectedScarabs.map(s => s.id), transactionCount);
  const validation = simulation.validate();
  
  if (!validation.valid) {
    alert(validation.error);
    return;
  }

  try {
    // Calculate results based on strategy
    let results;
    switch (strategyType) {
      case 'optimized':
        results = calculateOptimizedStrategy(currentScarabs, currentThreshold, transactionCount);
        break;
      case 'user_chosen':
        results = calculateUserChosenStrategy(selectedScarabs, currentThreshold, transactionCount);
        break;
      case 'random':
        results = calculateRandomStrategy(currentScarabs, currentThreshold, transactionCount);
        break;
      default:
        throw new Error(`Unknown strategy: ${strategyType}`);
    }

    // Update simulation with results
    simulation.expectedProfitLoss = results.netProfitLoss;
    simulation.results = results;

    // Display results
    displayResults(resultsContainer, simulation, results);

  } catch (error) {
    console.error('Simulation error:', error);
    alert(`Simulation failed: ${error.message}`);
  }
}

/**
 * Display simulation results
 * @param {HTMLElement} container
 * @param {Simulation} simulation
 * @param {object} results
 */
function displayResults(container, simulation, results) {
  if (!container) return;

  const profitLoss = results.netProfitLoss;
  const profitLossColor = getProfitLossColor(profitLoss);
  const isProfit = profitLoss > 0;
  const sign = isProfit ? '+' : '';

  container.style.display = 'block';
  container.innerHTML = `
    <h3>Simulation Results</h3>
    <div class="results-summary">
      <div class="result-item">
        <span class="result-label">Strategy:</span>
        <span class="result-value">${getStrategyLabel(simulation.strategyType)}</span>
      </div>
      <div class="result-item">
        <span class="result-label">Transactions:</span>
        <span class="result-value">${simulation.transactionCount}</span>
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
          ${sign}${results.profitLossPerTransaction.toFixed(4)} chaos
        </span>
      </div>
      <div class="result-item">
        <span class="result-label">Total Input Value:</span>
        <span class="result-value">${results.totalInputValue.toFixed(2)} chaos</span>
      </div>
      <div class="result-item">
        <span class="result-label">Expected Output Value:</span>
        <span class="result-value">${results.expectedOutputValue.toFixed(2)} chaos</span>
      </div>
    </div>
  `;
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

