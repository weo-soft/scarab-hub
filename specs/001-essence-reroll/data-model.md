# Data Model: Essence Rerolling

**Date**: 2025-01-27  
**Feature**: Essence Rerolling  
**Phase**: 1 - Design & Contracts

## Entities

### Essence

Represents a game item (Essence) with all attributes needed for profitability analysis.

**Attributes**:
- `id` (string, required): Unique identifier derived from `detailsId` (e.g., "deafening-essence-of-doubt")
- `name` (string, required): Display name (e.g., "Deafening Essence of Doubt")
- `chaosValue` (number | null, optional): Market value in Chaos Orbs (null if unavailable)
- `divineValue` (number | null, optional): Market value in Divine Orbs (null if unavailable)
- `rerollGroup` (enum, calculated): "deafening" | "shrieking" | "special" | null
- `expectedValue` (number, calculated): Calculated expected value from reroll group (equal weighting)
- `profitabilityStatus` (enum, calculated): "profitable" | "not_profitable" | "unknown"
- `threshold` (number, calculated): The economic threshold value for this reroll group
- `selectedForReroll` (boolean, optional): Whether user has selected this Essence for rerolling (default: false)

**Relationships**:
- Belongs to: RerollGroup (many-to-one)

**Validation Rules**:
- `id` must be unique
- `chaosValue` and `divineValue` must be >= 0 if not null
- `rerollGroup` must be valid enum value or null
- `selectedForReroll` must be boolean

**State Transitions**:
- Initial: Loaded from JSON files
- Classified: After reroll group assignment
- Calculated: After expected value calculation
- Selected: User marks for rerolling
- Updated: When market prices refresh

### RerollGroup

Represents a collection of Essences that can reroll into each other.

**Attributes**:
- `type` (enum, required): "deafening" | "shrieking" | "special"
- `essences` (array<Essence>, required): All Essences in this group
- `expectedValue` (number, calculated): Average value of all Essences in group (equal weighting)
- `threshold` (number, calculated): Expected value minus reroll cost
- `rerollCost` (number, calculated): Cost of 30 Primal Crystallised Lifeforce

**Relationships**:
- Contains: Array of Essence entities (one-to-many)

**Validation Rules**:
- `type` must be valid enum value
- `essences` array must not be empty
- `expectedValue` must be >= 0
- `threshold` can be negative (unprofitable group)

**Calculation Logic**:
```
For each reroll group:
  expectedValue = (Σ essence.chaosValue) / n  (where n = number of Essences in group)
  rerollCost = 30 × Primal Crystallised Lifeforce price
  threshold = expectedValue - rerollCost
```

### ExpectedValueThreshold

Represents the calculated economic threshold for a specific reroll group.

**Attributes**:
- `rerollGroup` (enum, required): "deafening" | "shrieking" | "special"
- `value` (number, required): The threshold value in Chaos Orbs
- `expectedValue` (number, required): Average value of Essences in group
- `rerollCost` (number, required): Cost of 30 Primal Crystallised Lifeforce
- `calculationMethod` (string, required): "equal_weighted_average"
- `essenceCount` (number, required): Number of Essences in group
- `calculatedAt` (timestamp, required): When calculation was performed

**Relationships**:
- Derived from: RerollGroup entity

**Validation Rules**:
- `value` can be negative (indicates unprofitable group)
- `expectedValue` must be >= 0
- `rerollCost` must be >= 0
- `essenceCount` must be > 0

### PrimalCrystallisedLifeforce

Represents the currency item required for rerolling.

**Attributes**:
- `name` (string, required): "Primal Crystallised Lifeforce"
- `chaosValue` (number | null, optional): Market value in Chaos Orbs (null if unavailable)
- `divineValue` (number | null, optional): Market value in Divine Orbs (null if unavailable)
- `rerollCost` (number, calculated): 30 × chaosValue (cost per reroll)

**Relationships**:
- Used by: All reroll operations

**Validation Rules**:
- `chaosValue` and `divineValue` must be >= 0 if not null
- `rerollCost` must be >= 0 if chaosValue is available

### UserPreferences

Represents user preferences stored in LocalStorage (extends existing Scarab preferences).

**Attributes**:
- `defaultView` (enum, optional): "list" | "grid" (default: "list")
- `currencyPreference` (enum, optional): "chaos" | "divine" (default: "chaos")
- `selectedEssenceIds` (array<string>, optional): Array of Essence IDs selected for rerolling
- `lastPriceUpdate` (timestamp, optional): When prices were last updated
- `cachedPrices` (object, optional): Cached price data with timestamp

**Relationships**:
- None (user-specific data)

**Validation Rules**:
- `defaultView` must be valid enum value
- `currencyPreference` must be valid enum value
- `selectedEssenceIds` must contain valid Essence IDs
- `lastPriceUpdate` must be valid timestamp if present

## Data Flow

### Initial Load

1. Load `essencePrices_{league}.json` → Array of Essence price objects
2. Load `lifeforcePrices_{league}.json` → Get Primal Crystallised Lifeforce price
3. Classify each Essence into reroll group based on name
4. Group Essences by reroll group type
5. Calculate expected value for each reroll group (equal weighting)
6. Calculate threshold for each group (expected value - reroll cost)
7. Calculate profitability status for each Essence
8. Store merged data in memory
9. Render list view

### Price Updates

1. User triggers price refresh (manual or automatic)
2. Load new `essencePrices_{league}.json`
3. Load new `lifeforcePrices_{league}.json`
4. Update Essence entities with new prices
5. Recalculate expected value for each reroll group
6. Recalculate thresholds
7. Recalculate profitability status for all Essences
8. Update UI with new data
9. Cache updated prices in LocalStorage

### Selection Toggle

1. User clicks on Essence in list view
2. Toggle `selectedForReroll` state
3. Update visual indicator (background color, border, icon)
4. Store selection in UserPreferences (LocalStorage)
5. Recalculate expected outcomes if needed (only selected Essences)

### Reroll Group Classification

1. For each Essence, check name against classification rules:
   - Exact match: "Essence of Horror", "Essence of Hysteria", "Essence of Insanity", "Essence of Delirium" → "special"
   - Starts with: "Deafening Essence of" → "deafening"
   - Starts with: "Shrieking Essence of" → "shrieking"
   - Otherwise: null (should not occur)
2. Assign `rerollGroup` attribute
3. Group Essences by `rerollGroup` for calculations

## Data Storage

### LocalStorage Keys

- `scarabHub_preferences`: User preferences (extends existing, adds `selectedEssenceIds`)
- `scarabHub_cachedPrices`: Cached price data with timestamp (shared with Scarab feature)
- `scarabHub_lastUpdate`: Timestamp of last price update (shared with Scarab feature)

### Data Format

```json
{
  "scarabHub_preferences": {
    "defaultView": "list",
    "currencyPreference": "chaos",
    "selectedEssenceIds": ["deafening-essence-of-doubt", "shrieking-essence-of-anger"],
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

- **Missing price data**: Mark Essence as "unknown" profitability, display "N/A" for value
- **Missing Primal Crystallised Lifeforce price**: Cannot calculate threshold, mark all Essences as "unknown"
- **Essence without reroll group**: Should not occur, but mark as "unknown" if it does

### Invalid Data

- **Negative prices**: Clamp to 0, log warning
- **Missing required fields**: Skip Essence, log error
- **Invalid reroll group classification**: Mark as null, exclude from calculations

### Data Mismatch

- **Price data without matching Essence**: Skip price entry, log warning
- **Essence in multiple groups**: Should not occur, use first match, log warning
- **Special group Essence in other groups**: Should not occur, prioritize special group, log warning

### Reroll Group Edge Cases

- **Empty reroll group**: Should not occur, but handle gracefully (skip calculation)
- **Single Essence in group**: Valid, expected value = that Essence's value
- **All Essences in group have missing prices**: Mark group threshold as "unknown", mark all Essences as "unknown"
