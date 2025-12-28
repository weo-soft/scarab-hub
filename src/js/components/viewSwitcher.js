/**
 * View Switcher Component
 * Handles switching between List and Grid views
 */

import { savePreferences, loadPreferences } from '../services/dataService.js';

/**
 * Create and render view switcher
 * @param {HTMLElement} container - Container element
 * @param {string|null} currentView - Current view ('list' or 'grid'), or null to hide view buttons
 * @param {Function|object} callbacks - Callback function or object with onViewChange
 */
export function renderViewSwitcher(container, currentView = 'list', callbacks) {
  if (!container) {
    console.error('View switcher: missing container');
    return;
  }

  const showViewButtons = currentView !== null;
  
  container.innerHTML = `
    <div class="view-switcher">
      ${showViewButtons ? `
      <div class="view-buttons">
        <button class="view-btn ${currentView === 'list' ? 'active' : ''}" 
                data-view="list" 
                aria-label="List view">
          <span>📋</span> List
        </button>
        <button class="view-btn ${currentView === 'grid' ? 'active' : ''}" 
                data-view="grid" 
                aria-label="Grid view">
          <span>🔲</span> Grid
        </button>
      </div>
      ` : ''}
    </div>
  `;

  // Normalize callbacks
  const onViewChange = typeof callbacks === 'function' ? callbacks : callbacks?.onViewChange;

  // Attach event listeners for view buttons (only if shown)
  if (showViewButtons) {
    const buttons = container.querySelectorAll('.view-btn');
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const view = button.dataset.view;
        if (view && onViewChange) {
          onViewChange(view);
        }
      });
    });
  }
}

/**
 * Update view switcher active state
 * @param {HTMLElement} container
 * @param {string} activeView
 */
export function updateViewSwitcher(container, activeView) {
  const buttons = container.querySelectorAll('.view-btn');
  buttons.forEach(button => {
    if (button.dataset.view === activeView) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
}

/**
 * Get saved view preference or default
 * @returns {string} 'list' or 'grid'
 */
export function getViewPreference() {
  const preferences = loadPreferences();
  return preferences.defaultView || 'list';
}

/**
 * Save view preference
 * @param {string} view - 'list' or 'grid'
 */
export function saveViewPreference(view) {
  const preferences = loadPreferences();
  preferences.defaultView = view;
  savePreferences(preferences);
}

/**
 * Get currency preference or default
 * @returns {string} 'chaos' or 'divine'
 */
export function getCurrencyPreference() {
  const preferences = loadPreferences();
  return preferences.currencyPreference || 'chaos';
}

/**
 * Save currency preference
 * @param {string} currency - 'chaos' or 'divine'
 */
export function saveCurrencyPreference(currency) {
  const preferences = loadPreferences();
  preferences.currencyPreference = currency;
  savePreferences(preferences);
}

