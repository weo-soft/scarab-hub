# Data Contracts: 3-to-1 Trade Simulation

**Date**: 2025-01-27  
**Feature**: 3-to-1 Trade Simulation  
**Phase**: 1 - Design & Contracts

## Input Data Contracts

### Simulation Configuration Request

**Format**: User input for configuring simulation

```typescript
interface SimulationConfigurationRequest {
  selectedScarabIds: string[]; // Array of Scarab IDs (minimum 3)
  breakevenPoint: number; // Breakeven threshold in Chaos Orbs (>= 0)
  rareScarabThreshold: number; // Drop weight percentile (0-1, default: 0.1)
  transactionCount: number; // Number of trades (1 to 1,000,000)
  inputScarabStrategy?: "lowest_value" | "optimal_combination" | "user_selected"; // Optional, default: "user_selected"
}
```

**Validation Rules**:
- `selectedScarabIds.length >= 3`
- `transactionCount > 0 && transactionCount <= 1,000,000`
- `breakevenPoint >= 0`
- `rareScarabThreshold >= 0 && rareScarabThreshold <= 1`
- All `selectedScarabIds` must reference valid Scarab entities

**Example**:
```json
{
  "selectedScarabIds": ["abyss-scarab", "breach-scarab", "divination-scarab"],
  "breakevenPoint": 0,
  "rareScarabThreshold": 0.1,
  "transactionCount": 1000000,
  "inputScarabStrategy": "user_selected"
}
```

## Internal Data Contracts

### SimulationConfiguration

**Format**: Validated simulation configuration

```typescript
interface SimulationConfiguration {
  selectedScarabIds: string[];
  breakevenPoint: number;
  rareScarabThreshold: number;
  transactionCount: number;
  inputScarabStrategy: "lowest_value" | "optimal_combination" | "user_selected";
  createdAt: string; // ISO 8601 timestamp
}
```

### SimulationTransaction

**Format**: Single transaction data

```typescript
interface SimulationTransaction {
  transactionNumber: number; // 1 to transactionCount
  inputScarabIds: string[]; // Array of 3 Scarab IDs
  returnedScarabId: string;
  inputValue: number; // Sum of 3 input scarab values in Chaos Orbs
  returnedValue: number; // Returned scarab value in Chaos Orbs
  profitLoss: number; // returnedValue - inputValue
  cumulativeProfitLoss: number; // Running total up to this transaction
}
```

**Example**:
```json
{
  "transactionNumber": 1,
  "inputScarabIds": ["abyss-scarab", "breach-scarab", "divination-scarab"],
  "returnedScarabId": "abyss-scarab",
  "inputValue": 5.5,
  "returnedValue": 2.0,
  "profitLoss": -3.5,
  "cumulativeProfitLoss": -3.5
}
```

### SignificantEvent

**Format**: Significant event detected during simulation

```typescript
interface SignificantEvent {
  type: "rare_scarab_return" | "breakeven_achieved";
  transactionNumber: number;
  scarabId?: string; // Required for "rare_scarab_return"
  cumulativeProfitLoss?: number; // Required for "breakeven_achieved"
  details?: Record<string, any>; // Additional event-specific data
}
```

**Example (Rare Scarab)**:
```json
{
  "type": "rare_scarab_return",
  "transactionNumber": 50000,
  "scarabId": "rare-scarab-id",
  "details": {
    "dropWeight": 10.5,
    "chaosValue": 50.0
  }
}
```

**Example (Breakeven)**:
```json
{
  "type": "breakeven_achieved",
  "transactionNumber": 250000,
  "cumulativeProfitLoss": 0.01,
  "details": {
    "previousCumulative": -0.5,
    "currentCumulative": 0.01
  }
}
```

### SimulationResult

**Format**: Complete simulation results

```typescript
interface SimulationResult {
  simulationId: string; // Unique identifier
  configuration: SimulationConfiguration;
  yieldCounts: Record<string, number>; // Map of scarab ID to yield count
  totalTransactions: number;
  totalInputValue: number;
  totalOutputValue: number;
  netProfitLoss: number;
  averageProfitLossPerTransaction: number;
  finalCumulativeProfitLoss: number;
  significantEvents: SignificantEvent[];
  transactions: SimulationTransaction[]; // All transactions (for history view)
  completedAt: string; // ISO 8601 timestamp
  executionTimeMs: number; // Execution time in milliseconds
}
```

**Example**:
```json
{
  "simulationId": "sim_1234567890_abc123",
  "configuration": {
    "selectedScarabIds": ["abyss-scarab", "breach-scarab", "divination-scarab"],
    "breakevenPoint": 0,
    "rareScarabThreshold": 0.1,
    "transactionCount": 1000000,
    "inputScarabStrategy": "user_selected",
    "createdAt": "2025-01-27T10:00:00Z"
  },
  "yieldCounts": {
    "abyss-scarab": 15000,
    "breach-scarab": 12000,
    "divination-scarab": 13000,
    "other-scarab": 600000
  },
  "totalTransactions": 1000000,
  "totalInputValue": 5500000.0,
  "totalOutputValue": 5550000.0,
  "netProfitLoss": 50000.0,
  "averageProfitLossPerTransaction": 0.05,
  "finalCumulativeProfitLoss": 50000.0,
  "significantEvents": [
    {
      "type": "rare_scarab_return",
      "transactionNumber": 50000,
      "scarabId": "rare-scarab-id"
    },
    {
      "type": "breakeven_achieved",
      "transactionNumber": 250000,
      "cumulativeProfitLoss": 0.01
    }
  ],
  "completedAt": "2025-01-27T10:05:00Z",
  "executionTimeMs": 300000
}
```

### YieldCount

**Format**: Yield count for visualization

```typescript
interface YieldCount {
  scarabId: string;
  count: number; // >= 0
  percentage: number; // 0-100, calculated as (count / totalTransactions) × 100
}
```

### Transaction History Request

**Format**: Request for transaction history pagination

```typescript
interface TransactionHistoryRequest {
  simulationId: string;
  page: number; // 1-based page number
  pageSize: number; // Transactions per page (default: 100)
  filter?: {
    scarabId?: string; // Filter by returned scarab
    minTransactionNumber?: number;
    maxTransactionNumber?: number;
  };
}
```

### Transaction History Response

**Format**: Paginated transaction history

```typescript
interface TransactionHistoryResponse {
  transactions: SimulationTransaction[];
  totalTransactions: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
```

## Storage Contracts

### LocalStorage Keys

- `scarabHub_simulationResults`: Array<SimulationResult> (session persistence)
- `scarabHub_simulationConfig`: SimulationConfiguration (last used configuration)

### LocalStorage Format

```typescript
interface LocalStorageData {
  scarabHub_simulationResults: SimulationResult[];
  scarabHub_simulationConfig: SimulationConfiguration;
}
```

**Example**:
```json
{
  "scarabHub_simulationResults": [
    {
      "simulationId": "sim_1234567890_abc123",
      "configuration": { ... },
      "yieldCounts": { ... },
      "totalTransactions": 1000000,
      "significantEvents": [ ... ],
      "transactions": [ ... ],
      "completedAt": "2025-01-27T10:05:00Z",
      "executionTimeMs": 300000
    }
  ],
  "scarabHub_simulationConfig": {
    "selectedScarabIds": ["abyss-scarab", "breach-scarab", "divination-scarab"],
    "breakevenPoint": 0,
    "rareScarabThreshold": 0.1,
    "transactionCount": 100000,
    "inputScarabStrategy": "user_selected",
    "createdAt": "2025-01-27T10:00:00Z"
  }
}
```

## API Contracts (Component Interfaces)

### SimulationService Interface

**Format**: Service methods for simulation execution

```typescript
interface SimulationService {
  // Configure simulation
  createConfiguration(request: SimulationConfigurationRequest): SimulationConfiguration;
  
  // Validate configuration
  validateConfiguration(config: SimulationConfiguration): { valid: boolean; error?: string };
  
  // Run simulation
  runSimulation(config: SimulationConfiguration, progressCallback?: (progress: number) => void): Promise<SimulationResult>;
  
  // Get transaction history
  getTransactionHistory(request: TransactionHistoryRequest): Promise<TransactionHistoryResponse>;
  
  // Get significant events
  getSignificantEvents(simulationId: string): SignificantEvent[];
  
  // Get yield counts
  getYieldCounts(simulationId: string): Record<string, number>;
}
```

### SimulationPanel Component Interface

**Format**: Component methods for UI interaction

```typescript
interface SimulationPanel {
  // Render configuration UI
  renderConfiguration(config?: SimulationConfiguration): void;
  
  // Render simulation results
  renderResults(result: SimulationResult): void;
  
  // Render transaction history
  renderTransactionHistory(transactions: SimulationTransaction[], pagination: PaginationInfo): void;
  
  // Render significant events
  renderSignificantEvents(events: SignificantEvent[]): void;
  
  // Update progress indicator
  updateProgress(progress: number, currentTransaction: number, totalTransactions: number): void;
}
```

### GridView/ListView Extension Interface

**Format**: Methods for displaying yield counts

```typescript
interface ViewWithYieldCounts {
  // Set yield counts for display
  setYieldCounts(yieldCounts: Record<string, number>): void;
  
  // Clear yield counts
  clearYieldCounts(): void;
  
  // Update yield count display
  updateYieldCountDisplay(): void;
}
```

## Error Handling Contracts

### Configuration Validation Errors

```typescript
interface ConfigurationError {
  field: string;
  message: string;
  code: "INVALID_SCARAB_COUNT" | "INVALID_TRANSACTION_COUNT" | "INVALID_BREAKEVEN" | "INVALID_THRESHOLD" | "INVALID_SCARAB_ID";
}
```

### Simulation Execution Errors

```typescript
interface SimulationError {
  code: "SIMULATION_FAILED" | "INVALID_CONFIGURATION" | "MISSING_DATA" | "MEMORY_ERROR" | "CANCELLED";
  message: string;
  simulationId?: string;
  partialResults?: Partial<SimulationResult>;
}
```

### Transaction History Errors

```typescript
interface TransactionHistoryError {
  code: "SIMULATION_NOT_FOUND" | "INVALID_PAGE" | "INVALID_FILTER";
  message: string;
}
```

## Performance Contracts

### Simulation Execution Performance

- **Batch size**: 10,000 transactions per batch
- **Progress update frequency**: After each batch
- **Memory target**: <100MB for 1 million transactions
- **Execution time target**: <5 minutes for 1 million transactions (browser-dependent)

### Transaction History Performance

- **Page load time**: <2 seconds for 100 transactions
- **Pagination response**: <500ms
- **Search/filter response**: <1 second

### UI Responsiveness

- **Progress indicator update**: <100ms perceived latency
- **Yield count display update**: <200ms
- **View switching**: <100ms

## Versioning

**Current Version**: 1.0.0

**Breaking Changes**: None (initial version)

**Future Considerations**:
- API versioning if backend added
- Schema versioning for LocalStorage data
- Migration path for simulation results
- Compression for large simulation results

