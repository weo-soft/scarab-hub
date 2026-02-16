# Tasks: Regex Search for Selected Flip/Reroll Items

**Input**: Design documents from `/specs/001-regex-item-search/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Plan defines unit tests for regex and selection, integration tests for list/grid sync. Test tasks included below.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Repository root: `src/`, `tests/`, `public/`
- Source: `src/js/` (views, services, components, utils, adapters)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ensure test and source structure exists for new code.

- [x] T001 Verify test structure for unit and integration tests in tests/unit/services/ and tests/integration/views/ per plan.md
- [x] T002 [P] Add CSS class or variables for selection visual (e.g. .item-selected) in src/styles/main.css if not already present

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Selection state and category name data that all user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 Create selection state module with getSelectedIds, toggle, add, remove, clear, has, subscribe(callback) and per-category state in src/js/services/selectionState.js
- [x] T004 [P] Add CategoryItemNames builder: function that given categoryId and items array (with id and name/baseType) returns { categoryId, namesById, names } in src/js/utils/categoryItemNames.js

**Checkpoint**: Foundation ready — user story implementation can begin

---

## Phase 3: User Story 1 - Select Items and Get Exact-Match Regex (Priority: P1) 🎯 MVP

**Goal**: User selects items (via list) and gets a copyable regex that exactly matches those item names, ≤250 characters.

**Independent Test**: Select one or more items by clicking list entries; regex appears and is copyable; paste into game search matches only selected items; length ≤250.

### Implementation for User Story 1

- [x] T005 [P] [US1] Implement generateRegex(selectedIds, categoryNames) returning SearchRegexResult | null with escaped alternation and length ≤250 in src/js/services/regexSearchService.js
- [x] T006 [US1] Create regex display component: show regex value or "Select at least one item", Copy button using navigator.clipboard.writeText in src/js/components/regexSearchDisplay.js
- [x] T007 [US1] Wire list view to selection state: on list entry click call selectionState.toggle(itemId) in src/js/views/listView.js
- [x] T008 [US1] Wire regex display to selection: when selectionState changes call generateRegex with current category names and update display (mount component where regex is shown, subscribe to selectionState) in main.js or view that hosts list/grid
- [x] T009 [P] [US1] Unit tests for regexSearchService: empty selection → null, one item → escaped match, length ≤250, exact match vs all category names in tests/unit/services/regexSearchService.test.js

**Checkpoint**: User Story 1 testable — select via list, see and copy regex

---

## Phase 4: User Story 2 - Select and Unselect with Clear Visual Feedback (Priority: P2)

**Goal**: Selection visible in both list and grid; click in either view toggles selection; both views stay in sync.

**Independent Test**: Click list entry → list row and grid cell show selected; click grid cell → grid cell and list row show selected; toggle again removes indication in both.

### Implementation for User Story 2

- [x] T010 [US2] Add selection visual to list entries: apply selected class/style when item id is in selectionState.getSelectedIds() in src/js/views/listView.js
- [x] T011 [US2] Add cell click handler and selection highlight (draw or class) for selected cells in src/js/views/genericGridView.js
- [x] T012 [US2] Wire grid to selection state: on cell click resolve item ID and call selectionState.toggle(id); ensure list and grid both re-render or update from same state (subscribe in both views) in src/js/views/genericGridView.js and list view
- [x] T013 [P] [US2] Integration test: click list updates grid selection visual and regex; click grid updates list selection visual and regex in tests/integration/views/selectionAndRegex.test.js

**Checkpoint**: User Stories 1 and 2 work — selection in both views, regex updates

---

## Phase 5: User Story 3 - Regex Fits 250-Character Limit (Priority: P3)

**Goal**: When many items selected and naive alternation exceeds 250 chars, system produces regex ≤250 that still exactly matches selected items (fallback: shortened unique substrings or trie).

**Independent Test**: Select 20+ items; generated regex ≤250 chars; regex matches only selected names when tested against full category name list.

### Implementation for User Story 3

- [x] T014 [US3] Add fallback in regexSearchService when regex length >250: use shortened unique substrings or trie-based compact regex, set truncated flag in src/js/services/regexSearchService.js
- [x] T015 [US3] Show truncated message when SearchRegexResult.truncated is true in src/js/components/regexSearchDisplay.js
- [x] T016 [P] [US3] Unit tests for fallback: large selection produces regex ≤250 and exact match in tests/unit/services/regexSearchService.test.js

**Checkpoint**: All user stories complete — large selection still gets valid regex

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Category switch behavior, validation, and docs.

- [x] T017 Handle category switch: clear or preserve selection per category when user switches category (see data-model.md) in src/js/services/selectionState.js and where category is switched (e.g. main.js or tab handler)
- [ ] T018 [P] Run quickstart.md test scenarios and document any gaps in specs/001-regex-item-search/quickstart.md
- [x] T019 Add error handling for missing category names or copy failure in src/js/components/regexSearchDisplay.js and src/js/services/regexSearchService.js

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 — first user-facing increment (MVP)
- **Phase 4 (US2)**: Depends on Phase 2; builds on US1 (same selection state and regex display)
- **Phase 5 (US3)**: Depends on Phase 2; extends regex service from US1
- **Phase 6 (Polish)**: Depends on Phases 3–5 complete

### User Story Dependencies

- **US1 (P1)**: After Foundational — regex service, display, list click to select
- **US2 (P2)**: After Foundational — selection visual in list and grid, grid click, sync
- **US3 (P3)**: After Foundational — regex fallback when >250 chars

### Within Each User Story

- Implement service/component before wiring (e.g. regexSearchService before regex display)
- Wire list before grid (US1 list selection, US2 add grid and visuals)
- Tests can be written alongside or after implementation (plan requires unit + integration)

### Parallel Opportunities

- T002 and T004 can run in parallel (different files)
- T005 and T009 (US1) can run in parallel
- T013 (US2 integration test) and T016 (US3 unit test) can run in parallel with other tasks in their phases
- After Phase 2, US2 and US3 tasks can be done in parallel by different developers (US2 view work, US3 regex fallback)

---

## Parallel Example: User Story 1

```text
# Implement core regex and tests in parallel:
T005: Implement generateRegex in src/js/services/regexSearchService.js
T009: Unit tests in tests/unit/services/regexSearchService.test.js

# Then wire UI (sequential):
T006: Regex display component
T007: List click → selectionState
T008: Wire display to selection
```

---

## Parallel Example: User Story 2

```text
# After T010–T012, run integration test in parallel with other work:
T013: Integration test in tests/integration/views/selectionAndRegex.test.js
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2
2. Complete Phase 3 (US1): regex service, display, list selection, wire display
3. **STOP and VALIDATE**: Select items in list, copy regex, verify length and exact match
4. Demo/deploy MVP

### Incremental Delivery

1. Phase 1 + 2 → foundation
2. Phase 3 (US1) → test independently → MVP
3. Phase 4 (US2) → selection in both views, sync → test
4. Phase 5 (US3) → large selection fallback → test
5. Phase 6 → polish and docs

### Parallel Team Strategy

- Developer A: Phase 3 (US1) then Phase 5 (US3) — regex and fallback
- Developer B: Phase 4 (US2) — list/grid selection and visuals
- Phase 2 must be done first; then A and B can work in parallel

---

## Notes

- [P] = different files, no dependencies on other tasks in same phase
- [Story] maps task to spec user story for traceability
- Each user story is independently testable per quickstart.md
- Commit after each task or logical group
- File paths are absolute from repo root (e.g. src/js/services/selectionState.js)
