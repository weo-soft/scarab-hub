# Feature Specification: Flipping Scarabs Page

**Feature Branch**: `001-flipping-scarabs`  
**Created**: 2025-12-27  
**Status**: Draft  
**Input**: User description: "Create a Page: **Page: Flipping Scarabs** ... [full description provided]"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Scarab Profitability Analysis (Priority: P1)

A Path of Exile player wants to determine which Scarabs are profitable to vendor using the 3-to-1 vendor recipe. The player opens the Flipping Scarabs page and immediately sees all Scarabs displayed with clear visual indicators showing which ones are profitable to vendor (below the economic threshold) and which ones should not be vendored (above the threshold). The page calculates and displays the expected value threshold that separates profitable from unprofitable vendoring decisions.

**Why this priority**: This is the core value proposition - enabling players to make informed vendoring decisions. Without this, players cannot determine which Scarabs to vendor, which defeats the entire purpose of the feature.

**Independent Test**: Can be fully tested by displaying all Scarabs with profitability indicators and the calculated threshold value. Delivers immediate value by showing which Scarabs are safe to vendor.

**Acceptance Scenarios**:

1. **Given** the page loads with current Scarab market values and vendor probabilities, **When** a user views the page, **Then** all Scarabs are displayed with visual indicators (e.g., color coding) showing profitable vs unprofitable vendoring status
2. **Given** Scarab data is available, **When** the page calculates expected value, **Then** a clear threshold value is displayed that separates profitable from unprofitable Scarabs
3. **Given** a Scarab with market value below the threshold, **When** displayed, **Then** it is visually marked as profitable to vendor
4. **Given** a Scarab with market value above the threshold, **When** displayed, **Then** it is visually marked as not profitable to vendor

---

### User Story 2 - View Scarabs in Multiple Display Formats (Priority: P2)

A player wants to view Scarabs in a format that matches their preference or workflow. The player can switch between a List view (for detailed comparison and analysis) and a Grid view (that mirrors the in-game Scarab stash layout). Both views maintain the same profitability indicators and threshold information.

**Why this priority**: Different players have different preferences and use cases. List view enables detailed analysis while grid view provides familiar in-game context. This enhances usability but is secondary to the core profitability analysis.

**Independent Test**: Can be fully tested by implementing view switching functionality that displays the same Scarab data in different layouts. Delivers value by accommodating different user preferences and workflows.

**Acceptance Scenarios**:

1. **Given** the page is displaying Scarabs, **When** a user selects List view, **Then** Scarabs are displayed in a list format with detailed information visible
2. **Given** the page is displaying Scarabs, **When** a user selects Grid view, **Then** Scarabs are displayed in a grid layout that mirrors the in-game stash appearance
3. **Given** a user switches between views, **When** the view changes, **Then** all profitability indicators and threshold information remain consistent across both views

---

### User Story 3 - Explore Vendoring Outcomes with Simulations (Priority: P3)

A player wants to understand the long-term outcomes of different vendoring strategies. The player can run simulations that show expected results over time using different strategies: an optimized strategy (vendoring only profitable Scarabs), a user-chosen strategy (selecting specific Scarabs to vendor), or random vendoring behavior (for comparison). The simulation displays expected profit/loss over multiple vendor transactions.

**Why this priority**: Simulations provide educational value and help players understand the economic impact of their decisions over time. This is valuable but not essential for the core decision-making functionality.

**Independent Test**: Can be fully tested by implementing simulation functionality that calculates and displays expected outcomes for different vendoring strategies. Delivers value by helping players understand long-term economic implications.

**Acceptance Scenarios**:

1. **Given** the page displays Scarab profitability data, **When** a user runs an optimized strategy simulation, **Then** the system calculates and displays expected profit/loss over a specified number of vendor transactions
2. **Given** the page displays Scarab profitability data, **When** a user selects specific Scarabs and runs a custom simulation, **Then** the system calculates expected outcomes based on the user's chosen Scarabs
3. **Given** the page displays Scarab profitability data, **When** a user runs a random vendoring simulation, **Then** the system calculates expected outcomes assuming random Scarab selection for comparison purposes
4. **Given** a simulation is run, **When** results are displayed, **Then** the expected profit/loss is clearly shown with visual indicators (positive/negative)

---

### Edge Cases

- What happens when market value data is unavailable or outdated for some Scarabs?
- How does the system handle Scarabs with zero or undefined vendor probability weights?
- What happens when all Scarabs are above or below the threshold (edge case scenarios)?
- How does the system handle rapid market value changes that affect profitability calculations?
- What happens if a user runs a simulation with invalid or missing input parameters?
- How does the system display results when the expected value calculation produces unexpected results (e.g., negative threshold)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display all available Scarabs with their current market values
- **FR-002**: System MUST calculate and display the expected value threshold that separates profitable from unprofitable vendoring
- **FR-003**: System MUST visually indicate which Scarabs are profitable to vendor (below threshold) and which are not (above threshold)
- **FR-004**: System MUST provide a List view that displays Scarabs in a detailed, comparable format
- **FR-005**: System MUST provide a Grid view that displays Scarabs in a layout mirroring the in-game stash appearance
- **FR-006**: System MUST allow users to switch between List and Grid views
- **FR-007**: System MUST calculate expected value based on Scarab vendor probabilities (weights) and possible outcome values
- **FR-008**: System MUST provide simulation functionality that calculates expected outcomes for optimized vendoring strategy
- **FR-009**: System MUST provide simulation functionality that allows users to select specific Scarabs and calculate expected outcomes
- **FR-010**: System MUST provide simulation functionality that calculates expected outcomes for random vendoring behavior
- **FR-011**: System MUST display simulation results showing expected profit/loss over multiple vendor transactions
- **FR-012**: System MUST maintain consistent profitability indicators and threshold information across all views
- **FR-013**: System MUST handle cases where market value data is unavailable by clearly indicating missing data
- **FR-014**: System MUST handle cases where vendor probability weights are zero or undefined

### Key Entities *(include if feature involves data)*

- **Scarab**: Represents a game item with attributes: name, market value (currency), vendor probability weight, expected value calculation result, profitability status (profitable/not profitable)
- **Expected Value Threshold**: The calculated maximum input value that separates profitable from unprofitable vendoring decisions, derived from vendor probabilities and outcome values
- **Simulation**: Represents a calculation scenario with attributes: strategy type (optimized/user-chosen/random), selected Scarabs (if applicable), number of transactions, expected profit/loss result
- **Market Value**: Current trading value of a Scarab in the game's economy, used to determine if vendoring is profitable

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can identify which Scarabs are profitable to vendor within 10 seconds of viewing the page
- **SC-002**: Users can understand the economic threshold that separates profitable from unprofitable vendoring decisions without additional explanation
- **SC-003**: Users can switch between List and Grid views in under 2 seconds without losing context
- **SC-004**: Users can run a simulation and understand expected outcomes within 30 seconds
- **SC-005**: The page displays all available Scarabs with profitability indicators without requiring user input or configuration
- **SC-006**: Users report increased confidence in making vendoring decisions after using the page (qualitative measure via user feedback)
