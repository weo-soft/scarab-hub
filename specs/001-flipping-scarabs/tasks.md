# Tasks: Flipping Scarabs Page

**Input**: Design documents from `/specs/001-flipping-scarabs/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are included per constitution requirements (80%+ coverage target for business logic).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths shown below follow single project structure from plan.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create project structure per implementation plan (src/, tests/, data/, assets/ directories)
- [x] T002 Initialize Vite project with package.json and vite.config.js
- [x] T003 [P] Configure Vitest for testing in vite.config.js
- [x] T004 [P] Create index.html entry point in src/index.html
- [x] T005 [P] Create main.js application entry point in src/main.js
- [x] T006 [P] Create global styles in src/styles/main.css
- [x] T007 Copy scarabDetails.json to src/data/scarabDetails.json
- [x] T008 Copy scarabPrices_Keepers.json to src/data/scarabPrices_Keepers.json
- [ ] T009 Copy scarab grid base image to src/assets/scarab-grid-image.png

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T010 Create Scarab model class in src/js/models/scarab.js with data structure from data-model.md
- [x] T011 [P] Create ExpectedValueThreshold model class in src/js/models/scarab.js
- [x] T012 [P] Create dataService for loading and merging JSON files in src/js/services/dataService.js
- [x] T013 [P] Create calculationService for expected value calculations in src/js/services/calculationService.js
- [x] T014 [P] Create colorUtils for profitability color coding in src/js/utils/colorUtils.js
- [x] T015 [P] Create LocalStorage utility functions in src/js/services/dataService.js
- [x] T016 Create error handling utilities for missing/invalid data in src/js/utils/errorHandler.js
- [x] T017 [P] Create unit tests for Scarab model in tests/unit/models/scarab.test.js
- [x] T018 [P] Create unit tests for calculationService in tests/unit/services/calculationService.test.js

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Scarab Profitability Analysis (Priority: P1) 🎯 MVP

**Goal**: Display all Scarabs with profitability indicators and calculated threshold value. Users can immediately see which Scarabs are profitable to vendor.

**Independent Test**: Can be fully tested by displaying all Scarabs with profitability indicators and the calculated threshold value. Delivers immediate value by showing which Scarabs are safe to vendor.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T019 [P] [US1] Create integration test for data loading and merging in tests/integration/dataService.test.js
- [x] T020 [P] [US1] Create integration test for threshold calculation and display in tests/integration/calculationService.test.js

### Implementation for User Story 1

- [x] T021 [US1] Implement threshold display component in src/js/components/thresholdDisplay.js
- [x] T022 [US1] Implement list view for displaying Scarabs in src/js/views/listView.js
- [x] T023 [US1] Add profitability visual indicators (color coding) to list view in src/js/views/listView.js
- [x] T024 [US1] Integrate dataService with main.js to load and merge Scarab data in src/main.js
- [x] T025 [US1] Integrate calculationService to calculate threshold and profitability status in src/main.js
- [x] T026 [US1] Render list view with all Scarabs and profitability indicators in src/main.js
- [x] T027 [US1] Display threshold value using thresholdDisplay component in src/main.js
- [x] T028 [US1] Add error handling for missing price data (mark as "unknown") in src/js/views/listView.js
- [x] T029 [US1] Add error handling for missing dropWeight (exclude from threshold) in src/js/services/calculationService.js

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Users can view all Scarabs with profitability indicators and threshold value.

---

## Phase 4: User Story 2 - View Scarabs in Multiple Display Formats (Priority: P2)

**Goal**: Provide both List and Grid views with view switching functionality. Grid view mirrors in-game stash appearance using HTML5 Canvas.

**Independent Test**: Can be fully tested by implementing view switching functionality that displays the same Scarab data in different layouts. Delivers value by accommodating different user preferences and workflows.

### Tests for User Story 2

- [x] T030 [P] [US2] Create integration test for view switching in tests/integration/views/listView.test.js
- [x] T031 [P] [US2] Create integration test for grid view rendering in tests/integration/views/gridView.test.js

### Implementation for User Story 2

- [x] T032 [US2] Create viewSwitcher component for toggling views in src/js/components/viewSwitcher.js
- [x] T033 [US2] Create canvasUtils for canvas drawing utilities in src/js/utils/canvasUtils.js
- [x] T034 [US2] Implement grid view with HTML5 Canvas in src/js/views/gridView.js
- [x] T035 [US2] Load and render base grid image on canvas in src/js/views/gridView.js
- [x] T036 [US2] Implement cell highlighting for profitability indicators on canvas in src/js/views/gridView.js
- [x] T037 [US2] Map Scarab data to grid cells in src/js/views/gridView.js
- [x] T038 [US2] Integrate viewSwitcher with main.js to handle view changes in src/main.js
- [x] T039 [US2] Save view preference to LocalStorage in src/js/components/viewSwitcher.js
- [x] T040 [US2] Load view preference from LocalStorage on page load in src/main.js
- [x] T041 [US2] Ensure profitability indicators remain consistent across view switches in src/js/views/listView.js and src/js/views/gridView.js
- [x] T042 [US2] Optimize canvas rendering for 60fps performance in src/js/views/gridView.js

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Users can switch between List and Grid views with consistent profitability indicators.

---

## Phase 5: User Story 3 - Explore Vendoring Outcomes with Simulations (Priority: P3)

**Goal**: Provide simulation functionality with three strategies (optimized, user-chosen, random) to help players understand long-term economic outcomes.

**Independent Test**: Can be fully tested by implementing simulation functionality that calculates and displays expected outcomes for different vendoring strategies. Delivers value by helping players understand long-term economic implications.

### Tests for User Story 3

- [x] T043 [P] [US3] Create unit test for optimized strategy simulation in tests/unit/services/calculationService.test.js
- [x] T044 [P] [US3] Create unit test for user-chosen strategy simulation in tests/unit/services/calculationService.test.js
- [x] T045 [P] [US3] Create unit test for random strategy simulation in tests/unit/services/calculationService.test.js

### Implementation for User Story 3

- [x] T046 [US3] Create Simulation model class in src/js/models/scarab.js
- [x] T047 [US3] Implement optimized strategy calculation in src/js/services/calculationService.js
- [x] T048 [US3] Implement user-chosen strategy calculation in src/js/services/calculationService.js
- [x] T049 [US3] Implement random strategy calculation in src/js/services/calculationService.js
- [x] T050 [US3] Create simulationPanel component for controls and results in src/js/components/simulationPanel.js
- [x] T051 [US3] Add strategy type selector (optimized/user-chosen/random) in src/js/components/simulationPanel.js
- [x] T052 [US3] Add Scarab selection UI for user-chosen strategy in src/js/components/simulationPanel.js
- [x] T053 [US3] Add transaction count input with validation (1-10000) in src/js/components/simulationPanel.js
- [x] T054 [US3] Implement simulation execution and result display in src/js/components/simulationPanel.js
- [x] T055 [US3] Add visual indicators for profit/loss results (positive/negative) in src/js/components/simulationPanel.js
- [x] T056 [US3] Integrate simulationPanel with main.js in src/main.js
- [x] T057 [US3] Add validation for user-chosen strategy (minimum 3 Scarabs) in src/js/components/simulationPanel.js
- [x] T058 [US3] Add error handling for invalid simulation parameters in src/js/services/calculationService.js

**Checkpoint**: All user stories should now be independently functional. Users can run simulations to explore vendoring outcomes.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T059 [P] Add currency preference toggle (chaos/divine) in src/js/components/viewSwitcher.js
- [x] T060 [P] Save currency preference to LocalStorage in src/js/services/dataService.js
- [x] T061 [P] Update all views to respect currency preference in src/js/views/listView.js and src/js/views/gridView.js
- [x] T062 [P] Add price refresh functionality (reload price JSON) in src/js/services/dataService.js
- [x] T063 [P] Add loading states and error messages for data loading in src/js/views/listView.js
- [x] T064 [P] Optimize initial page load performance (<2s target) in src/main.js
- [x] T065 [P] Add accessibility improvements (ARIA labels, keyboard navigation) in src/js/views/listView.js and src/js/views/gridView.js
- [x] T066 [P] Add responsive design for mobile devices in src/styles/main.css
- [x] T067 [P] Code cleanup and refactoring across all modules
- [ ] T068 [P] Run quickstart.md validation scenarios
- [ ] T069 [P] Performance testing and optimization (view switching <100ms, calculations <50ms)
- [ ] T070 [P] Cross-browser testing (Chrome, Firefox, Safari, Edge)

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
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 for profitability indicators consistency
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Depends on US1 for profitability data, can work independently

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before views/components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T003-T009)
- All Foundational tasks marked [P] can run in parallel (T011-T018)
- Once Foundational phase completes, User Story 1 can start
- User Story 2 can start after US1 profitability indicators are complete
- User Story 3 can start independently after Foundational
- All tests for a user story marked [P] can run in parallel
- All Polish tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Create integration test for data loading and merging in tests/integration/dataService.test.js"
Task: "Create integration test for threshold calculation and display in tests/integration/calculationService.test.js"

# These can run in parallel as they test different components
```

---

## Parallel Example: Foundational Phase

```bash
# Launch all foundational tasks marked [P] together:
Task: "Create ExpectedValueThreshold model class in src/js/models/scarab.js"
Task: "Create dataService for loading and merging JSON files in src/js/services/dataService.js"
Task: "Create calculationService for expected value calculations in src/js/services/calculationService.js"
Task: "Create colorUtils for profitability color coding in src/js/utils/colorUtils.js"
Task: "Create LocalStorage utility functions in src/js/services/dataService.js"
Task: "Create unit tests for Scarab model in tests/unit/models/scarab.test.js"
Task: "Create unit tests for calculationService in tests/unit/services/calculationService.test.js"
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
   - Developer B: User Story 2 (can start after US1 profitability indicators)
   - Developer C: User Story 3 (can start independently)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All file paths are relative to repository root
- Follow constitution requirements: 80%+ test coverage for business logic, performance targets must be met

