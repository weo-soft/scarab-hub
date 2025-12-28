/**
 * Threshold Display Component
 * Displays the calculated expected value threshold
 */

/**
 * Create and render threshold display
 * @param {HTMLElement} container - Container element
 * @param {ExpectedValueThreshold} threshold - Threshold data
 * @param {string} currency - 'chaos' or 'divine'
 * @param {number} currentConfidencePercentile - Current confidence percentile (0-1)
 * @param {Function} onConfidenceChange - Callback when confidence percentile changes
 * @param {string} currentTradeMode - Current trade mode ('returnable', 'lowest_value', 'optimal_combination')
 * @param {Function} onTradeModeChange - Callback when trade mode changes
 */
export function renderThresholdDisplay(container, threshold, currency = 'chaos', currentConfidencePercentile = 0.9, onConfidenceChange = null, currentTradeMode = 'returnable', onTradeModeChange = null) {
  if (!container || !threshold) {
    console.error('Threshold display: missing container or threshold');
    return;
  }

  const value = currency === 'divine' 
    ? (threshold.value / 150).toFixed(4) // Approximate conversion
    : threshold.value.toFixed(2);

  const currencySymbol = currency === 'divine' ? 'Div' : 'c';
  
  // Calculate and display additional statistics
  const confidencePercent = threshold.confidencePercentile 
    ? (threshold.confidencePercentile * 100).toFixed(0) 
    : '90';
  const expectedValueDisplay = currency === 'divine'
    ? (threshold.expectedValue / 150).toFixed(4)
    : threshold.expectedValue.toFixed(2);
  const stdDevDisplay = currency === 'divine'
    ? (threshold.standardDeviation / 150).toFixed(4)
    : threshold.standardDeviation.toFixed(2);

  // Confidence percentile options
  const confidenceOptions = [
    { value: 0.80, label: '80%' },
    { value: 0.85, label: '85%' },
    { value: 0.90, label: '90%' },
    { value: 0.95, label: '95%' },
    { value: 0.99, label: '99%' },
  ];

  // Trade mode options
  const tradeModeOptions = [
    { value: 'returnable', label: 'Returnable (Current)', description: 'Input scarabs can be returned from vendor' },
    { value: 'lowest_value', label: 'Lowest Value', description: 'Three of the same lowest value scarab are used' },
    { value: 'optimal_combination', label: 'Optimal Combination', description: 'Optimal combination (low value, high weighting)' },
  ];

  container.innerHTML = `
    <div class="threshold-display">
      <div class="threshold-header">
        <h2>Economic Threshold</h2>
        <div class="threshold-controls">
          <div class="confidence-selector">
            <label for="confidence-percentile">Certainty:</label>
            <select id="confidence-percentile" class="confidence-select">
              ${confidenceOptions.map(opt => 
                `<option value="${opt.value}" ${Math.abs(currentConfidencePercentile - opt.value) < 0.01 ? 'selected' : ''}>${opt.label}</option>`
              ).join('')}
            </select>
          </div>
        </div>
      </div>
      <div class="trade-mode-selector">
        <label for="trade-mode">Trade Mode:</label>
        <select id="trade-mode" class="trade-mode-select">
          ${tradeModeOptions.map(opt => 
            `<option value="${opt.value}" ${currentTradeMode === opt.value ? 'selected' : ''} title="${opt.description}">${opt.label}</option>`
          ).join('')}
        </select>
        <div class="trade-mode-description">
          ${tradeModeOptions.find(opt => opt.value === currentTradeMode)?.description || ''}
        </div>
      </div>
      <div class="threshold-value">
        <span class="value">${value}</span>
        <span class="currency">${currencySymbol}</span>
      </div>
      <p class="threshold-description">
        Scarabs below this value are profitable to vendor using the 3-to-1 recipe with ${confidencePercent}% certainty.
      </p>
      <div class="threshold-meta">
        <span>Based on ${threshold.scarabCount} Scarabs</span>
        <span>•</span>
        <span>Total Weight: ${threshold.totalWeight.toFixed(0)}</span>
      </div>
      <div class="threshold-details" style="margin-top: 10px; font-size: 0.85em; color: #666;">
        <div>Expected Value: ${expectedValueDisplay} ${currencySymbol}</div>
        <div>Std Deviation: ${stdDevDisplay} ${currencySymbol}</div>
        <div>Confidence: ${confidencePercent}%</div>
      </div>
    </div>
  `;

  // Attach event listener for confidence percentile change
  if (onConfidenceChange) {
    const select = container.querySelector('#confidence-percentile');
    if (select) {
      select.addEventListener('change', (e) => {
        const newPercentile = parseFloat(e.target.value);
        onConfidenceChange(newPercentile);
      });
    }
  }

  // Attach event listener for trade mode change
  if (onTradeModeChange) {
    const tradeModeSelect = container.querySelector('#trade-mode');
    const descriptionElement = container.querySelector('.trade-mode-description');
    
    if (tradeModeSelect) {
      tradeModeSelect.addEventListener('change', (e) => {
        const newMode = e.target.value;
        
        // Update description
        if (descriptionElement) {
          const selectedOption = tradeModeOptions.find(opt => opt.value === newMode);
          descriptionElement.textContent = selectedOption?.description || '';
        }
        
        onTradeModeChange(newMode);
      });
    }
  }
}

/**
 * Update threshold display with new value
 * @param {HTMLElement} container
 * @param {ExpectedValueThreshold} threshold
 * @param {string} currency
 * @param {number} currentConfidencePercentile
 * @param {Function} onConfidenceChange
 * @param {string} currentTradeMode
 * @param {Function} onTradeModeChange
 */
export function updateThresholdDisplay(container, threshold, currency = 'chaos', currentConfidencePercentile = 0.9, onConfidenceChange = null, currentTradeMode = 'returnable', onTradeModeChange = null) {
  renderThresholdDisplay(container, threshold, currency, currentConfidencePercentile, onConfidenceChange, currentTradeMode, onTradeModeChange);
}

