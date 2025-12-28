# Data Contracts: Flipping Scarabs Page

**Date**: 2025-12-27  
**Feature**: Flipping Scarabs Page  
**Phase**: 1 - Design & Contracts

## Input Data Contracts

### Scarab Details JSON Schema

**File**: `data/scarabDetails.json`

**Format**: Array of Scarab Detail objects

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "required": ["name", "id", "dropEnabledd", "limit", "dropLevel"],
    "properties": {
      "name": {
        "type": "string",
        "description": "Display name of the Scarab"
      },
      "id": {
        "type": "string",
        "description": "Unique identifier (kebab-case)"
      },
      "dropEnabledd": {
        "type": "boolean",
        "description": "Whether the item can drop (note: typo in source data)"
      },
      "limit": {
        "type": "number",
        "minimum": 1,
        "description": "Maximum stack limit"
      },
      "description": {
        "type": "string",
        "description": "In-game description text"
      },
      "dropLevel": {
        "type": "number",
        "minimum": 0,
        "description": "Minimum drop level"
      },
      "dropWeight": {
        "type": ["number", "null"],
        "minimum": 0,
        "description": "Probability weight for vendor recipe (null if not available)"
      }
    }
  }
}
```

**Example**:
```json
[
  {
    "name": "Abyss Scarab",
    "id": "abyss-scarab",
    "dropEnabledd": true,
    "limit": 2,
    "description": "Area contains an additional Abyss",
    "dropLevel": 68,
    "dropWeight": 601.0
  }
]
```

### Scarab Prices JSON Schema

**File**: `data/scarabPrices_Keepers.json`

**Format**: Array of Scarab Price objects

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "required": ["name", "detailsId"],
    "properties": {
      "name": {
        "type": "string",
        "description": "Display name of the Scarab"
      },
      "detailsId": {
        "type": "string",
        "description": "Identifier matching scarabDetails.id for merging"
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
    "name": "Abyss Scarab of Profound Depth",
    "chaosValue": 1.3,
    "divineValue": 0.008658,
    "detailsId": "abyss-scarab-of-profound-depth"
  }
]
```

## Internal Data Contracts

### Merged Scarab Object

**Format**: Internal representation after merging details and prices

```typescript
interface MergedScarab {
  // From scarabDetails.json
  id: string;
  name: string;
  description?: string;
  dropWeight: number | null;
  dropLevel: number;
  limit: number;
  dropEnabled: boolean; // Note: corrected from "dropEnabledd"
  
  // From scarabPrices_Keepers.json
  chaosValue: number | null;
  divineValue: number | null;
  
  // Calculated fields
  expectedValue: number;
  profitabilityStatus: "profitable" | "not_profitable" | "unknown";
  threshold: number;
}
```

### Expected Value Threshold Object

**Format**: Calculated threshold data

```typescript
interface ExpectedValueThreshold {
  value: number; // Threshold in Chaos Orbs
  calculationMethod: "weighted_average";
  totalWeight: number;
  calculatedAt: string; // ISO 8601 timestamp
  scarabCount: number;
}
```

### Simulation Request

**Format**: User input for simulation

```typescript
interface SimulationRequest {
  strategyType: "optimized" | "user_chosen" | "random";
  selectedScarabs?: string[]; // Array of Scarab IDs (required for "user_chosen")
  transactionCount: number; // 1-10000
}
```

### Simulation Result

**Format**: Simulation calculation output

```typescript
interface SimulationResult {
  id: string;
  strategyType: "optimized" | "user_chosen" | "random";
  selectedScarabs?: string[];
  transactionCount: number;
  expectedProfitLoss: number; // Positive = profit, Negative = loss
  createdAt: string; // ISO 8601 timestamp
  results: {
    totalInputValue: number;
    expectedOutputValue: number;
    netProfitLoss: number;
    profitLossPerTransaction: number;
  };
}
```

### User Preferences

**Format**: LocalStorage user preferences

```typescript
interface UserPreferences {
  defaultView?: "list" | "grid";
  currencyPreference?: "chaos" | "divine";
  lastPriceUpdate?: string; // ISO 8601 timestamp
  cachedPrices?: {
    data: MergedScarab[];
    timestamp: string; // ISO 8601 timestamp
  };
}
```

## Data Merging Contract

### Merge Operation

**Input**: 
- `scarabDetails`: Array<ScarabDetail>
- `scarabPrices`: Array<ScarabPrice>

**Output**: Array<MergedScarab>

**Matching Logic**:
1. Match `scarabPrices.detailsId` with `scarabDetails.id`
2. If match found: merge price data into detail object
3. If no match: include detail with null prices
4. If price without detail: skip price entry (log warning)

**Validation**:
- All required fields must be present
- dropWeight must be >= 0 or null
- chaosValue and divineValue must be >= 0 or null
- Invalid data should be handled gracefully (skip or default)

## Error Handling Contracts

### Missing Data

- **Missing price**: Set `chaosValue` and `divineValue` to `null`, mark `profitabilityStatus` as "unknown"
- **Missing dropWeight**: Set `dropWeight` to `null`, exclude from threshold calculation
- **Missing required field**: Skip entry, log error to console

### Invalid Data

- **Negative prices**: Clamp to 0, log warning
- **Invalid dropWeight**: Treat as null, exclude from calculations
- **Invalid transactionCount**: Return error, do not run simulation

## Versioning

**Current Version**: 1.0.0

**Breaking Changes**: None (initial version)

**Future Considerations**:
- API versioning if backend added
- Schema versioning for JSON files
- Migration path for LocalStorage data

