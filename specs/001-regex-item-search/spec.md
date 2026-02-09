# Feature Specification: Regex Search for Selected Flip/Reroll Items

**Feature Branch**: `001-regex-item-search`  
**Created**: 2025-02-09  
**Status**: Draft  
**Input**: User description: "The User Wants a way to quickly search for the items they should Flip/reroll ingame. The Game provides a search functionality that supports regular Expressions. Create a feature that lets the user create a regular expression to exactly match the items they have selected. The RegEx has a hard Limit of 250 Characters. For Each item Category, the List of possible Names is known in advance, so approaches like Trie-based-Regex, DFA minimazation or usage of controlled overmatching+exclusions can be employed. The Item names could be reduced to a unique combination of a few letters, to match them, if the desired item name contains such a combination. All the relevant item names per category can be found in their corresponding json files in public/data/items. The user can select/unselect items by clicking their list Entry or their cell in the gridviews When the user selects an item, there should be a visual indication on both the Cell and the Listview Entry."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Select Items and Get Exact-Match Regex (Priority: P1)

A player wants to quickly find the items they intend to flip or reroll when using the in-game search. They select the relevant items in the application (via list or grid). The system produces a regular expression that exactly matches only those selected item names, so they can paste it into the game search and see only the chosen items.

**Why this priority**: This is the core value—enabling the player to go from "I want these items" to "a regex I can use in-game" without manual regex writing and within the game's 250-character limit.

**Independent Test**: Can be fully tested by selecting a set of items, obtaining the generated regex, and verifying (against the known item names for that category) that the regex matches exactly the selected items and no others. Delivers immediate value by reducing time to set up in-game search.

**Acceptance Scenarios**:

1. **Given** the user has selected one or more items in the current category, **When** they request the search regex, **Then** the system provides a regular expression that matches exactly the selected item names and no other names in that category
2. **Given** the user has selected items, **When** the regex is generated, **Then** the regex length does not exceed 250 characters
3. **Given** the user is viewing a category with known item names (from the category's data source), **When** they select items and get the regex, **Then** the regex is valid for use in the game's search (syntax and behavior compatible with the game's regex support)
4. **Given** the user changes selection (adds or removes items), **When** they request the regex again, **Then** the regex is updated to exactly match the new selection

---

### User Story 2 - Select and Unselect Items with Clear Visual Feedback (Priority: P2)

A player wants to choose which items to include in their flip/reroll search by clicking on list entries or grid cells. They expect the same item to show as selected in both the list and the grid, and to see a clear visual indication so they know exactly what is selected.

**Why this priority**: Reliable selection and consistent feedback across list and grid are required for the regex feature to be trustworthy and easy to use.

**Independent Test**: Can be fully tested by clicking list entries and grid cells and verifying that selection state is reflected in both views and that a visible indicator (e.g., highlight or icon) appears for selected items in both places.

**Acceptance Scenarios**:

1. **Given** the user is viewing the list and grid for a category, **When** they click a list entry for an item, **Then** that item is selected and both the list entry and the corresponding grid cell show a clear visual indication of selection
2. **Given** an item is selected, **When** the user clicks its list entry or grid cell again, **Then** the item is unselected and the visual indication is removed from both the list entry and the grid cell
3. **Given** the user clicks a grid cell for an item, **When** the click is registered, **Then** that item is selected and both the grid cell and the corresponding list entry show the same visual indication
4. **Given** multiple items are selected, **When** the user views the list and grid, **Then** every selected item shows the selection indicator in both its list entry and its grid cell

---

### User Story 3 - Regex Fits 250-Character Limit Using Known Item Names (Priority: P3)

When many items are selected, a naive regex (e.g., long alternation) might exceed the game's 250-character limit. The system uses the known list of item names per category to produce a regex that stays within 250 characters while still exactly matching the selected items (e.g., via shortened unique substrings, trie-based regex, or other compact representation).

**Why this priority**: Ensures the feature remains usable for large selections; without it, users would hit the limit and get no usable regex.

**Independent Test**: Can be fully tested by selecting a large set of items whose naive regex would exceed 250 characters, then verifying the generated regex is at most 250 characters and still exactly matches only the selected items for that category.

**Acceptance Scenarios**:

1. **Given** the selected set would produce a regex longer than 250 characters if expressed as a simple alternation, **When** the user requests the regex, **Then** the system produces a regex of at most 250 characters that exactly matches the selected items
2. **Given** item names in a category are known in advance, **When** generating the regex, **Then** the system may use shortened unique letter combinations or other compact representations so the regex fits the limit while preserving exact match
3. **Given** the generated regex is used against the full category name list, **When** evaluated, **Then** it matches only the selected items and no unselected items (no false positives or false negatives)

---

### Edge Cases

- What happens when no items are selected? (e.g., show empty regex, disabled control, or message that at least one item must be selected)
- What happens when all items in the category are selected? (regex should match all; may be a single short pattern or "match all" equivalent within 250 chars)
- What happens when exactly one item is selected? (regex should match only that item's name or a unique substring)
- How does the system behave when the category has very many items and the user selects most of them? (must still stay within 250 characters and exact match)
- How does selection behave when the same item appears in both list and grid? (one selection state, two visual indicators)
- What happens if item name data for a category is missing or empty? (no regex generated or clear messaging)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow the user to select and unselect items by clicking the item's list entry or its cell in the grid view
- **FR-002**: System MUST keep selection state in sync so that selecting or unselecting in the list updates the grid, and selecting or unselecting in the grid updates the list
- **FR-003**: System MUST show a clear visual indication of selection on both the list entry and the grid cell for each selected item
- **FR-004**: System MUST generate a regular expression that exactly matches the set of currently selected item names for the current category (no false positives or false negatives against the known names for that category)
- **FR-005**: Generated regex MUST NOT exceed 250 characters (game-imposed limit)
- **FR-006**: System MUST use the known list of item names per category when generating the regex (source: item data for that category, e.g. from the corresponding data files under public/data/items)
- **FR-007**: When a simple alternation of selected names would exceed 250 characters, system MUST produce a valid regex of at most 250 characters that still exactly matches the selected items (e.g. using shortened unique substrings, trie-based regex, or other compact representation)
- **FR-008**: System MUST make the generated regex available to the user (e.g. display and copy) so it can be used in the game's search
- **FR-009**: System MUST scope regex generation to the current item category so that only names from that category's known set are considered

### Key Entities *(include if feature involves data)*

- **Item**: Represents a game item in a category; has a display name (and possibly an identifier) used for matching; can be selected or unselected
- **Item category**: A grouping of items (e.g. Scarabs, Vials, Catalysts) with a known list of item names provided by the category's data source
- **Selection**: The set of items currently selected by the user for the active category; shared between list view and grid view
- **Search regex**: A regular expression string (max 250 characters) that exactly matches the selected item names for the current category and is suitable for the game's search

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: User can select items via list or grid and see selection reflected in both views with a visible indicator on list entry and grid cell
- **SC-002**: Generated regex matches exactly the selected items when evaluated against the known item names for that category (no extra matches, no missed selected items)
- **SC-003**: Generated regex is always 250 characters or fewer
- **SC-004**: User can complete "select items and obtain copyable regex" in under one minute for typical selections (workflow efficiency)
- **SC-005**: For any selection size within a category, the system either produces a valid regex within the limit or clearly communicates when it cannot (e.g. no selection)

## Assumptions

- The game's search accepts regular expressions and enforces a 250-character maximum; the generated regex will be used by pasting into that search
- Item names per category are defined in the application's item data (e.g. JSON files under public/data/items); structure may vary by file (e.g. array of objects with "name" or "baseType") but each category has a well-defined set of names
- "Exactly match" means: when the regex is run against each known item name in the category, it matches if and only if that item is in the current selection
- List view and grid view both display the same set of items for a category; one item has one list entry and one grid cell
- Selection is per-session or per-view state; persistence of selection across sessions is out of scope unless stated otherwise
- Visual indication of selection can be any clear, consistent treatment (e.g. background highlight, border, icon) that is visible in both list and grid
