# Quickstart Guide: 3-to-1 Trade Simulation

**Date**: 2025-01-27  
**Feature**: 3-to-1 Trade Simulation  
**Phase**: 1 - Design & Contracts

## Setup

### Prerequisites

- Existing Flipping Scarabs application (from 001-flipping-scarabs feature)
- Node.js 18+ installed
- Modern web browser (Chrome, Firefox, Safari, Edge - latest 2 versions)

### Installation

```bash
# Ensure you're on the feature branch
git checkout 002-trade-simulation

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

### Access Application

Open browser to `http://localhost:5173` (or port shown in terminal)

Navigate to the Simulation page (if separate page) or access simulation panel from Flipping Scarabs page.

## Test Scenarios

### Scenario 1: Configure and Run Small Simulation (P1 - MVP)

**Goal**: Verify core simulation functionality with small transaction count

**Steps**:
1. Open application in browser
2. Navigate to simulation panel/page
3. Select 3+ scarabs to use in simulation
4. Set breakeven point to 0
5. Set rare scarab threshold to 10% (default)
6. Set transaction count to 100
7. Click "Run Simulation"
8. Wait for simulation to complete
9. Observe results display

**Expected Results**:
- ✅ Simulation completes successfully
- ✅ Results show yield counts for each scarab type
- ✅ Results show total profit/loss
- ✅ Results show significant events (if any occurred)
- ✅ Transaction history is accessible
- ✅ No errors in browser console

**Acceptance Criteria**: FR-001, FR-002, FR-003, FR-005, FR-013

---

### Scenario 2: View Transaction-by-Transaction History (P2)

**Goal**: Verify transaction history viewing functionality

**Steps**:
1. Run a simulation with 1000 transactions
2. Wait for simulation to complete
3. Click "View Transaction History" or similar control
4. Observe transaction list showing transaction number and returned scarab
5. Navigate to page 2 of transaction history
6. Use search/filter to find specific transaction
7. Navigate to transaction 500

**Expected Results**:
- ✅ Transaction history displays correctly
- ✅ Each transaction shows number and returned scarab
- ✅ Pagination works smoothly (<2s response time)
- ✅ Search/filter functionality works
- ✅ Navigation to specific transaction works
- ✅ No performance degradation with 1000 transactions

**Acceptance Criteria**: FR-006, FR-007, SC-003

---

### Scenario 3: Track Significant Events - Rare Scarab (P2)

**Goal**: Verify rare scarab event detection and display

**Steps**:
1. Configure simulation with rare scarab threshold of 10%
2. Run simulation with 10,000 transactions
3. Wait for simulation to complete
4. Review significant events section
5. Locate rare scarab return events
6. Click on a rare scarab event to navigate to that transaction
7. Verify transaction shows the rare scarab

**Expected Results**:
- ✅ Rare scarab events are detected and recorded
- ✅ Events show transaction number and scarab type
- ✅ Events are displayed in significant events summary
- ✅ Navigation from event to transaction works correctly
- ✅ Rare scarab definition (drop weight threshold) works as expected

**Acceptance Criteria**: FR-004, FR-008, FR-009, FR-015, SC-004, SC-007

---

### Scenario 4: Track Significant Events - Breakeven (P2)

**Goal**: Verify breakeven point detection and display

**Steps**:
1. Configure simulation with breakeven point of 0
2. Run simulation with 50,000 transactions
3. Wait for simulation to complete
4. Review significant events section
5. Locate breakeven achievement event (if occurred)
6. Verify transaction number where breakeven was reached
7. Navigate to that transaction and verify cumulative profit/loss

**Expected Results**:
- ✅ Breakeven event is detected when cumulative profit/loss reaches 0 or positive
- ✅ Event shows correct transaction number
- ✅ Event shows cumulative profit/loss at that point
- ✅ Navigation to breakeven transaction works
- ✅ Breakeven detection is accurate

**Acceptance Criteria**: FR-004, FR-008, FR-009, FR-014, SC-004, SC-007

---

### Scenario 5: Visualize Yield Counts in Grid View (P2)

**Goal**: Verify yield count display in Grid view

**Steps**:
1. Run a simulation with 10,000 transactions
2. Wait for simulation to complete
3. Switch to Grid view
4. Observe yield counts displayed on scarab cells
5. Verify counts match simulation results
6. Verify scarabs with zero yield show count of 0

**Expected Results**:
- ✅ Yield counts are displayed on each scarab cell
- ✅ Counts are clearly visible and readable
- ✅ Counts match actual simulation results
- ✅ Zero-yield scarabs show count of 0
- ✅ Existing scarab information (profitability, etc.) is preserved
- ✅ Grid view remains functional with yield counts

**Acceptance Criteria**: FR-010, SC-006

---

### Scenario 6: Visualize Yield Counts in List View (P2)

**Goal**: Verify yield count display in List view

**Steps**:
1. Run a simulation with 10,000 transactions
2. Wait for simulation to complete
3. Switch to List view
4. Observe yield count column in table
5. Verify counts match simulation results
6. Verify scarabs with zero yield show count of 0
7. Sort by yield count (if sorting available)

**Expected Results**:
- ✅ Yield count column is added to table
- ✅ Counts are displayed for each scarab
- ✅ Counts match actual simulation results
- ✅ Zero-yield scarabs show count of 0
- ✅ Existing table functionality (sorting, filtering) works with yield counts
- ✅ List view remains functional with yield counts

**Acceptance Criteria**: FR-011, SC-006

---

### Scenario 7: Large-Scale Simulation (1 Million Transactions) (P1)

**Goal**: Verify simulation handles maximum transaction count efficiently

**Steps**:
1. Configure simulation with 1,000,000 transactions
2. Set appropriate scarabs and parameters
3. Click "Run Simulation"
4. Observe progress indicator during execution
5. Wait for simulation to complete (may take several minutes)
6. Verify all 1 million transactions were processed
7. Verify results are accurate
8. Verify memory usage is reasonable (<100MB)
9. Verify transaction history is accessible

**Expected Results**:
- ✅ Simulation processes all 1 million transactions
- ✅ Progress indicator updates regularly
- ✅ UI remains responsive during execution
- ✅ Results are accurate and complete
- ✅ Memory usage is within acceptable limits
- ✅ No browser crashes or errors
- ✅ Transaction history is accessible (with pagination)

**Acceptance Criteria**: FR-013, SC-001, SC-005

---

### Scenario 8: Configuration Validation (Edge Cases)

**Goal**: Verify configuration validation prevents invalid inputs

**Steps**:
1. Try to configure simulation with fewer than 3 scarabs
2. Try to set transaction count to 0
3. Try to set transaction count to 2,000,000 (over limit)
4. Try to set negative breakeven point
5. Try to set rare scarab threshold outside 0-1 range
6. Verify error messages are clear and helpful

**Expected Results**:
- ✅ Simulation prevents execution with <3 scarabs
- ✅ Transaction count validation works (1 to 1,000,000)
- ✅ Breakeven point validation works (>= 0)
- ✅ Rare scarab threshold validation works (0-1)
- ✅ Clear error messages are displayed
- ✅ Invalid configurations cannot be submitted

**Acceptance Criteria**: FR-012, SC-008

---

### Scenario 9: Multiple Simulations and Results Persistence

**Goal**: Verify multiple simulations can be run and results persist

**Steps**:
1. Run first simulation with 10,000 transactions
2. Review results
3. Run second simulation with different parameters
4. Review second simulation results
5. Verify first simulation results are still accessible
6. Close browser tab
7. Reopen application
8. Verify simulation results are persisted (if implemented)

**Expected Results**:
- ✅ Multiple simulations can be run in same session
- ✅ Results from each simulation are accessible
- ✅ Results don't interfere with each other
- ✅ Simulation results persist in session (LocalStorage)
- ✅ Results are restored on page reload (if implemented)

**Acceptance Criteria**: Session persistence functionality

---

### Scenario 10: Performance - Transaction History Navigation

**Goal**: Verify transaction history navigation performance for large simulations

**Steps**:
1. Run simulation with 100,000 transactions
2. Wait for completion
3. Open transaction history
4. Navigate to page 1 (first 100 transactions)
5. Measure page load time
6. Navigate to page 500 (middle of simulation)
7. Measure page load time
8. Navigate to page 1000 (end of simulation)
9. Measure page load time
10. Use search to find specific transaction
11. Measure search response time

**Expected Results**:
- ✅ Page load times <2 seconds for any page
- ✅ Pagination responds quickly (<500ms)
- ✅ Search responds quickly (<1 second)
- ✅ No noticeable lag or jank
- ✅ Memory usage remains reasonable

**Acceptance Criteria**: SC-003, Performance contracts

---

## Manual Testing Checklist

- [ ] Small simulation (100 transactions) completes successfully
- [ ] Medium simulation (10,000 transactions) completes successfully
- [ ] Large simulation (1,000,000 transactions) completes successfully
- [ ] Transaction history displays correctly
- [ ] Transaction history pagination works
- [ ] Transaction history search/filter works
- [ ] Rare scarab events are detected correctly
- [ ] Breakeven events are detected correctly
- [ ] Significant events navigation works
- [ ] Yield counts display in Grid view
- [ ] Yield counts display in List view
- [ ] Yield counts are accurate
- [ ] Configuration validation works
- [ ] Progress indicator updates during simulation
- [ ] UI remains responsive during large simulations
- [ ] Memory usage is reasonable
- [ ] No browser crashes
- [ ] No console errors
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Edge

## Known Limitations

- Large simulations (1 million transactions) may take several minutes to complete
- Transaction history for very large simulations requires pagination (not all transactions in memory)
- Memory usage scales with transaction count (mitigated by efficient data structures)
- Simulation execution is single-threaded (browser JavaScript limitation)

## Performance Benchmarks

**Target Performance**:
- Small simulation (1,000 transactions): <1 second
- Medium simulation (100,000 transactions): <30 seconds
- Large simulation (1,000,000 transactions): <5 minutes
- Transaction history page load: <2 seconds
- Transaction history pagination: <500ms
- Yield count display update: <200ms

**Memory Targets**:
- 1 million transactions: <100MB memory usage
- Transaction history page (100 transactions): <1MB
- Full simulation result: <50MB

