import { describe, it, expect } from 'vitest';
import { Scarab } from '../../../src/js/models/scarab.js';
import {
  calculateThreshold,
  calculateProfitabilityStatus,
} from '../../../src/js/services/calculationService.js';

describe('Calculation Service Integration', () => {
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

  it('should calculate threshold and update profitability status', () => {
    const scarabs = [
      createTestScarab('scar1', 100, 0.5), // Below threshold (will be profitable)
      createTestScarab('scar2', 200, 1.0),
      createTestScarab('scar3', 300, 2.0), // Above threshold (will be not profitable)
    ];

    // Calculate threshold
    const threshold = calculateThreshold(scarabs);
    expect(threshold.value).toBeGreaterThan(0);
    expect(threshold.validate()).toBe(true);

    // Calculate profitability status
    calculateProfitabilityStatus(scarabs, threshold);

    // Verify statuses
    expect(scarabs[0].profitabilityStatus).toBe('profitable');
    expect(scarabs[2].profitabilityStatus).toBe('not_profitable');
  });

  it('should handle threshold calculation with real-world data structure', () => {
    const scarabs = [
      createTestScarab('abyss-scarab', 601.0, 0.4947),
      createTestScarab('ambush-scarab', 646.0, 1.25),
      createTestScarab('anarchy-scarab', 628.0, 0.5073),
    ];

    const threshold = calculateThreshold(scarabs);
    expect(threshold.value).toBeGreaterThan(0);
    expect(threshold.scarabCount).toBe(3);
    expect(threshold.totalWeight).toBe(601.0 + 646.0 + 628.0);
  });
});

