import { describe, it, expect } from 'vitest';
import { Scarab, ExpectedValueThreshold, Simulation } from '../../../src/js/models/scarab.js';

describe('Scarab Model', () => {
  it('should create a valid Scarab instance', () => {
    const data = {
      id: 'test-scarab',
      name: 'Test Scarab',
      description: 'Test description',
      dropWeight: 100,
      dropLevel: 68,
      limit: 1,
      dropEnabledd: true,
      chaosValue: 1.5,
      divineValue: 0.01,
    };

    const scarab = new Scarab(data);
    expect(scarab.id).toBe('test-scarab');
    expect(scarab.name).toBe('Test Scarab');
    expect(scarab.dropWeight).toBe(100);
    expect(scarab.chaosValue).toBe(1.5);
  });

  it('should handle null dropWeight', () => {
    const data = {
      id: 'test-scarab',
      name: 'Test Scarab',
      dropWeight: null,
      dropLevel: 68,
      limit: 1,
      dropEnabledd: true,
    };

    const scarab = new Scarab(data);
    expect(scarab.dropWeight).toBeNull();
    expect(scarab.hasDropWeight()).toBe(false);
  });

  it('should handle null price data', () => {
    const data = {
      id: 'test-scarab',
      name: 'Test Scarab',
      dropWeight: 100,
      dropLevel: 68,
      limit: 1,
      dropEnabledd: true,
      chaosValue: null,
      divineValue: null,
    };

    const scarab = new Scarab(data);
    expect(scarab.hasPriceData()).toBe(false);
    expect(scarab.profitabilityStatus).toBe('unknown');
  });

  it('should validate required fields', () => {
    const validData = {
      id: 'test-scarab',
      name: 'Test Scarab',
      dropWeight: 100,
      dropLevel: 68,
      limit: 1,
      dropEnabledd: true,
    };

    const scarab = new Scarab(validData);
    expect(scarab.validate()).toBe(true);
  });

  it('should fail validation with missing id', () => {
    const invalidData = {
      name: 'Test Scarab',
      dropWeight: 100,
    };

    const scarab = new Scarab(invalidData);
    expect(scarab.validate()).toBe(false);
  });
});

describe('ExpectedValueThreshold Model', () => {
  it('should create a valid threshold', () => {
    const threshold = new ExpectedValueThreshold(1.5, 1000, 50);
    expect(threshold.value).toBe(1.5);
    expect(threshold.calculationMethod).toBe('weighted_average');
    expect(threshold.totalWeight).toBe(1000);
    expect(threshold.scarabCount).toBe(50);
    expect(threshold.validate()).toBe(true);
  });

  it('should fail validation with invalid data', () => {
    const threshold = new ExpectedValueThreshold(-1, 0, 0);
    expect(threshold.validate()).toBe(false);
  });
});

describe('Simulation Model', () => {
  it('should create a valid simulation', () => {
    const sim = new Simulation('optimized', [], 100);
    expect(sim.strategyType).toBe('optimized');
    expect(sim.transactionCount).toBe(100);
    expect(sim.id).toBeDefined();
  });

  it('should validate transaction count', () => {
    const sim1 = new Simulation('optimized', [], 0);
    expect(sim1.validate().valid).toBe(false);

    const sim2 = new Simulation('optimized', [], 10001);
    expect(sim2.validate().valid).toBe(false);

    const sim3 = new Simulation('optimized', [], 100);
    expect(sim3.validate().valid).toBe(true);
  });

  it('should validate user-chosen strategy requires 3+ Scarabs', () => {
    const sim1 = new Simulation('user_chosen', ['id1', 'id2'], 100);
    expect(sim1.validate().valid).toBe(false);

    const sim2 = new Simulation('user_chosen', ['id1', 'id2', 'id3'], 100);
    expect(sim2.validate().valid).toBe(true);
  });
});

