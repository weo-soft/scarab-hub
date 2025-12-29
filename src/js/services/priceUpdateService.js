/**
 * Price Update Service
 * Handles automatic periodic refresh of scarab price data
 */

import { refreshPriceData } from './dataService.js';
import { getCacheInfo } from '../utils/dataFetcher.js';
import { getPriceFileName } from './leagueService.js';

export class PriceUpdateService {
  constructor() {
    this.updateIntervalId = null;
    this.DEFAULT_UPDATE_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
    this.onPriceUpdateCallback = null;
  }

  /**
   * Set callback to be called when prices are updated
   * @param {Function} callback - Function to call with updated prices
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
    const priceFileName = getPriceFileName();
    const cacheInfo = getCacheInfo(priceFileName);
    
    // If cache is expired or doesn't exist, refresh
    if (!cacheInfo.hasCache || cacheInfo.age > this.DEFAULT_UPDATE_INTERVAL_MS) {
      try {
        console.log('Price data cache expired, refreshing...');
        const prices = await refreshPriceData();
        
        // Notify callback if set
        if (this.onPriceUpdateCallback) {
          this.onPriceUpdateCallback(prices);
        }
        
        console.log(`✓ Price data refreshed (${prices.length} items)`);
      } catch (error) {
        console.error('Failed to refresh price data:', error);
      }
    } else {
      console.debug(`Price data cache is still valid (age: ${Math.round(cacheInfo.age / 1000 / 60)} minutes)`);
    }
  }

  /**
   * Force refresh prices immediately
   * @returns {Promise<Array>} Updated prices
   */
  async forceRefresh() {
    try {
      console.log('Force refreshing price data...');
      const prices = await refreshPriceData();
      
      // Notify callback if set
      if (this.onPriceUpdateCallback) {
        this.onPriceUpdateCallback(prices);
      }
      
      console.log(`✓ Price data force refreshed (${prices.length} items)`);
      return prices;
    } catch (error) {
      console.error('Failed to force refresh price data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const priceUpdateService = new PriceUpdateService();

