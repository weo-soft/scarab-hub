import { describe, it, expect } from 'vitest';
import { Fossil } from '../../../src/js/models/fossil.js';
import {
  calculateExpectedValueForGroup,
  calculateThresholdForGroup,
  calculateProfitabilityStatus,
  calculateExpectedOutcomeForSelected,
} from '../../../src/js/services/fossilCalculationService.js';

describe('Fossil Calculation Service', () => {
  const createTestFossil = (id, chaosValue, dropWeight = null) => {
    return new Fossil({
      id,
      name: `Test ${id}`,
      chaosValue,
      divineValue: chaosValue ? chaosValue * 0.0065 : null,
      detailsId: id,
      dropWeight,
    });
  };

  describe('calculateExpectedValueForGroup', () => {
    it('should calculate expected value correctly with equal weighting', () => {
      const fossils = [
        createTestFossil('fossil1', 1.0),
        createTestFossil('fossil2', 2.0),
        createTestFossil('fossil3', 3.0),
      ];

      const result = calculateExpectedValueForGroup(fossils);
      expect(result.expectedValue).toBe(2.0); // (1.0 + 2.0 + 3.0) / 3
      expect(result.method).toBe('equal_weighted');
    });

    it('should calculate expected value with drop-weight weighting when all have weights', () => {
      const fossils = [
        createTestFossil('fossil1', 10.0, 100),  // common, low value
        createTestFossil('fossil2', 2.0, 50),   // rarer
        createTestFossil('fossil3', 1.0, 50),   // rarer, low value
      ];
      // totalWeight = 200; weighted EV = (100/200)*10 + (50/200)*2 + (50/200)*1 = 5 + 0.5 + 0.25 = 5.75
      const result = calculateExpectedValueForGroup(fossils);
      expect(result.expectedValue).toBe(5.75);
      expect(result.method).toBe('weighted');
    });

    it('should exclude Fossils without price data', () => {
      const fossils = [
        createTestFossil('fossil1', 1.0),
        createTestFossil('fossil2', null), // No price
        createTestFossil('fossil3', 3.0),
      ];

      const result = calculateExpectedValueForGroup(fossils);
      expect(result.expectedValue).toBe(2.0); // (1.0 + 3.0) / 2
      expect(result.method).toBe('equal_weighted');
    });

    it('should return 0 for empty array', () => {
      const result = calculateExpectedValueForGroup([]);
      expect(result.expectedValue).toBe(0);
      expect(result.method).toBe('equal_weighted');
    });

    it('should return 0 for array with no valid prices', () => {
      const fossils = [
        createTestFossil('fossil1', null),
        createTestFossil('fossil2', null),
      ];

      const result = calculateExpectedValueForGroup(fossils);
      expect(result.expectedValue).toBe(0);
      expect(result.method).toBe('equal_weighted');
    });

    it('should handle single Fossil', () => {
      const fossils = [createTestFossil('fossil1', 5.0)];
      const result = calculateExpectedValueForGroup(fossils);
      expect(result.expectedValue).toBe(5.0);
      expect(result.method).toBe('equal_weighted');
    });
  });

  describe('calculateThresholdForGroup', () => {
    it('should calculate threshold correctly', () => {
      const expectedValue = 2.0;
      const rerollCost = 0.5; // 30 × Wild Crystallised Lifeforce price
      const threshold = calculateThresholdForGroup(expectedValue, rerollCost);
      expect(threshold).toBe(1.5); // 2.0 - 0.5
    });

    it('should handle negative threshold (unprofitable group)', () => {
      const expectedValue = 0.5;
      const rerollCost = 1.0;
      const threshold = calculateThresholdForGroup(expectedValue, rerollCost);
      expect(threshold).toBe(-0.5); // 0.5 - 1.0
    });

    it('should return expectedValue if rerollCost is unavailable', () => {
      const expectedValue = 2.0;
      const threshold = calculateThresholdForGroup(expectedValue, null);
      expect(threshold).toBe(2.0);
    });

    it('should return 0 if expectedValue is invalid', () => {
      const threshold = calculateThresholdForGroup(null, 0.5);
      expect(threshold).toBe(0);
    });
  });

  describe('calculateProfitabilityStatus', () => {
    it('should return profitable when Fossil value is below threshold', () => {
      const fossil = createTestFossil('fossil1', 1.0);
      const threshold = 2.0;
      const status = calculateProfitabilityStatus(fossil, threshold);
      expect(status).toBe('profitable');
    });

    it('should return not_profitable when Fossil value is above threshold', () => {
      const fossil = createTestFossil('fossil1', 3.0);
      const threshold = 2.0;
      const status = calculateProfitabilityStatus(fossil, threshold);
      expect(status).toBe('not_profitable');
    });

    it('should return not_profitable when Fossil value equals threshold', () => {
      const fossil = createTestFossil('fossil1', 2.0);
      const threshold = 2.0;
      const status = calculateProfitabilityStatus(fossil, threshold);
      expect(status).toBe('not_profitable');
    });

    it('should return unknown when Fossil has no price data', () => {
      const fossil = createTestFossil('fossil1', null);
      const threshold = 2.0;
      const status = calculateProfitabilityStatus(fossil, threshold);
      expect(status).toBe('unknown');
    });

    it('should return unknown when threshold is invalid', () => {
      const fossil = createTestFossil('fossil1', 1.0);
      const status = calculateProfitabilityStatus(fossil, null);
      expect(status).toBe('unknown');
    });
  });

  describe('calculateExpectedOutcomeForSelected', () => {
    it('should calculate expected outcome for selected Fossils', () => {
      const selectedFossils = [
        createTestFossil('fossil1', 1.0),
        createTestFossil('fossil2', 2.0),
        createTestFossil('fossil3', 3.0),
      ];
      const expectedValue = 2.5;

      const outcome = calculateExpectedOutcomeForSelected(selectedFossils, expectedValue);
      expect(outcome.totalInputValue).toBe(6.0); // 1.0 + 2.0 + 3.0
      expect(outcome.expectedOutputValue).toBe(7.5); // 2.5 × 3
      expect(outcome.netProfitLoss).toBe(1.5); // 7.5 - 6.0
      expect(outcome.averageProfitLossPerFossil).toBe(0.5); // 1.5 / 3
    });

    it('should exclude Fossils without price data', () => {
      const selectedFossils = [
        createTestFossil('fossil1', 1.0),
        createTestFossil('fossil2', null), // No price
        createTestFossil('fossil3', 3.0),
      ];
      const expectedValue = 2.0;

      const outcome = calculateExpectedOutcomeForSelected(selectedFossils, expectedValue);
      expect(outcome.totalInputValue).toBe(4.0); // 1.0 + 3.0
      expect(outcome.expectedOutputValue).toBe(4.0); // 2.0 × 2 (only fossils with prices)
      expect(outcome.netProfitLoss).toBe(0.0);
    });

    it('should return zeros for empty array', () => {
      const outcome = calculateExpectedOutcomeForSelected([], 2.0);
      expect(outcome.totalInputValue).toBe(0);
      expect(outcome.expectedOutputValue).toBe(0);
      expect(outcome.netProfitLoss).toBe(0);
      expect(outcome.averageProfitLossPerFossil).toBe(0);
    });

    it('should handle invalid expectedValue', () => {
      const selectedFossils = [createTestFossil('fossil1', 1.0)];
      const outcome = calculateExpectedOutcomeForSelected(selectedFossils, null);
      expect(outcome.totalInputValue).toBe(1.0);
      expect(outcome.expectedOutputValue).toBe(0);
      expect(outcome.netProfitLoss).toBe(-1.0);
    });
  });
});

