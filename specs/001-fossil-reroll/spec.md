# Feature Specification: Fossil Rerolling

**Feature Branch**: `001-fossil-reroll`  
**Created**: 2025-01-27  
**Status**: Draft  
**Input**: User description: "Similar to the Essence rerolling, Fossils can also be rerolled. It costs 30 wild crystallised Liefeforce. The User should be able to see what Fossils to reroll and which to keep in a similiar Fashion as for the Essences."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Fossil Profitability Analysis (Priority: P1)

A Path of Exile player wants to determine which Fossils are profitable to reroll using Wild Crystallised Lifeforce. The player opens the Fossil rerolling page and immediately sees all Fossils displayed with clear visual indicators showing which ones are profitable to reroll (below the economic threshold) and which ones should not be rerolled (above the threshold). The page calculates and displays the expected value threshold that separates profitable from unprofitable rerolling decisions.

**Why this priority**: This is the core value proposition - enabling players to make informed rerolling decisions. Without this, players cannot determine which Fossils to reroll, which defeats the entire purpose of the feature.

**Independent Test**: Can be fully tested by displaying all Fossils with profitability indicators and the calculated threshold value. Delivers immediate value by showing which Fossils are safe to reroll.

**Acceptance Scenarios**:

1. **Given** the page loads with current Fossil market values and reroll probabilities, **When** a user views the page, **Then** all Fossils are displayed with visual indicators (e.g., color coding) showing profitable vs unprofitable rerolling status
2. **Given** Fossil data is available, **When** the page calculates expected value, **Then** a clear threshold value is displayed that separates profitable from unprofitable Fossils
3. **Given** a Fossil with market value below the threshold, **When** displayed, **Then** it is visually marked as profitable to reroll
4. **Given** a Fossil with market value above the threshold, **When** displayed, **Then** it is visually marked as not profitable to reroll
5. **Given** the reroll cost (30 Wild Crystallised Lifeforce), **When** displayed, **Then** the cost is clearly shown and factored into profitability calculations

---

### User Story 2 - Select Fossils to Reroll or Keep (Priority: P2)

A player wants to customize which Fossils they will reroll and which they will keep. The player can select individual Fossils to mark them for rerolling or keeping, allowing them to create a personalized rerolling strategy based on their inventory and preferences.

**Why this priority**: This enables players to make strategic decisions based on their specific situation. While the profitability analysis provides guidance, players need control over their rerolling strategy. This is secondary to the core profitability analysis but essential for practical use.

**Independent Test**: Can be fully tested by implementing selection functionality that allows users to mark Fossils for rerolling or keeping. Delivers value by giving players control over their rerolling strategy.

**Acceptance Scenarios**:

1. **Given** the page displays Fossils, **When** a user clicks on a Fossil, **Then** the Fossil is marked as selected for rerolling
2. **Given** a Fossil is marked for rerolling, **When** a user clicks it again, **Then** the Fossil is marked as kept (not for rerolling)
3. **Given** multiple Fossils are selected, **When** displayed, **Then** all selected Fossils are visually distinguished from unselected ones
4. **Given** Fossils are selected for rerolling, **When** the page calculates expected outcomes, **Then** only selected Fossils are included in rerolling calculations

---

### User Story 3 - View Fossils in List Format (Priority: P2)

A player wants to view Fossils in a detailed list format that allows for easy comparison and analysis. The player can see all Fossils with their values, profitability status, and selection state in a sortable list view similar to the Essences list view.

**Why this priority**: The list view provides detailed information and comparison capabilities that are essential for making informed decisions. This matches the user's explicit requirement for a view similar to Essences. This is equally important as selection functionality for usability.

**Independent Test**: Can be fully tested by implementing a list view that displays Fossils with all relevant information in a sortable format. Delivers value by providing detailed comparison and analysis capabilities.

**Acceptance Scenarios**:

1. **Given** the page displays Fossils, **When** a user views the list, **Then** all Fossils are displayed in a list format with name, value, and profitability status
2. **Given** the list view is displayed, **When** a user clicks on a column header, **Then** the list is sorted by that column
3. **Given** Fossils are displayed in the list, **When** viewed, **Then** each Fossil shows its current market value in the selected currency (chaos or divine)
4. **Given** Fossils are displayed in the list, **When** viewed, **Then** each Fossil shows its profitability status with visual indicators

---

### Edge Cases

- What happens when market value data is unavailable or outdated for some Fossils?
- How does the system handle Fossils that don't fit into the reroll group (should not occur, but needs handling)?
- What happens when all Fossils are above or below the threshold?
- How does the system calculate expected value when some Fossils have missing price data?
- What happens when Wild Crystallised Lifeforce price data is unavailable?
- How does the system handle cases where no Fossils are available to display?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display all available Fossils with their current market values
- **FR-002**: System MUST calculate and display the expected value threshold that separates profitable from unprofitable rerolling
- **FR-003**: System MUST visually indicate which Fossils are profitable to reroll (below threshold) and which are not (above threshold)
- **FR-004**: System MUST provide a List view that displays Fossils in a detailed, comparable format similar to the Essences list view
- **FR-005**: System MUST calculate expected value based on equal weighting for all Fossils within the reroll group
- **FR-006**: System MUST group all Fossils together as a single reroll group where each Fossil can reroll into any other Fossil
- **FR-007**: System MUST factor in the cost of 30 Wild Crystallised Lifeforce when calculating profitability
- **FR-008**: System MUST allow users to select individual Fossils to mark them for rerolling
- **FR-009**: System MUST allow users to deselect Fossils to mark them as kept (not for rerolling)
- **FR-010**: System MUST visually distinguish selected Fossils from unselected ones
- **FR-011**: System MUST calculate expected outcomes based only on Fossils selected for rerolling
- **FR-012**: System MUST handle cases where market value data is unavailable by clearly indicating missing data
- **FR-013**: System MUST handle cases where Wild Crystallised Lifeforce price data is unavailable
- **FR-014**: System MUST maintain consistent profitability indicators across all views
- **FR-015**: System MUST support sorting the list view by name, value, and profitability status

### Key Entities *(include if feature involves data)*

- **Fossil**: Represents a game item with attributes: name, market value (currency), reroll group membership, expected value calculation result, profitability status (profitable/not profitable), selection state (selected for rerolling/kept)
- **Expected Value Threshold**: The calculated maximum input value that separates profitable from unprofitable rerolling decisions, derived from equal-weighted probabilities within the reroll group and outcome values, accounting for the cost of 30 Wild Crystallised Lifeforce
- **Reroll Group**: A collection of all Fossils that can reroll into each other. All Fossils belong to a single reroll group where each Fossil can reroll into any other Fossil with equal probability
- **Wild Crystallised Lifeforce**: The currency item required for rerolling, with a cost of 30 units per reroll operation
- **Market Value**: Current trading value of a Fossil in the game's economy, used to determine if rerolling is profitable

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can identify which Fossils are profitable to reroll within 10 seconds of viewing the page
- **SC-002**: Users can understand the economic threshold that separates profitable from unprofitable rerolling decisions without additional explanation
- **SC-003**: Users can select or deselect Fossils for rerolling in under 2 seconds per Fossil
- **SC-004**: Users can view and sort all Fossils in the list view without requiring additional configuration
- **SC-005**: The page displays all available Fossils with profitability indicators without requiring user input or configuration
- **SC-006**: Users can understand which Fossils belong to the reroll group without confusion
- **SC-007**: The system correctly calculates expected value using equal weighting for all Fossils within the reroll group
- **SC-008**: Users report increased confidence in making rerolling decisions after using the page (qualitative measure via user feedback)

## Assumptions

- All Fossils can reroll into each other with equal probability (similar to how all Deafening Essences can reroll into each other)
- The data structure for Fossil prices follows the same pattern as Essence prices: `{ name, chaosValue, divineValue, detailsId }`
- Fossil prices are available in the same format as other items: `fossilPrices_{league}.json`
- Wild Crystallised Lifeforce price is available in `lifeforcePrices_{league}.json`
- The UI/UX patterns from Essence rerolling can be reused for Fossil rerolling
- Users are familiar with the Essence rerolling interface and will understand similar patterns for Fossils
