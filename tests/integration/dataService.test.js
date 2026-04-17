import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadAndMergeScarabData, loadAndMergeFossilData, getWildLifeforcePrice } from '../../src/js/services/dataService.js';

function jsonOk(data) {
  return Promise.resolve({
    ok: true,
    json: async () => data,
  });
}

describe('Data Service Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    globalThis.fetch = vi.fn();
  });

  it('should load and merge Scarab data correctly', async () => {
    const mockDetails = [
      {
        id: 'abyss-scarab',
        name: 'Abyss Scarab',
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

    globalThis.fetch.mockImplementation((url) => {
      const u = String(url);
      if (u.includes('/data/items/scarabs.json')) return jsonOk(mockDetails);
      if (u.includes('poedata.dev') && u.includes('scarabs')) {
        return jsonOk({ items: [{ id: 'abyss-scarab', weight: 601.0 }] });
      }
      if (u.includes('data.poeatlas.app') && u.includes('scarabPrices')) return jsonOk(mockPrices);
      if (u.includes('/data/prices/') && u.includes('scarab')) return jsonOk(mockPrices);
      return Promise.reject(new Error(`Unmocked fetch: ${u}`));
    });

    const result = await loadAndMergeScarabData();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('abyss-scarab');
    expect(result[0].chaosValue).toBe(0.4947);
    expect(result[0].divineValue).toBe(0.003294702);
    expect(result[0].dropWeight).toBe(601.0);
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

    const mockPrices = [];

    globalThis.fetch.mockImplementation((url) => {
      const u = String(url);
      if (u.includes('/data/items/scarabs.json')) return jsonOk(mockDetails);
      if (u.includes('poedata.dev') && u.includes('scarabs')) {
        return jsonOk({ items: [{ id: 'test-scarab', weight: 100 }] });
      }
      if (u.includes('data.poeatlas.app') && u.includes('scarabPrices')) return jsonOk(mockPrices);
      if (u.includes('/data/prices/') && u.includes('scarab')) return jsonOk(mockPrices);
      return Promise.reject(new Error(`Unmocked fetch: ${u}`));
    });

    const result = await loadAndMergeScarabData();

    expect(result).toHaveLength(1);
    expect(result[0].chaosValue).toBeNull();
    expect(result[0].divineValue).toBeNull();
  });

  it('should handle fetch errors', async () => {
    globalThis.fetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(loadAndMergeScarabData()).rejects.toThrow();
  });
});

describe('Fossil Data Service Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    globalThis.fetch = vi.fn();
  });

  it('should load and merge Fossil data correctly', async () => {
    const mockDetails = [
      { id: 'bound-fossil', name: 'Bound Fossil', description: 'More Minion' },
      { id: 'fractured-fossil', name: 'Fractured Fossil', description: 'Splits' },
    ];

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

    globalThis.fetch.mockImplementation((url) => {
      const u = String(url);
      if (u.includes('/data/items/fossils.json')) return jsonOk(mockDetails);
      if (u.includes('poedata.dev') && u.includes('fossils')) {
        return jsonOk({
          items: [
            { id: 'bound-fossil', weight: 10 },
            { id: 'fractured-fossil', weight: 5 },
          ],
        });
      }
      if (u.includes('data.poeatlas.app') && u.includes('fossilPrices')) return jsonOk(mockPrices);
      if (u.includes('/data/prices/') && u.includes('fossil')) return jsonOk(mockPrices);
      return Promise.reject(new Error(`Unmocked fetch: ${u}`));
    });

    const result = await loadAndMergeFossilData();

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Bound Fossil');
    expect(result[0].chaosValue).toBe(3.75);
    expect(result[1].name).toBe('Fractured Fossil');
    expect(result[1].chaosValue).toBe(9.53);
  });

  it('should handle missing Fossil price data gracefully', async () => {
    const mockDetails = [{ id: 'test-fossil', name: 'Test Fossil', description: 'x' }];
    const mockPrices = [
      {
        name: 'Test Fossil',
        detailsId: 'test-fossil',
        chaosValue: null,
        divineValue: null,
      },
    ];

    globalThis.fetch.mockImplementation((url) => {
      const u = String(url);
      if (u.includes('/data/items/fossils.json')) return jsonOk(mockDetails);
      if (u.includes('poedata.dev') && u.includes('fossils')) {
        return jsonOk({ items: [{ id: 'test-fossil', weight: 1 }] });
      }
      if (u.includes('data.poeatlas.app') && u.includes('fossilPrices')) return jsonOk(mockPrices);
      if (u.includes('/data/prices/') && u.includes('fossil')) return jsonOk(mockPrices);
      return Promise.reject(new Error(`Unmocked fetch: ${u}`));
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
        divineValue: 8.778264e-5,
      },
      {
        name: 'Primal Crystallised Lifeforce',
        detailsId: 'primal-crystallised-lifeforce',
        chaosValue: 0.02048,
        divineValue: 0.00013287424000000002,
      },
    ];

    globalThis.fetch.mockImplementation((url) => {
      const u = String(url);
      if (u.includes('data.poeatlas.app') && u.includes('lifeforcePrices')) return jsonOk(mockLifeforcePrices);
      if (u.includes('/data/prices/') && u.includes('lifeforce')) return jsonOk(mockLifeforcePrices);
      return Promise.reject(new Error(`Unmocked fetch: ${u}`));
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

    globalThis.fetch.mockImplementation((url) => {
      const u = String(url);
      if (u.includes('data.poeatlas.app') && u.includes('lifeforcePrices')) return jsonOk(mockLifeforcePrices);
      if (u.includes('/data/prices/') && u.includes('lifeforce')) return jsonOk(mockLifeforcePrices);
      return Promise.reject(new Error(`Unmocked fetch: ${u}`));
    });

    const result = await getWildLifeforcePrice();

    expect(result).toBeNull();
  });
});
