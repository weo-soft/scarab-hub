# Data Contracts: Essence Rerolling

**Date**: 2025-01-27  
**Feature**: Essence Rerolling  
**Phase**: 1 - Design & Contracts

## Input Data Contracts

### Essence Prices JSON Schema

**File**: `public/data/essencePrices_{league}.json`

**Format**: Array of Essence Price objects (same structure as Scarab prices)

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "required": ["name", "detailsId"],
    "properties": {
      "name": {
        "type": "string",
        "description": "Display name of the Essence"
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
    "name": "Deafening Essence of Doubt",
    "chaosValue": 0.9062,
    "divineValue": 0.0058794256,
    "detailsId": "deafening-essence-of-doubt"
  },
  {
    "name": "Essence of Horror",
    "chaosValue": 22.38,
    "divineValue": 0.14520144,
    "detailsId": "essence-of-horror"
  }
]
```

### Primal Crystallised Lifeforce Price JSON Schema

**File**: `public/data/lifeforcePrices_{league}.json`

**Format**: Array of Lifeforce Price objects (includes Primal Crystallised Lifeforce)

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
    "name": "Primal Crystallised Lifeforce",
    "chaosValue": 0.02048,
    "divineValue": 0.00013287424000000002,
    "detailsId": "primal-crystallised-lifeforce"
  }
]
```

## Internal Data Contracts

### Merged Essence Object

**Format**: Internal representation after loading prices and classification

```typescript
interface MergedEssence {
  // From essencePrices_{league}.json
  id: string; // Derived from detailsId
  name: string;
  chaosValue: number | null;
  divineValue: number | null;
  
  // Calculated fields
  rerollGroup: "deafening" | "shrieking" | "special" | null;
  expectedValue: number;
  profitabilityStatus: "profitable" | "not_profitable" | "unknown";
  threshold: number;
  selectedForReroll: boolean;
}
```

### Reroll Group Object

**Format**: Grouped Essences with calculated values

```typescript
interface RerollGroup {
  type: "deafening" | "shrieking" | "special";
  essences: MergedEssence[];
  expectedValue: number; // Average of all Essences in group (equal weighting)
  threshold: number; // expectedValue - rerollCost
  rerollCost: number; // 30 × Primal Crystallised Lifeforce price
  essenceCount: number;
}
```

### Expected Value Threshold Object

**Format**: Calculated threshold data for a reroll group

```typescript
interface ExpectedValueThreshold {
  rerollGroup: "deafening" | "shrieking" | "special";
  value: number; // Threshold in Chaos Orbs (can be negative)
  expectedValue: number; // Average value of Essences in group
  rerollCost: number; // Cost of 30 Primal Crystallised Lifeforce
  calculationMethod: "equal_weighted_average";
  essenceCount: number;
  calculatedAt: string; // ISO 8601 timestamp
}
```

### Selection State Object

**Format**: User's selection of Essences for rerolling

```typescript
interface EssenceSelection {
  selectedEssenceIds: string[]; // Array of Essence IDs
  lastUpdated: string; // ISO 8601 timestamp
}
```

### User Preferences (Extended)

**Format**: LocalStorage user preferences (extends existing Scarab preferences)

```typescript
interface UserPreferences {
  defaultView?: "list" | "grid";
  currencyPreference?: "chaos" | "divine";
  selectedEssenceIds?: string[]; // NEW: Essence selection state
  lastPriceUpdate?: string; // ISO 8601 timestamp
  cachedPrices?: {
    data: MergedEssence[];
    timestamp: string; // ISO 8601 timestamp
  };
}
```

## Data Merging Contract

### Merge Operation

**Input**: 
- `essencePrices`: Array<EssencePrice>
- `lifeforcePrices`: Array<LifeforcePrice>

**Output**: Array<MergedEssence>

**Matching Logic**:
1. Extract Primal Crystallised Lifeforce price from `lifeforcePrices` array
2. For each Essence price, create MergedEssence object
3. Classify Essence into reroll group based on name pattern
4. Group Essences by reroll group
5. Calculate expected value for each group (equal weighting)
6. Calculate threshold for each group
7. Calculate profitability status for each Essence

**Validation**:
- All required fields must be present
- `chaosValue` and `divineValue` must be >= 0 or null
- `rerollGroup` must be valid enum value or null
- Invalid data should be handled gracefully (skip or default)

## Reroll Group Classification Contract

### Classification Rules

**Input**: Essence name (string)

**Output**: Reroll group type or null

**Rules**:
1. **Special Group** (exact match):
   - "Essence of Horror"
   - "Essence of Hysteria"
   - "Essence of Insanity"
   - "Essence of Delirium"
   → Returns: "special"

2. **Deafening Group** (starts with):
   - Name starts with "Deafening Essence of"
   → Returns: "deafening"

3. **Shrieking Group** (starts with):
   - Name starts with "Shrieking Essence of"
   → Returns: "shrieking"

4. **Unknown**:
   - Does not match any pattern
   → Returns: null (should not occur in practice)

**Validation**:
- Classification must be deterministic (same name always returns same group)
- Special group takes precedence (checked first)
- Case-sensitive matching

## Expected Value Calculation Contract

### Equal-Weighted Average Calculation

**Input**: 
- `essences`: Array<MergedEssence> (all in same reroll group)
- `rerollCost`: number (cost of 30 Primal Crystallised Lifeforce)

**Output**: ExpectedValueThreshold

**Formula**:
```
expectedValue = (Σ essence.chaosValue) / n
  where n = number of Essences with valid price data in group

threshold = expectedValue - rerollCost
```

**Validation**:
- All Essences must belong to same reroll group
- At least one Essence must have valid price data
- `rerollCost` must be >= 0
- `threshold` can be negative (indicates unprofitable group)

## Error Handling Contracts

### Missing Data

- **Missing Essence price**: Set `chaosValue` and `divineValue` to `null`, mark `profitabilityStatus` as "unknown"
- **Missing Primal Crystallised Lifeforce price**: Cannot calculate thresholds, mark all Essences as "unknown", log error
- **Missing reroll group**: Set `rerollGroup` to `null`, exclude from calculations, log warning
- **Missing required field**: Skip entry, log error to console

### Invalid Data

- **Negative prices**: Clamp to 0, log warning
- **Invalid reroll group**: Treat as null, exclude from calculations
- **Empty reroll group**: Skip calculation, log warning

### Data Mismatch

- **Price data without matching Essence**: Skip price entry, log warning
- **Essence in multiple groups**: Should not occur, use first match, log warning
- **Special group Essence classified as other**: Should not occur, prioritize special group, log warning

## Versioning

**Current Version**: 1.0.0

**Breaking Changes**: None (initial version)

**Future Considerations**:
- API versioning if backend added
- Schema versioning for JSON files
- Migration path for LocalStorage data
- Support for additional reroll groups if game mechanics change
