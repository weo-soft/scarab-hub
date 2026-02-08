import { describe, it, expect } from 'vitest';
import { Fossil } from '../../../src/js/models/fossil.js';

describe('Fossil Model', () => {
  it('should create a valid Fossil instance', () => {
    const data = {
      id: 'bound-fossil',
      name: 'Bound Fossil',
      chaosValue: 3.75,
      divineValue: 0.02433,
      detailsId: 'bound-fossil',
    };

    const fossil = new Fossil(data);
    expect(fossil.id).toBe('bound-fossil');
    expect(fossil.name).toBe('Bound Fossil');
    expect(fossil.chaosValue).toBe(3.75);
    expect(fossil.divineValue).toBe(0.02433);
    expect(fossil.rerollGroup).toBe('fossil');
  });

  it('should handle null price data', () => {
    const data = {
      id: 'test-fossil',
      name: 'Test Fossil',
      chaosValue: null,
      divineValue: null,
      detailsId: 'test-fossil',
    };

    const fossil = new Fossil(data);
    expect(fossil.hasPriceData()).toBe(false);
    expect(fossil.profitabilityStatus).toBe('unknown');
  });

  it('should validate required fields', () => {
    const validData = {
      id: 'test-fossil',
      name: 'Test Fossil',
      chaosValue: 1.5,
      divineValue: 0.01,
    };

    const fossil = new Fossil(validData);
    expect(fossil.validate()).toBe(true);
  });

  it('should fail validation with missing id', () => {
    const invalidData = {
      name: 'Test Fossil',
      chaosValue: 1.5,
    };

    const fossil = new Fossil(invalidData);
    expect(fossil.validate()).toBe(false);
  });

  it('should fail validation with missing name', () => {
    const invalidData = {
      id: 'test-fossil',
      chaosValue: 1.5,
    };

    const fossil = new Fossil(invalidData);
    expect(fossil.validate()).toBe(false);
  });

  it('should fail validation with negative price', () => {
    const invalidData = {
      id: 'test-fossil',
      name: 'Test Fossil',
      chaosValue: -1.5,
    };

    const fossil = new Fossil(invalidData);
    expect(fossil.validate()).toBe(false);
  });

  it('should fail validation with invalid reroll group', () => {
    const invalidData = {
      id: 'test-fossil',
      name: 'Test Fossil',
      chaosValue: 1.5,
      rerollGroup: 'invalid-group',
    };

    const fossil = new Fossil(invalidData);
    expect(fossil.validate()).toBe(false);
  });

  it('should check if Fossil has price data', () => {
    const fossilWithPrice = new Fossil({
      id: 'test-fossil',
      name: 'Test Fossil',
      chaosValue: 1.5,
    });
    expect(fossilWithPrice.hasPriceData()).toBe(true);

    const fossilWithoutPrice = new Fossil({
      id: 'test-fossil',
      name: 'Test Fossil',
      chaosValue: null,
    });
    expect(fossilWithoutPrice.hasPriceData()).toBe(false);
  });

  it('should check if Fossil has valid reroll group', () => {
    const fossil = new Fossil({
      id: 'test-fossil',
      name: 'Test Fossil',
      chaosValue: 1.5,
    });
    expect(fossil.hasRerollGroup()).toBe(true);

    const fossilWithoutGroup = new Fossil({
      id: 'test-fossil',
      name: 'Test Fossil',
      chaosValue: 1.5,
      rerollGroup: null,
    });
    expect(fossilWithoutGroup.hasRerollGroup()).toBe(false);
  });

  it('should toggle selection state', () => {
    const fossil = new Fossil({
      id: 'test-fossil',
      name: 'Test Fossil',
      chaosValue: 1.5,
    });
    
    expect(fossil.selectedForReroll).toBe(false);
    fossil.toggleSelection();
    expect(fossil.selectedForReroll).toBe(true);
    fossil.toggleSelection();
    expect(fossil.selectedForReroll).toBe(false);
  });

  it('should set selection state', () => {
    const fossil = new Fossil({
      id: 'test-fossil',
      name: 'Test Fossil',
      chaosValue: 1.5,
    });
    
    fossil.setSelected(true);
    expect(fossil.selectedForReroll).toBe(true);
    fossil.setSelected(false);
    expect(fossil.selectedForReroll).toBe(false);
  });
});

