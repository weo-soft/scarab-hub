# Data Model: 3-to-1 Trade Simulation

**Date**: 2025-01-27  
**Feature**: 3-to-1 Trade Simulation  
**Phase**: 1 - Design & Contracts

## Entities

### SimulationConfiguration

Represents user-defined simulation parameters including selected scarabs, breakeven point threshold, rare scarab threshold, and number of trades.

**Attributes**:
- `selectedScarabIds` (array<string>, required): Array of Scarab IDs to use in simulation (minimum 3)
- `breakevenPoint` (number, required): Breakeven threshold in Chaos Orbs (cumulative profit/loss target)
- `rareScarabThreshold` (number, required): Drop weight percentile threshold for rare scarab detection (0-1, default: 0.1 for bottom 10%)
- `transactionCount` (number, required): Number of trades to simulate (1 to 1,000,000)
- `inputScarabStrategy` (enum, optional): "lowest_value" | "optimal_combination" | "user_selected" (default: "user_selected")
- `createdAt` (timestamp, required): When configuration was created

**Relationships**:
- References: Array of Scarab entities (by ID)

**Validation Rules**:
- `selectedScarabIds` must have length >= 3
- `transactionCount` must be > 0 and <= 1,000,000
- `breakevenPoint` must be >= 0
- `rareScarabThreshold` must be between 0 and 1
- All `selectedScarabIds` must reference valid Scarab entities

**State Transitions**:
- Created: User configures simulation parameters
- Validated: Configuration validated before simulation execution
- Invalid: Validation fails, error message displayed

### SimulationTransaction

Represents a single 3-to-1 trade transaction with transaction number, input scarabs, and returned scarab.

**Attributes**:
- `transactionNumber` (number, required): Sequential transaction number (1 to transactionCount)
- `inputScarabIds` (array<string>, required): Array of 3 Scarab IDs used as input
- `returnedScarabId` (string, required): Scarab ID that was returned
- `inputValue` (number, calculated): Total value of 3 input scarabs in Chaos Orbs
- `returnedValue` (number, calculated): Value of returned scarab in Chaos Orbs
- `profitLoss` (number, calculated): Profit/loss for this transaction (returnedValue - inputValue)
- `cumulativeProfitLoss` (number, calculated): Running total of profit/loss up to this transaction

**Relationships**:
- References: 3 Scarab entities (input) and 1 Scarab entity (returned)

**Validation Rules**:
- `transactionNumber` must be > 0 and <= transactionCount
- `inputScarabIds` must have length === 3
- `returnedScarabId` must reference a valid Scarab entity
- All `inputScarabIds` must reference valid Scarab entities

**State Transitions**:
- Created: Transaction simulated
- Stored: Transaction data stored in simulation results

### SimulationResult

Represents aggregated results including total yield counts per scarab type, cumulative profit/loss, and significant events.

**Attributes**:
- `simulationId` (string, required): Unique identifier for this simulation run
- `configuration` (SimulationConfiguration, required): Configuration used for this simulation
- `yieldCounts` (Map<string, number>, required): Map of scarab ID to count of times yielded
- `totalTransactions` (number, required): Total number of transactions executed
- `totalInputValue` (number, calculated): Sum of all input values across transactions
- `totalOutputValue` (number, calculated): Sum of all returned values across transactions
- `netProfitLoss` (number, calculated): Total profit/loss (totalOutputValue - totalInputValue)
- `averageProfitLossPerTransaction` (number, calculated): Net profit/loss divided by transaction count
- `finalCumulativeProfitLoss` (number, calculated): Cumulative profit/loss after all transactions
- `significantEvents` (array<SignificantEvent>, required): Array of significant events detected
- `transactions` (array<SimulationTransaction>, required): Array of all transactions (for history view)
- `completedAt` (timestamp, required): When simulation completed
- `executionTimeMs` (number, calculated): Time taken to execute simulation in milliseconds

**Relationships**:
- Contains: Array of SimulationTransaction entities
- Contains: Array of SignificantEvent entities
- References: SimulationConfiguration entity

**Validation Rules**:
- `totalTransactions` must equal configuration.transactionCount
- `yieldCounts` must have entries for all scarabs that were yielded (count > 0)
- `significantEvents` array may be empty if no events occurred
- `transactions` array length must equal `totalTransactions`

**State Transitions**:
- Created: Simulation starts
- Running: Transactions being processed
- Completed: All transactions processed, results available
- Error: Simulation failed, partial results may be available

### SignificantEvent

Represents a notable occurrence during simulation (rare scarab return, breakeven achievement) with transaction number and details.

**Attributes**:
- `type` (enum, required): "rare_scarab_return" | "breakeven_achieved"
- `transactionNumber` (number, required): Transaction number where event occurred
- `scarabId` (string, optional): Scarab ID (required for "rare_scarab_return" type)
- `cumulativeProfitLoss` (number, optional): Cumulative profit/loss at event (required for "breakeven_achieved" type)
- `details` (object, optional): Additional event-specific details

**Relationships**:
- References: SimulationTransaction entity (by transactionNumber)
- References: Scarab entity (by scarabId, for rare_scarab_return type)

**Validation Rules**:
- `transactionNumber` must be > 0
- `scarabId` must be provided if type is "rare_scarab_return"
- `cumulativeProfitLoss` must be provided if type is "breakeven_achieved"

**State Transitions**:
- Detected: Event detected during simulation execution
- Recorded: Event stored in simulation results

### YieldCount

Represents the number of times a specific scarab type was returned across all transactions in a simulation.

**Attributes**:
- `scarabId` (string, required): Scarab ID
- `count` (number, required): Number of times this scarab was yielded (>= 0)
- `percentage` (number, calculated): Percentage of total transactions that yielded this scarab (0-100)

**Relationships**:
- References: Scarab entity (by scarabId)

**Validation Rules**:
- `count` must be >= 0
- `percentage` must be between 0 and 100
- `count` cannot exceed total transaction count

**Calculation**:
```
percentage = (count / totalTransactions) × 100
```

## Data Flow

### Simulation Configuration

1. User selects scarabs to include in simulation (minimum 3)
2. User sets breakeven point threshold
3. User sets rare scarab threshold (default: 10%)
4. User specifies number of trades (1 to 1,000,000)
5. System validates configuration
6. Configuration stored in SimulationConfiguration entity

### Simulation Execution

1. Initialize SimulationResult with configuration
2. Calculate rare scarab set based on drop weight threshold
3. For each transaction (1 to transactionCount):
   - Select 3 input scarabs based on strategy
   - Calculate input value (sum of 3 scarab values)
   - Select returned scarab based on drop weights (weighted random)
   - Calculate returned value
   - Calculate profit/loss for transaction
   - Update cumulative profit/loss
   - Create SimulationTransaction entity
   - Check for significant events:
     - If returned scarab is rare: create SignificantEvent (type: "rare_scarab_return")
     - If breakeven achieved: create SignificantEvent (type: "breakeven_achieved")
   - Update yield counts (increment count for returned scarab)
   - Store transaction in results
   - Update progress indicator (every 10,000 transactions)
4. Calculate final aggregated results
5. Store SimulationResult

### Transaction History View

1. User requests transaction history
2. System loads transactions from SimulationResult (paginated)
3. For each transaction in page:
   - Display transaction number
   - Display returned scarab name and details
   - Display profit/loss for transaction
   - Display cumulative profit/loss
4. User can navigate (pagination, search, filter)
5. User can navigate to specific transaction from significant event

### Yield Count Visualization

1. Simulation completes, SimulationResult available
2. For Grid view:
   - For each scarab cell:
     - Look up yield count in SimulationResult.yieldCounts
     - Display count as overlay text
     - Style based on count (zero vs non-zero)
3. For List view:
   - Add "Yield Count" column to table
   - For each scarab row:
     - Look up yield count in SimulationResult.yieldCounts
     - Display count in column
     - Display percentage if available

## Data Storage

### LocalStorage Keys

- `scarabHub_simulationResults`: Array of completed SimulationResult objects (session persistence)
- `scarabHub_simulationConfig`: Last used SimulationConfiguration (for convenience)

### Data Format

```json
{
  "scarabHub_simulationResults": [
    {
      "simulationId": "sim_1234567890_abc123",
      "configuration": {
        "selectedScarabIds": ["scarab-1", "scarab-2", "scarab-3"],
        "breakevenPoint": 0,
        "rareScarabThreshold": 0.1,
        "transactionCount": 1000000,
        "createdAt": "2025-01-27T10:00:00Z"
      },
      "yieldCounts": {
        "scarab-1": 15000,
        "scarab-2": 12000,
        "scarab-3": 13000
      },
      "totalTransactions": 1000000,
      "netProfitLoss": 5000.50,
      "significantEvents": [
        {
          "type": "rare_scarab_return",
          "transactionNumber": 50000,
          "scarabId": "rare-scarab-1"
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
  ],
  "scarabHub_simulationConfig": {
    "selectedScarabIds": ["scarab-1", "scarab-2", "scarab-3"],
    "breakevenPoint": 0,
    "rareScarabThreshold": 0.1,
    "transactionCount": 100000,
    "createdAt": "2025-01-27T10:00:00Z"
  }
}
```

## Edge Cases

### Missing Data

- **Missing price data for selected scarab**: Exclude from simulation, show error message
- **Missing drop weight for selected scarab**: Cannot calculate return probability, exclude from simulation
- **No valid scarabs after filtering**: Show error, prevent simulation execution

### Invalid Data

- **Negative transaction count**: Clamp to 1, show warning
- **Transaction count > 1,000,000**: Clamp to 1,000,000, show warning
- **Fewer than 3 selected scarabs**: Show error, prevent simulation execution
- **Invalid breakeven point**: Validate >= 0, show error if invalid

### Performance Edge Cases

- **Very large simulations (1 million transactions)**: Use batch processing, progress updates, efficient data structures
- **Memory constraints**: Stream transaction data, use pagination for history view
- **Long execution time**: Show progress indicator, allow cancellation
- **Browser tab inactive**: Pause simulation, resume when tab active (optional enhancement)

### Simulation Edge Cases

- **No breakeven achieved**: No breakeven event recorded (acceptable)
- **Multiple breakeven points**: Record first occurrence only
- **No rare scarabs returned**: No rare scarab events recorded (acceptable)
- **All transactions yield same scarab**: Valid outcome, yield count reflects this
- **Zero yield for some scarabs**: Display count of 0 in visualization

### Data Consistency

- **Transaction count mismatch**: Validate transactions array length matches configuration
- **Yield count sum mismatch**: Validate sum of yield counts equals transaction count
- **Event transaction number out of range**: Validate event transaction numbers are within valid range
- **Missing transaction data**: Handle gracefully, show error for missing transactions

