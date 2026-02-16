# Feature Specification: Temple Upgrade Display

**Feature Branch**: `003-temple-upgrade-display`  
**Created**: 2026-02-09  
**Status**: Draft  
**Input**: User description: "The User should be able to tell what uniques are worth upgrading in the Incrusion Temple. Update the Temple view to Display the different Combinations of Uniques + Vials + Incursion Temple (Chronicle_of_Atzoatl) = Upgraded Unique. Each Unique and Vial should be displayed with their corresponding Image and Name. A Mouseover on the items should display a Tooltip with the items Details."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Upgrade Combinations (Priority: P1)

Users need to see all available unique item upgrade combinations in the Incursion Temple to determine which upgrades are worth pursuing based on the required components and resulting upgraded unique.

**Why this priority**: This is the core functionality - without seeing the upgrade combinations, users cannot make informed decisions about which uniques to upgrade.

**Independent Test**: Can be fully tested by navigating to the Temple view and verifying that all upgrade combinations are displayed with their required components (unique item, vial, and temple room) and the resulting upgraded unique.

**Acceptance Scenarios**:

1. **Given** a user is viewing the Temple view, **When** the page loads, **Then** all available unique upgrade combinations are displayed showing the base unique item, required vial, required temple room, and resulting upgraded unique
2. **Given** upgrade combinations are displayed, **When** a user views a combination, **Then** each component (unique, vial, temple) shows its image and name
3. **Given** upgrade combinations are displayed, **When** a user views the resulting upgraded unique, **Then** it shows its image and name

---

### User Story 2 - View Item Details via Tooltips (Priority: P2)

Users need to see detailed information about each component (unique items, vials, and temple rooms) when hovering over them to understand what they're working with before committing to an upgrade.

**Why this priority**: Tooltips provide essential context about item properties, requirements, and values that help users make informed upgrade decisions.

**Independent Test**: Can be fully tested by hovering over any unique item, vial, or temple room image/name and verifying that a tooltip appears with the item's detailed information.

**Acceptance Scenarios**:

1. **Given** upgrade combinations are displayed, **When** a user hovers over a unique item image or name, **Then** a tooltip appears displaying the unique item's details (name, base type, modifiers, level requirement, etc.)
2. **Given** upgrade combinations are displayed, **When** a user hovers over a vial image or name, **Then** a tooltip appears displaying the vial's details (name, description, flavour text, etc.)
3. **Given** upgrade combinations are displayed, **When** a user hovers over a temple room image or name, **Then** a tooltip appears displaying the temple room's details (name, tier, base type, etc.)
4. **Given** a tooltip is displayed, **When** the user moves their mouse away from the item, **Then** the tooltip disappears

---

### Edge Cases

- What happens when a unique item has no upgrade path available?
- What happens when an item's image fails to load?
- What happens when tooltip data is missing or incomplete for an item?
- How does the system handle items with very long names or descriptions in tooltips?
- What happens when multiple upgrade combinations exist for the same base unique item?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display all available unique item upgrade combinations in the Temple view
- **FR-002**: System MUST show for each upgrade combination: the base unique item, required vial, required temple room (Chronicle of Atzoatl), and resulting upgraded unique
- **FR-003**: System MUST display an image for each unique item in upgrade combinations
- **FR-004**: System MUST display an image for each vial in upgrade combinations
- **FR-005**: System MUST display an image for each temple room in upgrade combinations
- **FR-006**: System MUST display the name of each unique item in upgrade combinations
- **FR-007**: System MUST display the name of each vial in upgrade combinations
- **FR-008**: System MUST display the name of each temple room in upgrade combinations
- **FR-009**: System MUST display a tooltip when a user hovers over a unique item image or name
- **FR-010**: System MUST display a tooltip when a user hovers over a vial image or name
- **FR-011**: System MUST display a tooltip when a user hovers over a temple room image or name
- **FR-012**: Tooltips for unique items MUST display item details including name, base type, modifiers, level requirement, and other relevant properties
- **FR-013**: Tooltips for vials MUST display vial details including name, description, flavour text, and other relevant properties
- **FR-014**: Tooltips for temple rooms MUST display temple room details including name, tier, base type, and other relevant properties
- **FR-015**: System MUST handle missing images gracefully (e.g., show placeholder or hide image element)
- **FR-016**: System MUST handle missing tooltip data gracefully (e.g., show available information or indicate data unavailable)

### Key Entities *(include if feature involves data)*

- **Upgrade Combination**: Represents a single upgrade path consisting of a base unique item, required vial, required temple room, and resulting upgraded unique
- **Unique Item**: A unique item that can be upgraded, with properties including name, base type, modifiers, level requirement, image, and upgrade requirements
- **Vial**: A vial required for upgrading unique items, with properties including name, description, flavour text, image, and details ID
- **Temple Room**: An Incursion Temple room (Chronicle of Atzoatl) required for upgrading unique items, with properties including name, tier, base type, image, and details ID
- **Upgraded Unique**: The resulting unique item after an upgrade, with properties including name, base type, modifiers, and image

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view all available unique upgrade combinations in the Temple view within 2 seconds of page load
- **SC-002**: 100% of displayed upgrade combinations show images and names for all required components (unique, vial, temple room) and the resulting upgraded unique
- **SC-003**: Tooltips appear within 500 milliseconds of hovering over any item (unique, vial, or temple room)
- **SC-004**: Tooltips display complete item details for 95% of items that have complete data available
- **SC-005**: Users can successfully identify which uniques are worth upgrading based on the displayed information without needing external resources

## Assumptions

- Upgrade combination data is available in the existing data files (uniques.json, vials.json, incursionTemples.json)
- The relationship between base uniques, vials, temple rooms, and upgraded uniques can be determined from the data (e.g., flavour text mentions upgrade requirements)
- Item images exist in the expected directory structure (e.g., `/assets/images/uniques/`, `/assets/images/vials/`)
- The Temple view is a new or existing view in the application that can be accessed by users
- Tooltip functionality can reuse existing tooltip infrastructure in the application
- Users understand that upgrading requires all three components (unique + vial + temple room) to be combined
