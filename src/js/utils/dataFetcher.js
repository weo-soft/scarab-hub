/**
 * Utility to fetch JSON data from remote URL with fallback to local
 * Includes caching and automatic refresh capabilities
 */

const DATA_BASE_URL = 'https://data.poeatlas.app/';
const CACHE_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Get cache key for a file
 * Note: Cache keys are league-specific via the fileName parameter
 */
function getCacheKey(fileName) {
  return `scarabHub_dataCache_${fileName}`;
}

/**
 * Get cache entry from localStorage
 */
function getCacheEntry(fileName) {
  try {
    const cacheKey = getCacheKey(fileName);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error(`Error reading cache for ${fileName}:`, error);
  }
  return null;
}

/**
 * Save cache entry to localStorage
 */
function saveCacheEntry(fileName, data) {
  try {
    const cacheKey = getCacheKey(fileName);
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      isLocal: false,
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
  } catch (error) {
    console.error(`Error saving cache for ${fileName}:`, error);
  }
}

/**
 * Check if cache is expired
 */
function isCacheExpired(cacheEntry) {
  if (!cacheEntry || cacheEntry.isLocal) {
    return true; // Always refresh local fallback data
  }
  const age = Date.now() - cacheEntry.timestamp;
  return age > CACHE_EXPIRATION_MS;
}

/**
 * Fetch data from remote URL with fallback to local
 * @param {string} fileName - The JSON file name (e.g., 'scarabPrices_Keepers.json')
 * @param {string} localPath - Local path to fallback file (e.g., '/data/scarabPrices_Keepers.json')
 * @returns {Promise<any>} The JSON data
 */
export async function fetchDataWithFallback(fileName, localPath) {
  const url = `${DATA_BASE_URL}${fileName}`;
  const cacheEntry = getCacheEntry(fileName);

  // If we have valid cached data, return it immediately
  if (cacheEntry && !isCacheExpired(cacheEntry)) {
    console.log(`✓ Using cached ${fileName}`);
    return cacheEntry.data;
  }

  // Try to fetch from remote
  try {
    console.log(`Fetching ${fileName} from ${url}...`);
    const response = await fetch(url, {
      cache: 'no-cache',
    });

    if (!response.ok) {
      // Check if it's a 404 (file not found)
      if (response.status === 404) {
        throw new Error(`Price data file not found: ${fileName} (404 Not Found)`);
      }
      throw new Error(`Failed to fetch ${fileName}: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Save to cache
    saveCacheEntry(fileName, data);
    
    console.log(`✓ Successfully loaded ${fileName} from remote`);
    return data;
  } catch (error) {
    console.warn(`⚠ Failed to fetch ${fileName} from remote, trying local fallback:`, error);

    // Try local fallback
    try {
      const localResponse = await fetch(localPath);
      if (!localResponse.ok) {
        // If local fallback also fails, throw a more specific error
        if (localResponse.status === 404) {
          throw new Error(`Unable to load ${fileName} from any source (file not found)`);
        }
        throw new Error(`Failed to fetch ${localPath}: ${localResponse.status} ${localResponse.statusText}`);
      }

      const data = await localResponse.json();
      
      // If we have stale cache, prefer it over local fallback
      if (cacheEntry && !cacheEntry.isLocal) {
        console.log(`✓ Using stale cached ${fileName} (local fallback available but cache is preferred)`);
        return cacheEntry.data;
      }

      console.log(`✓ Loaded ${fileName} from local fallback`);
      return data;
    } catch (localError) {
      // If we have any cached data (even expired), use it
      if (cacheEntry) {
        console.warn(`⚠ Using expired cache for ${fileName} (all fetch attempts failed)`);
        return cacheEntry.data;
      }

      console.error(`✗ Failed to load ${fileName} from all sources:`, localError);
      
      // Check if it's a JSON parse error (likely means file doesn't exist or is empty)
      if (localError instanceof SyntaxError && localError.message.includes('JSON.parse')) {
        throw new Error(`Unable to load ${fileName} from any source (file not found or invalid)`);
      }
      
      // Use the original error message if it's more specific
      if (localError.message && (localError.message.includes('file not found') || localError.message.includes('404'))) {
        throw new Error(`Unable to load ${fileName} from any source (file not found)`);
      }
      
      throw new Error(`Unable to load ${fileName} from any source`);
    }
  }
}

/**
 * Force refresh data from remote, bypassing cache
 * @param {string} fileName - The JSON file name
 * @param {string} localPath - Local path to fallback file
 * @returns {Promise<any>} Fresh data
 */
export async function forceRefreshData(fileName, localPath) {
  // Clear cache
  try {
    const cacheKey = getCacheKey(fileName);
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error(`Error clearing cache for ${fileName}:`, error);
  }

  // Fetch fresh data
  return await fetchDataWithFallback(fileName, localPath);
}

/**
 * Get cache information for a file
 * @param {string} fileName - The file name
 * @returns {object} Cache info with timestamp and age
 */
export function getCacheInfo(fileName) {
  const cacheEntry = getCacheEntry(fileName);
  if (!cacheEntry) {
    return {
      hasCache: false,
      timestamp: null,
      age: null,
      isLocal: false,
    };
  }

  return {
    hasCache: true,
    timestamp: cacheEntry.timestamp,
    age: Date.now() - cacheEntry.timestamp,
    isLocal: cacheEntry.isLocal,
  };
}

