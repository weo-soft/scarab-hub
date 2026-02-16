/**
 * Fossil Selection Panel
 * Component for managing Fossil selection (bulk operations)
 */

import { calculateExpectedOutcomeForSelected } from '../services/fossilCalculationService.js';

/**
 * Render selection panel with bulk operation controls
 * @param {HTMLElement} container - Container element
 * @param {Array<Fossil>} fossils - All Fossils
 * @param {Set<string>} selectedIds - Set of selected Fossil IDs
 * @param {Function} onSelectAll - Callback for select all
 * @param {Function} onDeselectAll - Callback for deselect all
 * @param {number} expectedValue - Expected value for the Fossil reroll group
 */
export function renderSelectionPanel(
  container,
  fossils,
  selectedIds,
  onSelectAll,
  onDeselectAll,
  expectedValue = null
) {
  if (!container) {
    console.error('Fossil selection panel: missing container');
    return;
  }

  const selectedCount = selectedIds.size;
  const totalCount = fossils.length;
  const selectedFossils = fossils.filter(f => selectedIds.has(f.id));
  
  // Calculate expected outcome if expectedValue is provided
  let outcomeDisplay = '';
  if (expectedValue !== null && selectedFossils.length > 0) {
    const outcome = calculateExpectedOutcomeForSelected(selectedFossils, expectedValue);
    const netProfitLoss = outcome.netProfitLoss;
    const profitLossClass = netProfitLoss >= 0 ? 'profit' : 'loss';
    const profitLossSign = netProfitLoss >= 0 ? '+' : '';
    
    outcomeDisplay = `
      <div class="expected-outcome">
        <div class="outcome-label">Expected Outcome:</div>
        <div class="outcome-values">
          <span>Input Value: ${outcome.totalInputValue.toFixed(2)} c</span>
          <span>Expected Output: ${outcome.expectedOutputValue.toFixed(2)} c</span>
          <span class="net-${profitLossClass}">Net: ${profitLossSign}${netProfitLoss.toFixed(2)} c</span>
        </div>
      </div>
    `;
  }

  const html = `
    <div class="fossil-selection-panel">
      <div class="selection-stats">
        <span>Selected: ${selectedCount} / ${totalCount}</span>
      </div>
      <div class="selection-actions">
        <button class="btn-select-all" data-action="select-all">Select All</button>
        <button class="btn-deselect-all" data-action="deselect-all">Deselect All</button>
      </div>
      ${outcomeDisplay}
    </div>
  `;

  container.innerHTML = html;

  // Attach event listeners
  setupSelectionPanelListeners(container, onSelectAll, onDeselectAll);
}

/**
 * Setup event listeners for selection panel
 * @param {HTMLElement} container
 * @param {Function} onSelectAll
 * @param {Function} onDeselectAll
 */
function setupSelectionPanelListeners(container, onSelectAll, onDeselectAll) {
  const selectAllBtn = container.querySelector('.btn-select-all');
  const deselectAllBtn = container.querySelector('.btn-deselect-all');

  if (selectAllBtn && onSelectAll) {
    selectAllBtn.addEventListener('click', onSelectAll);
  }

  if (deselectAllBtn && onDeselectAll) {
    deselectAllBtn.addEventListener('click', onDeselectAll);
  }
}

