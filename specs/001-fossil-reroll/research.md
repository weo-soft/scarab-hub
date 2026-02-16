# Research: Fossil Rerolling

**Date**: 2025-01-27  
**Feature**: Fossil Rerolling  
**Phase**: 0 - Outline & Research

## Technical Decisions

### Data Structure: Reuse Essence Patterns

**Decision**: Use the same data loading and structure patterns as the Essence feature.

**Rationale**: 
- User confirmed: "Similar to the Essence rerolling"
- Fossil prices already follow same JSON structure: `{ name, chaosValue, divineValue, detailsId }`
- URL patterns match: `fossilPrices_{league}.json` (same as `essencePrices_{league}.json`)
- Existing `dataService.js` and `leagueService.js` can be extended
- Consistent data handling reduces complexity and maintenance burden

**Data Flow**:
1. Load Fossil prices from `fossilPrices_{league}.json` using existing data fetcher
2. Load Wild Crystallised Lifeforce price from `lifeforcePrices_{league}.json`
3. All Fossils belong to a single reroll group (simpler than Essence's multiple groups)
4. Calculate expected value with equal weighting for all Fossils
5. Display in list view similar to Essences

**Alternatives considered**:
- Separate data service: Unnecessary duplication, violates DRY principle
- Different data structure: Would require new parsing logic, inconsistent with existing patterns

### Reroll Group Classification

**Decision**: All Fossils belong to a single reroll group where each Fossil can reroll into any other Fossil.

**Rationale**:
- User requirement: "Similar to the Essence rerolling" - but simpler grouping
- All Fossils can reroll into each other with equal probability
- No special groups or classification logic needed (unlike Essence's Deafening/Shrieking/Special groups)
- Simpler than Essence implementation - single group instead of multiple groups

**Classification Logic**:
```javascript
function classifyRerollGroup(fossilName) {
  // All Fossils belong to the same reroll group
  // No classification needed - all Fossils can reroll into each other
  return 'fossil'; // Single group identifier
}
```

**Alternatives considered**:
- Multiple groups: No game mechanics support this, all Fossils reroll into each other
- No grouping: Would require group logic for calculations, single group is cleaner

### Expected Value Calculation: Equal Weighting

**Decision**: Calculate expected value using equal weighting for all Fossils in the single reroll group.

**Rationale**:
- User requirement: Similar to Essence rerolling with equal weighting
- Simpler than Scarab's weighted approach (no dropWeight needed)
- Formula: Expected Value = (Σ price_i) / n for all Fossils
- Threshold calculation: Account for reroll cost (30 Wild Crystallised Lifeforce)
- Single group calculation (simpler than Essence's multiple groups)

**Formula**:
```
For the single Fossil reroll group:
  Expected Value = (Σ price_i) / n  (where n = number of Fossils)
  Reroll Cost = 30 × Wild Crystallised Lifeforce price
  Threshold = Expected Value - Reroll Cost
```

**Alternatives considered**:
- Weighted approach (like Scarabs): Contradicts user requirement for equal weighting
- Median value: Less accurate for equal probability scenarios
- Simple average: Same as equal weighting, but formula clarifies intent

### Cost Calculation: Wild Crystallised Lifeforce

**Decision**: Factor in the cost of 30 Wild Crystallised Lifeforce when calculating profitability.

**Rationale**:
- User requirement: "It costs 30 wild crystallised Liefeforce" per reroll
- Cost is fixed quantity (30 units) but price varies with market
- Load price from `lifeforcePrices_{league}.json` (already available)
- Cost must be subtracted from expected value to determine profitability
- Display cost clearly to users

**Cost Calculation**:
```javascript
const lifeforcePrice = getLifeforcePrice('Wild Crystallised Lifeforce');
const rerollCost = 30 * lifeforcePrice;
const netExpectedValue = expectedValue - rerollCost;
```

**Alternatives considered**:
- Hardcoded cost: Market prices change, must use current price data
- User input: Unnecessary complexity, price data already available

### List View: Reuse Essence Implementation

**Decision**: Extend existing Essence list view for Fossil display with Fossil-specific features.

**Rationale**:
- User requirement: "similar Fashion as for the Essences"
- Existing `essenceListView.js` provides proven, tested implementation
- Consistent UX across features
- Selection functionality can be added to existing list view pattern
- Reuses sorting, filtering, and display logic

**Extensions Needed**:
- Add selection state (selected for rerolling / kept)
- Display reroll cost prominently (30 Wild Crystallised Lifeforce)
- Visual indicators for profitability status (reuse color utilities)
- Single reroll group display (simpler than Essence's multiple groups)

**Alternatives considered**:
- New list view from scratch: Unnecessary duplication, inconsistent UX
- Grid view: Not required, user specifically requested similar to Essences

### Selection Functionality

**Decision**: Implement click-to-toggle selection for marking Fossils for rerolling or keeping.

**Rationale**:
- User requirement: "The User should be able to see what Fossils to reroll and which to keep"
- Simple toggle interaction (click to select/deselect)
- Visual feedback for selected state
- Selection state stored in model, persisted in calculations
- Similar to Essence selection pattern

**Interaction Pattern**:
- Click Fossil item → Toggle selection state
- Selected items visually distinguished (background color, border, icon)
- Selection affects expected value calculations (only selected Fossils included)

**Alternatives considered**:
- Checkbox UI: More explicit but adds visual clutter
- Multi-select with modifier keys: Unnecessary complexity for single selection
- Separate selection panel: Adds navigation overhead, less intuitive

### Testing Strategy

**Decision**: Use Vitest for unit and integration tests, manual testing for E2E, following existing patterns.

**Rationale**:
- Vitest already configured and used for Essence feature
- Unit tests for Fossil model and validation logic
- Unit tests for equal-weighted expected value calculations
- Integration tests for list view and selection functionality
- Manual E2E testing for user scenarios (consistent with Essence approach)

**Test Coverage Targets**:
- Fossil model: 80%+ coverage
- Expected value calculations: 80%+ coverage
- List view rendering: Integration tests for key interactions
- Selection functionality: Unit and integration tests

**Alternatives considered**:
- New testing framework: Unnecessary, Vitest works well
- Automated E2E: Overkill for single-page feature, manual testing sufficient

### Performance Considerations

**Decision**: Optimize for ~23 Fossil items with efficient single group calculations.

**Rationale**:
- ~23 Fossils to process (fewer than ~400 Essences)
- Single reroll group (simpler than Essence's multiple groups)
- Expected value calculation: O(n) single pass through all Fossils
- List view rendering: Virtual scrolling not needed for ~23 items
- Selection state: In-memory Set for O(1) lookups

**Optimizations**:
- Pre-compute reroll group on data load (all Fossils in one group)
- Cache expected value calculation
- Debounce selection state updates if needed
- Efficient DOM updates for list view

**Targets**:
- Initial load <2s (constitution requirement)
- List rendering <100ms
- Selection toggle <50ms
- Calculations <50ms

## Unresolved Questions

None - all technical decisions made based on requirements, existing patterns, and best practices. Single reroll group simplifies implementation compared to Essence's multiple groups.

## References

- Existing Essence implementation: `src/js/models/essence.js`, `src/js/services/essenceCalculationService.js`
- Existing Essence list view: `src/js/views/essenceListView.js`
- Existing data service: `src/js/services/dataService.js`
- Vitest Documentation: https://vitest.dev/

