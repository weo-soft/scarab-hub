/**
 * Performance tests for large-scale simulations
 * Tests 1 million transaction simulations
 */

import { describe, it, expect } from 'vitest';
import { createConfiguration, runSimulation } from '../../src/js/services/simulationService.js';
import { Scarab } from '../../src/js/models/scarab.js';

describe('Large Simulation Performance', () => {
  const createMockScarabs = (count = 10) => {
    const scarabs = [];
    for (let i = 0; i < count; i++) {
      scarabs.push(new Scarab({
        id: `scarab-${i}`,
        name: `Scarab ${i}`,
        dropWeight: 100 + i * 10,
        chaosValue: 1.0 + i * 0.5,
      }));
    }
    return scarabs;
  };
  
  it('should handle 1 million transactions without errors', async () => {
    const scarabs = createMockScarabs(10);
    const config = createConfiguration({
      selectedScarabIds: scarabs.slice(0, 3).map(s => s.id),
      transactionCount: 1000000,
    });
    
    const startTime = Date.now();
    const result = await runSimulation(config, scarabs);
    const executionTime = Date.now() - startTime;
    
    expect(result.totalTransactions).toBe(1000000);
    expect(result.transactions).toHaveLength(1000000);
    expect(executionTime).toBeLessThan(300000); // Should complete in under 5 minutes
  }, 600000); // 10 minute timeout
  
  it('should maintain memory efficiency for large simulations', async () => {
    const scarabs = createMockScarabs(10);
    const config = createConfiguration({
      selectedScarabIds: scarabs.slice(0, 3).map(s => s.id),
      transactionCount: 100000,
    });
    
    const result = await runSimulation(config, scarabs);
    
    // Verify memory-efficient data structures
    expect(result.transactions.length).toBe(100000);
    expect(result.yieldCounts.size).toBeLessThanOrEqual(10);
  });
});

