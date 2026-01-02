# Feature Specification: Essence Rerolling

**Feature Branch**: `001-essence-reroll`  
**Created**: 2025-01-27  
**Status**: Draft  
**Input**: User description: "Similar to the Scarabs essences can also be flipped/rerolled. To change the type of an Essence into a different one, the user has to use 30 Primal Crystallised Lifeforce. When rerolling Essences, all Essences are weighted the Same. Each Deafening Essence of ... can be rerolled into a different one. Same applies to the Shrieking Essences. The Essences of Horror, Hysteria, Insanity and Delirium can only rerolled into each other, and cant be created from any other essence. The User should be able to determine what essences to reroll and which ones to Keep. The Essences should be presented in a similar List view as used for the Scarabs."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Essence Profitability Analysis (Priority: P1)

A Path of Exile player wants to determine which Essences are profitable to reroll using Primal Crystallised Lifeforce. The player opens the Essence rerolling page and immediately sees all Essences displayed with clear visual indicators showing which ones are profitable to reroll (below the economic threshold) and which ones should not be rerolled (above the threshold). The page calculates and displays the expected value threshold that separates profitable from unprofitable rerolling decisions.

**Why this priority**: This is the core value proposition - enabling players to make informed rerolling decisions. Without this, players cannot determine which Essences to reroll, which defeats the entire purpose of the feature.

**Independent Test**: Can be fully tested by displaying all Essences with profitability indicators and the calculated threshold value. Delivers immediate value by showing which Essences are safe to reroll.

**Acceptance Scenarios**:

1. **Given** the page loads with current Essence market values and reroll probabilities, **When** a user views the page, **Then** all Essences are displayed with visual indicators (e.g., color coding) showing profitable vs unprofitable rerolling status
2. **Given** Essence data is available, **When** the page calculates expected value, **Then** a clear threshold value is displayed that separates profitable from unprofitable Essences
3. **Given** an Essence with market value below the threshold, **When** displayed, **Then** it is visually marked as profitable to reroll
4. **Given** an Essence with market value above the threshold, **When** displayed, **Then** it is visually marked as not profitable to reroll
5. **Given** the reroll cost (30 Primal Crystallised Lifeforce), **When** displayed, **Then** the cost is clearly shown and factored into profitability calculations

---

### User Story 2 - Select Essences to Reroll or Keep (Priority: P2)

A player wants to customize which Essences they will reroll and which they will keep. The player can select individual Essences to mark them for rerolling or keeping, allowing them to create a personalized rerolling strategy based on their inventory and preferences.

**Why this priority**: This enables players to make strategic decisions based on their specific situation. While the profitability analysis provides guidance, players need control over their rerolling strategy. This is secondary to the core profitability analysis but essential for practical use.

**Independent Test**: Can be fully tested by implementing selection functionality that allows users to mark Essences for rerolling or keeping. Delivers value by giving players control over their rerolling strategy.

**Acceptance Scenarios**:

1. **Given** the page displays Essences, **When** a user clicks on an Essence, **Then** the Essence is marked as selected for rerolling
2. **Given** an Essence is marked for rerolling, **When** a user clicks it again, **Then** the Essence is marked as kept (not for rerolling)
3. **Given** multiple Essences are selected, **When** displayed, **Then** all selected Essences are visually distinguished from unselected ones
4. **Given** Essences are selected for rerolling, **When** the page calculates expected outcomes, **Then** only selected Essences are included in rerolling calculations

---

### User Story 3 - View Essences in List Format (Priority: P2)

A player wants to view Essences in a detailed list format that allows for easy comparison and analysis. The player can see all Essences with their values, profitability status, and selection state in a sortable list view similar to the Scarabs list view.

**Why this priority**: The list view provides detailed information and comparison capabilities that are essential for making informed decisions. This matches the user's explicit requirement for a list view similar to Scarabs. This is equally important as selection functionality for usability.

**Independent Test**: Can be fully tested by implementing a list view that displays Essences with all relevant information in a sortable format. Delivers value by providing detailed comparison and analysis capabilities.

**Acceptance Scenarios**:

1. **Given** the page displays Essences, **When** a user views the list, **Then** all Essences are displayed in a list format with name, value, and profitability status
2. **Given** the list view is displayed, **When** a user clicks on a column header, **Then** the list is sorted by that column
3. **Given** Essences are displayed in the list, **When** viewed, **Then** each Essence shows its current market value in the selected currency (chaos or divine)
4. **Given** Essences are displayed in the list, **When** viewed, **Then** each Essence shows its profitability status with visual indicators

---

### Edge Cases

- What happens when market value data is unavailable or outdated for some Essences?
- How does the system handle Essences that belong to multiple reroll groups (should not occur, but needs handling)?
- What happens when all Essences in a reroll group are above or below the threshold?
- How does the system handle the special group (Horror, Hysteria, Insanity, Delirium) that can only reroll into each other?
- What happens when a user selects Essences from different reroll groups for rerolling?
- How does the system calculate expected value when some Essences in a reroll group have missing price data?
- What happens when Primal Crystallised Lifeforce price data is unavailable?
- How does the system handle Essences that don't fit into any reroll group (should not occur, but needs handling)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display all available Essences with their current market values
- **FR-002**: System MUST calculate and display the expected value threshold that separates profitable from unprofitable rerolling
- **FR-003**: System MUST visually indicate which Essences are profitable to reroll (below threshold) and which are not (above threshold)
- **FR-004**: System MUST provide a List view that displays Essences in a detailed, comparable format similar to the Scarabs list view
- **FR-005**: System MUST calculate expected value based on equal weighting for all Essences within the same reroll group
- **FR-006**: System MUST group "Deafening Essence of ..." Essences together as a reroll group where each can reroll into any other Deafening Essence
- **FR-007**: System MUST group "Shrieking Essence of ..." Essences together as a reroll group where each can reroll into any other Shrieking Essence
- **FR-008**: System MUST group Essences of Horror, Hysteria, Insanity, and Delirium together as a special reroll group where they can only reroll into each other
- **FR-009**: System MUST ensure that Essences of Horror, Hysteria, Insanity, and Delirium cannot be created from rerolling any other Essence types
- **FR-010**: System MUST factor in the cost of 30 Primal Crystallised Lifeforce when calculating profitability
- **FR-011**: System MUST allow users to select individual Essences to mark them for rerolling
- **FR-012**: System MUST allow users to deselect Essences to mark them as kept (not for rerolling)
- **FR-013**: System MUST visually distinguish selected Essences from unselected ones
- **FR-014**: System MUST calculate expected outcomes based only on Essences selected for rerolling
- **FR-015**: System MUST handle cases where market value data is unavailable by clearly indicating missing data
- **FR-016**: System MUST handle cases where Primal Crystallised Lifeforce price data is unavailable
- **FR-017**: System MUST maintain consistent profitability indicators across all views
- **FR-018**: System MUST support sorting the list view by name, value, and profitability status

### Key Entities *(include if feature involves data)*

- **Essence**: Represents a game item with attributes: name, market value (currency), reroll group membership, expected value calculation result, profitability status (profitable/not profitable), selection state (selected for rerolling/kept)
- **Expected Value Threshold**: The calculated maximum input value that separates profitable from unprofitable rerolling decisions, derived from equal-weighted probabilities within reroll groups and outcome values, accounting for the cost of 30 Primal Crystallised Lifeforce
- **Reroll Group**: A collection of Essences that can reroll into each other. Types: Deafening group (all Deafening Essences), Shrieking group (all Shrieking Essences), Special group (Horror, Hysteria, Insanity, Delirium only)
- **Primal Crystallised Lifeforce**: The currency item required for rerolling, with a cost of 30 units per reroll operation
- **Market Value**: Current trading value of an Essence in the game's economy, used to determine if rerolling is profitable

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can identify which Essences are profitable to reroll within 10 seconds of viewing the page
- **SC-002**: Users can understand the economic threshold that separates profitable from unprofitable rerolling decisions without additional explanation
- **SC-003**: Users can select or deselect Essences for rerolling in under 2 seconds per Essence
- **SC-004**: Users can view and sort all Essences in the list view without requiring additional configuration
- **SC-005**: The page displays all available Essences with profitability indicators without requiring user input or configuration
- **SC-006**: Users can understand which Essences belong to which reroll group without confusion
- **SC-007**: The system correctly calculates expected value using equal weighting for all Essences within each reroll group
- **SC-008**: Users report increased confidence in making rerolling decisions after using the page (qualitative measure via user feedback)
