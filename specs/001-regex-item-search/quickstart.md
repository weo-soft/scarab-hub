# Quickstart Guide: Regex Search for Selected Flip/Reroll Items

**Date**: 2025-02-09  
**Feature**: Regex Search for Selected Flip/Reroll Items  
**Phase**: 1 - Design & Contracts

## Setup

### Prerequisites

- Node.js 18+
- Modern web browser (Chrome, Firefox, Safari, Edge - latest 2 versions)
- Scarab Hub repository with dependencies installed

### Installation

```bash
git clone <repository-url>
cd scarab-hub
npm install
npm run dev
```

Open `http://localhost:5173` (or the port shown in the terminal).

## Test Scenarios

### Scenario 1: Select Items and Get Regex (P1)

**Goal**: Verify that selecting items and requesting the regex produces a copyable string that exactly matches the selected names and is ≤250 characters.

**Steps**:
1. Open a category that has list and grid (e.g. Scarabs).
2. Select one or more items by clicking list entries or grid cells.
3. Confirm both the list row and the grid cell show a clear selected state.
4. Locate the regex display; confirm it shows a non-empty regex (or a message if no selection).
5. Confirm the regex length is ≤250 characters.
6. Click Copy and paste into a text editor; verify the string matches what was displayed.
7. (Manual) Paste the regex into the game search and confirm it matches only the selected items.

**Expected Results**:
- Selection is visible in both list and grid.
- Regex is displayed and copyable.
- Regex length ≤250.
- No console errors.

---

### Scenario 2: Selection Sync Between List and Grid (P2)

**Goal**: Verify that selection state is shared: toggling in the list updates the grid, and toggling in the grid updates the list.

**Steps**:
1. Open a category with both list and grid visible.
2. Click a list entry for item A; confirm the corresponding grid cell shows selected.
3. Click the same list entry again; confirm both list and grid show unselected.
4. Click a grid cell for item B; confirm the corresponding list entry shows selected.
5. Click the grid cell for item B again; confirm both show unselected.
6. Select several items via list, then confirm all corresponding grid cells are selected; repeat by selecting via grid and confirming list.

**Expected Results**:
- One selection state; list and grid always agree.
- Toggle works from either view.

---

### Scenario 3: Regex Under 250 Characters for Large Selection (P3)

**Goal**: When many items are selected so that a simple alternation would exceed 250 characters, the system still produces a valid regex ≤250 characters that exactly matches the selected items (or clearly indicates truncation).

**Steps**:
1. Open a category with many items (e.g. Scarabs).
2. Select a large set of items (e.g. 20+).
3. Check the regex display: either the regex is ≤250 chars or a message indicates that not all items could be included.
4. If truncated, verify the regex still matches only selected items (or a subset) and no unselected items.
5. Copy and paste into game (if available) and confirm behavior.

**Expected Results**:
- Regex never exceeds 250 characters.
- When truncation is used, UI indicates it and the regex remains exact for the subset included.

---

### Scenario 4: No Selection and Empty State

**Goal**: When no items are selected, the regex area shows an appropriate message and copy is disabled or copies nothing.

**Steps**:
1. Open a category; do not select any items.
2. Check regex display: "Select at least one item" or equivalent.
3. Select one item, then deselect it; confirm the empty state again.

**Expected Results**:
- No regex shown when selection is empty; clear messaging.
- No errors.

---

### Scenario 5: Category Switch

**Goal**: When switching to another category, selection and regex apply to the new category (selection may be empty or restored per implementation).

**Steps**:
1. Select some items in category A; note the regex.
2. Switch to category B.
3. Confirm regex/selection state reflects category B (e.g. empty or B’s selection).
4. Select items in B; confirm regex updates for B’s names.
5. Switch back to A; confirm A’s selection and regex (or empty) are shown.

**Expected Results**:
- Regex and selection are scoped to the current category.
- No cross-category leakage.

---

## Manual Testing Checklist

- [ ] Select/deselect in list updates grid
- [ ] Select/deselect in grid updates list
- [ ] Visual indication of selection in both list and grid
- [ ] Regex displayed and ≤250 characters
- [ ] Copy copies the correct string
- [ ] Regex exactly matches selected items (manual check in game or with test harness)
- [ ] Empty selection shows clear message
- [ ] Large selection still produces valid regex (or truncation message)
- [ ] Category switch resets or restores selection as designed
- [ ] No console errors

## Known Limitations

- Regex compatibility with the game’s search engine is not guaranteed; conservative patterns are used.
- Selection persistence across sessions is out of scope for MVP unless added later.
- Truncation when &gt;250 chars may exclude some selected items; user should be informed.

## Integration with Existing Features

- Uses existing item data and list/grid views.
- Selection state is new; list and grid are extended to read/write it and show visuals.
- Regex service is new; consumes item names from existing data layer.
- Styling aligns with existing colorUtils and CSS.
