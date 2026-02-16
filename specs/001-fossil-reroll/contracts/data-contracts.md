# Data Contracts: Fossil Rerolling

**Date**: 2025-01-27  
**Feature**: Fossil Rerolling  
**Phase**: 1 - Design & Contracts

## Input Data Contracts

### Fossil Prices JSON Schema

**File**: `public/data/fossilPrices_{league}.json`

**Format**: Array of Fossil Price objects (same structure as Essence prices)

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "required": ["name", "detailsId"],
    "properties": {
      "name": {
        "type": "string",
        "description": "Display name of the Fossil"
      },
      "detailsId": {
        "type": "string",
        "description": "Unique identifier (kebab-case)"
      },
      "chaosValue": {
        "type": "number",
        "minimum": 0,
        "description": "Market value in Chaos Orbs"
      },
      "divineValue": {
        "type": "number",
        "minimum": 0,
        "description": "Market value in Divine Orbs"
      }
    }
  }
}
```

**Example**:
```json
[
  {
    "name": "Bound Fossil",
    "chaosValue": 3.75,
    "divineValue": 0.02433,
    "detailsId": "bound-fossil"
  },
  {
    "name": "Fractured Fossil",
    "chaosValue": 9.53,
    "divineValue": 0.06183063999999999,
    "detailsId": "fractured-fossil"
  }
]
```

### Wild Crystallised Lifeforce Price JSON Schema

**File**: `public/data/lifeforcePrices_{league}.json`

**Format**: Array of Lifeforce Price objects (includes Wild Crystallised Lifeforce)

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "required": ["name", "detailsId"],
    "properties": {
      "name": {
        "type": "string",
        "description": "Display name of the Lifeforce type"
      },
      "detailsId": {
        "type": "string",
        "description": "Unique identifier (kebab-case)"
      },
      "chaosValue": {
        "type": "number",
        "minimum": 0,
        "description": "Market value in Chaos Orbs"
      },
      "divineValue": {
        "type": "number",
        "minimum": 0,
        "description": "Market value in Divine Orbs"
      }
    }
  }
}
```

**Example**:
```json
[
  {
    "name": "Wild Crystallised Lifeforce",
    "chaosValue": 0.01353,
    "divineValue": 8.778264e-05,
    "detailsId": "wild-crystallised-lifeforce"
  }
]
```

## Internal Data Contracts

### Merged Fossil Object

**Format**: Internal representation after loading prices and classification

```typescript
interface MergedFossil {
  // From fossilPrices_{league}.json
  id: string; // Derived from detailsId
  name: string;
  chaosValue: number | null;
  divineValue: number | null;
  
  // Calculated fields
  rerollGroup: "fossil"; // Single group for all Fossils
  expectedValue: number;
  profitabilityStatus: "profitable" | "not_profitable" | "unknown";
  threshold: number;
  selectedForReroll: boolean;
}
```

### Reroll Group Object

**Format**: Grouped Fossils with calculated values

```typescript
interface RerollGroup {
  type: "fossil"; // Single group for all Fossils
  fossils: MergedFossil[];
  expectedValue: number; // Average of all Fossils in group (equal weighting)
  threshold: number; // expectedValue - rerollCost
  rerollCost: number; // 30 × Wild Crystallised Lifeforce price
  fossilCount: number;
}
```

### Expected Value Threshold Object

**Format**: Calculated threshold data for the Fossil reroll group

```typescript
interface ExpectedValueThreshold {
  rerollGroup: "fossil";
  value: number; // Threshold in Chaos Orbs (can be negative)
  expectedValue: number; // Average value of Fossils in group
  rerollCost: number; // Cost of 30 Wild Crystallised Lifeforce
  calculationMethod: "equal_weighted_average";
  fossilCount: number;
  calculatedAt: string; // ISO 8601 timestamp
}
```

### Selection State Object

**Format**: User's selection of Fossils for rerolling

```typescript
interface FossilSelection {
  selectedFossilIds: string[]; // Array of Fossil IDs
  lastUpdated: string; // ISO 8601 timestamp
}
```

### User Preferences (Extended)

**Format**: LocalStorage user preferences (extends existing Essence preferences)

```typescript
interface UserPreferences {
  defaultView?: "list" | "grid";
  currencyPreference?: "chaos" | "divine";
  selectedFossilIds?: string[]; // NEW: Fossil selection state
  lastPriceUpdate?: string; // ISO 8601 timestamp
  cachedPrices?: {
    data: MergedFossil[];
    timestamp: string; // ISO 8601 timestamp
  };
}
```

## Data Merging Contract

### Merge Operation

**Input**: 
- `fossilPrices`: Array<FossilPrice>
- `lifeforcePrices`: Array<LifeforcePrice>

**Output**: Array<MergedFossil>

**Matching Logic**:
1. Extract Wild Crystallised Lifeforce price from `lifeforcePrices` array
2. For each Fossil price, create MergedFossil object
3. Assign all Fossils to single reroll group ("fossil")
4. Calculate expected value for the group (equal weighting)
5. Calculate threshold (expected value - reroll cost)
6. Calculate profitability status for each Fossil

**Validation**:
- All required fields must be present
- `chaosValue` and `divineValue` must be >= 0 or null
- `rerollGroup` must be "fossil"
- Invalid data should be handled gracefully (skip or default)

## Reroll Group Classification Contract

### Classification Rules

**Input**: Fossil name (string)

**Output**: Reroll group type (always "fossil")

**Rules**:
1. **Fossil Group**:
   - All Fossils belong to the same reroll group
   - No classification logic needed (simpler than Essence)
   → Returns: "fossil"

**Validation**:
- Classification must be deterministic (all Fossils return "fossil")
- No special cases or exceptions
- Simpler than Essence's multiple group classification

## Expected Value Calculation Contract

### Equal-Weighted Average Calculation

**Input**: 
- `fossils`: Array<MergedFossil> (all in single reroll group)
- `rerollCost`: number (cost of 30 Wild Crystallised Lifeforce)

**Output**: ExpectedValueThreshold

**Formula**:
```
expectedValue = (Σ fossil.chaosValue) / n
  where n = number of Fossils with valid price data

threshold = expectedValue - rerollCost
```

**Validation**:
- All Fossils must belong to "fossil" reroll group
- At least one Fossil must have valid price data
- `rerollCost` must be >= 0
- `threshold` can be negative (indicates unprofitable group)

## Error Handling Contracts

### Missing Data

- **Missing Fossil price**: Set `chaosValue` and `divineValue` to `null`, mark `profitabilityStatus` as "unknown"
- **Missing Wild Crystallised Lifeforce price**: Cannot calculate thresholds, mark all Fossils as "unknown", log error
- **Missing reroll group**: Set `rerollGroup` to `null`, exclude from calculations, log warning
- **Missing required field**: Skip entry, log error to console

### Invalid Data

- **Negative prices**: Clamp to 0, log warning
- **Invalid reroll group**: Treat as null, exclude from calculations
- **Empty reroll group**: Skip calculation, log warning

### Data Mismatch

- **Price data without matching Fossil**: Skip price entry, log warning
- **Fossil in multiple groups**: Should not occur (single group), log warning if detected

## Versioning

**Current Version**: 1.0.0

**Breaking Changes**: None (initial version)

**Future Considerations**:
- API versioning if backend added
- Schema versioning for JSON files
- Migration path for LocalStorage data
- Support for additional reroll groups if game mechanics change (unlikely for Fossils)

