# Feature Specification: Additional Item Price Data

**Feature Branch**: `001-additional-item-prices`  
**Created**: 2025-01-27  
**Status**: Draft  
**Input**: User description: "Similar to the prices of the Scarabs, the user also wants to access up-to-date prices for Catalysts, delirium Orbs, Emblems, Essences, Fossils, Lifeforce, Oils, Tattoos, temple Uniques and Vials. The existing logic that updates the Scarab prices on page load and in regular intervals should also fetch the prices for the other items."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Access Current Prices for Additional Item Types (Priority: P1)

A Path of Exile player wants to access current market prices for Catalysts, Delirium Orbs, Emblems, Essences, Fossils, Lifeforce, Oils, Tattoos, Temple Uniques, and Vials when they open the application. The player expects these prices to be available immediately upon page load, just like Scarab prices are currently available.

**Why this priority**: This is the core value proposition - enabling players to access price data for all supported item types. Without this, players cannot view prices for the additional items, which defeats the purpose of the feature.

**Independent Test**: Can be fully tested by ensuring price data for all additional item types is loaded and accessible when the application starts. Delivers immediate value by providing comprehensive price information for all supported items.

**Acceptance Scenarios**:

1. **Given** the application loads, **When** a user opens the page, **Then** price data for Catalysts, Delirium Orbs, Emblems, Essences, Fossils, Lifeforce, Oils, Tattoos, Temple Uniques, and Vials is available
2. **Given** price data files exist for the selected league, **When** the application initializes, **Then** prices for all additional item types are fetched and loaded successfully
3. **Given** price data is unavailable for a specific item type, **When** the application loads, **Then** the system handles the missing data gracefully without preventing other item types from loading
4. **Given** the user switches leagues, **When** the league changes, **Then** price data for all additional item types is refreshed for the new league

---

### User Story 2 - Automatic Price Updates for Additional Item Types (Priority: P2)

A player wants to ensure they always have the most current market prices for all item types, including the additional items. The player expects the system to automatically refresh prices for Catalysts, Delirium Orbs, Emblems, Essences, Fossils, Lifeforce, Oils, Tattoos, Temple Uniques, and Vials at the same intervals as Scarab prices are updated.

**Why this priority**: Keeping price data current is essential for making informed trading decisions. Automatic updates ensure users don't need to manually refresh to get the latest prices. This is valuable but secondary to the core functionality of accessing the data.

**Independent Test**: Can be fully tested by verifying that price data for all additional item types is refreshed automatically at the same intervals as Scarab prices. Delivers value by ensuring price data remains current without user intervention.

**Acceptance Scenarios**:

1. **Given** the application is running, **When** the automatic update interval elapses, **Then** prices for all additional item types are checked and updated if new data is available
2. **Given** price data for additional items is cached, **When** the cache expires, **Then** fresh price data is fetched for all additional item types
3. **Given** a user manually triggers a price refresh, **When** the refresh completes, **Then** prices for all additional item types are updated along with Scarab prices
4. **Given** price updates occur, **When** new data is available, **Then** all additional item types receive updated prices simultaneously

---

### Edge Cases

- What happens when price data is unavailable for one or more additional item types (network errors, missing files)?
- How does the system handle partial price data availability (some item types have prices, others don't)?
- What happens when price data files exist but are empty or malformed?
- How does the system handle league-specific price data when a league doesn't have price files for all item types?
- What happens when the automatic update process fails for some item types but succeeds for others?
- How does the system handle rapid league switching while price updates are in progress?
- What happens when cache expiration times differ between item types?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST fetch and load price data for Catalysts on page load
- **FR-002**: System MUST fetch and load price data for Delirium Orbs on page load
- **FR-003**: System MUST fetch and load price data for Emblems on page load
- **FR-004**: System MUST fetch and load price data for Essences on page load
- **FR-005**: System MUST fetch and load price data for Fossils on page load
- **FR-006**: System MUST fetch and load price data for Lifeforce on page load
- **FR-007**: System MUST fetch and load price data for Oils on page load
- **FR-008**: System MUST fetch and load price data for Tattoos on page load
- **FR-009**: System MUST fetch and load price data for Temple Uniques on page load
- **FR-010**: System MUST fetch and load price data for Vials on page load
- **FR-011**: System MUST automatically refresh price data for all additional item types at the same intervals as Scarab prices
- **FR-012**: System MUST handle missing price data for individual item types without preventing other item types from loading
- **FR-013**: System MUST refresh price data for all additional item types when the selected league changes
- **FR-014**: System MUST support league-specific price data files for all additional item types
- **FR-015**: System MUST handle errors gracefully when fetching price data for additional item types fails
- **FR-016**: System MUST cache price data for all additional item types using the same caching strategy as Scarab prices
- **FR-017**: System MUST allow manual refresh of price data for all additional item types

### Key Entities *(include if feature involves data)*

- **Item Price Data**: Represents current market prices for game items, including attributes: item identifier, chaos value, divine value, league association, last update timestamp
- **Price Update Schedule**: Represents the timing and frequency of automatic price refreshes, shared across all item types including Scarabs and additional items
- **League-Specific Price Data**: Represents price information that varies by game league, requiring separate data files for each league and item type combination

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Price data for all 10 additional item types (Catalysts, Delirium Orbs, Emblems, Essences, Fossils, Lifeforce, Oils, Tattoos, Temple Uniques, Vials) is available within 5 seconds of page load
- **SC-002**: Automatic price updates refresh all additional item types simultaneously with Scarab prices, maintaining consistency across all item types
- **SC-003**: System successfully loads price data for at least 8 out of 10 additional item types even when some data sources are unavailable
- **SC-004**: Price data refresh for all additional item types completes within the same time window as Scarab price refreshes (no significant performance degradation)
- **SC-005**: Users can access current prices for all additional item types without manual intervention or configuration
- **SC-006**: League switching updates price data for all additional item types within 3 seconds of league selection

## Assumptions

- Price data files for additional item types follow the same naming convention and structure as Scarab price files (e.g., `catalystPrices_Keepers.json`, `deliriumOrbPrices_Keepers.json`)
- Price data for additional item types is available from the same remote data source as Scarab prices
- All additional item types use the same price update interval as Scarabs (1 hour default)
- Price data structure for additional items is consistent with Scarab price data structure (containing chaosValue, divineValue, and detailsId fields)
- League-specific price files exist for all supported leagues for each additional item type
- Users expect the same level of reliability and performance for additional item type prices as they currently experience with Scarab prices
