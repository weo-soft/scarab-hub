# Quickstart: Additional Item Price Data

**Date**: 2025-01-27  
**Feature**: Additional Item Price Data  
**Phase**: 1 - Design & Contracts

## Overview

This guide provides a quick reference for implementing support for loading and updating price data for 10 additional item types (Catalysts, Delirium Orbs, Emblems, Essences, Fossils, Lifeforce, Oils, Tattoos, Temple Uniques, and Vials) using the same patterns as existing Scarab price loading.

## Implementation Checklist

- [ ] Extend `leagueService.js` with item-type-specific file name helpers
- [ ] Extend `dataService.js` with multi-item-type loading functions
- [ ] Extend `priceUpdateService.js` to handle all item types
- [ ] Update `main.js` to initialize additional item type prices
- [ ] Add unit tests for new service functions
- [ ] Add integration tests for multi-item-type loading
- [ ] Verify error handling for partial failures
- [ ] Test league switching with all item types

## Step-by-Step Implementation

### Step 1: Define Item Type Configuration

Create a configuration object mapping item types to their file name patterns:

```javascript
// In leagueService.js or new config file
export const ITEM_TYPES = [
  { id: 'catalyst', displayName: 'Catalyst', fileNamePattern: 'catalystPrices_{league}.json' },
  { id: 'deliriumOrb', displayName: 'Delirium Orb', fileNamePattern: 'deliriumOrbPrices_{league}.json' },
  { id: 'emblem', displayName: 'Emblem', fileNamePattern: 'emblemPrices_{league}.json' },
  { id: 'essence', displayName: 'Essence', fileNamePattern: 'essencePrices_{league}.json' },
  { id: 'fossil', displayName: 'Fossil', fileNamePattern: 'fossilPrices_{league}.json' },
  { id: 'lifeforce', displayName: 'Lifeforce', fileNamePattern: 'lifeforcePrices_{league}.json' },
  { id: 'oil', displayName: 'Oil', fileNamePattern: 'oilPrices_{league}.json' },
  { id: 'tattoo', displayName: 'Tattoo', fileNamePattern: 'tattooPrices_{league}.json' },
  { id: 'templeUnique', displayName: 'Temple Unique', fileNamePattern: 'templeUniquePrices_{league}.json' },
  { id: 'vial', displayName: 'Vial', fileNamePattern: 'vialPrices_{league}.json' },
];
```

### Step 2: Extend LeagueService

Add helper functions to generate item-type-specific file names:

```javascript
// In leagueService.js

/**
 * Get price file name for an item type and selected league
 * @param {string} itemType - Item type identifier
 * @returns {string} Price file name
 */
export function getPriceFileName(itemType) {
  const league = getSelectedLeague();
  const itemTypeConfig = ITEM_TYPES.find(t => t.id === itemType);
  if (!itemTypeConfig) {
    throw new Error(`Unknown item type: ${itemType}`);
  }
  
  if (!league) {
    return itemTypeConfig.fileNamePattern.replace('{league}', 'Keepers');
  }
  return itemTypeConfig.fileNamePattern.replace('{league}', league.slug);
}

/**
 * Get local fallback path for an item type and selected league
 * @param {string} itemType - Item type identifier
 * @returns {string} Local path
 */
export function getPriceFileLocalPath(itemType) {
  const fileName = getPriceFileName(itemType);
  return `/data/${fileName}`;
}
```

### Step 3: Extend DataService

Add functions to load multiple item types:

```javascript
// In dataService.js

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
    } else {
      // Fallback: use empty array if promise rejected
      priceMap.set(itemTypes[index], []);
    }
  });
  
  return priceMap;
}
```

### Step 4: Extend PriceUpdateService

Update the service to handle all item types:

```javascript
// In priceUpdateService.js

/**
 * Check and update prices for all active item types
 * @returns {Promise<Map<string, UpdateResult>>}
 */
async checkAndUpdateAllPrices() {
  const itemTypes = ITEM_TYPES.map(t => t.id);
  const updatePromises = itemTypes.map(async (itemType) => {
    try {
      const priceFileName = getPriceFileName(itemType);
      const cacheInfo = getCacheInfo(priceFileName);
      
      if (!cacheInfo.hasCache || cacheInfo.age > this.DEFAULT_UPDATE_INTERVAL_MS) {
        const prices = await refreshItemTypePrices(itemType);
        return {
          itemType,
          success: true,
          itemCount: prices.length,
          timestamp: Date.now()
        };
      }
      
      return {
        itemType,
        success: true,
        itemCount: 0, // No update needed
        timestamp: Date.now()
      };
    } catch (error) {
      console.error(`Failed to update ${itemType} prices:`, error);
      return {
        itemType,
        success: false,
        itemCount: 0,
        error: error.message,
        timestamp: Date.now()
      };
    }
  });
  
  const results = await Promise.allSettled(updatePromises);
  const resultMap = new Map();
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const updateResult = result.value;
      resultMap.set(updateResult.itemType, updateResult);
      
      // Notify callback if set
      if (this.onPriceUpdateCallback && updateResult.success && updateResult.itemCount > 0) {
        // Load updated prices to pass to callback
        loadItemTypePrices(updateResult.itemType).then(prices => {
          this.onPriceUpdateCallback(updateResult.itemType, prices);
        }).catch(err => {
          console.error(`Error loading updated prices for callback:`, err);
        });
      }
    } else {
      resultMap.set(itemTypes[index], {
        itemType: itemTypes[index],
        success: false,
        itemCount: 0,
        error: result.reason?.message || 'Unknown error',
        timestamp: Date.now()
      });
    }
  });
  
  return resultMap;
}
```

### Step 5: Update Main Application

Initialize additional item type prices in main.js:

```javascript
// In main.js

// After loading Scarab data, load additional item types
const additionalItemTypes = ['catalyst', 'deliriumOrb', 'emblem', 'essence', 'fossil', 'lifeforce', 'oil', 'tattoo', 'templeUnique', 'vial'];

async function loadAllPriceData() {
  try {
    // Load Scarab data (existing)
    const scarabData = await loadAndMergeScarabData();
    
    // Load additional item type prices in parallel
    const additionalPrices = await loadAllItemTypePrices(additionalItemTypes);
    
    // Store prices for later use
    window.priceData = {
      scarabs: scarabData,
      additional: additionalPrices
    };
    
    console.log('✓ All price data loaded');
    return { scarabs: scarabData, additional: additionalPrices };
  } catch (error) {
    console.error('Error loading price data:', error);
    throw error;
  }
}

// In init() function, replace loadAndMergeScarabData() with loadAllPriceData()
```

### Step 6: Update Price Update Callbacks

Modify price update service to handle all item types:

```javascript
// In main.js

// Update price update callback to handle all item types
priceUpdateService.setOnPriceUpdate(async (itemType, updatedPrices) => {
  if (itemType === 'scarab') {
    // Existing Scarab update logic
    await reloadScarabDataWithPrices(updatedPrices);
  } else {
    // Update additional item type prices
    if (window.priceData) {
      window.priceData.additional.set(itemType, updatedPrices);
      console.log(`✓ Updated ${itemType} prices (${updatedPrices.length} items)`);
    }
  }
});
```

## Testing Guide

### Unit Tests

Test individual service functions:

```javascript
// tests/unit/services/dataService.test.js

import { loadItemTypePrices, loadAllItemTypePrices } from '../../../src/js/services/dataService.js';

describe('loadItemTypePrices', () => {
  it('should load catalyst prices', async () => {
    const prices = await loadItemTypePrices('catalyst');
    expect(Array.isArray(prices)).toBe(true);
    expect(prices.length).toBeGreaterThan(0);
    expect(prices[0]).toHaveProperty('name');
    expect(prices[0]).toHaveProperty('chaosValue');
    expect(prices[0]).toHaveProperty('detailsId');
  });
});

describe('loadAllItemTypePrices', () => {
  it('should load all item types in parallel', async () => {
    const itemTypes = ['catalyst', 'deliriumOrb', 'emblem'];
    const priceMap = await loadAllItemTypePrices(itemTypes);
    
    expect(priceMap.size).toBe(3);
    expect(priceMap.has('catalyst')).toBe(true);
    expect(priceMap.has('deliriumOrb')).toBe(true);
    expect(priceMap.has('emblem')).toBe(true);
  });
  
  it('should handle partial failures gracefully', async () => {
    // Mock one item type to fail
    const itemTypes = ['catalyst', 'nonexistent'];
    const priceMap = await loadAllItemTypePrices(itemTypes);
    
    expect(priceMap.size).toBe(2);
    expect(priceMap.get('catalyst').length).toBeGreaterThan(0);
    expect(priceMap.get('nonexistent')).toEqual([]);
  });
});
```

### Integration Tests

Test end-to-end loading:

```javascript
// tests/integration/dataService.test.js

describe('Multi-item-type price loading', () => {
  it('should load all 10 additional item types within 5 seconds', async () => {
    const startTime = Date.now();
    const itemTypes = ['catalyst', 'deliriumOrb', 'emblem', 'essence', 'fossil', 'lifeforce', 'oil', 'tattoo', 'templeUnique', 'vial'];
    const priceMap = await loadAllItemTypePrices(itemTypes);
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(5000);
    expect(priceMap.size).toBe(10);
    
    // Verify at least 8 item types loaded successfully
    const successfulLoads = Array.from(priceMap.values()).filter(prices => prices.length > 0).length;
    expect(successfulLoads).toBeGreaterThanOrEqual(8);
  });
});
```

## Common Pitfalls

1. **File Name Mismatch**: Ensure item type IDs match the file name patterns exactly (e.g., "deliriumOrb" not "delirium-orb")
2. **League Service Not Initialized**: Always ensure league service is initialized before calling file name helpers
3. **Error Handling**: Use `Promise.allSettled()` not `Promise.all()` to prevent one failure from blocking others
4. **Cache Keys**: Cache keys must include full file name to avoid collisions between item types
5. **Callback Timing**: Price update callbacks may fire asynchronously - handle race conditions

## Performance Tips

1. **Parallel Loading**: Always load all item types in parallel, not sequentially
2. **Cache First**: Check cache before making network requests
3. **Early Returns**: Return cached data immediately if valid
4. **Error Isolation**: Don't let one item type's failure block others
5. **Timeout Handling**: Set reasonable timeouts (10 seconds) for network requests

## Next Steps

After implementing:
1. Run test suite to verify functionality
2. Test with different leagues to ensure league switching works
3. Monitor console logs for any errors during loading
4. Verify cache behavior in browser DevTools
5. Test error scenarios (network offline, missing files)
