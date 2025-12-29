/**
 * Data Status Overlay Component
 * Shows metadata about price data and allows force refresh
 */

import { getCacheInfo } from '../utils/dataFetcher.js';
import { priceUpdateService } from '../services/priceUpdateService.js';
import { 
  getSelectedLeague, 
  getPriceFileName 
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
 * Render the data status overlay content
 * @param {HTMLElement} container - Container element
 */
export function renderDataStatusOverlay(container) {
  if (!container) {
    console.error('Data status overlay: missing container');
    return;
  }

  const selectedLeague = getSelectedLeague();
  const priceFileName = getPriceFileName();
  const cacheInfo = getCacheInfo(priceFileName);
  const statusInfo = getStatusInfo(cacheInfo);

  container.innerHTML = `
    <div class="data-status-content">
      <div class="data-status-section">
        <h3>Price Data Status</h3>
        <div class="data-status-info">
          <div class="status-row">
            <span class="status-label">League:</span>
            <span class="status-value">${selectedLeague ? selectedLeague.name : 'Unknown'}</span>
          </div>
        <div class="data-status-info">
          <div class="status-row">
            <span class="status-label">File:</span>
            <span class="status-value">${priceFileName}</span>
          </div>
          <div class="status-row">
            <span class="status-label">Source:</span>
            <span class="status-value">${cacheInfo.isLocal ? 'Local Fallback' : 'https://data.poeatlas.app/'}</span>
          </div>
          <div class="status-row">
            <span class="status-label">Last Updated:</span>
            <span class="status-value ${statusInfo.class}">
              ${formatTimestamp(cacheInfo.timestamp)}
            </span>
          </div>
          <div class="status-row">
            <span class="status-label">Age:</span>
            <span class="status-value">${formatAge(cacheInfo.age)}</span>
          </div>
          <div class="status-row">
            <span class="status-label">Status:</span>
            <span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>
          </div>
        </div>
      </div>

      <div class="data-status-actions">
        <button id="check-updates-btn" class="btn btn-outline">
          Check for Updates
        </button>
        <button id="force-refresh-btn" class="btn btn-primary">
          <span>🔄</span> Refresh Data
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
          <a href="https://data.poeatlas.app/${priceFileName}" target="_blank" rel="noopener noreferrer">
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
        // Check cache info to see if update is needed
        const priceFileName = getPriceFileName();
        const cacheInfo = getCacheInfo(priceFileName);
        const ageHours = cacheInfo.age ? cacheInfo.age / 1000 / 60 / 60 : Infinity;
        
        if (!cacheInfo.hasCache) {
          showMessage(messageDiv, 'No cached data found. Click "Refresh Data" to load.', 'info');
        } else if (ageHours > 1) {
          showMessage(messageDiv, 'Update available! Your data is older than 1 hour. Click "Refresh Data" to update.', 'warning');
        } else {
          showMessage(messageDiv, 'Your data is up to date!', 'success');
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
      refreshBtn.innerHTML = '<span>⏳</span> Refreshing...';
      messageDiv.style.display = 'none';

      try {
        const prices = await priceUpdateService.forceRefresh();
        
        // Update the display
        renderDataStatusOverlay(container);
        
        // Get the new message div after re-rendering
        const newMessageDiv = container.querySelector('#data-status-message');
        if (newMessageDiv) {
          showMessage(newMessageDiv, `Successfully refreshed! Loaded ${prices.length} price entries.`, 'success');
        }
        
        // Notify callback if set
        if (onRefreshCallback) {
          onRefreshCallback(prices);
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

