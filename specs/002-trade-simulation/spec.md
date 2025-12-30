# Feature Specification: 3-to-1 Trade Simulation

**Feature Branch**: `002-trade-simulation`  
**Created**: 2025-01-27  
**Status**: Draft  
**Input**: User description: "The user should be able to accuratly run 3-to-1 trade simulations of upto 1 million Trades. When the simulation is run, the user should see what Scarabs where return with each transaction. The user can configure the Simulation, eg what scarabs to use, breakeven point etc. The Simulation should track significant events during the run, eg. a rare scarab was returned at the Xth transaction. The breakeven point was reached with the Yth transaction. The simulation should be visualized using the available Grid and List view, adding the number of Scarabs the trades yielded for each of the Scarabs to the cells/Table Entries"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Run Large-Scale Trade Simulation (Priority: P1)

A Path of Exile player wants to understand the long-term outcomes of the 3-to-1 vendor recipe by running a simulation with up to 1 million trades. The player configures the simulation parameters (which scarabs to use, breakeven point threshold, number of trades) and runs the simulation. The system accurately simulates each trade, tracking which scarab was returned for each transaction, and displays the results showing how many of each scarab type were yielded across all trades.

**Why this priority**: This is the core functionality - enabling players to simulate large-scale trading scenarios to understand expected outcomes. Without accurate simulation of individual transactions, players cannot make informed decisions about long-term trading strategies.

**Independent Test**: Can be fully tested by running a simulation with a configured number of trades and verifying that each transaction is accurately simulated and results are correctly aggregated. Delivers immediate value by showing realistic trading outcomes.

**Acceptance Scenarios**:

1. **Given** a user has configured simulation parameters (scarabs to use, number of trades up to 1 million, breakeven point), **When** the user runs the simulation, **Then** the system accurately simulates each individual trade transaction
2. **Given** a simulation is running, **When** each transaction completes, **Then** the system records which scarab was returned for that specific transaction
3. **Given** a simulation completes, **When** results are displayed, **Then** the system shows the total count of each scarab type that was returned across all transactions
4. **Given** a user runs a simulation with 1 million trades, **When** the simulation completes, **Then** all 1 million transactions are accurately processed and results are correctly calculated

---

### User Story 2 - View Transaction-by-Transaction Results (Priority: P2)

A player wants to review the detailed results of a simulation, seeing what scarab was returned for each individual transaction. The player can navigate through the transaction history to see the sequence of returns, allowing them to understand patterns and specific outcomes at different points in the simulation.

**Why this priority**: Players need to verify simulation accuracy and understand the sequence of outcomes. This provides transparency and helps players trust the simulation results. However, this is secondary to the core simulation functionality.

**Independent Test**: Can be fully tested by displaying transaction history with each transaction showing its number and the scarab returned. Delivers value by providing detailed transparency into simulation execution.

**Acceptance Scenarios**:

1. **Given** a simulation has completed, **When** a user views transaction details, **Then** the system displays a list of transactions showing transaction number and scarab returned
2. **Given** a simulation with many transactions (e.g., 1 million), **When** a user views transaction details, **Then** the system provides navigation controls (pagination, search, filtering) to access specific transactions
3. **Given** a user is viewing transaction history, **When** they navigate to a specific transaction, **Then** the system displays that transaction's number and the scarab that was returned

---

### User Story 3 - Track Significant Simulation Events (Priority: P2)

A player wants to be alerted to important milestones and events during a simulation run. The system tracks and displays significant events such as when a rare scarab was returned, when the breakeven point was reached, and other notable milestones that help the player understand the simulation's progression.

**Why this priority**: Significant events provide context and help players understand simulation outcomes at key moments. This enhances the value of the simulation but is not essential for basic functionality.

**Independent Test**: Can be fully tested by running a simulation and verifying that significant events are detected, recorded, and displayed to the user. Delivers value by highlighting important moments in the simulation.

**Acceptance Scenarios**:

1. **Given** a simulation is running, **When** a rare scarab is returned at transaction X, **Then** the system records this event with the transaction number and scarab type
2. **Given** a simulation is running, **When** cumulative profit/loss reaches the breakeven point at transaction Y, **Then** the system records this event with the transaction number
3. **Given** a simulation completes, **When** results are displayed, **Then** the system shows a summary of all significant events that occurred during the simulation
4. **Given** a user views simulation results, **When** they review significant events, **Then** they can navigate to the specific transaction where each event occurred

---

### User Story 4 - Configure Simulation Parameters (Priority: P1)

A player wants to customize the simulation to match their specific trading scenario. The player can configure which scarabs to include in the simulation, set the breakeven point threshold, and specify the number of trades to simulate (up to 1 million).

**Why this priority**: Configuration is essential for the simulation to be useful. Players need to match simulation parameters to their actual trading strategy and goals. Without configuration, the simulation cannot provide personalized value.

**Independent Test**: Can be fully tested by providing configuration controls that allow users to set simulation parameters and verifying that these parameters are correctly used when running the simulation. Delivers value by enabling personalized simulation scenarios.

**Acceptance Scenarios**:

1. **Given** a user wants to configure a simulation, **When** they access configuration options, **Then** the system provides controls to select which scarabs to include in the simulation
2. **Given** a user is configuring a simulation, **When** they set the breakeven point, **Then** the system uses this threshold to detect when breakeven is reached during simulation
3. **Given** a user is configuring a simulation, **When** they specify the number of trades (1 to 1,000,000), **Then** the system validates and uses this number for the simulation
4. **Given** a user has configured simulation parameters, **When** they run the simulation, **Then** the system uses all configured parameters accurately

---

### User Story 5 - Visualize Results in Grid and List Views (Priority: P2)

A player wants to see simulation results integrated into the existing Grid and List views, showing how many of each scarab type were yielded by the trades. The results are overlaid on the existing scarab display, adding yield counts to each scarab's cell or table entry.

**Why this priority**: Visual integration with existing views provides a familiar interface and helps players correlate simulation results with scarab properties. This enhances usability but is secondary to core simulation functionality.

**Independent Test**: Can be fully tested by displaying simulation yield counts in both Grid and List views and verifying that counts are correctly associated with each scarab. Delivers value by providing visual context for simulation results.

**Acceptance Scenarios**:

1. **Given** a simulation has completed, **When** a user views results in Grid view, **Then** each scarab cell displays the count of that scarab type that was yielded in the simulation
2. **Given** a simulation has completed, **When** a user views results in List view, **Then** each scarab table entry displays the count of that scarab type that was yielded in the simulation
3. **Given** a user switches between Grid and List views, **When** they view simulation results, **Then** yield counts are consistently displayed in both views
4. **Given** a scarab was not yielded in the simulation, **When** results are displayed, **Then** that scarab shows a yield count of zero

---

### Edge Cases

- What happens when a simulation is configured with fewer than 3 scarabs? (Minimum 3 required for 3-to-1 recipe)
- How does the system handle simulations where no breakeven point is reached within the specified number of trades?
- What happens when a user tries to run a simulation with 0 trades or more than 1 million trades?
- How does the system handle simulations where selected scarabs have no price data or drop weight?
- What happens if a simulation is interrupted or the browser is closed mid-simulation?
- How does the system handle displaying transaction history for very large simulations (e.g., 1 million transactions) without performance degradation?
- What happens when multiple rare scarabs are returned in the same simulation?
- How does the system handle edge cases where cumulative profit/loss exactly equals the breakeven point?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to configure simulation parameters including which scarabs to use, breakeven point threshold, and number of trades (1 to 1,000,000)
- **FR-002**: System MUST accurately simulate each individual 3-to-1 trade transaction, selecting returned scarabs based on their drop weights
- **FR-003**: System MUST record which scarab was returned for each individual transaction in the simulation
- **FR-004**: System MUST track and record significant events during simulation execution, including rare scarab returns and breakeven point achievement
- **FR-005**: System MUST display the total count of each scarab type yielded across all transactions in the simulation results
- **FR-006**: System MUST provide transaction-by-transaction history view showing transaction number and returned scarab for each transaction
- **FR-007**: System MUST provide navigation controls (pagination, search, filtering) for accessing transaction history in large simulations
- **FR-008**: System MUST display significant events summary showing when each event occurred (transaction number) and relevant details
- **FR-009**: System MUST allow users to navigate from significant events to the specific transaction where the event occurred
- **FR-010**: System MUST display simulation yield counts in Grid view, adding the count to each scarab cell
- **FR-011**: System MUST display simulation yield counts in List view, adding the count to each scarab table entry
- **FR-012**: System MUST validate simulation configuration parameters before execution (minimum 3 scarabs, valid trade count range, valid breakeven point)
- **FR-013**: System MUST handle simulations with up to 1 million trades without data loss or calculation errors
- **FR-014**: System MUST calculate cumulative profit/loss for each transaction to detect breakeven point achievement
- **FR-015**: System MUST identify rare scarabs based on drop weight threshold (lower drop weight = rarer), with configurable threshold (default: bottom 10% of all scarabs)

### Key Entities *(include if feature involves data)*

- **Simulation Configuration**: Represents user-defined simulation parameters including selected scarabs, breakeven point threshold, and number of trades
- **Simulation Transaction**: Represents a single 3-to-1 trade transaction with transaction number, input scarabs, and returned scarab
- **Simulation Result**: Represents aggregated results including total yield counts per scarab type, cumulative profit/loss, and significant events
- **Significant Event**: Represents a notable occurrence during simulation (rare scarab return, breakeven achievement) with transaction number and details
- **Yield Count**: Represents the number of times a specific scarab type was returned across all transactions in a simulation

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can successfully run simulations with up to 1 million trades, with all transactions accurately processed and results correctly calculated
- **SC-002**: Simulation results display yield counts for each scarab type with 100% accuracy (counts match actual simulated transactions)
- **SC-003**: Users can view transaction-by-transaction history for simulations of any size (up to 1 million) with navigation controls responding in under 2 seconds
- **SC-004**: Significant events are detected and recorded with 100% accuracy (all rare scarab returns and breakeven achievements are captured)
- **SC-005**: Users can configure and run a complete simulation (configure parameters, execute, view results) in under 5 minutes for simulations up to 100,000 trades
- **SC-006**: Grid and List views display yield counts correctly for all scarabs, with zero-yield scarabs showing count of 0
- **SC-007**: Users can navigate from significant events to specific transactions with 100% accuracy (correct transaction is displayed)
- **SC-008**: Simulation configuration validation prevents invalid configurations (fewer than 3 scarabs, invalid trade counts) with clear error messages

## Assumptions

- Rare scarab identification will be based on a configurable threshold (drop weight or price-based) with a reasonable default
- Breakeven point is defined as the transaction where cumulative profit/loss reaches zero or becomes positive
- Transaction history for very large simulations (e.g., 1 million) will use pagination or virtual scrolling to maintain performance
- Simulation execution may take significant time for large simulations (1 million trades), and progress indication will be provided
- Yield counts in Grid and List views will be displayed as overlay or additional data, not replacing existing scarab information
- Users can run multiple simulations and compare results
- Simulation results persist for the current session and can be cleared when starting a new simulation

