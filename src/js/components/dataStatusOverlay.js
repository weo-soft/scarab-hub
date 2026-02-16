/**
 * Data Status Overlay Component
 * Shows metadata about price data and allows force refresh
 */

import { getCacheInfo } from '../utils/dataFetcher.js';
import { priceUpdateService } from '../services/priceUpdateService.js';
import { 
  getSelectedLeague, 
  getPriceFileName,
  ITEM_TYPES
} from '../services/leagueService.js';

let onRefreshCallback = null;

/**
 * Format timestamp for display
 * @param {number|null} timestamp - Timestamp in milliseconds
 * @returns {string} Formatted date string
 */
function formatTimestamp(timestamp) {
  if (!timestamp) return 'Not loaded';
  const date = new Date(timestamp);
  return date.toLocaleString();
}

/**
 * Format age for display
 * @param {number|null} age - Age in milliseconds
 * @returns {string} Formatted age string
 */
function formatAge(age) {
  if (!age) return 'N/A';
  const minutes = Math.floor(age / 1000 / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}

/**
 * Get status information for price data
 * @returns {object} Status info with text, color, and class
 */
function getStatusInfo(cacheInfo) {
  if (!cacheInfo.hasCache) {
    return {
      text: 'Not Loaded',
      color: 'grey',
      class: 'status-grey',
    };
  }

  if (cacheInfo.isLocal) {
    return {
      text: 'Local Fallback',
      color: 'warning',
      class: 'status-warning',
    };
  }

  const ageHours = cacheInfo.age / 1000 / 60 / 60;
  if (ageHours < 1) {
    return {
      text: 'Up to Date',
      color: 'success',
      class: 'status-success',
    };
  } else if (ageHours < 24) {
    return {
      text: 'Recent',
      color: 'info',
      class: 'status-info',
    };
  } else {
    return {
      text: 'Outdated',
      color: 'warning',
      class: 'status-warning',
    };
  }
}

/**
 * Get cache info for all item types
 * @returns {Array} Array of objects with itemType, cacheInfo, and statusInfo
 */
function getAllItemTypeStatuses() {
  const activeItemTypes = ITEM_TYPES.filter(t => t.isActive);
  return activeItemTypes.map(itemType => {
    const priceFileName = getPriceFileName(itemType.id);
    const cacheInfo = getCacheInfo(priceFileName);
    const statusInfo = getStatusInfo(cacheInfo);
    return {
      itemType,
      cacheInfo,
      statusInfo,
      fileName: priceFileName
    };
  });
}

/**
 * Get aggregate status summary
 * @param {Array} statuses - Array of item type statuses
 * @returns {object} Summary with counts and overall status
 */
function getAggregateStatus(statuses) {
  let upToDate = 0;
  let recent = 0;
  let outdated = 0;
  let notLoaded = 0;
  let localFallback = 0;
  let oldestTimestamp = null;
  let newestTimestamp = null;

  statuses.forEach(({ cacheInfo, statusInfo }) => {
    if (statusInfo.text === 'Up to Date') upToDate++;
    else if (statusInfo.text === 'Recent') recent++;
    else if (statusInfo.text === 'Outdated') outdated++;
    else if (statusInfo.text === 'Not Loaded') notLoaded++;
    else if (statusInfo.text === 'Local Fallback') localFallback++;

    if (cacheInfo.timestamp) {
      if (!oldestTimestamp || cacheInfo.timestamp < oldestTimestamp) {
        oldestTimestamp = cacheInfo.timestamp;
      }
      if (!newestTimestamp || cacheInfo.timestamp > newestTimestamp) {
        newestTimestamp = cacheInfo.timestamp;
      }
    }
  });

  const total = statuses.length;
  const overallStatus = notLoaded > 0 ? 'warning' : 
                       outdated > 0 ? 'warning' : 
                       localFallback > 0 ? 'info' : 
                       upToDate === total ? 'success' : 'info';

  return {
    total,
    upToDate,
    recent,
    outdated,
    notLoaded,
    localFallback,
    oldestTimestamp,
    newestTimestamp,
    overallStatus
  };
}

/**
 * Render the data status overlay content
 * @param {HTMLElement} container - Container element
 */
export function renderDataStatusOverlay(container) {
  if (!container) {
    console.error('Data status overlay: missing container');
    return;
  }

  const selectedLeague = getSelectedLeague();
  const allStatuses = getAllItemTypeStatuses();
  const aggregate = getAggregateStatus(allStatuses);
  
  // Determine overall status text
  let overallStatusText = 'All Up to Date';
  let overallStatusClass = 'status-success';
  if (aggregate.notLoaded > 0) {
    overallStatusText = `${aggregate.notLoaded} Not Loaded`;
    overallStatusClass = 'status-warning';
  } else if (aggregate.outdated > 0) {
    overallStatusText = `${aggregate.outdated} Outdated`;
    overallStatusClass = 'status-warning';
  } else if (aggregate.localFallback > 0) {
    overallStatusText = `${aggregate.localFallback} Using Local Fallback`;
    overallStatusClass = 'status-info';
  } else if (aggregate.recent > 0) {
    overallStatusText = 'All Recent';
    overallStatusClass = 'status-info';
  }

  // Build item type status list
  const itemTypeList = allStatuses.map(({ itemType, cacheInfo, statusInfo, fileName }) => {
    const ageHours = cacheInfo.age ? cacheInfo.age / 1000 / 60 / 60 : null;
    return `
      <div class="item-type-status-row">
        <div class="item-type-name">
          <span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>
          <span class="item-type-label">${itemType.displayName}</span>
        </div>
        <div class="item-type-details">
          ${cacheInfo.timestamp ? `
            <span class="item-type-age">${formatAge(cacheInfo.age)}</span>
            ${cacheInfo.isLocal ? '<span class="item-type-source">(Local)</span>' : ''}
          ` : '<span class="item-type-age">Not loaded</span>'}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="data-status-content">
      <div class="data-status-section">
        <h3>Price Data Status</h3>
        <div class="data-status-info">
          <div class="status-row">
            <span class="status-label">League:</span>
            <span class="status-value">${selectedLeague ? selectedLeague.name : 'Unknown'}</span>
          </div>
          <div class="status-row">
            <span class="status-label">Item Types:</span>
            <span class="status-value">${aggregate.total} total</span>
          </div>
          <div class="status-row">
            <span class="status-label">Overall Status:</span>
            <span class="status-badge ${overallStatusClass}">${overallStatusText}</span>
          </div>
          ${aggregate.newestTimestamp ? `
            <div class="status-row">
              <span class="status-label">Newest Update:</span>
              <span class="status-value">${formatTimestamp(aggregate.newestTimestamp)}</span>
            </div>
            <div class="status-row">
              <span class="status-label">Newest Age:</span>
              <span class="status-value">${formatAge(Date.now() - aggregate.newestTimestamp)}</span>
            </div>
          ` : ''}
        </div>
      </div>

      <div class="data-status-section">
        <h4>Item Type Details</h4>
        <div class="item-type-status-list">
          ${itemTypeList}
        </div>
      </div>

      <div class="data-status-actions">
        <button id="check-updates-btn" class="btn btn-outline">
          Check for Updates
        </button>
        <button id="force-refresh-btn" class="btn btn-primary">
          <span>🔄</span> Refresh All Data
        </button>
      </div>

      <div id="data-status-message" class="data-status-message" style="display: none;"></div>

      <div class="data-status-footer">
        <p class="text-caption">
          Data is automatically checked for updates every hour. 
          You can manually check or refresh at any time.
        </p>
        <p class="text-caption">
          <strong>Source:</strong> Price data from 
          <a href="https://data.poeatlas.app/" target="_blank" rel="noopener noreferrer">
            data.poeatlas.app
          </a>
        </p>
      </div>
    </div>
  `;

  // Setup event listeners
  setupEventListeners(container);
}

/**
 * Setup event listeners for the overlay
 * @param {HTMLElement} container
 */
function setupEventListeners(container) {
  const checkBtn = container.querySelector('#check-updates-btn');
  const refreshBtn = container.querySelector('#force-refresh-btn');
  const messageDiv = container.querySelector('#data-status-message');

  if (checkBtn) {
    checkBtn.addEventListener('click', async () => {
      checkBtn.disabled = true;
      checkBtn.textContent = 'Checking...';
      messageDiv.style.display = 'none';

      try {
        // Check cache info for all item types
        const allStatuses = getAllItemTypeStatuses();
        const aggregate = getAggregateStatus(allStatuses);
        
        let needsUpdate = 0;
        let notLoaded = 0;
        
        allStatuses.forEach(({ cacheInfo }) => {
          const ageHours = cacheInfo.age ? cacheInfo.age / 1000 / 60 / 60 : Infinity;
          if (!cacheInfo.hasCache) {
            notLoaded++;
          } else if (ageHours > 1) {
            needsUpdate++;
          }
        });
        
        if (notLoaded > 0) {
          showMessage(messageDiv, `${notLoaded} item type${notLoaded > 1 ? 's' : ''} not loaded. Click "Refresh All Data" to load.`, 'info');
        } else if (needsUpdate > 0) {
          showMessage(messageDiv, `Update available! ${needsUpdate} item type${needsUpdate > 1 ? 's' : ''} ${needsUpdate > 1 ? 'are' : 'is'} older than 1 hour. Click "Refresh All Data" to update.`, 'warning');
        } else {
          showMessage(messageDiv, `All ${aggregate.total} item types are up to date!`, 'success');
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
        showMessage(messageDiv, 'Error checking for updates. Please try again.', 'error');
      } finally {
        checkBtn.disabled = false;
        checkBtn.textContent = 'Check for Updates';
      }
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.disabled = true;
      const originalText = refreshBtn.innerHTML;
      refreshBtn.innerHTML = '<span>⏳</span> Refreshing All...';
      messageDiv.style.display = 'none';

      try {
        // Refresh all item types
        const results = await priceUpdateService.forceRefreshAllPrices();
        
        // Count successful refreshes
        let successCount = 0;
        let totalItems = 0;
        let failedCount = 0;
        
        results.forEach((result, itemType) => {
          if (result.success && result.itemCount > 0) {
            successCount++;
            totalItems += result.itemCount;
          } else if (!result.success) {
            failedCount++;
          }
        });
        
        // Update the display
        renderDataStatusOverlay(container);
        
        // Get the new message div after re-rendering
        const newMessageDiv = container.querySelector('#data-status-message');
        if (newMessageDiv) {
          if (failedCount === 0) {
            showMessage(newMessageDiv, `Successfully refreshed all ${successCount} item type${successCount > 1 ? 's' : ''}! Loaded ${totalItems} total price entries.`, 'success');
          } else {
            showMessage(newMessageDiv, `Refreshed ${successCount} item type${successCount > 1 ? 's' : ''} (${totalItems} entries). ${failedCount} failed.`, 'warning');
          }
        }
        
        // Notify callback if set (for backward compatibility, pass Scarab prices)
        if (onRefreshCallback) {
          const scarabResult = results.get('scarab');
          if (scarabResult && scarabResult.success) {
            // Load Scarab prices for callback
            const { loadItemTypePrices } = await import('../services/dataService.js');
            try {
              const scarabPrices = await loadItemTypePrices('scarab');
              onRefreshCallback(scarabPrices);
            } catch (err) {
              console.error('Error loading Scarab prices for callback:', err);
            }
          }
        }
      } catch (error) {
        console.error('Error refreshing data:', error);
        showMessage(messageDiv, 'Failed to refresh data. Please check your connection and try again.', 'error');
        refreshBtn.innerHTML = originalText;
      } finally {
        refreshBtn.disabled = false;
        if (refreshBtn.innerHTML.includes('Refreshing')) {
          refreshBtn.innerHTML = originalText;
        }
      }
    });
  }
}

/**
 * Show a message in the overlay
 * @param {HTMLElement} messageDiv - Message container
 * @param {string} message - Message text
 * @param {string} type - Message type ('success', 'error', 'warning', 'info')
 */
function showMessage(messageDiv, message, type) {
  if (!messageDiv) return;
  
  messageDiv.textContent = message;
  messageDiv.className = `data-status-message message-${type}`;
  messageDiv.style.display = 'block';
  
  // Auto-hide success/info messages after 5 seconds
  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 5000);
  }
}

/**
 * Set callback to be called when data is refreshed
 * @param {Function} callback - Callback function
 */
export function setOnRefreshCallback(callback) {
  onRefreshCallback = callback;
}

/**
 * Open the data status overlay
 */
export function openDataStatusOverlay() {
  const overlay = document.getElementById('data-status-overlay');
  const content = document.getElementById('data-status-content');
  
  if (overlay && content) {
    // Refresh the display with current cache info
    renderDataStatusOverlay(content);
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Close the data status overlay
 */
export function closeDataStatusOverlay() {
  const overlay = document.getElementById('data-status-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/**
 * Initialize the data status overlay
 */
export function initDataStatusOverlay() {
  const overlay = document.getElementById('data-status-overlay');
  const closeBtn = document.getElementById('close-data-status-overlay');
  
  if (closeBtn) {
    closeBtn.addEventListener('click', closeDataStatusOverlay);
  }
  
  if (overlay) {
    // Close overlay when clicking outside
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeDataStatusOverlay();
      }
    });
    
    // Close overlay on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) {
        closeDataStatusOverlay();
      }
    });
  }
}

