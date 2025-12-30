# Research: 3-to-1 Trade Simulation

**Date**: 2025-01-27  
**Feature**: 3-to-1 Trade Simulation  
**Phase**: 0 - Outline & Research

## Technical Decisions

### Rare Scarab Definition

**Decision**: Define rare scarabs based on drop weight threshold (lower drop weight = rarer).

**Rationale**: 
- Drop weight directly represents the probability of a scarab being returned in the 3-to-1 vendor recipe
- Lower drop weight means the scarab is less likely to be returned, making it "rare" in the context of vendor outcomes
- Aligns with game mechanics where drop weight determines rarity in vendor recipes
- Provides objective, data-driven definition that doesn't depend on market fluctuations
- Default threshold: scarabs with drop weight in the bottom 10% of all scarabs (configurable)

**Alternatives considered**:
- Price threshold (higher price = rarer): Market-dependent, can change frequently, doesn't reflect actual vendor recipe rarity
- User-defined: Adds complexity to configuration, may not align with game mechanics
- Combination of drop weight and price: More complex, price volatility makes it less reliable

**Implementation**:
- Calculate drop weight percentile distribution across all scarabs
- Default: scarabs with drop weight <= 10th percentile are considered rare
- Configurable threshold in simulation configuration (5%, 10%, 15%, 20%, or custom value)
- Store threshold in simulation configuration for event detection

### Large-Scale Simulation Performance

**Decision**: Use batch processing with progress updates and efficient data structures for 1 million transactions.

**Rationale**:
- Processing 1 million transactions synchronously would block the UI and potentially crash the browser
- Batch processing allows UI updates and progress indication
- Efficient data structures (Map for yield counts, sparse arrays for transactions) minimize memory usage
- Streaming/chunked approach for transaction history to avoid loading all 1 million transactions into memory

**Approach**:
- Process transactions in batches of 10,000
- Update UI progress indicator after each batch
- Use `requestAnimationFrame` or `setTimeout` to yield control to browser between batches
- Store transaction data efficiently: only store transaction number and returned scarab ID (not full objects)
- Use Map<scarabId, count> for yield counts (O(1) lookup)
- Lazy load transaction history (pagination/virtual scrolling)

**Alternatives considered**:
- Web Workers: Adds complexity, communication overhead, may not be necessary for batch processing
- IndexedDB: Overkill for in-memory simulation, adds async complexity
- Full synchronous processing: Would block UI and risk browser crashes

### Transaction History Storage

**Decision**: Store transaction data as lightweight objects with pagination/virtual scrolling for large simulations.

**Rationale**:
- Full transaction history needed for transaction-by-transaction view
- For 1 million transactions, storing full objects would use excessive memory
- Lightweight storage: { transactionNumber, returnedScarabId } per transaction
- Pagination for navigation (e.g., 100 transactions per page)
- Virtual scrolling for smooth navigation in large lists

**Data Structure**:
```javascript
{
  transactionNumber: number,
  returnedScarabId: string
}
```

**Memory Estimate**:
- Per transaction: ~50 bytes (number + string ID)
- 1 million transactions: ~50MB (acceptable for modern browsers)
- Alternative: Store only significant transactions + aggregated data, but spec requires full history

**Alternatives considered**:
- Store only significant transactions: Doesn't meet spec requirement for full transaction history
- IndexedDB storage: Adds complexity, async operations, not needed for session-only data
- Server-side storage: Not applicable (client-side only application)

### Significant Event Detection

**Decision**: Track events during simulation execution with efficient detection algorithms.

**Rationale**:
- Events must be detected in real-time during simulation (not post-processed)
- Efficient detection avoids performance impact on large simulations
- Event types: rare scarab return, breakeven achievement

**Implementation**:
- Rare scarab detection: Check if returned scarab ID is in rare scarab set (O(1) lookup)
- Breakeven detection: Track cumulative profit/loss, check if threshold crossed after each transaction
- Store events in array: { type, transactionNumber, details }
- Events array typically small (<100 events even for 1 million transactions)

**Performance**:
- Rare scarab check: O(1) per transaction (Set lookup)
- Breakeven check: O(1) per transaction (simple comparison)
- Event storage: O(1) per event (array append)
- Negligible performance impact

### Yield Count Visualization

**Decision**: Overlay yield counts on existing Grid and List views without replacing existing data.

**Rationale**:
- Spec requires integration with existing views
- Yield counts are additional data, not replacement for existing scarab information
- Visual overlay maintains existing view functionality
- Consistent with existing profitability indicators pattern

**Implementation**:
- Grid view: Add yield count text overlay on scarab cells
- List view: Add yield count column to table
- Display format: "Yield: X" or "X yielded"
- Zero yields: Display "0" (not hide)
- Styling: Distinct from profitability indicators, clear and readable

**Alternatives considered**:
- Separate view: Doesn't meet spec requirement for integration
- Replace existing data: Would lose existing scarab information
- Modal/popup: Less integrated, doesn't meet spec requirement

### Breakeven Point Calculation

**Decision**: Track cumulative profit/loss after each transaction to detect breakeven achievement.

**Rationale**:
- Breakeven = cumulative profit/loss reaches zero or becomes positive
- Must track running total during simulation (not calculate post-simulation)
- Simple comparison after each transaction: if cumulative >= 0 and previous cumulative < 0, breakeven achieved

**Calculation**:
- Initial cumulative: 0
- After each transaction: cumulative += (returnedScarabValue - 3 × inputScarabValue)
- Breakeven detected when: cumulative >= 0 AND previousCumulative < 0
- Store transaction number when breakeven achieved

**Edge Cases**:
- Breakeven never reached: No event recorded (acceptable per spec)
- Multiple breakeven points: Record first occurrence (spec doesn't specify multiple)
- Exact zero: Counts as breakeven achievement

## Unresolved Questions

None - all technical decisions made based on requirements, existing codebase patterns, and best practices.

## References

- Existing codebase: `src/js/services/calculationService.js` for simulation patterns
- Existing codebase: `src/js/models/scarab.js` for Simulation model structure
- MDN Web APIs: requestAnimationFrame, setTimeout for async processing
- Performance: JavaScript memory management for large arrays

