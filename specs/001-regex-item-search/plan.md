# Implementation Plan: Regex Search for Selected Flip/Reroll Items

**Branch**: `001-regex-item-search` | **Date**: 2025-02-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-regex-item-search/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enable users to select items (via list entry or grid cell) and obtain a regular expression that exactly matches those selected item names for use in the game's search (flip/reroll workflow). The regex must not exceed 250 characters (game limit). Selection state is shared between list and grid with clear visual indication on both. Item names per category are known from existing JSON under `public/data/items`; when a simple alternation would exceed 250 characters, the system uses compact strategies (e.g. shortened unique substrings, trie-based regex) to stay within the limit while preserving exact match. Built on the existing Vite/vanilla JS app, reusing list/grid views and adapters.

**Technical Approach**: Add a shared selection model per category; extend list and grid views to toggle selection and show visual state; add a regex generation service that consumes selected item names and category name set, producing a ≤250-character exact-match regex; expose the regex via a display/copy control. All technical choices documented in research.md.

## Technical Context

**Language/Version**: JavaScript (ES6+), HTML5, CSS3  
**Primary Dependencies**: Vite (build and dev server), existing codebase (generic grid, list view, adapters)  
**Storage**: In-memory selection state per category; optional LocalStorage for persistence (out of scope per spec unless added later)  
**Testing**: Vitest (unit for regex service and selection logic; integration for list/grid selection and regex display)  
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)  
**Project Type**: Single-page web application (extension of existing Scarab Hub)  
**Performance Goals**:
- Regex generation &lt;50ms for typical selections
- Selection toggle and UI update &lt;100ms perceived latency
- Initial page load unchanged (&lt;2s constitution requirement)
**Constraints**:
- Generated regex MUST be ≤250 characters (game limit)
- Regex MUST exactly match selected names against the known category name set (no false positives/negatives)
- Selection MUST stay in sync between list and grid; one source of truth
**Scale/Scope**:
- All item categories that have list/grid views and item data in `public/data/items`
- Typical selection sizes from 1 to hundreds of items; regex must remain within 250 chars

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify compliance with constitution principles:

- **Code Quality**: Design follows established patterns and maintains readability
  - Reuses existing list view, generic grid view, and adapter patterns
  - New code: selection state module, regex generator service, UI for regex display/copy
  - Naming and structure consistent with existing codebase
- **Testing**: Testing strategy defined
  - Unit tests for regex generation (exact match, length limit, edge cases)
  - Unit tests for selection state and name-set resolution per category
  - Integration tests for list/grid selection sync and regex UI updates
  - Manual verification for in-game regex compatibility
- **User Experience**: UX consistency maintained
  - Same interaction pattern (click to toggle) across list and grid
  - Visual indication of selection consistent in both views (e.g. highlight/border)
  - Regex display and copy control consistent with existing controls
- **Performance**: Performance targets identified
  - Regex generation &lt;50ms; selection toggle &lt;100ms; no regression on load time
- **Complexity**: Deviations justified
  - Compact regex strategies (shortened substrings, trie-based) justified by 250-char limit and exact-match requirement; complexity contained in regex service

## Project Structure

### Documentation (this feature)

```text
specs/001-regex-item-search/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks - not created by plan)
```

### Source Code (repository root)

```text
src/
├── index.html
├── main.js
├── styles/
│   └── main.css         # Extend for selection styles if needed
├── js/
│   ├── models/          # Existing (scarab, essence, etc.)
│   ├── views/
│   │   ├── listView.js       # Extend: selection toggle, visual indication, regex UI hook
│   │   ├── genericGridView.js # Extend: selection toggle, visual indication (cell highlight)
│   │   └── [category]ListView.js / [category]GridView.js  # Wire selection + regex per category
│   ├── services/
│   │   ├── dataService.js    # Existing (may expose item names per category)
│   │   └── regexSearchService.js  # NEW: build regex from selected names, ≤250 chars, exact match
│   ├── utils/
│   │   └── regexBuilder.js   # NEW (optional): trie/shortened-substring logic used by service
│   ├── components/      # NEW or extend: regex display + copy component
│   ├── adapters/       # Existing grid adapters (may expose getItemId/getItemName)
│   └── config/
│       └── gridConfig.js     # Existing
public/
└── data/
    └── items/           # Existing JSON per category (source of item names)
tests/
├── unit/
│   └── services/
│       └── regexSearchService.test.js  # NEW
├── integration/
│   └── views/
│       └── selectionAndRegex.test.js   # NEW (or extend listView/gridView tests)
```

**Structure Decision**: Single-page app; new selection and regex behavior integrated into existing views and services. Regex generation isolated in `regexSearchService.js` (and optional `regexBuilder.js`) for testability. Selection state is a single source of truth (e.g. Set of item IDs) shared by list and grid; views subscribe or receive callbacks to update visuals.

## Constitution Check (Post–Phase 1)

Re-check after Phase 1 design:

- **Code Quality**: ✅ data-model and contracts align with existing patterns; single selection store and regex service keep responsibilities clear.
- **Testing**: ✅ Unit (regex, selection) and integration (list/grid + regex UI) defined in plan and quickstart.
- **User Experience**: ✅ Selection and regex display/copy specified; visuals consistent across list and grid.
- **Performance**: ✅ Targets (regex &lt;50ms, selection &lt;100ms) unchanged.
- **Complexity**: ✅ No new violations; regex fallback and truncation documented in research and contracts.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. Compact regex logic is justified by the 250-character game limit and is encapsulated in the regex service.
