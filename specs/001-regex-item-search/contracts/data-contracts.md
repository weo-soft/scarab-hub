# Data Contracts: Regex Search for Selected Flip/Reroll Items

**Date**: 2025-02-09  
**Feature**: Regex Search for Selected Flip/Reroll Items  
**Phase**: 1 - Design & Contracts

## Input Data Contracts

### Item Data (existing, per category)

Item names are sourced from existing JSON under `public/data/items/`. File structure varies; the following contract describes what the regex feature consumes after normalization.

**Files**: e.g. `scarabs.json`, `vials.json`, `catalysts.json`, `deliriumOrbs.json`, etc.

**Normalized shape** (produced by existing data layer or adapter):

- Each category exposes a list of items. Each item MUST have:
  - `id` (string): Stable identifier (e.g. `detailsId` or slug).
  - `name` (string): Display name used for in-game search (from JSON field `name` or `baseType` as appropriate per file).

**No new JSON schema** is required; the regex service consumes an in-memory structure built from existing item loading.

---

## Internal Data Contracts

### SelectionState

**Purpose**: Single source of truth for which items are selected in the current category.

```typescript
interface SelectionState {
  categoryId: string;
  selectedIds: Set<string>;
}
```

**Operations**:
- `getSelectedIds(): Set<string>`
- `toggle(id: string): void`
- `add(id: string): void`
- `remove(id: string): void`
- `clear(): void`
- `has(id: string): boolean`
- `subscribe(callback: () => void): () => void`  // optional; unsubscribe on return

**Invariants**:
- selectedIds contains only IDs that exist in the current category.
- List and grid both read/write this state; no separate copy in either view.

---

### CategoryItemNames

**Purpose**: Known set of item names for one category, for regex generation and exact-match validation.

```typescript
interface CategoryItemNames {
  categoryId: string;
  /** Map item id → display name (used in game search) */
  namesById: Map<string, string>;
  /** All display names in the category (for validation / unique substring) */
  names: string[];
}
```

**Source**: Built when category data is loaded; keys from item `id`, values from item `name` (or `baseType` where applicable).

---

### SearchRegexResult

**Purpose**: Result of regex generation for the current selection.

```typescript
interface SearchRegexResult {
  /** The regex string (length ≤ 250) */
  value: string;
  /** value.length */
  length: number;
  /** True if not all selected items could be included (fallback shortened) */
  truncated?: boolean;
  /** Number of selected items this regex is intended to match */
  selectedCount: number;
  categoryId: string;
}
```

**When no selection**: Caller may receive `null` or `{ value: '', length: 0, selectedCount: 0, categoryId }`; UI shows "Select at least one item" or disables copy.

---

## Regex Generation Contract

### generateRegex(selectedIds: Set<string>, categoryNames: CategoryItemNames): SearchRegexResult | null

**Input**:
- `selectedIds`: Set of item IDs currently selected.
- `categoryNames`: Names and IDs for the current category.

**Output**:
- If selectedIds is empty: return `null` (or equivalent).
- Otherwise: SearchRegexResult with `value.length ≤ 250`, and the regex must **exactly match** the set of names whose IDs are in selectedIds (when tested against `categoryNames.names`): no false positives, no false negatives.

**Behavior**:
1. Resolve selected names from selectedIds using categoryNames.namesById.
2. If no names, return null.
3. Build regex (trie-based or alternation with common factoring). Escape special regex characters in names.
4. If length &gt; 250: use fallback (e.g. shortest unique substring per selected name); if still over 250, shorten or drop items and set `truncated: true`.
5. Return SearchRegexResult.

**Validation (tests)**:
- For every name in the selected set, regex must match that name.
- For every name in categoryNames.names that is not in the selected set, regex must not match that name.
- value.length ≤ 250.

---

## UI Contracts (informal)

### List view

- **Click on list row**: Toggle selection for the item’s ID in SelectionState; update visual (e.g. background/border) for selected state.
- **Visual**: Selected row and corresponding grid cell both show the same selected state (read from SelectionState).

### Grid view

- **Click on cell**: Resolve item ID for that cell; toggle selection for that ID in SelectionState; update cell visual and list row visual.

### Regex display

- **Input**: SearchRegexResult (or null).
- **Display**: Show regex string (or message when null/empty). Provide "Copy" that writes `result.value` to clipboard.
- **Update**: When SelectionState or category changes, regenerate regex and update display.

---

## Error Handling

- **Missing name for ID**: Omit that ID from regex input; do not throw.
- **Invalid or empty categoryNames**: Return null or empty result; do not throw.
- **Copy failed** (e.g. clipboard permission): Show user-visible message; do not throw.

---

## Versioning

**Current Version**: 1.0.0

**Breaking Changes**: None (initial version).
