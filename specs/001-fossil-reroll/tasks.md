# Tasks: Fossil Rerolling

**Input**: Design documents from `/specs/001-fossil-reroll/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are included per constitution requirements (80%+ coverage target for business logic).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., [US1], [US2], [US3])
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths shown below follow existing project structure

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Verify existing Vite project structure and dependencies in package.json
- [x] T002 [P] Review existing Essence implementation patterns in src/js/models/essence.js and src/js/services/essenceCalculationService.js
- [x] T003 [P] Review existing Essence list view in src/js/views/essenceListView.js for reuse patterns

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Extend dataService.js to load Fossil prices from fossilPrices_{league}.json in src/js/services/dataService.js
- [x] T005 [P] Create Fossil model class following Essence pattern in src/js/models/fossil.js
- [x] T006 [P] Create fossilGroupUtils.js with single reroll group classification in src/js/utils/fossilGroupUtils.js
- [x] T007 [P] Create fossilCalculationService.js with equal-weighted calculation functions in src/js/services/fossilCalculationService.js
- [x] T008 Extend dataService.js to load Wild Crystallised Lifeforce price from lifeforcePrices_{league}.json in src/js/services/dataService.js

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Fossil Profitability Analysis (Priority: P1) 🎯 MVP

**Goal**: Display all Fossils with profitability indicators and calculated threshold value. Users can immediately see which Fossils are profitable to reroll.

**Independent Test**: Can be fully tested by displaying all Fossils with profitability indicators and the calculated threshold value. Delivers immediate value by showing which Fossils are safe to reroll.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T009 [P] [US1] Unit test for Fossil model validation and price data checks in tests/unit/models/fossil.test.js
- [x] T010 [P] [US1] Unit test for equal-weighted expected value calculation in tests/unit/services/fossilCalculationService.test.js
- [x] T011 [P] [US1] Unit test for threshold calculation with Wild Crystallised Lifeforce cost in tests/unit/services/fossilCalculationService.test.js
- [x] T012 [P] [US1] Unit test for profitability status calculation in tests/unit/services/fossilCalculationService.test.js
- [x] T013 [P] [US1] Integration test for Fossil data loading and processing in tests/integration/dataService.test.js

### Implementation for User Story 1

- [x] T014 [US1] Implement Fossil model constructor with id, name, price data, and reroll group assignment in src/js/models/fossil.js
- [x] T015 [US1] Implement Fossil model validation method in src/js/models/fossil.js
- [x] T016 [US1] Implement Fossil model hasPriceData() method in src/js/models/fossil.js
- [x] T017 [US1] Implement classifyRerollGroup() function returning 'fossil' for all Fossils in src/js/utils/fossilGroupUtils.js
- [x] T018 [US1] Implement calculateExpectedValueForGroup() with equal weighting in src/js/services/fossilCalculationService.js
- [x] T019 [US1] Implement calculateThresholdForGroup() accounting for 30 Wild Crystallised Lifeforce cost in src/js/services/fossilCalculationService.js
- [x] T020 [US1] Implement calculateProfitabilityStatus() for individual Fossils in src/js/services/fossilCalculationService.js
- [x] T021 [US1] Implement loadAndProcessFossilData() function in src/main.js
- [x] T022 [US1] Create fossilListView.js with basic rendering of all Fossils in src/js/views/fossilListView.js
- [x] T023 [US1] Implement profitability status visual indicators (color coding) in src/js/views/fossilListView.js
- [x] T024 [US1] Implement threshold display component showing expected value and reroll cost in src/js/views/fossilListView.js
- [x] T025 [US1] Add Fossil rerolling page navigation/routing in src/main.js
- [x] T026 [US1] Add error handling for missing Wild Crystallised Lifeforce price data in src/js/services/fossilCalculationService.js
- [x] T027 [US1] Add error handling for missing Fossil price data in src/js/views/fossilListView.js

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Users can view all Fossils with profitability indicators and threshold value.

---

## Phase 4: User Story 2 - Select Fossils to Reroll or Keep (Priority: P2)

**Goal**: Users can select individual Fossils to mark them for rerolling or keeping, allowing personalized rerolling strategy.

**Independent Test**: Can be fully tested by implementing selection functionality that allows users to mark Fossils for rerolling or keeping. Delivers value by giving players control over their rerolling strategy.

### Tests for User Story 2

- [x] T028 [P] [US2] Unit test for Fossil selection toggle functionality in tests/unit/models/fossil.test.js
- [x] T029 [P] [US2] Unit test for expected outcome calculation with selected Fossils in tests/unit/services/fossilCalculationService.test.js
- [x] T030 [P] [US2] Integration test for selection persistence in LocalStorage in tests/integration/dataService.test.js
- [ ] T031 [P] [US2] Integration test for selection visual feedback in tests/integration/views/fossilListView.test.js

### Implementation for User Story 2

- [x] T032 [US2] Implement toggleSelection() method in Fossil model in src/js/models/fossil.js
- [x] T033 [US2] Implement setSelected() method in Fossil model in src/js/models/fossil.js
- [x] T034 [US2] Implement calculateExpectedOutcomeForSelected() function in src/js/services/fossilCalculationService.js
- [x] T035 [US2] Add click handler for Fossil selection toggle in src/js/views/fossilListView.js
- [x] T036 [US2] Implement visual distinction for selected Fossils (background color, border, icon) in src/js/views/fossilListView.js
- [x] T037 [US2] Create fossilSelectionPanel.js component for selection controls in src/js/components/fossilSelectionPanel.js
- [x] T038 [US2] Implement LocalStorage persistence for selectedFossilIds in src/js/services/dataService.js
- [x] T039 [US2] Implement selection state restoration on page load in src/js/views/fossilListView.js
- [x] T040 [US2] Update expected outcome calculations to use only selected Fossils in src/js/views/fossilListView.js

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Users can view Fossils and select which ones to reroll.

---

## Phase 5: User Story 3 - View Fossils in List Format (Priority: P2)

**Goal**: Display Fossils in a detailed, sortable list view similar to Essences list view with all required information.

**Independent Test**: Can be fully tested by implementing a list view that displays Fossils with all relevant information in a sortable format. Delivers value by providing detailed comparison and analysis capabilities.

**Note**: This story overlaps with US1 (list view is part of MVP), but focuses on enhanced sorting and detailed display features.

### Tests for User Story 3

- [ ] T041 [P] [US3] Integration test for list view sorting functionality in tests/integration/views/fossilListView.test.js
- [ ] T042 [P] [US3] Integration test for currency toggle (chaos/divine) in tests/integration/views/fossilListView.test.js
- [ ] T043 [P] [US3] Integration test for list view column display in tests/integration/views/fossilListView.test.js

### Implementation for User Story 3

- [x] T044 [US3] Implement sortable column headers (name, value, status) in src/js/views/fossilListView.js
- [x] T045 [US3] Implement sorting logic for name column in src/js/views/fossilListView.js
- [x] T046 [US3] Implement sorting logic for value column in src/js/views/fossilListView.js
- [x] T047 [US3] Implement sorting logic for profitability status column in src/js/views/fossilListView.js
- [x] T048 [US3] Implement currency toggle (chaos/divine) display in src/js/views/fossilListView.js
- [x] T049 [US3] Ensure list view styling matches Essence list view in src/styles/main.css
- [x] T050 [US3] Add sort indicator arrows (↑/↓) in column headers in src/js/views/fossilListView.js
- [x] T051 [US3] Implement responsive list view layout for different screen sizes in src/styles/main.css

**Checkpoint**: All user stories should now be independently functional. Users can view, sort, and select Fossils in a comprehensive list view.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T052 [P] Add comprehensive error handling for edge cases (missing prices, invalid data) across all Fossil components
- [ ] T053 [P] Performance optimization: Cache expected value calculations in src/js/services/fossilCalculationService.js
- [ ] T054 [P] Performance optimization: Efficient DOM updates for list view in src/js/views/fossilListView.js
- [ ] T055 [P] Add loading states and error messages in UI components
- [ ] T056 [P] Ensure consistent profitability indicators across all views in src/js/utils/colorUtils.js
- [ ] T057 [P] Add accessibility improvements (ARIA labels, keyboard navigation) in src/js/views/fossilListView.js
- [ ] T058 [P] Code cleanup and refactoring: Remove duplicate code, improve naming consistency
- [ ] T059 [P] Documentation: Add JSDoc comments to all public methods in Fossil components
- [ ] T060 Run quickstart.md validation: Test all scenarios from quickstart.md
- [ ] T061 [P] Browser compatibility testing: Verify functionality in Chrome, Firefox, Safari, Edge
- [ ] T062 [P] Performance validation: Verify initial load <2s, interactions <100ms, calculations <50ms

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
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 for list view display
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Enhances US1 list view, can work in parallel with US2

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before views
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models and utilities within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test for Fossil model validation and price data checks in tests/unit/models/fossil.test.js"
Task: "Unit test for equal-weighted expected value calculation in tests/unit/services/fossilCalculationService.test.js"
Task: "Unit test for threshold calculation with Wild Crystallised Lifeforce cost in tests/unit/services/fossilCalculationService.test.js"
Task: "Unit test for profitability status calculation in tests/unit/services/fossilCalculationService.test.js"
Task: "Integration test for Fossil data loading and processing in tests/integration/dataService.test.js"

# Launch foundational components in parallel:
Task: "Create Fossil model class following Essence pattern in src/js/models/fossil.js"
Task: "Create fossilGroupUtils.js with single reroll group classification in src/js/utils/fossilGroupUtils.js"
Task: "Create fossilCalculationService.js with equal-weighted calculation functions in src/js/services/fossilCalculationService.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (MVP)
   - Developer B: User Story 2 (can start after US1 list view is ready)
   - Developer C: User Story 3 (can work in parallel, enhances US1)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Single reroll group simplifies implementation compared to Essence's multiple groups
- Reuse Essence patterns where possible to maintain consistency
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Task Summary

**Total Tasks**: 62
- **Phase 1 (Setup)**: 3 tasks
- **Phase 2 (Foundational)**: 5 tasks
- **Phase 3 (User Story 1 - MVP)**: 19 tasks (5 tests + 14 implementation)
- **Phase 4 (User Story 2)**: 13 tasks (4 tests + 9 implementation)
- **Phase 5 (User Story 3)**: 11 tasks (3 tests + 8 implementation)
- **Phase 6 (Polish)**: 11 tasks

**Parallel Opportunities**: 
- Phase 1: 2 tasks can run in parallel
- Phase 2: 3 tasks can run in parallel
- Phase 3: 5 tests + 3 foundational components can run in parallel
- Phase 4: 4 tests can run in parallel
- Phase 5: 3 tests can run in parallel
- Phase 6: 10 tasks can run in parallel

**Suggested MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1) = 27 tasks

**Independent Test Criteria**:
- **US1**: Display all Fossils with profitability indicators and threshold value
- **US2**: Select/deselect Fossils with visual feedback and persistence
- **US3**: Sortable list view with currency toggle and detailed information

