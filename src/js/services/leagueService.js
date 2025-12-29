/**
 * League Service
 * Handles fetching available leagues and managing league selection
 */

import { loadPreferences, savePreferences } from './dataService.js';

const LEAGUES_URL = 'https://data.poeatlas.app/leagues.json';
const STORAGE_KEY = 'scarabHub_selectedLeague';

let availableLeagues = [];
let selectedLeague = null;

/**
 * Fetch available leagues from API
 * @returns {Promise<Array>} Array of league objects
 */
export async function fetchLeagues() {
  try {
    const response = await fetch(LEAGUES_URL, {
      cache: 'no-cache',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch leagues: ${response.status} ${response.statusText}`);
    }

    const leagues = await response.json();
    availableLeagues = leagues;
    
    // If no league is selected, select the first one (usually the current league)
    if (!selectedLeague && leagues.length > 0) {
      setSelectedLeague(leagues[0].id);
    }
    
    return leagues;
  } catch (error) {
    console.error('Error fetching leagues:', error);
    // Return default league if fetch fails
    return [{
      name: 'Keepers of the Flame',
      slug: 'Keepers',
      id: 'keepers'
    }];
  }
}

/**
 * Get available leagues (cached)
 * @returns {Array} Array of league objects
 */
export function getAvailableLeagues() {
  return availableLeagues;
}

/**
 * Get selected league
 * @returns {object|null} Selected league object
 */
export function getSelectedLeague() {
  if (!selectedLeague && availableLeagues.length > 0) {
    // Try to load from preferences
    const preferences = loadPreferences();
    const savedLeagueId = preferences.selectedLeagueId || localStorage.getItem(STORAGE_KEY);
    
    if (savedLeagueId) {
      const league = availableLeagues.find(l => l.id === savedLeagueId);
      if (league) {
        selectedLeague = league;
        return league;
      }
    }
    
    // Default to first league
    selectedLeague = availableLeagues[0];
  }
  return selectedLeague;
}

/**
 * Set selected league
 * @param {string} leagueId - League ID
 */
export function setSelectedLeague(leagueId) {
  const league = availableLeagues.find(l => l.id === leagueId);
  if (league) {
    selectedLeague = league;
    
    // Save to preferences
    const preferences = loadPreferences();
    preferences.selectedLeagueId = leagueId;
    savePreferences(preferences);
    
    // Also save to localStorage for quick access
    localStorage.setItem(STORAGE_KEY, leagueId);
    
    console.log(`✓ Selected league: ${league.name} (${league.slug})`);
  } else {
    console.warn(`League not found: ${leagueId}`);
  }
}

/**
 * Get price file name for selected league
 * @returns {string} Price file name (e.g., 'scarabPrices_Keepers.json')
 */
export function getPriceFileName() {
  const league = getSelectedLeague();
  if (!league) {
    // Fallback to Keepers if no league selected
    return 'scarabPrices_Keepers.json';
  }
  return `scarabPrices_${league.slug}.json`;
}

/**
 * Get local fallback path for price file
 * @returns {string} Local path (e.g., '/data/scarabPrices_Keepers.json')
 */
export function getPriceFileLocalPath() {
  const league = getSelectedLeague();
  if (!league) {
    // Fallback to Keepers if no league selected
    return '/data/scarabPrices_Keepers.json';
  }
  return `/data/scarabPrices_${league.slug}.json`;
}

/**
 * Initialize league service
 * Fetches leagues and sets up default selection
 * @returns {Promise<void>}
 */
export async function initLeagueService() {
  try {
    const leagues = await fetchLeagues();
    availableLeagues = leagues;
    
    // Load saved preference or use first league
    const preferences = loadPreferences();
    const savedLeagueId = preferences.selectedLeagueId || localStorage.getItem(STORAGE_KEY);
    
    if (savedLeagueId) {
      const league = leagues.find(l => l.id === savedLeagueId);
      if (league) {
        selectedLeague = league;
      } else {
        // Saved league not found, use first available
        selectedLeague = leagues[0];
        setSelectedLeague(leagues[0].id);
      }
    } else {
      // No saved preference, use first league
      selectedLeague = leagues[0];
      setSelectedLeague(leagues[0].id);
    }
    
    console.log(`✓ League service initialized: ${selectedLeague.name}`);
  } catch (error) {
    console.error('Error initializing league service:', error);
    // Set default league
    availableLeagues = [{
      name: 'Keepers of the Flame',
      slug: 'Keepers',
      id: 'keepers'
    }];
    selectedLeague = availableLeagues[0];
  }
}

