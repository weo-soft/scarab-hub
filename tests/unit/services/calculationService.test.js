import { describe, it, expect } from 'vitest';
import { Scarab, ExpectedValueThreshold } from '../../../src/js/models/scarab.js';
import {
  calculateThreshold,
  calculateProfitabilityStatus,
  calculateOptimizedStrategy,
  calculateUserChosenStrategy,
  calculateRandomStrategy,
  computeVariance,
} from '../../../src/js/services/calculationService.js';

describe('Calculation Service', () => {
  const createTestScarab = (id, dropWeight, chaosValue) => {
    return new Scarab({
      id,
      name: `Test ${id}`,
      dropWeight,
      dropLevel: 68,
      limit: 1,
      dropEnabledd: true,
      chaosValue,
    });
  };

  describe('calculateThreshold', () => {
    it('should calculate threshold correctly', () => {
      const scarabs = [
        createTestScarab('scar1', 100, 1.0),
        createTestScarab('scar2', 200, 2.0),
        createTestScarab('scar3', 300, 3.0),
      ];

      const threshold = calculateThreshold(scarabs);
      expect(threshold.value).toBeGreaterThan(0);
      expect(threshold.totalWeight).toBe(600);
      expect(threshold.scarabCount).toBe(3);
    });

    it('should exclude Scarabs without dropWeight', () => {
      const scarabs = [
        createTestScarab('scar1', 100, 1.0),
        createTestScarab('scar2', null, 2.0), // No dropWeight
        createTestScarab('scar3', 300, 3.0),
      ];

      const threshold = calculateThreshold(scarabs);
      expect(threshold.scarabCount).toBe(2); // Only scar1 and scar3
    });

    it('should exclude Scarabs without price data', () => {
      const scarabs = [
        createTestScarab('scar1', 100, 1.0),
        new Scarab({
          id: 'scar2',
          name: 'Test scar2',
          dropWeight: 200,
          dropLevel: 68,
          limit: 1,
          dropEnabledd: true,
          chaosValue: null, // No price
        }),
        createTestScarab('scar3', 300, 3.0),
      ];

      const threshold = calculateThreshold(scarabs);
      expect(threshold.scarabCount).toBe(2);
    });

    it('should throw error if no valid Scarabs', () => {
      const scarabs = [
        createTestScarab('scar1', null, null),
      ];

      expect(() => calculateThreshold(scarabs)).toThrow();
    });

    it('should include variance and confidence percentile in threshold calculation', () => {
      const scarabs = [
        createTestScarab('scar1', 100, 1.0),
        createTestScarab('scar2', 200, 2.0),
        createTestScarab('scar3', 300, 3.0),
      ];

      const threshold = calculateThreshold(scarabs);
      expect(threshold.expectedValue).toBeDefined();
      expect(threshold.variance).toBeDefined();
      expect(threshold.standardDeviation).toBeDefined();
      expect(threshold.confidencePercentile).toBe(0.9); // Default 90th percentile
      expect(threshold.variance).toBeGreaterThanOrEqual(0);
      expect(threshold.standardDeviation).toBeGreaterThanOrEqual(0);
    });

    it('should use custom confidence percentile', () => {
      const scarabs = [
        createTestScarab('scar1', 100, 1.0),
        createTestScarab('scar2', 200, 2.0),
        createTestScarab('scar3', 300, 3.0),
      ];

      const threshold90 = calculateThreshold(scarabs, 0.9);  // 90th percentile
      const threshold95 = calculateThreshold(scarabs, 0.95); // 95th percentile
      
      // Higher confidence percentile should result in lower threshold (more conservative)
      expect(threshold95.value).toBeLessThanOrEqual(threshold90.value);
      expect(threshold95.confidencePercentile).toBe(0.95);
      expect(threshold90.confidencePercentile).toBe(0.9);
    });

    it('should not allow negative threshold values', () => {
      // Create scarabs with very high variance
      const scarabs = [
        createTestScarab('scar1', 100, 1.0),
        createTestScarab('scar2', 100, 100.0), // High variance
      ];

      // Even with very high confidence percentile, threshold should not go negative
      const threshold = calculateThreshold(scarabs, 0.99);
      expect(threshold.value).toBeGreaterThanOrEqual(0);
    });

    it('should calculate 90th percentile threshold correctly', () => {
      // Create scarabs with known values
      const scarabs = [
        createTestScarab('scar1', 100, 1.0),
        createTestScarab('scar2', 200, 2.0),
        createTestScarab('scar3', 300, 3.0),
      ];

      const threshold = calculateThreshold(scarabs, 0.9);
      
      // Verify it uses 90th percentile confidence
      expect(threshold.confidencePercentile).toBe(0.9);
      
      // The threshold should be lower than the simple expected value / 3
      // because we're using the lower bound of the 90% confidence interval
      const simpleThreshold = threshold.expectedValue / 3;
      expect(threshold.value).toBeLessThanOrEqual(simpleThreshold);
    });
  });

  describe('computeVariance', () => {
    it('should calculate variance correctly', () => {
      const scarabs = [
        createTestScarab('scar1', 100, 1.0),
        createTestScarab('scar2', 200, 2.0),
        createTestScarab('scar3', 300, 3.0),
      ];
      const totalWeight = 600;
      const expectedValue = (100/600 * 1.0) + (200/600 * 2.0) + (300/600 * 3.0);

      const variance = computeVariance(scarabs, totalWeight, expectedValue);
      expect(variance).toBeGreaterThanOrEqual(0);
      expect(typeof variance).toBe('number');
    });

    it('should return zero variance for identical values', () => {
      const scarabs = [
        createTestScarab('scar1', 100, 5.0),
        createTestScarab('scar2', 200, 5.0),
        createTestScarab('scar3', 300, 5.0),
      ];
      const totalWeight = 600;
      const expectedValue = 5.0; // All values are 5.0

      const variance = computeVariance(scarabs, totalWeight, expectedValue);
      expect(variance).toBe(0);
    });
  });

  describe('calculateProfitabilityStatus', () => {
    it('should mark Scarabs below threshold as profitable', () => {
      const threshold = new ExpectedValueThreshold(2.0, 1000, 10);
      const scarabs = [
        createTestScarab('scar1', 100, 1.0), // Below threshold
        createTestScarab('scar2', 200, 3.0), // Above threshold
      ];

      calculateProfitabilityStatus(scarabs, threshold);
      expect(scarabs[0].profitabilityStatus).toBe('profitable');
      expect(scarabs[1].profitabilityStatus).toBe('not_profitable');
    });

    it('should mark Scarabs without price as unknown', () => {
      const threshold = new ExpectedValueThreshold(2.0, 1000, 10);
      const scarab = new Scarab({
        id: 'scar1',
        name: 'Test scar1',
        dropWeight: 100,
        dropLevel: 68,
        limit: 1,
        dropEnabledd: true,
        chaosValue: null,
      });

      calculateProfitabilityStatus([scarab], threshold);
      expect(scarab.profitabilityStatus).toBe('unknown');
    });
  });

  describe('calculateOptimizedStrategy', () => {
    it('should calculate optimized strategy results', () => {
      const threshold = new ExpectedValueThreshold(2.0, 1000, 10);
      const scarabs = [
        createTestScarab('scar1', 100, 1.0), // Profitable
        createTestScarab('scar2', 200, 3.0), // Not profitable
      ];

      calculateProfitabilityStatus(scarabs, threshold);
      const results = calculateOptimizedStrategy(scarabs, threshold, 100);

      expect(results.totalInputValue).toBeGreaterThan(0);
      expect(results.netProfitLoss).toBeDefined();
      expect(results.profitLossPerTransaction).toBeDefined();
    });
  });

  describe('calculateUserChosenStrategy', () => {
    it('should calculate user-chosen strategy results', () => {
      const threshold = new ExpectedValueThreshold(2.0, 1000, 10);
      const selectedScarabs = [
        createTestScarab('scar1', 100, 1.5),
        createTestScarab('scar2', 200, 2.0),
        createTestScarab('scar3', 300, 2.5),
      ];

      const results = calculateUserChosenStrategy(selectedScarabs, threshold, 50);
      expect(results.totalInputValue).toBeGreaterThan(0);
      expect(results.netProfitLoss).toBeDefined();
    });

    it('should throw error if less than 3 Scarabs', () => {
      const threshold = new ExpectedValueThreshold(2.0, 1000, 10);
      const selectedScarabs = [
        createTestScarab('scar1', 100, 1.5),
        createTestScarab('scar2', 200, 2.0),
      ];

      expect(() => calculateUserChosenStrategy(selectedScarabs, threshold, 50)).toThrow();
    });
  });

  describe('calculateRandomStrategy', () => {
    it('should calculate random strategy results', () => {
      const threshold = new ExpectedValueThreshold(2.0, 1000, 10);
      const scarabs = [
        createTestScarab('scar1', 100, 1.0),
        createTestScarab('scar2', 200, 2.0),
        createTestScarab('scar3', 300, 3.0),
      ];

      const results = calculateRandomStrategy(scarabs, threshold, 100);
      expect(results.totalInputValue).toBeGreaterThan(0);
      expect(results.netProfitLoss).toBeDefined();
    });
  });

  describe('Simulation Strategies', () => {
    it('should calculate optimized strategy correctly', () => {
      const threshold = new ExpectedValueThreshold(2.0, 1000, 10);
      const scarabs = [
        createTestScarab('scar1', 100, 1.0), // Profitable
        createTestScarab('scar2', 200, 3.0), // Not profitable
        createTestScarab('scar3', 300, 0.5), // Profitable
      ];

      calculateProfitabilityStatus(scarabs, threshold);
      const results = calculateOptimizedStrategy(scarabs, threshold, 50);
      
      expect(results.totalInputValue).toBeGreaterThan(0);
      expect(results.expectedOutputValue).toBe(threshold.value * 3);
      expect(results.profitLossPerTransaction).toBeDefined();
    });

    it('should calculate user-chosen strategy correctly', () => {
      const threshold = new ExpectedValueThreshold(2.0, 1000, 10);
      const selectedScarabs = [
        createTestScarab('scar1', 100, 1.5),
        createTestScarab('scar2', 200, 2.0),
        createTestScarab('scar3', 300, 2.5),
      ];

      const results = calculateUserChosenStrategy(selectedScarabs, threshold, 100);
      expect(results.totalInputValue).toBeGreaterThan(0);
      expect(results.netProfitLoss).toBeDefined();
    });

    it('should throw error for user-chosen with less than 3 Scarabs', () => {
      const threshold = new ExpectedValueThreshold(2.0, 1000, 10);
      const selectedScarabs = [
        createTestScarab('scar1', 100, 1.5),
        createTestScarab('scar2', 200, 2.0),
      ];

      expect(() => calculateUserChosenStrategy(selectedScarabs, threshold, 100)).toThrow();
    });
  });
});

