/**
 * Data Service
 * Handles loading and merging JSON files, LocalStorage management
 */

/**
 * Load and merge Scarab details and prices
 * @returns {Promise<Array<Scarab>>}
 */
export async function loadAndMergeScarabData() {
  try {
    // Load both JSON files
    const [detailsResponse, pricesResponse] = await Promise.all([
      fetch('/data/scarabDetails.json'),
      fetch('/data/scarabPrices_Keepers.json'),
    ]);

    if (!detailsResponse.ok || !pricesResponse.ok) {
      throw new Error('Failed to load Scarab data files');
    }

    const details = await detailsResponse.json();
    const prices = await pricesResponse.json();

    // Create a map of prices by detailsId for quick lookup
    const priceMap = new Map();
    prices.forEach(price => {
      if (price.detailsId) {
        priceMap.set(price.detailsId, price);
      }
    });

    // Merge details with prices
    const merged = details.map(detail => {
      const price = priceMap.get(detail.id);
      return {
        ...detail,
        chaosValue: price?.chaosValue ?? null,
        divineValue: price?.divineValue ?? null,
      };
    });

    // Handle prices without matching details (log warning)
    const detailIds = new Set(details.map(d => d.id));
    prices.forEach(price => {
      if (price.detailsId && !detailIds.has(price.detailsId)) {
        console.warn(`Price data found for unknown Scarab: ${price.detailsId}`);
      }
    });

    return merged;
  } catch (error) {
    console.error('Error loading Scarab data:', error);
    throw error;
  }
}

/**
 * LocalStorage utility functions
 */
const STORAGE_KEYS = {
  PREFERENCES: 'scarabHub_preferences',
  CACHED_PRICES: 'scarabHub_cachedPrices',
  LAST_UPDATE: 'scarabHub_lastUpdate',
};

/**
 * Save user preferences to LocalStorage
 * @param {object} preferences
 */
export function savePreferences(preferences) {
  try {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving preferences:', error);
  }
}

/**
 * Load user preferences from LocalStorage
 * @returns {object}
 */
export function loadPreferences() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading preferences:', error);
    return {};
  }
}

/**
 * Save cached price data to LocalStorage
 * @param {Array} priceData
 */
export function saveCachedPrices(priceData) {
  try {
    const cache = {
      data: priceData,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.CACHED_PRICES, JSON.stringify(cache));
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, cache.timestamp);
  } catch (error) {
    console.error('Error saving cached prices:', error);
  }
}

/**
 * Load cached price data from LocalStorage
 * @returns {object|null}
 */
export function loadCachedPrices() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CACHED_PRICES);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading cached prices:', error);
    return null;
  }
}

/**
 * Get last update timestamp
 * @returns {string|null}
 */
export function getLastUpdate() {
  try {
    return localStorage.getItem(STORAGE_KEYS.LAST_UPDATE);
  } catch (error) {
    console.error('Error getting last update:', error);
    return null;
  }
}

/**
 * Refresh price data (reload from JSON)
 * @returns {Promise<Array>}
 */
export async function refreshPriceData() {
  try {
    const response = await fetch('/data/scarabPrices_Keepers.json');
    if (!response.ok) {
      throw new Error('Failed to refresh price data');
    }
    const prices = await response.json();
    saveCachedPrices(prices);
    return prices;
  } catch (error) {
    console.error('Error refreshing price data:', error);
    throw error;
  }
}

