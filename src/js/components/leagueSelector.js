/**
 * League Selector Component
 * Renders league selection dropdown in the header
 */

import { 
  getAvailableLeagues, 
  getSelectedLeague, 
  setSelectedLeague 
} from '../services/leagueService.js';
import { showErrorToast, showWarningToast } from '../utils/toast.js';

let onLeagueChangeCallback = null;

/**
 * Set callback to be called when league changes
 * @param {Function} callback - Callback function
 */
export function setOnLeagueChange(callback) {
  onLeagueChangeCallback = callback;
}

/**
 * Render league selector in header
 * @param {HTMLElement} container - Container element (header)
 */
export function renderLeagueSelector(container) {
  if (!container) {
    console.error('League selector: missing container');
    return;
  }

  const selectedLeague = getSelectedLeague();
  const availableLeagues = getAvailableLeagues();

  if (availableLeagues.length === 0) {
    // Leagues not loaded yet, show placeholder
    container.innerHTML = `
      <div class="league-selector-container">
        <label for="header-league-selector" class="league-selector-label">League:</label>
        <select id="header-league-selector" class="header-league-selector" disabled>
          <option>Loading...</option>
        </select>
      </div>
    `;
    return;
  }

  // Build league selector options
  const leagueOptions = availableLeagues.map(league => 
    `<option value="${league.id}" ${selectedLeague && selectedLeague.id === league.id ? 'selected' : ''}>
      ${league.name}
    </option>`
  ).join('');

  container.innerHTML = `
    <div class="league-selector-container">
      <label for="header-league-selector" class="league-selector-label">League:</label>
      <select id="header-league-selector" class="header-league-selector">
        ${leagueOptions}
      </select>
    </div>
  `;

  // Setup event listener
  const selector = container.querySelector('#header-league-selector');
  if (selector) {
    selector.addEventListener('change', async (e) => {
      const newLeagueId = e.target.value;
      const oldLeagueId = getSelectedLeague()?.id;
      
      if (newLeagueId !== oldLeagueId) {
        selector.disabled = true;
        
        try {
          setSelectedLeague(newLeagueId);
          
          // Notify callback if set
          if (onLeagueChangeCallback) {
            await onLeagueChangeCallback(null);
          }
          
          const newLeague = getSelectedLeague();
          console.log(`✓ League changed to: ${newLeague.name}`);
        } catch (error) {
          console.error('Error changing league:', error);
          
          // Show error toast
          const newLeague = getSelectedLeague();
          const leagueName = newLeague ? newLeague.name : 'selected league';
          
          // Check if it's a data loading error
          if (error.message && (error.message.includes('Unable to load') || error.message.includes('file not found') || error.message.includes('404'))) {
            showErrorToast(
              `There is insufficient price data for ${leagueName}. ` +
              `Please try another league or check back later.`
            );
          } else {
            showErrorToast(`Failed to switch to ${leagueName}. Please try again.`);
          }
          
          // Revert selection
          selector.value = oldLeagueId;
          // Also revert in league service
          const oldLeague = availableLeagues.find(l => l.id === oldLeagueId);
          if (oldLeague) {
            setSelectedLeague(oldLeagueId);
          }
        } finally {
          selector.disabled = false;
        }
      }
    });
  }
}

/**
 * Update league selector (refresh options and selection)
 * @param {HTMLElement} container - Container element
 */
export function updateLeagueSelector(container) {
  renderLeagueSelector(container);
}

