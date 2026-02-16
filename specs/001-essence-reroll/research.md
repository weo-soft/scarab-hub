# Research: Essence Rerolling

**Date**: 2025-01-27  
**Feature**: Essence Rerolling  
**Phase**: 0 - Outline & Research

## Technical Decisions

### Data Structure: Reuse Scarab Patterns

**Decision**: Use the same data loading and structure patterns as the Scarab feature.

**Rationale**: 
- User confirmed: "The Structure of the prices and the urls is the same as for the scarabs"
- Essence prices already follow same JSON structure: `{ name, chaosValue, divineValue, detailsId }`
- URL patterns match: `essencePrices_{league}.json` (same as `scarabPrices_{league}.json`)
- Existing `dataService.js` and `leagueService.js` can be extended
- Consistent data handling reduces complexity and maintenance burden

**Data Flow**:
1. Load Essence prices from `essencePrices_{league}.json` using existing data fetcher
2. Load Primal Crystallised Lifeforce price from `lifeforcePrices_{league}.json`
3. Classify Essences into reroll groups
4. Calculate expected value with equal weighting within groups
5. Display in list view similar to Scarabs

**Alternatives considered**:
- Separate data service: Unnecessary duplication, violates DRY principle
- Different data structure: Would require new parsing logic, inconsistent with existing patterns

### Reroll Group Classification

**Decision**: Classify Essences into reroll groups based on name patterns and special rules.

**Rationale**:
- Deafening Essences: All "Deafening Essence of ..." can reroll into each other
- Shrieking Essences: All "Shrieking Essence of ..." can reroll into each other
- Special group: "Essence of Horror", "Essence of Hysteria", "Essence of Insanity", "Essence of Delirium" can only reroll into each other
- Special group cannot be created from other Essence types
- Pattern matching on name is reliable and efficient

**Classification Logic**:
```javascript
function classifyRerollGroup(essenceName) {
  // Special group (exact match)
  const specialGroup = ['Essence of Horror', 'Essence of Hysteria', 
                        'Essence of Insanity', 'Essence of Delirium'];
  if (specialGroup.includes(essenceName)) {
    return 'special';
  }
  
  // Deafening group (starts with "Deafening Essence of")
  if (essenceName.startsWith('Deafening Essence of')) {
    return 'deafening';
  }
  
  // Shrieking group (starts with "Shrieking Essence of")
  if (essenceName.startsWith('Shrieking Essence of')) {
    return 'shrieking';
  }
  
  // Unknown/unclassified (should not occur in practice)
  return null;
}
```

**Alternatives considered**:
- Database lookup: Overkill, adds complexity and data dependency
- Configuration file: Unnecessary, logic is simple and stable
- Manual tagging: Error-prone, requires maintenance

### Expected Value Calculation: Equal Weighting

**Decision**: Calculate expected value using equal weighting for all Essences within the same reroll group.

**Rationale**:
- User requirement: "all Essences are weighted the Same" within reroll groups
- Simpler than Scarab's weighted approach (no dropWeight needed)
- Formula: Expected Value = (Σ price_i) / n for all Essences in group
- Threshold calculation: Account for reroll cost (30 Primal Crystallised Lifeforce)
- Each reroll group calculated independently

**Formula**:
```
For each reroll group:
  Expected Value = (Σ price_i) / n  (where n = number of Essences in group)
  Reroll Cost = 30 × Primal Crystallised Lifeforce price
  Threshold = Expected Value - Reroll Cost
```

**Alternatives considered**:
- Weighted approach (like Scarabs): Contradicts user requirement for equal weighting
- Median value: Less accurate for equal probability scenarios
- Simple average: Same as equal weighting, but formula clarifies intent

### Cost Calculation: Primal Crystallised Lifeforce

**Decision**: Factor in the cost of 30 Primal Crystallised Lifeforce when calculating profitability.

**Rationale**:
- User requirement: "the user has to use 30 Primal Crystallised Lifeforce" per reroll
- Cost is fixed quantity (30 units) but price varies with market
- Load price from `lifeforcePrices_{league}.json` (already available)
- Cost must be subtracted from expected value to determine profitability
- Display cost clearly to users

**Cost Calculation**:
```javascript
const lifeforcePrice = getLifeforcePrice('Primal Crystallised Lifeforce');
const rerollCost = 30 * lifeforcePrice;
const netExpectedValue = expectedValue - rerollCost;
```

**Alternatives considered**:
- Hardcoded cost: Market prices change, must use current price data
- User input: Unnecessary complexity, price data already available

### List View: Reuse Scarab Implementation

**Decision**: Extend existing Scarab list view for Essence display with Essence-specific features.

**Rationale**:
- User requirement: "similar List view as used for the Scarabs"
- Existing `listView.js` provides proven, tested implementation
- Consistent UX across features
- Selection functionality can be added to existing list view
- Reuses sorting, filtering, and display logic

**Extensions Needed**:
- Add selection state (selected for rerolling / kept)
- Display reroll group information
- Show reroll cost prominently
- Visual indicators for profitability status (reuse color utilities)

**Alternatives considered**:
- New list view from scratch: Unnecessary duplication, inconsistent UX
- Grid view: Not required, user specifically requested list view

### Selection Functionality

**Decision**: Implement click-to-toggle selection for marking Essences for rerolling or keeping.

**Rationale**:
- User requirement: "The User should be able to determine what essences to reroll and which ones to Keep"
- Simple toggle interaction (click to select/deselect)
- Visual feedback for selected state
- Selection state stored in model, persisted in calculations
- Similar to checkbox pattern but more intuitive for list items

**Interaction Pattern**:
- Click Essence item → Toggle selection state
- Selected items visually distinguished (background color, border, icon)
- Selection affects expected value calculations (only selected Essences included)

**Alternatives considered**:
- Checkbox UI: More explicit but adds visual clutter
- Multi-select with modifier keys: Unnecessary complexity for single selection
- Separate selection panel: Adds navigation overhead, less intuitive

### Testing Strategy

**Decision**: Use Vitest for unit and integration tests, manual testing for E2E, following existing patterns.

**Rationale**:
- Vitest already configured and used for Scarab feature
- Unit tests for reroll group classification logic
- Unit tests for equal-weighted expected value calculations
- Integration tests for list view and selection functionality
- Manual E2E testing for user scenarios (consistent with Scarab approach)

**Test Coverage Targets**:
- Reroll group classification: 100% (critical logic)
- Expected value calculations: 80%+ coverage
- List view rendering: Integration tests for key interactions
- Selection functionality: Unit and integration tests

**Alternatives considered**:
- New testing framework: Unnecessary, Vitest works well
- Automated E2E: Overkill for single-page feature, manual testing sufficient

### Performance Considerations

**Decision**: Optimize for ~400 Essence items with efficient group lookups and calculations.

**Rationale**:
- ~400 Essences to process (more than ~150 Scarabs)
- Reroll group classification: O(n) single pass through Essences
- Expected value calculation: O(n) per group, groups processed in parallel
- List view rendering: Virtual scrolling not needed for ~400 items
- Selection state: In-memory Map for O(1) lookups

**Optimizations**:
- Pre-compute reroll groups on data load
- Cache expected value calculations per group
- Debounce selection state updates if needed
- Efficient DOM updates for list view

**Targets**:
- Initial load <2s (constitution requirement)
- List rendering <100ms
- Selection toggle <50ms
- Calculations <50ms

## Unresolved Questions

None - all technical decisions made based on requirements, existing patterns, and best practices.

## References

- Existing Scarab implementation: `src/js/models/scarab.js`, `src/js/services/calculationService.js`
- Existing list view: `src/js/views/listView.js`
- Existing data service: `src/js/services/dataService.js`
- Vitest Documentation: https://vitest.dev/
