/**
 * Price Update Service
 * Handles automatic periodic refresh of scarab price data
 */

import { refreshPriceData, refreshItemTypePrices, loadItemTypePrices } from './dataService.js';
import { getCacheInfo } from '../utils/dataFetcher.js';
import { getPriceFileName } from './leagueService.js';
import { ITEM_TYPES } from './leagueService.js';

export class PriceUpdateService {
  constructor() {
    this.updateIntervalId = null;
    this.DEFAULT_UPDATE_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
    this.onPriceUpdateCallback = null;
  }

  /**
   * Set callback to be called when prices are updated
   * @param {Function} callback - Function to call with updated prices
   * Callback signature: (itemType: string, prices: Array) => void
   */
  setOnPriceUpdate(callback) {
    this.onPriceUpdateCallback = callback;
  }

  /**
   * Start automatic background price updates
   * @param {number} intervalMs - Check interval in milliseconds (default: 1 hour)
   */
  startAutomaticUpdates(intervalMs) {
    // Stop existing interval if running
    this.stopAutomaticUpdates();

    const interval = intervalMs ?? this.DEFAULT_UPDATE_INTERVAL_MS;

    // Check immediately on start
    this.checkAndUpdatePrices().catch((error) => {
      console.error('Error during initial price update check:', error);
    });

    // Set up periodic checks
    this.updateIntervalId = window.setInterval(() => {
      this.checkAndUpdatePrices().catch((error) => {
        console.error('Error during automatic price update check:', error);
      });
    }, interval);

    console.log(`✓ Started automatic price updates (interval: ${interval / 1000 / 60} minutes)`);
  }

  /**
   * Stop automatic background price updates
   */
  stopAutomaticUpdates() {
    if (this.updateIntervalId !== null) {
      clearInterval(this.updateIntervalId);
      this.updateIntervalId = null;
      console.log('✓ Stopped automatic price updates');
    }
  }

  /**
   * Check cache and update prices if needed
   * @returns {Promise<void>}
   */
  async checkAndUpdatePrices() {
    // Use the new method that handles all item types
    await this.checkAndUpdateAllPrices();
  }

  /**
   * Check and update prices for all active item types
   * @returns {Promise<Map<string, object>>} Map of item type to update result
   */
  async checkAndUpdateAllPrices() {
    const itemTypes = ITEM_TYPES.filter(t => t.isActive).map(t => t.id);
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
        
        // Notify callback if set and update was successful with new data
        if (this.onPriceUpdateCallback && updateResult.success && updateResult.itemCount > 0) {
          // Load updated prices to pass to callback
          loadItemTypePrices(updateResult.itemType).then(prices => {
            this.onPriceUpdateCallback(updateResult.itemType, prices);
          }).catch(err => {
            console.error(`Error loading updated prices for callback:`, err);
          });
        }
        
        // Log update result
        if (updateResult.success) {
          if (updateResult.itemCount > 0) {
            console.log(`✓ Updated ${updateResult.itemType} prices (${updateResult.itemCount} items)`);
          } else {
            console.debug(`✓ ${updateResult.itemType} prices still valid (no update needed)`);
          }
        } else {
          console.warn(`⚠ Failed to update ${updateResult.itemType} prices: ${updateResult.error}`);
        }
      } else {
        const itemType = itemTypes[index];
        resultMap.set(itemType, {
          itemType,
          success: false,
          itemCount: 0,
          error: result.reason?.message || 'Unknown error',
          timestamp: Date.now()
        });
        console.error(`✗ Promise rejected for ${itemType} update:`, result.reason);
      }
    });
    
    return resultMap;
  }

  /**
   * Force refresh prices immediately
   * @returns {Promise<Array>} Updated prices (for backward compatibility, returns Scarab prices)
   */
  async forceRefresh() {
    // Use the new method that handles all item types
    const results = await this.forceRefreshAllPrices();
    // For backward compatibility, return Scarab prices
    const scarabResult = results.get('scarab');
    if (scarabResult && scarabResult.success) {
      return await loadItemTypePrices('scarab');
    }
    return [];
  }

  /**
   * Force refresh all item type prices immediately
   * @returns {Promise<Map<string, object>>} Map of item type to update result
   */
  async forceRefreshAllPrices() {
    const itemTypes = ITEM_TYPES.filter(t => t.isActive).map(t => t.id);
    const updatePromises = itemTypes.map(async (itemType) => {
      try {
        const prices = await refreshItemTypePrices(itemType);
        
        // Notify callback if set
        if (this.onPriceUpdateCallback) {
          this.onPriceUpdateCallback(itemType, prices);
        }
        
        return {
          itemType,
          success: true,
          itemCount: prices.length,
          timestamp: Date.now()
        };
      } catch (error) {
        console.error(`Failed to force refresh ${itemType} prices:`, error);
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
        
        // Log update result
        if (updateResult.success) {
          console.log(`✓ Force refreshed ${updateResult.itemType} prices (${updateResult.itemCount} items)`);
        } else {
          console.warn(`⚠ Failed to force refresh ${updateResult.itemType} prices: ${updateResult.error}`);
        }
      } else {
        const itemType = itemTypes[index];
        resultMap.set(itemType, {
          itemType,
          success: false,
          itemCount: 0,
          error: result.reason?.message || 'Unknown error',
          timestamp: Date.now()
        });
        console.error(`✗ Promise rejected for ${itemType} force refresh:`, result.reason);
      }
    });
    
    return resultMap;
  }
}

// Export singleton instance
export const priceUpdateService = new PriceUpdateService();

