import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadAndMergeScarabData, loadAndMergeFossilData, getWildLifeforcePrice } from '../../../src/js/services/dataService.js';
import { Scarab } from '../../../src/js/models/scarab.js';
import { Fossil } from '../../../src/js/models/fossil.js';

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

describe('Fossil Data Service Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load and merge Fossil data correctly', async () => {
    const mockPrices = [
      {
        name: 'Bound Fossil',
        detailsId: 'bound-fossil',
        chaosValue: 3.75,
        divineValue: 0.02433,
      },
      {
        name: 'Fractured Fossil',
        detailsId: 'fractured-fossil',
        chaosValue: 9.53,
        divineValue: 0.06183063999999999,
      },
    ];

    // Mock loadItemTypePrices to return mockPrices
    vi.doMock('../../../src/js/services/dataService.js', async () => {
      const actual = await vi.importActual('../../../src/js/services/dataService.js');
      return {
        ...actual,
        loadItemTypePrices: vi.fn().mockResolvedValue(mockPrices),
      };
    });

    // Since loadAndMergeFossilData uses loadItemTypePrices internally,
    // we need to mock the fetch for the data fetcher
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPrices,
    });

    const result = await loadAndMergeFossilData();

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Bound Fossil');
    expect(result[0].chaosValue).toBe(3.75);
    expect(result[1].name).toBe('Fractured Fossil');
    expect(result[1].chaosValue).toBe(9.53);
  });

  it('should handle missing Fossil price data gracefully', async () => {
    const mockPrices = [
      {
        name: 'Test Fossil',
        detailsId: 'test-fossil',
        chaosValue: null,
        divineValue: null,
      },
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPrices,
    });

    const result = await loadAndMergeFossilData();

    expect(result).toHaveLength(1);
    expect(result[0].chaosValue).toBeNull();
    expect(result[0].divineValue).toBeNull();
  });

  it('should get Wild Crystallised Lifeforce price', async () => {
    const mockLifeforcePrices = [
      {
        name: 'Wild Crystallised Lifeforce',
        detailsId: 'wild-crystallised-lifeforce',
        chaosValue: 0.01353,
        divineValue: 8.778264e-05,
      },
      {
        name: 'Primal Crystallised Lifeforce',
        detailsId: 'primal-crystallised-lifeforce',
        chaosValue: 0.02048,
        divineValue: 0.00013287424000000002,
      },
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLifeforcePrices,
    });

    const result = await getWildLifeforcePrice();

    expect(result).toBeDefined();
    expect(result.name).toBe('Wild Crystallised Lifeforce');
    expect(result.chaosValue).toBe(0.01353);
  });

  it('should return null if Wild Crystallised Lifeforce not found', async () => {
    const mockLifeforcePrices = [
      {
        name: 'Primal Crystallised Lifeforce',
        detailsId: 'primal-crystallised-lifeforce',
        chaosValue: 0.02048,
      },
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLifeforcePrices,
    });

    const result = await getWildLifeforcePrice();

    expect(result).toBeNull();
  });
});

