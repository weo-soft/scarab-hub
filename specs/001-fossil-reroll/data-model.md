# Data Model: Fossil Rerolling

**Date**: 2025-01-27  
**Feature**: Fossil Rerolling  
**Phase**: 1 - Design & Contracts

## Entities

### Fossil

Represents a game item (Fossil) with all attributes needed for profitability analysis.

**Attributes**:
- `id` (string, required): Unique identifier derived from `detailsId` (e.g., "bound-fossil")
- `name` (string, required): Display name (e.g., "Bound Fossil")
- `chaosValue` (number | null, optional): Market value in Chaos Orbs (null if unavailable)
- `divineValue` (number | null, optional): Market value in Divine Orbs (null if unavailable)
- `rerollGroup` (enum, calculated): "fossil" (all Fossils belong to single group)
- `expectedValue` (number, calculated): Calculated expected value from reroll group (equal weighting)
- `profitabilityStatus` (enum, calculated): "profitable" | "not_profitable" | "unknown"
- `threshold` (number, calculated): The economic threshold value for the reroll group
- `selectedForReroll` (boolean, optional): Whether user has selected this Fossil for rerolling (default: false)

**Relationships**:
- Belongs to: RerollGroup (many-to-one, all Fossils in single group)

**Validation Rules**:
- `id` must be unique
- `chaosValue` and `divineValue` must be >= 0 if not null
- `rerollGroup` must be "fossil" (single group)
- `selectedForReroll` must be boolean

**State Transitions**:
- Initial: Loaded from JSON files
- Classified: After reroll group assignment (all assigned to "fossil")
- Calculated: After expected value calculation
- Selected: User marks for rerolling
- Updated: When market prices refresh

### RerollGroup

Represents the collection of all Fossils that can reroll into each other.

**Attributes**:
- `type` (enum, required): "fossil" (single group for all Fossils)
- `fossils` (array<Fossil>, required): All Fossils in this group
- `expectedValue` (number, calculated): Average value of all Fossils in group (equal weighting)
- `threshold` (number, calculated): Expected value minus reroll cost
- `rerollCost` (number, calculated): Cost of 30 Wild Crystallised Lifeforce

**Relationships**:
- Contains: Array of Fossil entities (one-to-many)

**Validation Rules**:
- `type` must be "fossil"
- `fossils` array must not be empty
- `expectedValue` must be >= 0
- `threshold` can be negative (unprofitable group)

**Calculation Logic**:
```
For the single Fossil reroll group:
  expectedValue = (Σ fossil.chaosValue) / n  (where n = number of Fossils in group)
  rerollCost = 30 × Wild Crystallised Lifeforce price
  threshold = expectedValue - rerollCost
```

### ExpectedValueThreshold

Represents the calculated economic threshold for the Fossil reroll group.

**Attributes**:
- `rerollGroup` (enum, required): "fossil"
- `value` (number, required): The threshold value in Chaos Orbs
- `expectedValue` (number, required): Average value of Fossils in group
- `rerollCost` (number, required): Cost of 30 Wild Crystallised Lifeforce
- `calculationMethod` (string, required): "equal_weighted_average"
- `fossilCount` (number, required): Number of Fossils in group
- `calculatedAt` (timestamp, required): When calculation was performed

**Relationships**:
- Derived from: RerollGroup entity

**Validation Rules**:
- `value` can be negative (indicates unprofitable group)
- `expectedValue` must be >= 0
- `rerollCost` must be >= 0
- `fossilCount` must be > 0

### WildCrystallisedLifeforce

Represents the currency item required for rerolling.

**Attributes**:
- `name` (string, required): "Wild Crystallised Lifeforce"
- `chaosValue` (number | null, optional): Market value in Chaos Orbs (null if unavailable)
- `divineValue` (number | null, optional): Market value in Divine Orbs (null if unavailable)
- `rerollCost` (number, calculated): 30 × chaosValue (cost per reroll)

**Relationships**:
- Used by: All reroll operations

**Validation Rules**:
- `chaosValue` and `divineValue` must be >= 0 if not null
- `rerollCost` must be >= 0 if chaosValue is available

### UserPreferences

Represents user preferences stored in LocalStorage (extends existing Essence preferences).

**Attributes**:
- `defaultView` (enum, optional): "list" | "grid" (default: "list")
- `currencyPreference` (enum, optional): "chaos" | "divine" (default: "chaos")
- `selectedFossilIds` (array<string>, optional): Array of Fossil IDs selected for rerolling
- `lastPriceUpdate` (timestamp, optional): When prices were last updated
- `cachedPrices` (object, optional): Cached price data with timestamp

**Relationships**:
- None (user-specific data)

**Validation Rules**:
- `defaultView` must be valid enum value
- `currencyPreference` must be valid enum value
- `selectedFossilIds` must contain valid Fossil IDs
- `lastPriceUpdate` must be valid timestamp if present

## Data Flow

### Initial Load

1. Load `fossilPrices_{league}.json` → Array of Fossil price objects
2. Load `lifeforcePrices_{league}.json` → Get Wild Crystallised Lifeforce price
3. Assign all Fossils to single reroll group ("fossil")
4. Calculate expected value for the reroll group (equal weighting)
5. Calculate threshold (expected value - reroll cost)
6. Calculate profitability status for each Fossil
7. Store merged data in memory
8. Render list view

### Price Updates

1. User triggers price refresh (manual or automatic)
2. Load new `fossilPrices_{league}.json`
3. Load new `lifeforcePrices_{league}.json`
4. Update Fossil entities with new prices
5. Recalculate expected value for the reroll group
6. Recalculate threshold
7. Recalculate profitability status for all Fossils
8. Update UI with new data
9. Cache updated prices in LocalStorage

### Selection Toggle

1. User clicks on Fossil in list view
2. Toggle `selectedForReroll` state
3. Update visual indicator (background color, border, icon)
4. Store selection in UserPreferences (LocalStorage)
5. Recalculate expected outcomes if needed (only selected Fossils)

### Reroll Group Classification

1. For each Fossil, assign to single reroll group:
   - All Fossils → "fossil" group
   - No classification logic needed (simpler than Essence)
2. Assign `rerollGroup` attribute
3. All Fossils grouped together for calculations

## Data Storage

### LocalStorage Keys

- `scarabHub_preferences`: User preferences (extends existing, adds `selectedFossilIds`)
- `scarabHub_cachedPrices`: Cached price data with timestamp (shared with other features)
- `scarabHub_lastUpdate`: Timestamp of last price update (shared with other features)

### Data Format

```json
{
  "scarabHub_preferences": {
    "defaultView": "list",
    "currencyPreference": "chaos",
    "selectedFossilIds": ["bound-fossil", "fractured-fossil"],
    "lastPriceUpdate": "2025-01-27T10:00:00Z"
  },
  "scarabHub_cachedPrices": {
    "data": [...],
    "timestamp": "2025-01-27T10:00:00Z"
  }
}
```

## Edge Cases

### Missing Data

- **Missing price data**: Mark Fossil as "unknown" profitability, display "N/A" for value
- **Missing Wild Crystallised Lifeforce price**: Cannot calculate threshold, mark all Fossils as "unknown"
- **Fossil without reroll group**: Should not occur, but mark as "unknown" if it does

### Invalid Data

- **Negative prices**: Clamp to 0, log warning
- **Missing required fields**: Skip Fossil, log error
- **Invalid reroll group classification**: Mark as null, exclude from calculations

### Data Mismatch

- **Price data without matching Fossil**: Skip price entry, log warning
- **Fossil in multiple groups**: Should not occur (single group), log warning if detected

### Reroll Group Edge Cases

- **Empty reroll group**: Should not occur, but handle gracefully (skip calculation)
- **Single Fossil in group**: Valid, expected value = that Fossil's value
- **All Fossils have missing prices**: Mark group threshold as "unknown", mark all Fossils as "unknown"

