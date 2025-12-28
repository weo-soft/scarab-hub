import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadAndMergeScarabData } from '../../../src/js/services/dataService.js';
import { Scarab } from '../../../src/js/models/scarab.js';

// Mock fetch
global.fetch = vi.fn();

describe('Data Service Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load and merge Scarab data correctly', async () => {
    const mockDetails = [
      {
        id: 'abyss-scarab',
        name: 'Abyss Scarab',
        dropWeight: 601.0,
        dropLevel: 68,
        limit: 2,
        dropEnabledd: true,
        description: 'Area contains an additional Abyss',
      },
    ];

    const mockPrices = [
      {
        name: 'Abyss Scarab',
        detailsId: 'abyss-scarab',
        chaosValue: 0.4947,
        divineValue: 0.003294702,
      },
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockDetails,
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPrices,
    });

    const result = await loadAndMergeScarabData();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('abyss-scarab');
    expect(result[0].chaosValue).toBe(0.4947);
    expect(result[0].divineValue).toBe(0.003294702);
  });

  it('should handle missing price data gracefully', async () => {
    const mockDetails = [
      {
        id: 'test-scarab',
        name: 'Test Scarab',
        dropWeight: 100,
        dropLevel: 68,
        limit: 1,
        dropEnabledd: true,
      },
    ];

    const mockPrices = []; // No matching price

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockDetails,
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPrices,
    });

    const result = await loadAndMergeScarabData();

    expect(result).toHaveLength(1);
    expect(result[0].chaosValue).toBeNull();
    expect(result[0].divineValue).toBeNull();
  });

  it('should handle fetch errors', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(loadAndMergeScarabData()).rejects.toThrow();
  });
});

