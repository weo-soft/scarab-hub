/**
 * Unit tests for Simulation Service
 * Tests core simulation engine functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createConfiguration, validateConfiguration, runSimulation } from '../../../src/js/services/simulationService.js';
import { Scarab } from '../../../src/js/models/scarab.js';

describe('SimulationService', () => {
  let mockScarabs;
  
  beforeEach(() => {
    mockScarabs = [
      new Scarab({ id: 'scarab-1', name: 'Scarab 1', dropWeight: 100, chaosValue: 1.0 }),
      new Scarab({ id: 'scarab-2', name: 'Scarab 2', dropWeight: 200, chaosValue: 2.0 }),
      new Scarab({ id: 'scarab-3', name: 'Scarab 3', dropWeight: 300, chaosValue: 3.0 }),
    ];
  });
  
  describe('createConfiguration', () => {
    it('should create configuration with default values', () => {
      const config = createConfiguration({
        selectedScarabIds: ['scarab-1', 'scarab-2', 'scarab-3'],
        transactionCount: 1000,
      });
      
      expect(config.selectedScarabIds).toHaveLength(3);
      expect(config.breakevenPoint).toBe(0);
      expect(config.rareScarabThreshold).toBe(0.1);
      expect(config.transactionCount).toBe(1000);
    });
  });
  
  describe('validateConfiguration', () => {
    it('should validate correct configuration', () => {
      const config = createConfiguration({
        selectedScarabIds: ['scarab-1', 'scarab-2', 'scarab-3'],
        transactionCount: 1000,
      });
      
      const validation = validateConfiguration(config, mockScarabs);
      expect(validation.valid).toBe(true);
    });
    
    it('should reject configuration with fewer than 3 scarabs', () => {
      const config = createConfiguration({
        selectedScarabIds: ['scarab-1', 'scarab-2'],
        transactionCount: 1000,
      });
      
      const validation = validateConfiguration(config, mockScarabs);
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('3 scarabs');
    });
    
    it('should reject invalid transaction count', () => {
      const config = createConfiguration({
        selectedScarabIds: ['scarab-1', 'scarab-2', 'scarab-3'],
        transactionCount: 2000000,
      });
      
      const validation = validateConfiguration(config, mockScarabs);
      expect(validation.valid).toBe(false);
    });
  });
  
  describe('runSimulation', () => {
    it('should run simulation and return results', async () => {
      const config = createConfiguration({
        selectedScarabIds: ['scarab-1', 'scarab-2', 'scarab-3'],
        transactionCount: 100,
      });
      
      const result = await runSimulation(config, mockScarabs);
      
      expect(result).toBeDefined();
      expect(result.totalTransactions).toBe(100);
      expect(result.transactions).toHaveLength(100);
      expect(result.yieldCounts.size).toBeGreaterThan(0);
    });
  });
});

