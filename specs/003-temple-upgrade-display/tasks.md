# Tasks: Temple Upgrade Display

**Input**: Design documents from `/specs/003-temple-upgrade-display/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Manual testing only (no automated tests per project standards)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Single-page web application**: `src/` at repository root
- Paths shown below follow the structure defined in plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and file structure preparation

- [X] T001 Create new view file structure for temple upgrade feature in `src/js/views/templeUpgradeListView.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data loading infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 [P] Implement `loadTempleUpgradeData()` function in `src/js/services/dataService.js` to load and parse `uniques.json` and `vials.json`
- [X] T003 [P] Implement `extractUpgradeCombinations()` helper function in `src/js/services/dataService.js` to identify base uniques with "Altar of Sacrifice" in flavourText
- [X] T004 [P] Implement `findUpgradedUnique()` helper function in `src/js/services/dataService.js` with known mapping table for base-to-upgraded unique matching
- [X] T005 Implement vial name extraction from flavourText using regex pattern in `extractUpgradeCombinations()` function in `src/js/services/dataService.js`
- [X] T006 Add error handling and logging for missing vials and upgraded uniques in `extractUpgradeCombinations()` function in `src/js/services/dataService.js`
- [X] T007 Create `TempleItem` object with name "Chronicle of Atzoatl" and image path in `loadTempleUpgradeData()` function in `src/js/services/dataService.js`

**Checkpoint**: Foundation ready - data loading function complete, user story implementation can now begin

---

## Phase 3: User Story 1 - View Upgrade Combinations (Priority: P1) 🎯 MVP

**Goal**: Display all available unique item upgrade combinations showing base unique + vial + Chronicle of Atzoatl = upgraded unique with images and names

**Independent Test**: Navigate to Temple category, verify all 11 upgrade combinations are displayed with images and names for all components (base unique, vial, temple, upgraded unique)

### Implementation for User Story 1

- [X] T008 [P] [US1] Create `renderTempleUpgradeList()` function in `src/js/views/templeUpgradeListView.js` to render HTML structure for upgrade combinations
- [X] T009 [P] [US1] Implement `getUniqueImagePath()` helper function in `src/js/views/templeUpgradeListView.js` to convert `detailsId` to image filename (e.g., "apeps-slumber-vaal-spirit-shield" → "apeps-slumber.png")
- [X] T010 [P] [US1] Implement `getVialImagePath()` helper function in `src/js/views/templeUpgradeListView.js` to generate vial image path from `detailsId`
- [X] T011 [US1] Implement `renderCombination()` helper function in `src/js/views/templeUpgradeListView.js` to generate HTML for single upgrade combination with all four components
- [X] T012 [US1] Add image error handling (onerror handler) to hide missing images in `renderCombination()` function in `src/js/views/templeUpgradeListView.js`
- [X] T013 [US1] Implement `escapeHtml()` helper function in `src/js/views/templeUpgradeListView.js` for safe HTML rendering
- [X] T014 [US1] Create `renderTempleUpgradeUI()` function in `src/main.js` to orchestrate view rendering and hide filter panel/grid view
- [X] T015 [US1] Add temple category handler in `handleCategoryChange()` function in `src/main.js` to call `loadTempleUpgradeData()` and `renderTempleUpgradeUI()`
- [X] T016 [US1] Add CSS styles for `.temple-upgrade-list`, `.temple-upgrade-combination`, `.upgrade-component`, `.component-image`, `.component-name`, `.upgrade-operator` in `src/styles/main.css`
- [X] T017 [US1] Import `renderTempleUpgradeList` from `templeUpgradeListView.js` in `src/main.js`
- [X] T018 [US1] Import `loadTempleUpgradeData` from `dataService.js` in `src/main.js`

**Checkpoint**: At this point, User Story 1 should be fully functional - all combinations display with images and names, independently testable

---

## Phase 4: User Story 2 - View Item Details via Tooltips (Priority: P2)

**Goal**: Display detailed tooltips when hovering over unique items, vials, and temple room showing item properties and details

**Independent Test**: Hover over any unique item, vial, or temple room image/name and verify tooltip appears with complete item details (name, modifiers, level requirement, etc.)

### Implementation for User Story 2

- [X] T019 [P] [US2] Implement `showUniqueTooltip()` function in `src/js/utils/tooltip.js` to display tooltip for unique items
- [X] T020 [P] [US2] Implement `buildUniqueTooltipContent()` helper function in `src/js/utils/tooltip.js` to build HTML with name, base type, level requirement, modifiers, and flavour text
- [X] T021 [P] [US2] Implement `showVialTooltip()` function in `src/js/utils/tooltip.js` to display tooltip for vials
- [X] T022 [P] [US2] Implement `buildVialTooltipContent()` helper function in `src/js/utils/tooltip.js` to build HTML with name, flavour text, and stack size
- [X] T023 [P] [US2] Implement `showTempleRoomTooltip()` function in `src/js/utils/tooltip.js` to display tooltip for Chronicle of Atzoatl
- [X] T024 [P] [US2] Implement `buildTempleRoomTooltipContent()` helper function in `src/js/utils/tooltip.js` to build HTML with name and description
- [X] T025 [US2] Implement `attachTooltipHandlers()` function in `src/js/views/templeUpgradeListView.js` to attach mouseenter/mouseleave event listeners to all upgrade components
- [X] T026 [US2] Implement `findUniqueById()` helper function in `src/js/views/templeUpgradeListView.js` to locate unique item from combinations array by detailsId
- [X] T027 [US2] Implement `findVialById()` helper function in `src/js/views/templeUpgradeListView.js` to locate vial from combinations array by detailsId
- [X] T028 [US2] Call `attachTooltipHandlers()` from `renderTempleUpgradeList()` function in `src/js/views/templeUpgradeListView.js` after rendering HTML
- [X] T029 [US2] Export `showUniqueTooltip`, `showVialTooltip`, `showTempleRoomTooltip` functions from `src/js/utils/tooltip.js`
- [X] T030 [US2] Import tooltip functions (`showUniqueTooltip`, `showVialTooltip`, `showTempleRoomTooltip`, `hideTooltip`) in `src/js/views/templeUpgradeListView.js`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - combinations display with tooltips on hover

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Error handling improvements, styling refinements, and integration validation

- [X] T031 [P] Add error handling for JSON load failures with user-friendly error toast in `loadTempleUpgradeData()` function in `src/js/services/dataService.js`
- [X] T032 [P] Add CSS styles for tooltip content formatting (modifiers, flavour text, separators) in `src/styles/main.css` to match existing tooltip styles
- [X] T033 [P] Add hover effects and transitions for upgrade components in `src/styles/main.css` (scale transform on hover)
- [X] T034 [P] Add responsive styling for temple upgrade list view in `src/styles/main.css` for different screen sizes
- [ ] T035 Verify all 11 known upgrade combinations are correctly extracted and displayed (manual testing checklist)
- [ ] T036 Verify tooltip positioning and visibility on all component types (unique, vial, temple) - manual testing
- [ ] T037 Verify missing image handling works correctly (test with invalid image paths) - manual testing
- [ ] T038 Verify page load performance meets < 2 seconds requirement (SC-001) - manual testing with browser DevTools
- [ ] T039 Verify tooltip display performance meets < 500ms requirement (SC-003) - manual testing
- [X] T040 Run quickstart.md validation to ensure all implementation steps are complete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 (P1) can start after Foundational (Phase 2)
  - User Story 2 (P2) can start after Foundational (Phase 2) but requires US1 components for tooltip integration
- **Polish (Phase 5)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Requires US1 view components for tooltip attachment, but tooltip functions can be developed in parallel

### Within Each User Story

- Helper functions before main functions
- View rendering before event handlers
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 2**: Tasks T002, T003, T004 can run in parallel (different helper functions)
- **Phase 3 (US1)**: Tasks T008, T009, T010 can run in parallel (different helper functions)
- **Phase 4 (US2)**: Tasks T019-T024 can run in parallel (different tooltip functions)
- **Phase 5**: All polish tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all helper functions for User Story 1 together:
Task: "Create renderTempleUpgradeList() function in src/js/views/templeUpgradeListView.js"
Task: "Implement getUniqueImagePath() helper function in src/js/views/templeUpgradeListView.js"
Task: "Implement getVialImagePath() helper function in src/js/views/templeUpgradeListView.js"
```

---

## Parallel Example: User Story 2

```bash
# Launch all tooltip functions for User Story 2 together:
Task: "Implement showUniqueTooltip() function in src/js/utils/tooltip.js"
Task: "Implement buildUniqueTooltipContent() helper function in src/js/utils/tooltip.js"
Task: "Implement showVialTooltip() function in src/js/utils/tooltip.js"
Task: "Implement buildVialTooltipContent() helper function in src/js/utils/tooltip.js"
Task: "Implement showTempleRoomTooltip() function in src/js/utils/tooltip.js"
Task: "Implement buildTempleRoomTooltipContent() helper function in src/js/utils/tooltip.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently - verify all 11 combinations display correctly
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add Polish → Test → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (view rendering)
   - Developer B: User Story 2 (tooltip functions) - can start in parallel
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Manual testing only (no automated tests per project standards)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All file paths are relative to repository root (`src/`, `public/`)
