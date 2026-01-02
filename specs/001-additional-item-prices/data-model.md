# Data Model: Additional Item Price Data

**Date**: 2025-01-27  
**Feature**: Additional Item Price Data  
**Phase**: 1 - Design & Contracts

## Entities

### Item Price Data

Represents price information for a single item from any supported item type (Scarabs, Catalysts, Delirium Orbs, etc.).

**Attributes**:
- `name` (string, required): Display name (e.g., "Accelerating Catalyst")
- `chaosValue` (number | null, optional): Market value in Chaos Orbs (null if unavailable)
- `divineValue` (number | null, optional): Market value in Divine Orbs (null if unavailable)
- `detailsId` (string, required): Unique identifier matching item details (e.g., "accelerating-catalyst")

**Relationships**:
- Belongs to: Item Type (Catalyst, Delirium Orb, etc.)
- Belongs to: League (Keepers, etc.)

**Validation Rules**:
- `name` must be non-empty
- `chaosValue` and `divineValue` must be >= 0 if not null
- `detailsId` must be unique within item type
- `detailsId` must match format: lowercase, hyphen-separated

**Data Source**: JSON files from remote (`https://data.poeatlas.app/`) or local fallback (`/data/`)

---

### Item Type Configuration

Represents metadata for each supported item type in the system.

**Attributes**:
- `id` (string, required): Unique identifier (e.g., "catalyst", "deliriumOrb")
- `displayName` (string, required): Human-readable name (e.g., "Catalyst", "Delirium Orb")
- `fileNamePattern` (string, required): File name template (e.g., "catalystPrices_{league}.json")
- `isActive` (boolean, required): Whether this item type is currently enabled

**Relationships**:
- Has many: Item Price Data entries

**Validation Rules**:
- `id` must be unique
- `fileNamePattern` must contain `{league}` placeholder
- `id` must match existing fallback file naming convention

**Supported Item Types**:
```javascript
[
  { id: "scarab", displayName: "Scarab", fileNamePattern: "scarabPrices_{league}.json", isActive: true },
  { id: "catalyst", displayName: "Catalyst", fileNamePattern: "catalystPrices_{league}.json", isActive: true },
  { id: "deliriumOrb", displayName: "Delirium Orb", fileNamePattern: "deliriumOrbPrices_{league}.json", isActive: true },
  { id: "emblem", displayName: "Emblem", fileNamePattern: "emblemPrices_{league}.json", isActive: true },
  { id: "essence", displayName: "Essence", fileNamePattern: "essencePrices_{league}.json", isActive: true },
  { id: "fossil", displayName: "Fossil", fileNamePattern: "fossilPrices_{league}.json", isActive: true },
  { id: "lifeforce", displayName: "Lifeforce", fileNamePattern: "lifeforcePrices_{league}.json", isActive: true },
  { id: "oil", displayName: "Oil", fileNamePattern: "oilPrices_{league}.json", isActive: true },
  { id: "tattoo", displayName: "Tattoo", fileNamePattern: "tattooPrices_{league}.json", isActive: true },
  { id: "templeUnique", displayName: "Temple Unique", fileNamePattern: "templeUniquePrices_{league}.json", isActive: true },
  { id: "vial", displayName: "Vial", fileNamePattern: "vialPrices_{league}.json", isActive: true }
]
```

---

### Price Data Cache Entry

Represents a cached price data file in LocalStorage.

**Attributes**:
- `data` (array<ItemPriceData>, required): Array of price data objects
- `timestamp` (number, required): Cache creation timestamp (milliseconds since epoch)
- `isLocal` (boolean, required): Whether data came from local fallback (true) or remote (false)

**Relationships**:
- Cached by: File name (cache key: `scarabHub_dataCache_{fileName}`)

**Validation Rules**:
- `timestamp` must be valid timestamp
- `data` must be array (can be empty)
- Cache expires after 1 hour (CACHE_EXPIRATION_MS = 60 * 60 * 1000)

**Storage Format**:
```json
{
  "data": [
    {
      "name": "Accelerating Catalyst",
      "chaosValue": 0.9754,
      "divineValue": 0.0063283952,
      "detailsId": "accelerating-catalyst"
    }
  ],
  "timestamp": 1706356800000,
  "isLocal": false
}
```

---

### Price Update State

Represents the current state of price updates for all item types.

**Attributes**:
- `itemType` (string, required): Item type identifier
- `lastUpdateAttempt` (timestamp, optional): When last update was attempted
- `lastSuccessfulUpdate` (timestamp, optional): When last successful update occurred
- `updateStatus` (enum, required): "pending" | "in_progress" | "success" | "error" | "not_started"
- `errorMessage` (string, optional): Error message if update failed

**Relationships**:
- Tracks: One item type's update lifecycle

**Validation Rules**:
- `updateStatus` must be valid enum value
- `lastSuccessfulUpdate` must be <= `lastUpdateAttempt` if both present

**State Transitions**:
- `not_started` → `pending` (update scheduled)
- `pending` → `in_progress` (update started)
- `in_progress` → `success` (update completed successfully)
- `in_progress` → `error` (update failed)
- `error` → `pending` (retry scheduled)
- `success` → `pending` (cache expired, refresh needed)

---

## Data Flow

### Initial Load (All Item Types)

1. Application starts, league service initializes
2. For each active item type:
   - Generate file name: `{itemType}Prices_{leagueSlug}.json`
   - Check cache in LocalStorage
   - If cache valid: use cached data
   - If cache expired/missing: fetch from remote
   - If remote fails: use local fallback
   - If all fail: log error, continue with empty array
3. All item types loaded in parallel using `Promise.allSettled()`
4. Results aggregated: successful loads stored, errors logged
5. Application continues with available price data

### Price Update (Automatic)

1. Update interval elapses (default: 1 hour)
2. For each active item type:
   - Check cache age
   - If expired: mark for refresh
3. Refresh all expired item types in parallel
4. Update cache with new data
5. Notify callbacks if registered
6. Log update results (success/failure per item type)

### Price Update (Manual)

1. User triggers manual refresh
2. Clear cache for all item types (or specific item type)
3. Force fetch from remote for all item types
4. Update cache with fresh data
5. Notify callbacks
6. Display update status to user

### League Change

1. User selects new league
2. Clear all cached price data (or mark as invalid)
3. For each active item type:
   - Generate new file name with new league slug
   - Load prices for new league (follow initial load flow)
4. Update UI with new league's prices

---

## Data Storage

### LocalStorage Keys

**Price Data Cache** (per file):
- Key: `scarabHub_dataCache_{fileName}`
- Format: `{data: Array, timestamp: number, isLocal: boolean}`
- Example: `scarabHub_dataCache_catalystPrices_Keepers.json`

**User Preferences** (existing):
- `scarabHub_preferences`: User preferences including selected league
- `scarabHub_lastUpdate`: Last update timestamp (legacy, may be item-type-specific)

### File Structure

**Remote URLs**:
```
https://data.poeatlas.app/catalystPrices_Keepers.json
https://data.poeatlas.app/deliriumOrbPrices_Keepers.json
https://data.poeatlas.app/emblemPrices_Keepers.json
... (one per item type per league)
```

**Local Fallback Paths**:
```
/data/catalystPrices_Keepers.json
/data/deliriumOrbPrices_Keepers.json
/data/emblemPrices_Keepers.json
... (one per item type per league)
```

---

## Edge Cases

### Missing Price Data

- **File not found (404)**: Use local fallback, log warning
- **Network error**: Use local fallback, log error
- **Local fallback missing**: Use expired cache if available, otherwise empty array, log error
- **Malformed JSON**: Log error, skip file, continue with other item types

### Partial Availability

- **Some item types fail**: Continue with successful loads, log errors for failed ones
- **League has no price files**: Use empty arrays for missing item types, log info
- **Mixed success/failure**: Aggregate results, store successful loads, log failures

### Cache Issues

- **Cache expired**: Fetch fresh data, update cache
- **Cache corrupted**: Clear cache, fetch fresh data
- **LocalStorage full**: Log error, continue without caching for that item type

### Concurrent Updates

- **Multiple refresh triggers**: Debounce or queue updates, prevent duplicate fetches
- **League change during update**: Cancel in-progress updates, start fresh for new league
- **Page reload during update**: Update state lost, will restart on next load

---

## Performance Considerations

### Load Time Optimization

- **Parallel loading**: All item types load simultaneously
- **Cache-first**: Check cache before network requests
- **Early return**: Return cached data immediately if valid
- **Timeout handling**: Set reasonable timeouts for network requests

### Memory Usage

- **Lazy loading**: Only load item types when needed (future optimization)
- **Cache limits**: Consider cache size limits if many leagues/item types
- **Data structure**: Keep price data arrays in memory, not individual objects

### Network Efficiency

- **Batch requests**: All requests fire in parallel (already optimal)
- **Cache headers**: Respect cache headers from remote if present
- **Retry logic**: Consider exponential backoff for failed requests (future enhancement)
