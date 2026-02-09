/**
 * Data Service
 * Handles loading and merging JSON files, LocalStorage management
 */

import { fetchDataWithFallback, forceRefreshData } from '../utils/dataFetcher.js';
import { getPriceFileName, getPriceFileLocalPath } from './leagueService.js';

const MLE_WEIGHTS_URL = 'https://poedata.dev/data/scarabs/calculations/mle.json';
const ESSENCE_MLE_WEIGHTS_URL = 'https://poedata.dev/data/essences/calculations/mle.json';
const CATALYST_MLE_WEIGHTS_URL = 'https://poedata.dev/data/catalysts/calculations/mle.json';
const FOSSIL_MLE_WEIGHTS_URL = 'https://poedata.dev/data/fossils/calculations/mle.json';

/**
 * Fetch scarab drop weights from poedata.dev MLE calculations
 * @returns {Promise<Map<string, number>>} Map of scarab id -> weight (probability)
 */
async function fetchScarabWeightsFromMle() {
  const response = await fetch(MLE_WEIGHTS_URL);
  if (!response.ok) {
    throw new Error(`Failed to load Scarab weights from ${MLE_WEIGHTS_URL}`);
  }
  const data = await response.json();
  const weightMap = new Map();
  if (data.items && Array.isArray(data.items)) {
    data.items.forEach(item => {
      if (item.id != null && typeof item.weight === 'number') {
        weightMap.set(item.id, item.weight);
      }
    });
  }
  return weightMap;
}

/**
 * Fetch essence drop weights from poedata.dev MLE calculations.
 * MLE data only includes Deafening tier; same weight is used for all tiers of each essence type.
 * @returns {Promise<Map<string, number>>} Map of deafening essence id -> weight (e.g. "deafening-essence-of-woe" -> weight)
 */
async function fetchEssenceWeightsFromMle() {
  const response = await fetch(ESSENCE_MLE_WEIGHTS_URL);
  if (!response.ok) {
    throw new Error(`Failed to load Essence weights from ${ESSENCE_MLE_WEIGHTS_URL}`);
  }
  const data = await response.json();
  const weightMap = new Map();
  if (data.items && Array.isArray(data.items)) {
    data.items.forEach(item => {
      if (item.id != null && typeof item.weight === 'number') {
        weightMap.set(item.id, item.weight);
      }
    });
  }
  return weightMap;
}

/**
 * Get the Deafening essence id for a given essence id (all tiers share the same MLE weight).
 * e.g. "muttering-essence-of-anger" -> "deafening-essence-of-anger"; "essence-of-horror" -> null.
 * @param {string} essenceId - Full essence id
 * @returns {string|null} Deafening id for lookup, or null for special essences
 */
function getDeafeningEssenceIdForWeight(essenceId) {
  if (!essenceId || typeof essenceId !== 'string') return null;
  if (essenceId.startsWith('essence-of-')) return null; // special essences not in MLE
  const match = essenceId.match(/-essence-of-(.+)$/);
  return match ? `deafening-essence-of-${match[1]}` : null;
}

/**
 * Fetch catalyst drop weights from poedata.dev MLE calculations
 * @returns {Promise<Map<string, number>>} Map of catalyst id -> weight (probability)
 */
async function fetchCatalystWeightsFromMle() {
  const response = await fetch(CATALYST_MLE_WEIGHTS_URL);
  if (!response.ok) {
    throw new Error(`Failed to load Catalyst weights from ${CATALYST_MLE_WEIGHTS_URL}`);
  }
  const data = await response.json();
  const weightMap = new Map();
  if (data.items && Array.isArray(data.items)) {
    data.items.forEach((item) => {
      if (item.id != null && typeof item.weight === 'number') {
        weightMap.set(item.id, item.weight);
      }
    });
  }
  return weightMap;
}

/**
 * Fetch fossil drop weights from poedata.dev MLE calculations
 * @returns {Promise<Map<string, number>>} Map of fossil id -> weight (probability)
 */
async function fetchFossilWeightsFromMle() {
  const response = await fetch(FOSSIL_MLE_WEIGHTS_URL);
  if (!response.ok) {
    throw new Error(`Failed to load Fossil weights from ${FOSSIL_MLE_WEIGHTS_URL}`);
  }
  const data = await response.json();
  const weightMap = new Map();
  if (data.items && Array.isArray(data.items)) {
    data.items.forEach((item) => {
      if (item.id != null && typeof item.weight === 'number') {
        weightMap.set(item.id, item.weight);
      }
    });
  }
  return weightMap;
}

/**
 * Load and merge Scarab details (from scarabs.json), weights (from poedata.dev MLE), and prices
 * @param {Array|null} [pricesOverride] - Optional price data to use instead of fetching (e.g. after refresh)
 * @returns {Promise<Array>} Merged scarab data with id, name, description, dropWeight, chaosValue, etc.
 */
export async function loadAndMergeScarabData(pricesOverride = null) {
  try {
    // Load details from local (static data) - scarabs.json has no weights
    const detailsResponse = await fetch('/data/items/scarabs.json');
    if (!detailsResponse.ok) {
      throw new Error('Failed to load Scarab details file');
    }
    const details = await detailsResponse.json();

    // Fetch up-to-date weights from poedata.dev MLE
    const weightMap = await fetchScarabWeightsFromMle();

    // Load prices (use override if provided, e.g. after refresh)
    let prices;
    if (pricesOverride != null) {
      prices = pricesOverride;
    } else {
      const priceFileName = getPriceFileName();
      const priceFileLocalPath = getPriceFileLocalPath();
      prices = await fetchDataWithFallback(
        priceFileName,
        priceFileLocalPath
      );
    }

    // Create a map of prices by detailsId for quick lookup
    const priceMap = new Map();
    prices.forEach(price => {
      if (price.detailsId) {
        priceMap.set(price.detailsId, price);
      }
    });

    // Merge details + weights + prices
    const merged = details.map(detail => {
      const price = priceMap.get(detail.id);
      const dropWeight = weightMap.has(detail.id) ? weightMap.get(detail.id) : null;
      return {
        ...detail,
        dropWeight,
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
    const preferences = stored ? JSON.parse(stored) : {};
    
    // Ensure selectedEssenceIds is an array (for Essence selection state)
    if (preferences.selectedEssenceIds && !Array.isArray(preferences.selectedEssenceIds)) {
      preferences.selectedEssenceIds = [];
    }
    
    // Ensure selectedFossilIds is an array (for Fossil selection state)
    if (preferences.selectedFossilIds && !Array.isArray(preferences.selectedFossilIds)) {
      preferences.selectedFossilIds = [];
    }
    
    return preferences;
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
 * Refresh price data (force refresh from remote)
 * @returns {Promise<Array>}
 */
export async function refreshPriceData() {
  try {
    const priceFileName = getPriceFileName();
    const priceFileLocalPath = getPriceFileLocalPath();
    
    const prices = await forceRefreshData(
      priceFileName,
      priceFileLocalPath
    );
    saveCachedPrices(prices);
    return prices;
  } catch (error) {
    console.error('Error refreshing price data:', error);
    throw error;
  }
}

/**
 * Load price data for a specific item type
 * @param {string} itemType - Item type identifier
 * @returns {Promise<Array>} Price data array
 */
export async function loadItemTypePrices(itemType) {
  try {
    const priceFileName = getPriceFileName(itemType);
    const priceFileLocalPath = getPriceFileLocalPath(itemType);
    
    const prices = await fetchDataWithFallback(
      priceFileName,
      priceFileLocalPath
    );
    
    console.log(`✓ Loaded ${itemType} prices (${prices.length} items)`);
    return prices;
  } catch (error) {
    console.error(`Error loading ${itemType} prices:`, error);
    throw error;
  }
}

/**
 * Load price data for multiple item types in parallel
 * @param {Array<string>} itemTypes - Array of item type identifiers
 * @returns {Promise<Map<string, Array>>} Map of item type to price data
 */
export async function loadAllItemTypePrices(itemTypes) {
  const loadPromises = itemTypes.map(async (itemType) => {
    try {
      const prices = await loadItemTypePrices(itemType);
      return { itemType, prices, success: true };
    } catch (error) {
      console.error(`Failed to load ${itemType} prices:`, error);
      return { itemType, prices: [], success: false, error: error.message };
    }
  });
  
  const results = await Promise.allSettled(loadPromises);
  
  const priceMap = new Map();
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const { itemType, prices } = result.value;
      priceMap.set(itemType, prices);
      
      // Log success or failure
      if (result.value.success) {
        console.log(`✓ Successfully loaded ${itemType} prices (${prices.length} items)`);
      } else {
        console.warn(`⚠ Failed to load ${itemType} prices: ${result.value.error}`);
      }
    } else {
      // Fallback: use empty array if promise rejected
      const itemType = itemTypes[index];
      priceMap.set(itemType, []);
      console.error(`✗ Promise rejected for ${itemType}:`, result.reason);
    }
  });
  
  return priceMap;
}

/**
 * Refresh price data for a specific item type (force refresh from remote)
 * @param {string} itemType - Item type identifier
 * @returns {Promise<Array>} Updated price data array
 */
export async function refreshItemTypePrices(itemType) {
  try {
    const priceFileName = getPriceFileName(itemType);
    const priceFileLocalPath = getPriceFileLocalPath(itemType);
    
    const prices = await forceRefreshData(
      priceFileName,
      priceFileLocalPath
    );
    
    console.log(`✓ Refreshed ${itemType} prices (${prices.length} items)`);
    return prices;
  } catch (error) {
    console.error(`Error refreshing ${itemType} prices:`, error);
    throw error;
  }
}

/**
 * Load full Essence list from essences.json and merge with price data and MLE drop weights.
 * Every entry in the details file is returned; price never determines inclusion.
 * Drop weights from poedata.dev MLE (Deafening tier); same weight is used for all tiers of each type.
 * @returns {Promise<Array>} Array of merged Essence objects (id, name, tier, chaosValue, divineValue, dropWeight, ...)
 */
export async function loadFullEssenceData() {
  try {
    const [definitionsRes, prices, essenceWeightMap] = await Promise.all([
      fetch('/data/items/essences.json'),
      loadItemTypePrices('essence').catch(() => []),
      fetchEssenceWeightsFromMle().catch((err) => {
        console.warn('Essence MLE weights unavailable, using equal weighting:', err.message);
        return new Map();
      })
    ]);
    if (!definitionsRes.ok) {
      throw new Error('Failed to load essences.json');
    }
    const definitions = await definitionsRes.json();
    if (!Array.isArray(definitions)) {
      throw new Error('essences.json must be an array');
    }
    const priceByDetailsId = new Map();
    (prices || []).forEach((p) => {
      const id = p.detailsId || p.id;
      if (id) {
        priceByDetailsId.set(id, {
          chaosValue: p.chaosValue ?? null,
          divineValue: p.divineValue ?? null
        });
      }
    });
    const merged = definitions.map((def) => {
      const id = def.id || def.detailsId;
      const price = priceByDetailsId.get(id);
      const deafeningId = getDeafeningEssenceIdForWeight(id);
      const dropWeight = deafeningId != null && essenceWeightMap.has(deafeningId)
        ? essenceWeightMap.get(deafeningId)
        : null;
      return {
        ...def,
        id: id || def.id,
        name: def.name || '',
        chaosValue: price?.chaosValue ?? null,
        divineValue: price?.divineValue ?? null,
        dropWeight
      };
    });
    console.log(`✓ Loaded ${merged.length} Essences (${priceByDetailsId.size} with price data, MLE weights for ${essenceWeightMap.size} types)`);
    return merged;
  } catch (error) {
    console.error('Error loading full Essence data:', error);
    throw error;
  }
}

/**
 * Load and merge Essence price data (price-only; for backward compatibility).
 * Prefer loadFullEssenceData() when the full grid list is needed.
 * @returns {Promise<Array>} Array of Essence price objects
 */
export async function loadAndMergeEssenceData() {
  try {
    const prices = await loadItemTypePrices('essence');
    const processedPrices = (prices || []).map((price) => ({
      ...price,
      id: price.detailsId || price.id,
      chaosValue: price.chaosValue ?? null,
      divineValue: price.divineValue ?? null
    }));
    return processedPrices;
  } catch (error) {
    console.error('Error loading Essence data:', error);
    return [];
  }
}

/**
 * Get Primal Crystallised Lifeforce price from lifeforce prices
 * @returns {Promise<object|null>} Primal Crystallised Lifeforce price object or null if not found
 */
export async function getPrimalLifeforcePrice() {
  try {
    // Load lifeforce prices
    const lifeforcePrices = await loadItemTypePrices('lifeforce');
    
    // Find Primal Crystallised Lifeforce
    const primalLifeforce = lifeforcePrices.find(
      item => item.name === 'Primal Crystallised Lifeforce' || 
              item.detailsId === 'primal-crystallised-lifeforce'
    );
    
    if (!primalLifeforce) {
      console.warn('Primal Crystallised Lifeforce not found in price data');
      return null;
    }
    
    return primalLifeforce;
  } catch (error) {
    console.error('Error loading Primal Crystallised Lifeforce price:', error);
    return null;
  }
}

/**
 * Load and merge Fossil price data
 * Fossils don't have a separate details file like Scarabs - prices contain all needed data
 * @returns {Promise<Array>} Array of Fossil price objects
 */
export async function loadAndMergeFossilData() {
  try {
    // Load Fossil prices from remote with fallback to local (using selected league)
    const prices = await loadItemTypePrices('fossil');
    
    // Handle missing price data - mark as null if chaosValue is missing
    const processedPrices = prices.map(price => ({
      ...price,
      chaosValue: price.chaosValue ?? null,
      divineValue: price.divineValue ?? null
    }));
    
    // Log warnings for Fossils with missing prices
    const missingPrices = processedPrices.filter(p => p.chaosValue === null);
    if (missingPrices.length > 0) {
      console.warn(`${missingPrices.length} Fossils have missing price data`);
    }
    
    // Fossil prices already contain all needed data (name, detailsId, chaosValue, divineValue)
    // No merging needed like Scarabs
    return processedPrices;
  } catch (error) {
    console.error('Error loading Fossil data:', error);
    // Return empty array instead of throwing to allow graceful degradation
    return [];
  }
}

/**
 * Get Wild Crystallised Lifeforce price from lifeforce prices
 * @returns {Promise<object|null>} Wild Crystallised Lifeforce price object or null if not found
 */
export async function getWildLifeforcePrice() {
  try {
    // Load lifeforce prices
    const lifeforcePrices = await loadItemTypePrices('lifeforce');
    
    // Find Wild Crystallised Lifeforce
    const wildLifeforce = lifeforcePrices.find(
      item => item.name === 'Wild Crystallised Lifeforce' || 
              item.detailsId === 'wild-crystallised-lifeforce'
    );
    
    if (!wildLifeforce) {
      console.warn('Wild Crystallised Lifeforce not found in price data');
      return null;
    }
    
    return wildLifeforce;
  } catch (error) {
    console.error('Error loading Wild Crystallised Lifeforce price:', error);
    return null;
  }
}

/**
 * Load and merge Catalyst details (catalysts.json), MLE weights (poedata.dev), and prices
 * @returns {Promise<Array>} Merged catalyst data with id, name, description, dropWeight, chaosValue, etc.
 */
export async function loadAndMergeCatalystData() {
  try {
    const detailsResponse = await fetch('/data/items/catalysts.json');
    if (!detailsResponse.ok) {
      throw new Error('Failed to load Catalyst details file');
    }
    const details = await detailsResponse.json();

    const weightMap = await fetchCatalystWeightsFromMle().catch((err) => {
      console.warn('Catalyst MLE weights unavailable:', err.message);
      return new Map();
    });

    const prices = await loadItemTypePrices('catalyst').catch(() => []);

    const priceMap = new Map();
    (prices || []).forEach((price) => {
      const id = price.detailsId || price.id;
      if (id) {
        priceMap.set(id, price);
      }
    });

    const merged = details.map((detail) => {
      const price = priceMap.get(detail.id);
      const dropWeight = weightMap.has(detail.id) ? weightMap.get(detail.id) : null;
      return {
        ...detail,
        dropWeight,
        chaosValue: price?.chaosValue ?? null,
        divineValue: price?.divineValue ?? null
      };
    });

    console.log(`✓ Loaded ${merged.length} Catalysts (${priceMap.size} with price data, MLE weights for ${weightMap.size} types)`);
    return merged;
  } catch (error) {
    console.error('Error loading Catalyst data:', error);
    throw error;
  }
}

/**
 * Load and merge Fossil details (fossils.json), MLE weights (poedata.dev), and prices.
 * Use for grid view and any display needing name, description, dropWeight.
 * @returns {Promise<Array>} Merged fossil data with id, name, description, dropWeight, chaosValue, etc.
 */
export async function loadFullFossilData() {
  try {
    const detailsResponse = await fetch('/data/items/fossils.json');
    if (!detailsResponse.ok) {
      throw new Error('Failed to load Fossil details file');
    }
    const details = await detailsResponse.json();

    const weightMap = await fetchFossilWeightsFromMle().catch((err) => {
      console.warn('Fossil MLE weights unavailable:', err.message);
      return new Map();
    });

    const prices = await loadItemTypePrices('fossil').catch(() => []);

    const priceMap = new Map();
    (prices || []).forEach((price) => {
      const id = price.detailsId || price.id;
      if (id) {
        priceMap.set(id, price);
      }
    });

    const merged = details.map((detail) => {
      const price = priceMap.get(detail.id);
      const dropWeight = weightMap.has(detail.id) ? weightMap.get(detail.id) : null;
      return {
        ...detail,
        dropWeight,
        chaosValue: price?.chaosValue ?? null,
        divineValue: price?.divineValue ?? null
      };
    });

    console.log(`✓ Loaded ${merged.length} Fossils (${priceMap.size} with price data, MLE weights for ${weightMap.size} types)`);
    return merged;
  } catch (error) {
    console.error('Error loading full Fossil data:', error);
    throw error;
  }
}

/**
 * Load and merge Oil details (oils.json) and prices.
 * No MLE weight data on poedata.dev for oils; order by itemOrderConfig (tier).
 * @returns {Promise<Array>} Merged oil data with id, name, tier, chaosValue, divineValue, etc.
 */
export async function loadFullOilData() {
  try {
    const detailsResponse = await fetch('/data/items/oils.json');
    if (!detailsResponse.ok) {
      throw new Error('Failed to load Oil details file');
    }
    const details = await detailsResponse.json();

    const prices = await loadItemTypePrices('oil').catch(() => []);

    const priceMap = new Map();
    (prices || []).forEach((price) => {
      const id = price.detailsId || price.id;
      if (id) {
        priceMap.set(id, price);
      }
    });

    const merged = details.map((detail) => {
      const price = priceMap.get(detail.id);
      return {
        ...detail,
        chaosValue: price?.chaosValue ?? null,
        divineValue: price?.divineValue ?? null
      };
    });

    console.log(`✓ Loaded ${merged.length} Oils (${priceMap.size} with price data)`);
    return merged;
  } catch (error) {
    console.error('Error loading Oil data:', error);
    throw error;
  }
}

/**
 * Load and merge Delirium Orb details (deliriumOrbs.json) and prices.
 * @returns {Promise<Array>} Merged delirium orb data with id, name, helpText, chaosValue, divineValue, etc.
 */
export async function loadFullDeliriumOrbData() {
  try {
    const detailsResponse = await fetch('/data/items/deliriumOrbs.json');
    if (!detailsResponse.ok) {
      throw new Error('Failed to load Delirium Orb details file');
    }
    const details = await detailsResponse.json();

    const prices = await loadItemTypePrices('deliriumOrb').catch(() => []);

    const priceMap = new Map();
    (prices || []).forEach((price) => {
      const id = price.detailsId || price.id;
      if (id) {
        priceMap.set(id, price);
      }
    });

    const merged = details.map((detail) => {
      const price = priceMap.get(detail.id);
      return {
        ...detail,
        chaosValue: price?.chaosValue ?? null,
        divineValue: price?.divineValue ?? null
      };
    });

    console.log(`✓ Loaded ${merged.length} Delirium Orbs (${priceMap.size} with price data)`);
    return merged;
  } catch (error) {
    console.error('Error loading Delirium Orb data:', error);
    throw error;
  }
}

/**
 * Load and merge Legion Emblem details (legionEmblems.json) and prices.
 * @returns {Promise<Array>} Merged emblem data with id, name, helpText, chaosValue, divineValue, etc.
 */
export async function loadFullEmblemData() {
  try {
    const detailsResponse = await fetch('/data/items/legionEmblems.json');
    if (!detailsResponse.ok) {
      throw new Error('Failed to load Legion Emblem details file');
    }
    const details = await detailsResponse.json();

    const prices = await loadItemTypePrices('emblem').catch(() => []);

    const priceMap = new Map();
    (prices || []).forEach((price) => {
      const id = price.detailsId || price.id;
      if (id) {
        priceMap.set(id, price);
      }
    });

    const merged = details.map((detail) => {
      const price = priceMap.get(detail.id);
      return {
        ...detail,
        chaosValue: price?.chaosValue ?? null,
        divineValue: price?.divineValue ?? null
      };
    });

    console.log(`✓ Loaded ${merged.length} Legion Emblems (${priceMap.size} with price data)`);
    return merged;
  } catch (error) {
    console.error('Error loading Legion Emblem data:', error);
    throw error;
  }
}

/**
 * Load and merge Tattoo details (tattoos.json) and prices.
 * @returns {Promise<Array>} Merged tattoo data with id, name, description, chaosValue, divineValue, etc.
 */
export async function loadFullTattooData() {
  try {
    const detailsResponse = await fetch('/data/items/tattoos.json');
    if (!detailsResponse.ok) {
      throw new Error('Failed to load Tattoo details file');
    }
    const details = await detailsResponse.json();

    const prices = await loadItemTypePrices('tattoo').catch(() => []);

    const priceMap = new Map();
    (prices || []).forEach((price) => {
      const id = price.detailsId || price.id;
      if (id) {
        priceMap.set(id, price);
      }
    });

    const merged = details.map((detail) => {
      const price = priceMap.get(detail.id);
      return {
        ...detail,
        chaosValue: price?.chaosValue ?? null,
        divineValue: price?.divineValue ?? null
      };
    });

    console.log(`✓ Loaded ${merged.length} Tattoos (${priceMap.size} with price data)`);
    return merged;
  } catch (error) {
    console.error('Error loading Tattoo data:', error);
    throw error;
  }
}

/**
 * Load and process temple upgrade combination data
 * @returns {Promise<{combinations: Array, uniques: Array, vials: Array, temple: Object}>}
 */
export async function loadTempleUpgradeData() {
  try {
    // Load JSON files
    const [uniquesResponse, vialsResponse, uniquePricesResponse, vialPricesResponse] = await Promise.all([
      fetch('/data/items/uniques.json'),
      fetch('/data/items/vials.json'),
      fetch('/data/prices/templeUniquePrices.json').catch(() => ({ ok: false })),
      fetch('/data/prices/vialPrices.json').catch(() => ({ ok: false }))
    ]);
    
    if (!uniquesResponse.ok) {
      throw new Error('Failed to load uniques.json');
    }
    if (!vialsResponse.ok) {
      throw new Error('Failed to load vials.json');
    }
    
    const uniques = await uniquesResponse.json();
    const vialsData = await vialsResponse.json();
    const vials = vialsData.lines || [];
    
    // Load and merge prices
    const uniquePrices = uniquePricesResponse.ok ? await uniquePricesResponse.json() : [];
    const vialPrices = vialPricesResponse.ok ? await vialPricesResponse.json() : [];
    
    // Create price maps
    const uniquePriceMap = new Map();
    uniquePrices.forEach(price => {
      const id = price.detailsId || price.id;
      if (id) {
        uniquePriceMap.set(id, price);
      }
    });
    
    const vialPriceMap = new Map();
    vialPrices.forEach(price => {
      const id = price.detailsId || price.id;
      if (id) {
        vialPriceMap.set(id, price);
      }
    });
    
    // Merge prices with uniques
    const uniquesWithPrices = uniques.map(unique => {
      const price = uniquePriceMap.get(unique.detailsId);
      return {
        ...unique,
        chaosValue: price?.chaosValue ?? null,
        divineValue: price?.divineValue ?? null
      };
    });
    
    // Merge prices with vials
    const vialsWithPrices = vials.map(vial => {
      const price = vialPriceMap.get(vial.detailsId);
      return {
        ...vial,
        chaosValue: price?.chaosValue ?? null,
        divineValue: price?.divineValue ?? null
      };
    });
    
    // Extract upgrade combinations
    const combinations = extractUpgradeCombinations(uniquesWithPrices, vialsWithPrices);
    
    // Calculate profitability for each combination
    combinations.forEach(combo => {
      calculateUpgradeProfitability(combo);
    });
    
    // Create temple item
    const temple = {
      name: 'Chronicle of Atzoatl',
      imagePath: '/assets/images/Chronicle_of_Atzoatl.png'
    };
    
    console.log(`✓ Loaded ${combinations.length} temple upgrade combinations`);
    return { combinations, uniques: uniquesWithPrices, vials: vialsWithPrices, temple };
  } catch (error) {
    console.error('Error loading Temple upgrade data:', error);
    throw error;
  }
}

/**
 * Calculate profitability for an upgrade combination
 * @param {Object} combo - Upgrade combination object
 */
function calculateUpgradeProfitability(combo) {
  const baseUniquePrice = combo.baseUnique.chaosValue ?? null;
  const vialPrice = combo.vial.chaosValue ?? null;
  const upgradedUniquePrice = combo.upgradedUnique.chaosValue ?? null;
  
  // Check if all prices are available
  if (baseUniquePrice === null || vialPrice === null || upgradedUniquePrice === null) {
    combo.profitabilityStatus = 'unknown';
    combo.profitChaos = null;
    combo.profitDivine = null;
    combo.totalCostChaos = null;
    combo.totalCostDivine = null;
    return;
  }
  
  // Calculate total cost (base unique + vial)
  const totalCostChaos = baseUniquePrice + vialPrice;
  const totalCostDivine = (combo.baseUnique.divineValue ?? 0) + (combo.vial.divineValue ?? 0);
  
  // Calculate profit (upgraded unique price - total cost)
  const profitChaos = upgradedUniquePrice - totalCostChaos;
  const profitDivine = (combo.upgradedUnique.divineValue ?? 0) - totalCostDivine;
  
  combo.totalCostChaos = totalCostChaos;
  combo.totalCostDivine = totalCostDivine;
  combo.profitChaos = profitChaos;
  combo.profitDivine = profitDivine;
  
  // Determine profitability status
  if (profitChaos > 0) {
    combo.profitabilityStatus = 'profitable';
  } else if (profitChaos < 0) {
    combo.profitabilityStatus = 'not_profitable';
  } else {
    combo.profitabilityStatus = 'unknown';
  }
}

/**
 * Extract upgrade combinations from unique items
 * @param {Array} uniques - Array of unique items
 * @param {Array} vials - Array of vial items
 * @returns {Array} Array of upgrade combination objects
 */
function extractUpgradeCombinations(uniques, vials) {
  const combinations = [];
  const vialMap = new Map(vials.map(v => [v.name, v]));
  
  // Find base uniques (have "Altar of Sacrifice" in flavourText)
  const baseUniques = uniques.filter(u => 
    u.flavourText && u.flavourText.includes('Altar of Sacrifice')
  );
  
  for (const baseUnique of baseUniques) {
    // Extract vial name from flavourText
    const vialMatch = baseUnique.flavourText.match(/Vial of ([^}]+)/);
    if (!vialMatch) {
      console.warn(`Could not extract vial name from: ${baseUnique.name}`);
      continue;
    }
    
    const vialName = `Vial of ${vialMatch[1].trim()}`;
    const vial = vialMap.get(vialName);
    if (!vial) {
      console.warn(`Vial not found: ${vialName} (for ${baseUnique.name})`);
      continue;
    }
    
    // Find upgraded unique (same baseType, related name)
    const upgradedUnique = findUpgradedUnique(baseUnique, uniques);
    if (!upgradedUnique) {
      console.warn(`Upgraded unique not found for: ${baseUnique.name}`);
      continue;
    }
    
    combinations.push({
      id: `${baseUnique.detailsId}-${vial.detailsId}`,
      baseUnique,
      vial,
      upgradedUnique
    });
  }
  
  return combinations;
}

/**
 * Find upgraded unique for a base unique
 * @param {Object} baseUnique - Base unique item
 * @param {Array} allUniques - All unique items
 * @returns {Object|null} Upgraded unique item or null if not found
 */
function findUpgradedUnique(baseUnique, allUniques) {
  // Known mappings
  const mappings = {
    "Apep's Slumber": "Apep's Supremacy",
    "Coward's Chains": "Coward's Legacy",
    "Architect's Hand": "Slavedriver's Hand",
    "Story of the Vaal": "Fate of the Vaal",
    "Mask of the Spirit Drinker": "Mask of the Stitched Demon",
    "Dance of the Offered": "Omeyocan",
    "Tempered Flesh": "Transcendent Flesh",
    "Tempered Spirit": "Transcendent Spirit",
    "Tempered Mind": "Transcendent Mind",
    "Sacrificial Heart": "Zerphi's Heart",
    "Soul Catcher": "Soul Ripper"
  };
  
  const upgradedName = mappings[baseUnique.name];
  if (upgradedName) {
    return allUniques.find(u => u.name === upgradedName) || null;
  }
  
  // Fallback: same baseType, no "Altar of Sacrifice" in flavourText
  return allUniques.find(u => 
    u.baseType === baseUnique.baseType &&
    (!u.flavourText || !u.flavourText.includes('Altar of Sacrifice')) &&
    u.name !== baseUnique.name
  ) || null;
}

