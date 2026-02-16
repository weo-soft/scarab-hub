# Implementation Tasks: 3-to-1 Trade Simulation

**Feature**: 3-to-1 Trade Simulation  
**Branch**: `002-trade-simulation`  
**Date**: 2025-01-27  
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Summary

This document breaks down the implementation into actionable, dependency-ordered tasks organized by user story priority. Each user story phase is independently testable and can be developed in parallel where dependencies allow.

**Total Tasks**: 45  
**User Stories**: 5 (2 P1, 3 P2)  
**MVP Scope**: User Story 1 + User Story 4 (Core simulation with configuration)

## Dependencies

### User Story Completion Order

1. **Phase 1: Setup** → Must complete first (project structure)
2. **Phase 2: Foundational** → Must complete before user stories (shared models/utilities)
3. **Phase 3: User Story 1 (P1)** → Core simulation engine (can start after Phase 2)
4. **Phase 4: User Story 4 (P1)** → Configuration UI (can start after Phase 2, parallel with US1)
5. **Phase 5: User Story 3 (P2)** → Event tracking (depends on US1)
6. **Phase 6: User Story 2 (P2)** → Transaction history (depends on US1)
7. **Phase 7: User Story 5 (P2)** → Yield count visualization (depends on US1)
8. **Phase 8: Polish** → Final optimizations and cross-cutting concerns

### Parallel Execution Opportunities

- **Phase 3 (US1) + Phase 4 (US4)**: Can be developed in parallel after Phase 2
- **Phase 5 (US3) + Phase 6 (US2) + Phase 7 (US5)**: Can be developed in parallel after Phase 3
- Within each phase: Model tasks can run parallel with utility tasks

## Implementation Strategy

**MVP First**: Implement User Story 1 (core simulation) + User Story 4 (configuration) to deliver basic simulation functionality. This provides immediate value and can be tested independently.

**Incremental Delivery**: Each user story phase is independently testable. Complete each phase fully before moving to the next to maintain working software at all times.

**Performance Considerations**: Large-scale simulation (1 million transactions) requires batch processing and efficient data structures. Implement these from the start in Phase 3.

---

## Phase 1: Setup

**Goal**: Initialize project structure and prepare for feature development

**Independent Test**: Project structure exists, new files can be created, existing codebase is accessible

### Tasks

- [x] T001 Create new service file structure for simulation engine in `src/js/services/simulationService.js`
- [x] T002 Create new utility file for simulation helpers in `src/js/utils/simulationUtils.js`
- [x] T003 Create new component file for transaction history in `src/js/components/transactionHistory.js`
- [x] T004 Create test directory structure for simulation tests in `tests/unit/services/simulationService.test.js`
- [x] T005 Create test directory structure for performance tests in `tests/performance/largeSimulation.test.js`

---

## Phase 2: Foundational

**Goal**: Create shared models and utilities needed by all user stories

**Independent Test**: Models can be instantiated, utilities can be called, validation works

### Tasks

- [x] T006 [P] Extend Simulation model in `src/js/models/scarab.js` to add SimulationConfiguration class with validation
- [x] T007 [P] Add SimulationTransaction class to `src/js/models/scarab.js` with transaction data structure
- [x] T008 [P] Add SignificantEvent class to `src/js/models/scarab.js` with event data structure
- [x] T009 [P] Extend Simulation class in `src/js/models/scarab.js` to support transaction tracking and results aggregation
- [x] T010 [P] Create rare scarab detection utility function in `src/js/utils/simulationUtils.js` that calculates drop weight percentile and identifies rare scarabs
- [x] T011 [P] Create weighted random selection utility function in `src/js/utils/simulationUtils.js` for selecting returned scarabs based on drop weights
- [x] T012 [P] Create breakeven detection utility function in `src/js/utils/simulationUtils.js` that checks if cumulative profit/loss crosses breakeven threshold

---

## Phase 3: User Story 1 - Run Large-Scale Trade Simulation (P1)

**Goal**: Implement core simulation engine that accurately simulates each transaction and aggregates results

**Independent Test**: Can run simulation with configured parameters, all transactions are accurately simulated, yield counts are correctly calculated, results are displayed

**Acceptance Criteria**: FR-002, FR-003, FR-005, FR-013, SC-001, SC-002

### Tasks

- [x] T013 [US1] Create simulationService.js with createConfiguration method that validates and creates SimulationConfiguration in `src/js/services/simulationService.js`
- [x] T014 [US1] Implement validateConfiguration method in `src/js/services/simulationService.js` that checks minimum 3 scarabs, valid transaction count (1-1M), valid breakeven point
- [x] T015 [US1] Implement runSimulation method in `src/js/services/simulationService.js` that processes transactions in batches of 10,000 with progress callbacks
- [x] T016 [US1] Implement transaction simulation logic in `src/js/services/simulationService.js` that selects 3 input scarabs, calculates input value, selects returned scarab using weighted random, calculates returned value
- [x] T017 [US1] Implement transaction recording in `src/js/services/simulationService.js` that creates SimulationTransaction objects for each transaction with all required fields
- [x] T018 [US1] Implement yield count aggregation in `src/js/services/simulationService.js` that maintains Map<scarabId, count> and increments for each returned scarab
- [x] T019 [US1] Implement cumulative profit/loss calculation in `src/js/services/simulationService.js` that tracks running total after each transaction
- [x] T020 [US1] Implement batch processing with progress updates in `src/js/services/simulationService.js` using requestAnimationFrame or setTimeout to yield control between batches
- [x] T021 [US1] Implement result aggregation in `src/js/services/simulationService.js` that calculates totalInputValue, totalOutputValue, netProfitLoss, averageProfitLossPerTransaction
- [x] T022 [US1] Extend simulationPanel.js to call simulationService.runSimulation and display results with yield counts in `src/js/components/simulationPanel.js`

---

## Phase 4: User Story 4 - Configure Simulation Parameters (P1)

**Goal**: Implement configuration UI that allows users to set simulation parameters with validation

**Independent Test**: Can configure simulation parameters, validation prevents invalid configurations, configuration is used correctly when running simulation

**Acceptance Criteria**: FR-001, FR-012, SC-008

### Tasks

- [x] T023 [US4] Extend simulationPanel.js to add scarab selection UI with checkboxes for selecting scarabs in `src/js/components/simulationPanel.js`
- [x] T024 [US4] Add breakeven point input field with validation (>= 0) in `src/js/components/simulationPanel.js`
- [x] T025 [US4] Add rare scarab threshold input field with validation (0-1 range, default 0.1) in `src/js/components/simulationPanel.js`
- [x] T026 [US4] Extend transaction count input to support up to 1,000,000 with validation in `src/js/components/simulationPanel.js`
- [x] T027 [US4] Implement configuration validation UI that shows error messages for invalid configurations in `src/js/components/simulationPanel.js`
- [x] T028 [US4] Implement configuration persistence to LocalStorage key `scarabHub_simulationConfig` in `src/js/components/simulationPanel.js`
- [x] T029 [US4] Implement configuration loading from LocalStorage on panel initialization in `src/js/components/simulationPanel.js`

---

## Phase 5: User Story 3 - Track Significant Simulation Events (P2)

**Goal**: Detect and record significant events (rare scarab returns, breakeven achievement) during simulation

**Independent Test**: Events are detected during simulation, events are recorded with correct transaction numbers, events are displayed in results, navigation from events to transactions works

**Acceptance Criteria**: FR-004, FR-008, FR-009, FR-014, FR-015, SC-004, SC-007

### Tasks

- [x] T030 [US3] Integrate rare scarab detection into simulationService.runSimulation using simulationUtils.identifyRareScarabs in `src/js/services/simulationService.js`
- [x] T031 [US3] Implement rare scarab event detection in `src/js/services/simulationService.js` that checks if returned scarab is in rare scarab set and creates SignificantEvent
- [x] T032 [US3] Implement breakeven event detection in `src/js/services/simulationService.js` that checks if cumulative profit/loss crosses breakeven threshold and creates SignificantEvent
- [x] T033 [US3] Store significant events array in SimulationResult with event details in `src/js/services/simulationService.js`
- [x] T034 [US3] Extend simulationPanel.js to display significant events summary with transaction numbers in `src/js/components/simulationPanel.js`
- [x] T035 [US3] Implement navigation from significant events to specific transactions in `src/js/components/simulationPanel.js` that scrolls to or highlights the transaction

---

## Phase 6: User Story 2 - View Transaction-by-Transaction Results (P2)

**Goal**: Display transaction history with pagination, search, and filtering for large simulations

**Independent Test**: Transaction history displays correctly, pagination works, search/filter works, navigation to specific transaction works, performance is acceptable for large simulations

**Acceptance Criteria**: FR-006, FR-007, SC-003

### Tasks

- [x] T036 [US2] Create transactionHistory.js component with render method that displays transaction list in `src/js/components/transactionHistory.js`
- [x] T037 [US2] Implement pagination controls in `src/js/components/transactionHistory.js` with page size selector (100, 500, 1000 transactions per page)
- [x] T038 [US2] Implement transaction history data loading from SimulationResult.transactions array with pagination in `src/js/components/transactionHistory.js`
- [x] T039 [US2] Implement search functionality in `src/js/components/transactionHistory.js` that filters transactions by scarab name or ID
- [x] T040 [US2] Implement filter functionality in `src/js/components/transactionHistory.js` that filters by transaction number range
- [x] T041 [US2] Implement navigation to specific transaction by number in `src/js/components/transactionHistory.js`
- [x] T042 [US2] Integrate transactionHistory component into simulationPanel.js to display history after simulation completes in `src/js/components/simulationPanel.js`

---

## Phase 7: User Story 5 - Visualize Results in Grid and List Views (P2)

**Goal**: Display yield counts in existing Grid and List views as overlay/additional data

**Independent Test**: Yield counts display in Grid view, yield counts display in List view, counts are accurate, zero-yield scarabs show 0, existing view functionality is preserved

**Acceptance Criteria**: FR-010, FR-011, SC-006

### Tasks

- [x] T043 [US5] Extend gridView.js to accept yield counts Map and display counts as text overlay on scarab cells in `src/js/views/gridView.js`
- [x] T044 [US5] Extend listView.js to add "Yield Count" column to table and display counts for each scarab in `src/js/views/listView.js`
- [x] T045 [US5] Implement yield count update mechanism in `src/js/components/simulationPanel.js` that passes yield counts to gridView and listView after simulation completes

---

## Phase 8: Polish & Cross-Cutting Concerns

**Goal**: Final optimizations, error handling, performance tuning, and cross-cutting improvements

**Independent Test**: All features work together, performance targets met, error handling is robust, code quality is maintained

### Tasks

- [x] T046 Implement error handling for simulation failures with user-friendly error messages in `src/js/services/simulationService.js`
- [x] T047 Implement simulation cancellation support that allows users to stop long-running simulations in `src/js/services/simulationService.js`
- [x] T048 Add performance optimizations for memory management in large simulations (streaming, efficient data structures) in `src/js/services/simulationService.js`
- [x] T049 Implement simulation results persistence to LocalStorage key `scarabHub_simulationResults` in `src/js/components/simulationPanel.js`
- [x] T050 Add loading states and progress indicators for simulation execution in `src/js/components/simulationPanel.js`
- [x] T051 Add unit tests for simulationService with 80%+ coverage in `tests/unit/services/simulationService.test.js`
- [x] T052 Add performance tests for 1 million transaction simulations in `tests/performance/largeSimulation.test.js`
- [x] T053 Add integration tests for transaction history component in `tests/integration/components/simulationPanel.test.js`
- [x] T054 Add integration tests for yield count visualization in Grid and List views in `tests/integration/views/gridView.test.js` and `tests/integration/views/listView.test.js`
- [x] T055 Review and optimize code for consistency with existing codebase patterns and naming conventions

---

## Parallel Execution Examples

### Example 1: Phase 3 + Phase 4 (After Phase 2)
- Developer A: Works on T013-T022 (US1 - Core simulation engine)
- Developer B: Works on T023-T029 (US4 - Configuration UI)
- Both can work independently after Phase 2 completes

### Example 2: Phase 5 + Phase 6 + Phase 7 (After Phase 3)
- Developer A: Works on T030-T035 (US3 - Event tracking)
- Developer B: Works on T036-T042 (US2 - Transaction history)
- Developer C: Works on T043-T045 (US5 - Yield count visualization)
- All can work in parallel after Phase 3 completes

### Example 3: Within Phase 2
- Developer A: Works on T006-T009 (Model classes)
- Developer B: Works on T010-T012 (Utility functions)
- Both can work in parallel as models and utilities are independent

---

## Task Summary

**Total Tasks**: 55  
**Setup Tasks**: 5 (Phase 1)  
**Foundational Tasks**: 7 (Phase 2)  
**User Story 1 Tasks**: 10 (Phase 3)  
**User Story 4 Tasks**: 7 (Phase 4)  
**User Story 3 Tasks**: 6 (Phase 5)  
**User Story 2 Tasks**: 7 (Phase 6)  
**User Story 5 Tasks**: 3 (Phase 7)  
**Polish Tasks**: 10 (Phase 8)

**Parallelizable Tasks**: 15 (marked with [P])

**MVP Scope**: Phases 1, 2, 3, 4 (27 tasks) - Core simulation with configuration

