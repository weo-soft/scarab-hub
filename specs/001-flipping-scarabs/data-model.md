# Data Model: Flipping Scarabs Page

**Date**: 2025-12-27  
**Feature**: Flipping Scarabs Page  
**Phase**: 1 - Design & Contracts

## Entities

### Scarab

Represents a game item (Scarab) with all attributes needed for profitability analysis.

**Attributes**:
- `id` (string, required): Unique identifier (e.g., "abyss-scarab")
- `name` (string, required): Display name (e.g., "Abyss Scarab")
- `description` (string, optional): In-game description text
- `dropWeight` (number | null, required): Probability weight for vendor recipe (null if not available)
- `dropLevel` (number, required): Minimum drop level
- `limit` (number, required): Maximum stack limit
- `dropEnabled` (boolean, required): Whether item can drop
- `chaosValue` (number | null, optional): Market value in Chaos Orbs (null if unavailable)
- `divineValue` (number | null, optional): Market value in Divine Orbs (null if unavailable)
- `expectedValue` (number, calculated): Calculated expected value from vendor recipe
- `profitabilityStatus` (enum, calculated): "profitable" | "not_profitable" | "unknown"
- `threshold` (number, calculated): The economic threshold value

**Relationships**:
- None (standalone entity)

**Validation Rules**:
- `id` must be unique
- `dropWeight` must be >= 0 if not null
- `chaosValue` and `divineValue` must be >= 0 if not null
- `dropLevel` must be >= 0
- `limit` must be > 0

**State Transitions**:
- Initial: Loaded from JSON files
- Calculated: After expected value calculation
- Updated: When market prices refresh

### ExpectedValueThreshold

Represents the calculated economic threshold that separates profitable from unprofitable vendoring.

**Attributes**:
- `value` (number, required): The threshold value in Chaos Orbs
- `calculationMethod` (string, required): "weighted_average" (only method)
- `totalWeight` (number, required): Sum of all Scarab drop weights
- `calculatedAt` (timestamp, required): When calculation was performed
- `scarabCount` (number, required): Number of Scarabs included in calculation

**Relationships**:
- Derived from: Collection of Scarab entities

**Validation Rules**:
- `value` must be >= 0
- `totalWeight` must be > 0
- `scarabCount` must be > 0

**Calculation Logic**:
```
totalWeight = Σ(scarab.dropWeight) for all scarabs where dropWeight is not null
expectedValue = Σ((scarab.dropWeight / totalWeight) × scarab.chaosValue) for all scarabs
threshold = expectedValue / 3  // Maximum input value for profitable vendoring
```

### Simulation

Represents a vendoring simulation scenario with strategy and results.

**Attributes**:
- `id` (string, required): Unique simulation identifier
- `strategyType` (enum, required): "optimized" | "user_chosen" | "random"
- `selectedScarabs` (array<string>, optional): Array of Scarab IDs (required for "user_chosen")
- `transactionCount` (number, required): Number of vendor transactions to simulate
- `expectedProfitLoss` (number, calculated): Expected profit/loss in Chaos Orbs
- `createdAt` (timestamp, required): When simulation was created
- `results` (object, calculated): Detailed results breakdown

**Relationships**:
- References: Array of Scarab entities (by ID)

**Validation Rules**:
- `transactionCount` must be > 0 and <= 10000
- `selectedScarabs` must contain valid Scarab IDs if strategyType is "user_chosen"
- `selectedScarabs` must have length >= 3 if strategyType is "user_chosen"

**State Transitions**:
- Created: User initiates simulation
- Running: Calculation in progress
- Completed: Results available
- Error: Invalid parameters or calculation failure

### UserPreferences

Represents user preferences stored in LocalStorage.

**Attributes**:
- `defaultView` (enum, optional): "list" | "grid" (default: "list")
- `currencyPreference` (enum, optional): "chaos" | "divine" (default: "chaos")
- `lastPriceUpdate` (timestamp, optional): When prices were last updated
- `cachedPrices` (object, optional): Cached price data with timestamp

**Relationships**:
- None (user-specific data)

**Validation Rules**:
- `defaultView` must be valid enum value
- `currencyPreference` must be valid enum value
- `lastPriceUpdate` must be valid timestamp if present

## Data Flow

### Initial Load

1. Load `scarabDetails.json` → Array of Scarab detail objects
2. Load `scarabPrices_Keepers.json` → Array of Scarab price objects
3. Merge by matching `detailsId` (from prices) with `id` (from details)
4. Calculate expected value threshold from all Scarabs
5. Calculate profitability status for each Scarab
6. Store merged data in memory
7. Render active view (List or Grid)

### Price Updates

1. User triggers price refresh (manual or automatic)
2. Load new `scarabPrices_Keepers.json`
3. Update Scarab entities with new prices
4. Recalculate expected value threshold
5. Recalculate profitability status for all Scarabs
6. Update UI with new data
7. Cache updated prices in LocalStorage

### View Switching

1. User selects view mode (List or Grid)
2. Store preference in LocalStorage
3. Hide current view
4. Show selected view
5. Maintain profitability indicators consistency

### Simulation

1. User selects strategy type
2. If "user_chosen": User selects Scarabs
3. User sets transaction count
4. Calculate expected profit/loss based on strategy
5. Display results with visual indicators

## Data Storage

### LocalStorage Keys

- `scarabHub_preferences`: User preferences (defaultView, currencyPreference)
- `scarabHub_cachedPrices`: Cached price data with timestamp
- `scarabHub_lastUpdate`: Timestamp of last price update

### Data Format

```json
{
  "scarabHub_preferences": {
    "defaultView": "list",
    "currencyPreference": "chaos",
    "lastPriceUpdate": "2025-12-27T10:00:00Z"
  },
  "scarabHub_cachedPrices": {
    "data": [...],
    "timestamp": "2025-12-27T10:00:00Z"
  }
}
```

## Edge Cases

### Missing Data

- **Missing price data**: Mark Scarab as "unknown" profitability, display "N/A" for value
- **Missing dropWeight**: Exclude from threshold calculation, mark as "unknown"
- **Null dropWeight**: Treat as 0, exclude from calculations

### Invalid Data

- **Negative prices**: Clamp to 0, log warning
- **Invalid dropWeight**: Treat as null, exclude from calculations
- **Missing required fields**: Skip Scarab, log error

### Data Mismatch

- **Price data without details**: Skip price entry, log warning
- **Details without price**: Include in display with "N/A" price, mark as "unknown"

