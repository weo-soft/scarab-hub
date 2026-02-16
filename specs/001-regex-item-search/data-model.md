# Data Model: Regex Search for Selected Flip/Reroll Items

**Date**: 2025-02-09  
**Feature**: Regex Search for Selected Flip/Reroll Items  
**Phase**: 1 - Design & Contracts

## Entities

### Selection (per category)

Represents the set of items currently selected by the user for the active item category. Shared between list view and grid view; single source of truth.

**Attributes**:
- `categoryId` (string, required): Identifier for the item category (e.g. "scarabs", "vials", "catalysts")
- `selectedIds` (Set&lt;string&gt;, required): Set of item IDs that are selected. Empty when nothing is selected.

**Relationships**:
- Scoped to one category at a time (the currently viewed category)
- Item IDs correspond to the same IDs used by list/grid (e.g. `item.id` or `detailsId`)

**Validation Rules**:
- Every ID in `selectedIds` must exist in the current category's item set
- No duplicate IDs (Set guarantees this)

**State Transitions**:
- Initial: Empty set when category is first loaded or when user has not selected anything
- Toggle: User clicks list entry or grid cell → add or remove that item's ID from the set
- Category change: Selection may be cleared or preserved per product decision (e.g. clear on tab switch, or persist per category in memory)

### Item (existing, extended for selection)

Items are already represented in the app (e.g. Scarab, Essence, Vial). For this feature we only add:
- Whether the item is selected (derived: id ∈ Selection.selectedIds for current category)
- Display name used for regex (from item data: `name` or `baseType`)

No new persistent item attributes required; selection is held in the Selection entity.

### SearchRegex

Represents the generated regular expression string for the current selection.

**Attributes**:
- `value` (string, required): The regex string, length ≤ 250
- `length` (number, required): value.length
- `truncated` (boolean, optional): True if not all selected items could be represented within 250 chars (fallback used)
- `selectedCount` (number, required): Number of selected items this regex is intended to match
- `categoryId` (string, required): Category this regex applies to

**Relationships**:
- Derived from: Selection (selectedIds) + category's full name list
- Valid only for the current category's known item names

**Validation Rules**:
- value.length ≤ 250
- When evaluated against the category's full name list, the regex matches exactly the names of items whose IDs are in Selection.selectedIds (no false positives, no false negatives among known names)

### CategoryItemNames

Represents the known list of item names for one category, used for regex generation and validation.

**Attributes**:
- `categoryId` (string, required): Identifier for the category
- `namesById` (Map&lt;string, string&gt; or equivalent): Map from item ID to display name. Keys = item IDs, values = names used in game search.
- `names` (array&lt;string&gt;, derived): All display names in the category (for validation and unique-substring computation)

**Relationships**:
- Sourced from item data for that category (e.g. `public/data/items/{category}.json`)
- One per category; loaded when category is loaded

**Validation Rules**:
- Every name must be non-empty after trim
- Item IDs must be unique within the category

## Data Flow

### Initial Load (per category)

1. Load item data for category (existing flow: e.g. dataService + adapter).
2. Build CategoryItemNames for that category: id → name (from `name` or `baseType` per file structure).
3. Initialize Selection for category: selectedIds = empty Set (or restore from in-memory cache if we persist per category).
4. Render list and grid; neither shows selection yet.
5. Regex output: empty or message "Select at least one item".

### Selection Toggle (list or grid)

1. User clicks list entry or grid cell; event handler receives item ID (and optionally item object).
2. Selection: if ID in selectedIds, remove it; otherwise add it.
3. Notify subscribers or re-render: list updates visual for that row; grid updates visual for that cell.
4. Recompute SearchRegex from Selection.selectedIds and CategoryItemNames; update regex display and copy buffer.

### Regex Generation

1. Input: selectedIds (Set), namesById (Map), full name list (array).
2. Get selected names: names = selectedIds.map(id => namesById.get(id)).filter(Boolean).
3. If names is empty → return null or sentinel (no regex).
4. Build regex (trie-based or alternation); if length &gt; 250, use fallback (shortest unique substrings, then trim to fit).
5. Output: SearchRegex { value, length, truncated?, selectedCount, categoryId }.
6. Validate: run regex against full name list; assert matches exactly the selected names (unit test and optionally runtime check in dev).

### Category Switch

1. When user switches to another category, current Selection and SearchRegex refer to the new category.
2. Selection for the new category: empty or restored from per-category in-memory state, depending on product choice.
3. Recompute regex for the new category's selection.

## Data Storage

- **In-memory**: Selection.selectedIds per category; CategoryItemNames derived from loaded item data; SearchRegex derived on demand.
- **LocalStorage**: Out of scope for MVP per spec; can be added later (e.g. persist selectedIds per category under a key like `scarabHub_regexSelection_{categoryId}`).

## Edge Cases

- **No selection**: Regex display shows message or empty; copy disabled or copies empty string. No regex sent to game.
- **All items selected**: Regex should match all names (e.g. single short pattern or alternation); must still be ≤250 chars (may require fallback).
- **Single item selected**: Regex is escaped literal of that name, or unique substring.
- **Many items, regex &gt; 250 after fallback**: Set `truncated` true; include as many items as fit in 250 chars; show message that not all selected items are in the regex.
- **Missing name for an ID**: Exclude from regex generation; do not match that ID.
- **Empty category**: No names; regex remains empty; selection remains empty.
