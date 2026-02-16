# Data Contracts: Additional Item Price Data

**Date**: 2025-01-27  
**Feature**: Additional Item Price Data  
**Phase**: 1 - Design & Contracts

## Overview

This document defines the data contracts for loading and managing price data for multiple item types. All contracts follow the same structure as existing Scarab price data contracts.

## Price Data File Contract

### Remote URL Format

```
GET https://data.poeatlas.app/{itemType}Prices_{leagueSlug}.json
```

**Parameters**:
- `itemType`: Item type identifier (e.g., "catalyst", "deliriumOrb")
- `leagueSlug`: League identifier (e.g., "Keepers")

**Response**: `200 OK` with JSON array, or `404 Not Found`

**Response Headers**:
- `Content-Type: application/json`
- `Cache-Control: no-cache` (recommended)

---

### Local Fallback Path Format

```
GET /data/{itemType}Prices_{leagueSlug}.json
```

**Parameters**: Same as remote URL

**Response**: `200 OK` with JSON array, or `404 Not Found`

---

### Price Data Array Schema

```typescript
type PriceDataArray = Array<PriceDataEntry>;

interface PriceDataEntry {
  name: string;              // Display name (e.g., "Accelerating Catalyst")
  chaosValue: number | null; // Market value in Chaos Orbs, null if unavailable
  divineValue: number | null; // Market value in Divine Orbs, null if unavailable
  detailsId: string;         // Unique identifier matching item details
}
```

**Validation Rules**:
- Array must be valid JSON
- Each entry must have `name` and `detailsId` (non-empty strings)
- `chaosValue` and `divineValue` must be numbers >= 0 or null
- `detailsId` must be unique within the array
- Array can be empty (no items available)

**Example**:
```json
[
  {
    "name": "Accelerating Catalyst",
    "chaosValue": 0.9754,
    "divineValue": 0.0063283952,
    "detailsId": "accelerating-catalyst"
  },
  {
    "name": "Abrasive Catalyst",
    "chaosValue": 0.8901,
    "divineValue": 0.0057749687999999995,
    "detailsId": "abrasive-catalyst"
  }
]
```

---

## Service Contracts

### DataService Contract

#### `loadItemTypePrices(itemType: string): Promise<Array<PriceDataEntry>>`

Loads price data for a specific item type.

**Parameters**:
- `itemType` (string, required): Item type identifier (e.g., "catalyst")

**Returns**: Promise resolving to array of price data entries

**Errors**:
- Throws if item type is invalid
- Throws if both remote and local fallback fail
- Returns empty array if file not found but fallback available

**Side Effects**:
- Updates LocalStorage cache if fetch successful
- Logs warnings for fallback usage

---

#### `loadAllItemTypePrices(itemTypes: Array<string>): Promise<Map<string, Array<PriceDataEntry>>>`

Loads price data for multiple item types in parallel.

**Parameters**:
- `itemTypes` (array<string>, required): Array of item type identifiers

**Returns**: Promise resolving to Map where keys are item type IDs and values are price data arrays

**Errors**:
- Never throws - uses `Promise.allSettled()` for graceful degradation
- Failed item types have empty arrays in result map
- Errors logged individually per item type

**Side Effects**:
- Updates LocalStorage cache for each successful fetch
- Logs errors for failed item types

**Example Result**:
```javascript
Map {
  "catalyst" => [{name: "...", chaosValue: 1.0, ...}, ...],
  "deliriumOrb" => [{name: "...", chaosValue: 2.5, ...}, ...],
  "emblem" => [] // Failed to load
}
```

---

#### `refreshItemTypePrices(itemType: string): Promise<Array<PriceDataEntry>>`

Forces refresh of price data for a specific item type, bypassing cache.

**Parameters**:
- `itemType` (string, required): Item type identifier

**Returns**: Promise resolving to array of price data entries

**Errors**:
- Throws if both remote and local fallback fail
- Returns cached data if available even if refresh fails

**Side Effects**:
- Clears cache for item type before fetching
- Updates LocalStorage cache with fresh data

---

### LeagueService Contract

#### `getPriceFileName(itemType: string): string`

Generates price file name for an item type and selected league.

**Parameters**:
- `itemType` (string, required): Item type identifier

**Returns**: File name string (e.g., "catalystPrices_Keepers.json")

**Errors**:
- Returns fallback file name if no league selected

**Dependencies**:
- Requires league service to be initialized
- Uses currently selected league

---

#### `getPriceFileLocalPath(itemType: string): string`

Generates local fallback path for an item type and selected league.

**Parameters**:
- `itemType` (string, required): Item type identifier

**Returns**: Local path string (e.g., "/data/catalystPrices_Keepers.json")

**Errors**:
- Returns fallback path if no league selected

**Dependencies**:
- Requires league service to be initialized
- Uses currently selected league

---

### PriceUpdateService Contract

#### `checkAndUpdateAllPrices(): Promise<Map<string, UpdateResult>>`

Checks cache and updates prices for all active item types.

**Parameters**: None

**Returns**: Promise resolving to Map of item type IDs to update results

**UpdateResult Interface**:
```typescript
interface UpdateResult {
  success: boolean;
  itemCount: number;
  error?: string;
  timestamp: number;
}
```

**Errors**:
- Never throws - individual failures don't prevent other updates
- Failed updates have `success: false` in result map

**Side Effects**:
- Updates LocalStorage cache for successful refreshes
- Logs update results per item type

---

#### `forceRefreshAllPrices(): Promise<Map<string, UpdateResult>>`

Forces immediate refresh of all active item type prices, bypassing cache.

**Parameters**: None

**Returns**: Promise resolving to Map of item type IDs to update results

**Errors**:
- Never throws - uses graceful degradation

**Side Effects**:
- Clears all caches before fetching
- Updates LocalStorage cache with fresh data
- Triggers callbacks if registered

---

#### `setOnPriceUpdate(callback: (itemType: string, prices: Array<PriceDataEntry>) => void): void`

Registers callback to be notified when prices are updated.

**Parameters**:
- `callback` (function, required): Function called with item type ID and updated prices

**Returns**: void

**Callback Contract**:
- Called once per item type when prices update
- Called with item type ID as first parameter
- Called with price data array as second parameter
- Called even if update failed (prices array may be empty)

---

## Cache Contract

### LocalStorage Cache Entry

**Key Format**: `scarabHub_dataCache_{fileName}`

**Value Schema**:
```typescript
interface CacheEntry {
  data: Array<PriceDataEntry>;
  timestamp: number;  // Milliseconds since epoch
  isLocal: boolean;   // true if from local fallback, false if from remote
}
```

**Expiration**: 1 hour (60 * 60 * 1000 milliseconds)

**Validation**:
- Cache entry must have `data`, `timestamp`, and `isLocal` fields
- `timestamp` must be valid number
- `data` must be array (can be empty)
- Cache is considered expired if age > expiration time
- Local fallback cache entries are always considered expired (force refresh)

---

## Error Handling Contract

### Error Types

**NetworkError**: Remote fetch failed (network issue, timeout)
- **Handling**: Fall back to local file
- **User Impact**: None (transparent fallback)

**FileNotFoundError**: Both remote and local files missing (404)
- **Handling**: Use empty array, log warning
- **User Impact**: Item type shows no prices

**ParseError**: JSON parsing failed (malformed data)
- **Handling**: Use empty array, log error
- **User Impact**: Item type shows no prices

**CacheError**: LocalStorage operation failed (quota exceeded, disabled)
- **Handling**: Continue without caching, log warning
- **User Impact**: None (prices still load, just not cached)

### Error Reporting

All errors must be:
- Logged to console with appropriate level (warn/error)
- Include item type identifier in error message
- Include file name in error message
- Not prevent other item types from loading

**Error Message Format**:
```
[ItemType: {itemType}] {errorType}: {message} (File: {fileName})
```

---

## Performance Contracts

### Load Time Requirements

- **Initial Load**: All 10 additional item types must load within 5 seconds (SC-001)
- **Cache Hit**: Cached data must return in < 100ms
- **Network Request**: Individual file fetch timeout: 10 seconds
- **Parallel Load**: All item types must load simultaneously (not sequential)

### Update Time Requirements

- **Automatic Update**: All item types must update within same time window as Scarabs (SC-004)
- **Manual Refresh**: All item types must refresh within 3 seconds of league change (SC-006)
- **Cache Check**: Cache validation must complete in < 50ms per item type

### Reliability Requirements

- **Partial Success**: At least 8 of 10 item types must load successfully even with failures (SC-003)
- **Error Isolation**: Failure of one item type must not affect others
- **Graceful Degradation**: Application must function with partial price data

---

## Versioning

**Current Version**: 1.0.0

**Breaking Changes**: None (initial version)

**Future Considerations**:
- Version field in price data files (if needed)
- API versioning in URLs (if remote API changes)
- Schema migration for cache entries (if structure changes)
