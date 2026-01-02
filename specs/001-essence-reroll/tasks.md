# Tasks: Essence Rerolling

**Input**: Design documents from `/specs/001-essence-reroll/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are included as they are mentioned in the plan.md testing strategy. Marked as optional - can be implemented alongside or after core functionality.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths shown below assume single project structure per plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create Essence model file structure in `src/js/models/essence.js`
- [x] T002 Create Essence calculation service file structure in `src/js/services/essenceCalculationService.js`
- [x] T003 Create Essence list view file structure in `src/js/views/essenceListView.js`
- [x] T004 [P] Create Essence group utilities file structure in `src/js/utils/essenceGroupUtils.js`
- [x] T005 [P] Create Essence selection panel component file structure in `src/js/components/essenceSelectionPanel.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 [P] Implement reroll group classification utility in `src/js/utils/essenceGroupUtils.js` with classifyRerollGroup function
- [x] T007 [P] Extend dataService to load Essence prices in `src/js/services/dataService.js` (add loadAndMergeEssenceData function)
- [x] T008 [P] Extend dataService to load Primal Crystallised Lifeforce price in `src/js/services/dataService.js` (add getPrimalLifeforcePrice function)
- [x] T009 Create Essence model class in `src/js/models/essence.js` with validation, price checks, and reroll group assignment
- [x] T010 Create RerollGroup model/utility in `src/js/utils/essenceGroupUtils.js` for grouping Essences by reroll type

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Essence Profitability Analysis (Priority: P1) 🎯 MVP

**Goal**: Display all Essences with profitability indicators and calculated thresholds. Users can immediately see which Essences are profitable to reroll.

**Independent Test**: Can be fully tested by displaying all Essences with profitability indicators and the calculated threshold value. Delivers immediate value by showing which Essences are safe to reroll.

### Tests for User Story 1 (OPTIONAL - can be implemented alongside)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T011 [P] [US1] Unit test for Essence model validation in `tests/unit/models/essence.test.js`
- [ ] T012 [P] [US1] Unit test for reroll group classification in `tests/unit/utils/essenceGroupUtils.test.js`
- [ ] T013 [P] [US1] Unit test for equal-weighted expected value calculation in `tests/unit/services/essenceCalculationService.test.js`
- [ ] T014 [P] [US1] Integration test for Essence data loading in `tests/integration/dataService.test.js` (extend existing)

### Implementation for User Story 1

- [x] T015 [US1] Implement equal-weighted expected value calculation in `src/js/services/essenceCalculationService.js` (calculateExpectedValueForGroup function)
- [x] T016 [US1] Implement threshold calculation per reroll group in `src/js/services/essenceCalculationService.js` (calculateThresholdForGroup function, accounts for 30 Primal Crystallised Lifeforce cost)
- [x] T017 [US1] Implement profitability status calculation in `src/js/services/essenceCalculationService.js` (calculateProfitabilityStatus function)
- [x] T018 [US1] Extend main.js to load Essence data on initialization in `src/main.js` (add Essence loading after Scarab loading)
- [x] T019 [US1] Extend main.js to calculate Essence thresholds and profitability in `src/main.js` (call calculation service after data load)
- [x] T020 [US1] Create basic Essence list view renderer in `src/js/views/essenceListView.js` (renderEssenceList function with name, value, profitability status)
- [x] T021 [US1] Add profitability visual indicators to Essence list view in `src/js/views/essenceListView.js` (reuse colorUtils for color coding)
- [x] T022 [US1] Add threshold display component for each reroll group in `src/js/components/thresholdDisplay.js` (extend existing or create Essence-specific)
- [x] T023 [US1] Add reroll cost display (30 Primal Crystallised Lifeforce) in `src/js/views/essenceListView.js` or `src/js/components/thresholdDisplay.js`
- [x] T024 [US1] Integrate Essence list view into main application in `src/main.js` (add Essence view container and initialization)
- [x] T025 [US1] Add error handling for missing Essence price data in `src/js/services/dataService.js` and `src/js/views/essenceListView.js`
- [x] T026 [US1] Add error handling for missing Primal Crystallised Lifeforce price in `src/js/services/essenceCalculationService.js`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Users can view all Essences with profitability indicators and thresholds.

---

## Phase 4: User Story 2 - Select Essences to Reroll or Keep (Priority: P2)

**Goal**: Users can select individual Essences to mark them for rerolling or keeping, allowing personalized rerolling strategy.

**Independent Test**: Can be fully tested by implementing selection functionality that allows users to mark Essences for rerolling or keeping. Delivers value by giving players control over their rerolling strategy.

### Tests for User Story 2 (OPTIONAL - can be implemented alongside)

- [ ] T027 [P] [US2] Unit test for Essence selection state management in `tests/unit/models/essence.test.js` (extend existing)
- [ ] T028 [P] [US2] Integration test for selection toggle functionality in `tests/integration/views/essenceListView.test.js`

### Implementation for User Story 2

- [x] T029 [US2] Add selectedForReroll property to Essence model in `src/js/models/essence.js` (add toggleSelection method)
- [x] T030 [US2] Implement selection state persistence in LocalStorage in `src/js/services/dataService.js` (extend savePreferences/loadPreferences for selectedEssenceIds)
- [x] T031 [US2] Add click handler for Essence selection toggle in `src/js/views/essenceListView.js` (toggleSelectionOnClick function)
- [x] T032 [US2] Add visual indicators for selected Essences in `src/js/views/essenceListView.js` (background color, border, icon styling)
- [x] T033 [US2] Update Essence list view to restore selection state from LocalStorage in `src/js/views/essenceListView.js` (loadSelectionState function)
- [x] T034 [US2] Implement selection-based expected outcome calculation in `src/js/services/essenceCalculationService.js` (calculateExpectedOutcomeForSelected function)
- [x] T035 [US2] Add selection panel component for bulk operations in `src/js/components/essenceSelectionPanel.js` (select all, deselect all, filter by group)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Users can view Essences with profitability indicators and select which ones to reroll.

---

## Phase 5: User Story 3 - View Essences in List Format (Priority: P2)

**Goal**: Users can view Essences in a detailed, sortable list format similar to Scarabs list view with all relevant information.

**Independent Test**: Can be fully tested by implementing a list view that displays Essences with all relevant information in a sortable format. Delivers value by providing detailed comparison and analysis capabilities.

### Tests for User Story 3 (OPTIONAL - can be implemented alongside)

- [ ] T036 [P] [US3] Integration test for list view sorting functionality in `tests/integration/views/essenceListView.test.js`
- [ ] T037 [P] [US3] Integration test for list view currency switching in `tests/integration/views/essenceListView.test.js`

### Implementation for User Story 3

- [x] T038 [US3] Add sortable column headers to Essence list view in `src/js/views/essenceListView.js` (name, value, profitability status, reroll group)
- [x] T039 [US3] Implement sorting by name in `src/js/views/essenceListView.js` (sortByName function)
- [x] T040 [US3] Implement sorting by value (chaos/divine) in `src/js/views/essenceListView.js` (sortByValue function)
- [x] T041 [US3] Implement sorting by profitability status in `src/js/views/essenceListView.js` (sortByProfitability function)
- [x] T042 [US3] Add currency preference support (chaos/divine) to Essence list view in `src/js/views/essenceListView.js` (reuse existing currency preference system)
- [x] T043 [US3] Add reroll group indicator column to Essence list view in `src/js/views/essenceListView.js` (display group type: deafening, shrieking, special)
- [x] T044 [US3] Style Essence list view to match Scarab list view in `src/styles/main.css` (consistent styling, spacing, colors)
- [x] T045 [US3] Add loading state for Essence list view in `src/js/views/essenceListView.js` (showLoadingState function)
- [x] T046 [US3] Add empty state handling for Essence list view in `src/js/views/essenceListView.js` (handleEmptyState function)

**Checkpoint**: All user stories should now be independently functional. Users can view Essences in a sortable list, see profitability indicators, and select which ones to reroll.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T047 [P] Add comprehensive error handling and user-friendly error messages across all Essence components
- [ ] T048 [P] Optimize Essence list view rendering performance for ~400 items in `src/js/views/essenceListView.js`
- [ ] T049 [P] Add accessibility improvements (ARIA labels, keyboard navigation) to Essence list view
- [ ] T050 [P] Add unit test coverage for edge cases (missing prices, invalid groups, etc.) in `tests/unit/`
- [ ] T051 [P] Add integration tests for full user journeys in `tests/integration/`
- [ ] T052 [P] Update documentation in README.md or feature docs with Essence rerolling usage
- [ ] T053 [P] Code cleanup and refactoring (remove console.logs, optimize imports)
- [ ] T054 [P] Run quickstart.md validation scenarios to verify all acceptance criteria
- [ ] T055 [P] Add navigation/routing to switch between Scarab and Essence views (if multi-page architecture)
- [ ] T056 [P] Performance testing and optimization (ensure <2s load, <100ms interactions, <50ms calculations)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 for list view display (selection builds on existing view)
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 for basic list view (sorting extends existing view)

### Within Each User Story

- Tests (if included) SHOULD be written and FAIL before implementation (TDD approach)
- Models before services
- Services before views
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T004, T005)
- All Foundational tasks marked [P] can run in parallel (T006, T007, T008, T010)
- Once Foundational phase completes, User Story 1 can start
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- User Stories 2 and 3 can be worked on in parallel after US1 is complete (they extend US1 functionality)

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test for Essence model validation in tests/unit/models/essence.test.js"
Task: "Unit test for reroll group classification in tests/unit/utils/essenceGroupUtils.test.js"
Task: "Unit test for equal-weighted expected value calculation in tests/unit/services/essenceCalculationService.test.js"
Task: "Integration test for Essence data loading in tests/integration/dataService.test.js"

# Launch foundational utilities together (Phase 2):
Task: "Implement reroll group classification utility in src/js/utils/essenceGroupUtils.js"
Task: "Extend dataService to load Essence prices in src/js/services/dataService.js"
Task: "Extend dataService to load Primal Crystallised Lifeforce price in src/js/services/dataService.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

**MVP Deliverable**: Users can view all Essences with profitability indicators and thresholds. Core value proposition delivered.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (Selection functionality)
4. Add User Story 3 → Test independently → Deploy/Demo (Full list view with sorting)
5. Add Polish phase → Final optimizations and testing
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (core profitability analysis)
   - Developer B: Prepares User Story 2 (selection functionality - can start after US1 basic view)
   - Developer C: Prepares User Story 3 (sorting functionality - can start after US1 basic view)
3. After US1 complete:
   - Developer A: Moves to Polish/optimization
   - Developer B: Completes User Story 2
   - Developer C: Completes User Story 3
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD approach recommended)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Reuse existing Scarab infrastructure where possible (dataService, colorUtils, etc.)
- Follow existing code patterns and naming conventions
- Ensure performance targets are met (<2s load, <100ms interactions, <50ms calculations)
- Handle edge cases gracefully (missing prices, invalid groups, etc.)
