# Tasks: Additional Item Price Data

**Input**: Design documents from `/specs/001-additional-item-prices/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Tests are included based on quickstart.md examples and plan.md testing strategy.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths shown below use existing project structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization - minimal setup needed as this extends existing project

- [x] T001 Verify all fallback price files exist in `public/data/` directory
- [x] T002 [P] Review existing service patterns in `src/js/services/dataService.js` and `src/js/services/priceUpdateService.js`

**Checkpoint**: Project structure verified, ready for foundational work

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Define ITEM_TYPES configuration array in `src/js/services/leagueService.js` with all 10 additional item types (catalyst, deliriumOrb, emblem, essence, fossil, lifeforce, oil, tattoo, templeUnique, vial)
- [x] T004 [US1] [US2] Add `getPriceFileName(itemType)` function to `src/js/services/leagueService.js` for generating item-type-specific file names
- [x] T005 [US1] [US2] Add `getPriceFileLocalPath(itemType)` function to `src/js/services/leagueService.js` for generating local fallback paths

**Checkpoint**: Foundation ready - item type configuration and file name helpers available for both user stories

---

## Phase 3: User Story 1 - Access Current Prices for Additional Item Types (Priority: P1) 🎯 MVP

**Goal**: Enable users to access price data for all 10 additional item types (Catalysts, Delirium Orbs, Emblems, Essences, Fossils, Lifeforce, Oils, Tattoos, Temple Uniques, and Vials) when the application loads, with graceful error handling for missing data.

**Independent Test**: Verify price data for all additional item types is loaded and accessible when application starts. Test that missing data for one item type doesn't prevent others from loading. Test league switching refreshes all item type prices.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T006 [P] [US1] Unit test for `loadItemTypePrices(itemType)` in `tests/unit/services/dataService.test.js`
- [x] T007 [P] [US1] Unit test for `loadAllItemTypePrices(itemTypes)` in `tests/unit/services/dataService.test.js`
- [x] T008 [P] [US1] Integration test for loading all 10 additional item types within 5 seconds in `tests/integration/dataService.test.js`
- [x] T009 [P] [US1] Integration test for graceful degradation when some item types fail in `tests/integration/dataService.test.js`
- [x] T010 [P] [US1] Integration test for league switching updates all item type prices in `tests/integration/dataService.test.js`

### Implementation for User Story 1

- [x] T011 [US1] Implement `loadItemTypePrices(itemType)` function in `src/js/services/dataService.js` using `getPriceFileName()` and `getPriceFileLocalPath()` helpers
- [x] T012 [US1] Implement `loadAllItemTypePrices(itemTypes)` function in `src/js/services/dataService.js` using `Promise.allSettled()` for parallel loading with error isolation
- [x] T013 [US1] Add error handling in `loadAllItemTypePrices()` to log individual failures without blocking other item types in `src/js/services/dataService.js`
- [x] T014 [US1] Update `init()` function in `src/main.js` to load additional item type prices after Scarab data loads
- [x] T015 [US1] Store loaded additional item type prices in application state (window.priceData or similar) in `src/main.js`
- [x] T016 [US1] Add league change handler to refresh all additional item type prices when league switches in `src/main.js`
- [x] T017 [US1] Add console logging for successful loads and errors per item type in `src/js/services/dataService.js`

**Checkpoint**: At this point, User Story 1 should be fully functional - all 10 additional item types load on page load, handle errors gracefully, and refresh on league change. Test independently.

---

## Phase 4: User Story 2 - Automatic Price Updates for Additional Item Types (Priority: P2)

**Goal**: Automatically refresh price data for all additional item types at the same intervals as Scarab prices, ensuring prices remain current without user intervention.

**Independent Test**: Verify that price data for all additional item types is refreshed automatically at the same intervals as Scarab prices. Test manual refresh updates all item types simultaneously. Test cache expiration triggers updates for all item types.

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T018 [P] [US2] Unit test for `checkAndUpdateAllPrices()` in `tests/unit/services/priceUpdateService.test.js`
- [x] T019 [P] [US2] Unit test for `forceRefreshAllPrices()` in `tests/unit/services/priceUpdateService.test.js`
- [x] T020 [P] [US2] Integration test for automatic updates refreshing all item types simultaneously in `tests/integration/dataService.test.js`
- [x] T021 [P] [US2] Integration test for cache expiration triggering updates in `tests/integration/dataService.test.js`
- [x] T022 [P] [US2] Integration test for manual refresh updating all item types in `tests/integration/dataService.test.js`

### Implementation for User Story 2

- [x] T023 [US2] Add `refreshItemTypePrices(itemType)` function to `src/js/services/dataService.js` for forcing refresh of a single item type
- [x] T024 [US2] Implement `checkAndUpdateAllPrices()` method in `src/js/services/priceUpdateService.js` to check cache and update all active item types in parallel
- [x] T025 [US2] Update `checkAndUpdatePrices()` method in `src/js/services/priceUpdateService.js` to call `checkAndUpdateAllPrices()` instead of single Scarab update
- [x] T026 [US2] Implement `forceRefreshAllPrices()` method in `src/js/services/priceUpdateService.js` to force immediate refresh of all item types
- [x] T027 [US2] Update `forceRefresh()` method in `src/js/services/priceUpdateService.js` to call `forceRefreshAllPrices()` for all item types
- [x] T028 [US2] Modify `setOnPriceUpdate()` callback signature in `src/js/services/priceUpdateService.js` to accept itemType parameter (or create new callback pattern)
- [x] T029 [US2] Update price update callback in `src/main.js` to handle updates for all item types (not just Scarabs)
- [x] T030 [US2] Add error handling in `checkAndUpdateAllPrices()` to log individual update failures without blocking others in `src/js/services/priceUpdateService.js`
- [x] T031 [US2] Add console logging for update results per item type in `src/js/services/priceUpdateService.js`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - prices load on page load and automatically refresh at intervals. Test independently.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories, error handling, and validation

- [x] T032 [P] Add comprehensive error handling for network failures, malformed JSON, and missing files across all item types
- [x] T033 [P] Add validation for price data structure (name, chaosValue, divineValue, detailsId) in `src/js/services/dataService.js`
- [x] T034 [P] Add performance monitoring/logging for load times to verify 5-second requirement (SC-001) in `src/js/services/dataService.js`
- [x] T035 [P] Verify graceful degradation works correctly - at least 8 of 10 item types load even with failures (SC-003)
- [x] T036 [P] Add unit tests for error scenarios (missing files, network errors, malformed JSON) in `tests/unit/services/dataService.test.js`
- [x] T037 [P] Add integration tests for edge cases (rapid league switching, concurrent updates) in `tests/integration/dataService.test.js`
- [x] T038 [P] Update documentation comments in all modified service files
- [x] T039 [P] Run quickstart.md validation - verify all implementation steps from quickstart.md are complete
- [x] T040 [P] Code review and cleanup - ensure consistent error messages and logging patterns

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion
- **User Story 2 (Phase 4)**: Depends on Foundational phase completion, can start after US1 or in parallel
- **Polish (Phase 5)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Extends US1 functionality but can be independently tested

### Within Each User Story

- Tests (T006-T010 for US1, T018-T022 for US2) MUST be written and FAIL before implementation
- Foundational helpers (T004-T005) before service functions (T011-T012)
- Service functions before main.js integration (T014-T016)
- Core implementation before error handling and logging
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1**: T002 can run in parallel with T001
- **Phase 2**: T004 and T005 can run in parallel (different functions, same file but no conflicts)
- **Phase 3 (US1 Tests)**: T006, T007, T008, T009, T010 can all run in parallel (different test files/functions)
- **Phase 3 (US1 Implementation)**: T011 and T012 are sequential (T012 depends on T011), but T017 can run in parallel with T013-T016
- **Phase 4 (US2 Tests)**: T018, T019, T020, T021, T022 can all run in parallel
- **Phase 4 (US2 Implementation)**: T023-T031 have some dependencies but T030 and T031 can run in parallel
- **Phase 5**: All tasks T032-T040 can run in parallel (different concerns)
- **Cross-Phase**: US2 can start after Foundational completes, even if US1 is still in progress (different files)

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task T006: "Unit test for loadItemTypePrices(itemType) in tests/unit/services/dataService.test.js"
Task T007: "Unit test for loadAllItemTypePrices(itemTypes) in tests/unit/services/dataService.test.js"
Task T008: "Integration test for loading all 10 additional item types within 5 seconds in tests/integration/dataService.test.js"
Task T009: "Integration test for graceful degradation when some item types fail in tests/integration/dataService.test.js"
Task T010: "Integration test for league switching updates all item type prices in tests/integration/dataService.test.js"

# After tests are written, launch foundational implementation:
Task T011: "Implement loadItemTypePrices(itemType) function in src/js/services/dataService.js"
Task T012: "Implement loadAllItemTypePrices(itemTypes) function in src/js/services/dataService.js"
```

---

## Parallel Example: User Story 2

```bash
# Launch all tests for User Story 2 together:
Task T018: "Unit test for checkAndUpdateAllPrices() in tests/unit/services/priceUpdateService.test.js"
Task T019: "Unit test for forceRefreshAllPrices() in tests/unit/services/priceUpdateService.test.js"
Task T020: "Integration test for automatic updates refreshing all item types simultaneously in tests/integration/dataService.test.js"
Task T021: "Integration test for cache expiration triggering updates in tests/integration/dataService.test.js"
Task T022: "Integration test for manual refresh updating all item types in tests/integration/dataService.test.js"

# After tests, implementation can proceed with some parallelization:
Task T023: "Add refreshItemTypePrices(itemType) function in src/js/services/dataService.js"
Task T024: "Implement checkAndUpdateAllPrices() method in src/js/services/priceUpdateService.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (verify files exist)
2. Complete Phase 2: Foundational (item type config and helpers)
3. Complete Phase 3: User Story 1 (load prices on page load)
4. **STOP and VALIDATE**: Test User Story 1 independently
   - Verify all 10 item types load on page load
   - Verify graceful degradation (some failures don't block others)
   - Verify league switching works
   - Verify 5-second load time requirement
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
   - Users can now access prices for all item types
3. Add User Story 2 → Test independently → Deploy/Demo
   - Prices now auto-update at intervals
4. Add Polish phase → Final validation → Deploy
   - Error handling, performance, edge cases

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (dataService.js, main.js integration)
   - Developer B: User Story 2 (priceUpdateService.js extensions)
3. Stories complete and integrate independently
4. Both developers: Polish phase (tests, error handling)

---

## Task Summary

- **Total Tasks**: 40
- **Phase 1 (Setup)**: 2 tasks
- **Phase 2 (Foundational)**: 3 tasks
- **Phase 3 (User Story 1)**: 12 tasks (5 tests + 7 implementation)
- **Phase 4 (User Story 2)**: 14 tasks (5 tests + 9 implementation)
- **Phase 5 (Polish)**: 9 tasks

### Task Count per User Story

- **User Story 1**: 12 tasks (5 tests, 7 implementation)
- **User Story 2**: 14 tasks (5 tests, 9 implementation)

### Parallel Opportunities Identified

- **High Parallelism**: Test phases (10 test tasks can run in parallel)
- **Medium Parallelism**: Foundational phase (2 functions in same file but independent)
- **Low Parallelism**: Implementation phases (some dependencies, but error handling/logging can parallelize)

### Independent Test Criteria

- **User Story 1**: Can test by loading application and verifying all 10 item type prices are available. Test graceful degradation by simulating failures. Test league switching updates prices.
- **User Story 2**: Can test by waiting for update interval and verifying all item types refresh. Test manual refresh updates all types. Test cache expiration triggers updates.

### Suggested MVP Scope

**MVP = User Story 1 Only** (Phase 1 + Phase 2 + Phase 3)
- Provides core value: users can access prices for all item types
- 17 tasks total (2 setup + 3 foundational + 12 US1)
- Can be delivered and validated independently
- User Story 2 adds automatic updates but is not required for initial value

---

## Notes

- [P] tasks = different files, no dependencies
- [US1] or [US2] labels map tasks to specific user stories for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All fallback price files already exist in `public/data/` - no file creation needed
- Reuse existing `dataFetcher.js` - no changes needed
- Extend existing services rather than creating new ones
