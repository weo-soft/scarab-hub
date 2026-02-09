# Research: Regex Search for Selected Flip/Reroll Items

**Date**: 2025-02-09  
**Feature**: Regex Search for Selected Flip/Reroll Items  
**Phase**: 0 - Outline & Research

## Technical Decisions

### 1. Regex Generation Strategy (≤250 Characters, Exact Match)

**Decision**: Use a two-tier approach: (1) build a compact regex from the set of selected item names (trie-based or DFA-minimization style) so that common prefixes/suffixes are merged; (2) if the resulting regex exceeds 250 characters, fall back to a strategy based on shortened unique substrings—i.e. for each selected name, find a minimal substring that is unique among all names in the category, then form an alternation of those substrings (or of escaped literal names) that fits within 250 characters.

**Rationale**:
- The game imposes a 250-character limit; a naive alternation of full names (e.g. `(Name1|Name2|...)`) quickly exceeds the limit for large selections.
- Trie-based regex (or DFA minimization) merges common prefixes/suffixes and produces a shorter pattern while preserving exact match over the given set.
- When even the optimized regex is too long (e.g. many selected items with little common structure), the only way to stay under 250 chars is to match on shorter strings. Using "shortest unique substring" per item ensures we still match exactly the selected items when the full name set is known (no false positives), and we can truncate or combine substrings to fit the limit.
- Implementation can be pure JavaScript; no need for WebAssembly or external regex engines for the game’s search (the output is a string the user pastes into the game).

**Alternatives considered**:
- **Overmatch + exclusions**: Match a broader pattern then exclude. Rejected for complexity and risk of the game’s regex engine differing; exact match with shortened unique substrings is simpler and safer.
- **External library (e.g. regexgen)**: Acceptable if dependency is small and output is a string; we still need a fallback when the generated regex is &gt;250 chars (e.g. shorten or use unique substrings). Document as optional dependency; fallback must remain in our control.
- **Server-side generation**: Spec and app are client-side only; no backend. Rejected.

**Implementation outline**:
- **Primary**: Build a single regex that exactly matches the selected names (e.g. trie → regex, or alternation of escaped names with common-prefix factoring). Validate length ≤250; if over, go to fallback.
- **Fallback**: For each selected name, compute a shortest unique substring (or shortest prefix/suffix that is unique). Build alternation `(sub1|sub2|...)` or factored form; if still over 250 chars, shorten substrings or drop items until under limit (with clear user feedback that not all items could be included in the regex).

### 2. Item Name Source and Per-Category Scope

**Decision**: Use the same item data that backs the list and grid for each category. Item names are read from the JSON files under `public/data/items` (e.g. `scarabs.json`, `vials.json`, `catalysts.json`). The display name for regex matching is taken from a consistent field per file: prefer `name` when present, else `baseType` (for files that use that structure). The set of all names for the current category is the "known set" for exact-match validation and for unique-substring computation.

**Rationale**:
- Spec states: "All the relevant item names per category can be found in their corresponding json files in public/data/items."
- Existing data already drives list/grid; reusing it keeps one source of truth and avoids mismatches between display and regex.
- Some files use `name`, some use `lines[].name` or `lines[].baseType`; the adapter or data layer already normalizes to a list of items with an identifier and display name. Regex generator receives an array of strings (the names for the current category) and the subset that is selected.

**Alternatives considered**:
- Separate "search names" file: Redundant; would drift from display names.
- Use `id`/`detailsId` instead of name: Game search matches on display name; we must output a regex that matches the same names the user sees and the game uses.

### 3. Selection State: Single Source of Truth, Synced List and Grid

**Decision**: Maintain one selection store per category: a Set of item IDs (or equivalent stable identifiers). List view and grid view both read from and write to this store on click (toggle). When selection changes, both views update their visual indication (list row and grid cell) from the same set. Optionally, a small "selection module" or facade exposes getSelectedIds(), toggle(id), add(id), remove(id), and subscribe(callback) so list and grid can re-render or update only affected elements.

**Rationale**:
- Spec: "When the user selects an item, there should be a visual indication on both the Cell and the Listview Entry" and "selecting or unselecting in the list updates the grid, and selecting or unselecting in the grid updates the list."
- A single Set (or equivalent) prevents desync. Views are consumers; they do not each hold their own selection state.
- Existing code has list→grid highlight (e.g. highlightCellForScarab); we extend to a bidirectional selection model: click in list toggles ID in Set and updates grid cell appearance; click on grid toggles ID in Set and updates list row appearance.

**Alternatives considered**:
- Each view holds its own selection and syncs via events: More fragile; risk of desync. Single store is simpler.
- Selection in URL or LocalStorage only: Spec says selection can be per-session; in-memory is sufficient for MVP. Persistence can be added later without changing the single-source-of-truth design.

### 4. Visual Indication of Selection

**Decision**: Use a consistent treatment for "selected" in both list and grid: e.g. a distinct background color, border, or small icon. Reuse or mirror existing highlight styles (e.g. from listView/gridView) so the selected state is clearly visible and consistent with the rest of the app. No new design system; align with current colorUtils / CSS.

**Rationale**:
- Constitution and spec require clear, consistent UX. Same treatment in list and grid avoids confusion.
- Existing views already have hover/highlight; selected is a persistent highlight for the same item in both views.

### 5. Regex Display and Copy

**Decision**: Provide a visible control that shows the current regex (or a message like "Select at least one item" / "Regex (250 char max): …") and a "Copy" action so the user can paste into the game. Exact placement (e.g. above list, in a toolbar, in a collapsible panel) is an implementation detail; the spec requires the regex to be "available" (display and copy).

**Rationale**:
- FR-008: "System MUST make the generated regex available to the user (e.g. display and copy) so it can be used in the game's search."
- Copy-to-clipboard is standard in browsers (navigator.clipboard.writeText); no backend needed.

### 6. Game Regex Compatibility

**Decision**: Do not depend on game-specific regex dialect documentation. Generate regex that is standard (JavaScript-style character escaping, no lookbehinds/lookaheads unless we confirm the game supports them). Prefer literal matching and simple alternation; avoid complex constructs. If the game is known to use a particular engine (e.g. PCRE), we can note that in docs but keep the generator conservative (literal + alternation + basic character classes) to maximize compatibility.

**Rationale**:
- Spec says the game "provides a search functionality that supports regular Expressions" but does not specify the engine. Conservative regex is safest.
- Escaping special regex characters in item names is required (e.g. parentheses, dots, `*`, `+`).

### 7. Testing Strategy

**Decision**: Unit tests for regex generation: given a set of names and a "all names in category" set, assert the generated regex is ≤250 chars, matches every selected name, and matches no unselected name. Unit tests for selection state (toggle, add, remove, subscribe). Integration tests for list and grid: simulate clicks, assert selection Set and visuals update in both views and regex output updates. Manual test: paste generated regex into game search and confirm behavior.

**Rationale**:
- Constitution requires test coverage and deterministic tests. Regex logic and selection logic are pure and easy to unit test. Integration tests cover sync and UI.
- No E2E against the game itself; manual verification for in-game behavior.

## Unresolved Questions

None. All technical decisions above are sufficient to proceed to Phase 1 (data model and contracts).

## References

- Spec: `specs/001-regex-item-search/spec.md`
- Item data: `public/data/items/*.json`
- List view: `src/js/views/listView.js`
- Generic grid: `src/js/views/genericGridView.js`
- Regex from string list (trie/DFA): e.g. [regexgen](https://github.com/devongovett/regexgen), [regex-trie](https://github.com/mathiasbynens/regex-trie-cli); SO: [Minimal DFA / regular expression from set of strings](https://stackoverflow.com/questions/67987964/minimal-dfa-regular-expression-from-set-of-strings)
