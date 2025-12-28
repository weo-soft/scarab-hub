# Quickstart Guide: Flipping Scarabs Page

**Date**: 2025-12-27  
**Feature**: Flipping Scarabs Page  
**Phase**: 1 - Design & Contracts

## Setup

### Prerequisites

- Node.js 18+ installed
- Modern web browser (Chrome, Firefox, Safari, Edge - latest 2 versions)

### Installation

```bash
# Clone repository (if not already done)
git clone <repository-url>
cd scarab-hub

# Install dependencies
npm install

# Start development server
npm run dev
```

### Access Application

Open browser to `http://localhost:5173` (or port shown in terminal)

## Test Scenarios

### Scenario 1: View Profitability Analysis (P1 - MVP)

**Goal**: Verify core functionality - displaying Scarabs with profitability indicators

**Steps**:
1. Open application in browser
2. Wait for page to load (<2s)
3. Observe all Scarabs displayed with visual indicators
4. Locate threshold value display
5. Identify Scarabs marked as profitable (below threshold)
6. Identify Scarabs marked as not profitable (above threshold)

**Expected Results**:
- ✅ Page loads within 2 seconds
- ✅ All ~150 Scarabs are displayed
- ✅ Threshold value is clearly visible
- ✅ Profitable Scarabs are visually distinct (e.g., green highlight)
- ✅ Non-profitable Scarabs are visually distinct (e.g., red highlight)
- ✅ No errors in browser console

**Acceptance Criteria**: FR-001, FR-002, FR-003

---

### Scenario 2: Switch Between List and Grid Views (P2)

**Goal**: Verify view switching functionality

**Steps**:
1. Open application (defaults to List view)
2. Locate view switcher control
3. Click to switch to Grid view
4. Observe grid layout with in-game style appearance
5. Click to switch back to List view
6. Verify profitability indicators remain consistent

**Expected Results**:
- ✅ View switches in <100ms
- ✅ Grid view displays Scarabs in grid layout
- ✅ Grid view shows base image with cell highlights
- ✅ List view displays detailed information
- ✅ Profitability indicators consistent across views
- ✅ No data loss during view switch

**Acceptance Criteria**: FR-004, FR-005, FR-006, FR-012

---

### Scenario 3: Run Optimized Strategy Simulation (P3)

**Goal**: Verify simulation functionality with optimized strategy

**Steps**:
1. Open application
2. Locate simulation panel
3. Select "Optimized Strategy"
4. Set transaction count to 100
5. Click "Run Simulation"
6. Observe results display

**Expected Results**:
- ✅ Simulation completes in <1s
- ✅ Results show expected profit/loss
- ✅ Results are clearly labeled (positive/negative)
- ✅ Calculation is based on profitable Scarabs only
- ✅ Results are displayed with visual indicators

**Acceptance Criteria**: FR-008, FR-011

---

### Scenario 4: Run User-Chosen Strategy Simulation (P3)

**Goal**: Verify custom simulation with user-selected Scarabs

**Steps**:
1. Open application
2. Locate simulation panel
3. Select "User-Chosen Strategy"
4. Select 3+ Scarabs from the list
5. Set transaction count to 50
6. Click "Run Simulation"
7. Observe results

**Expected Results**:
- ✅ User can select multiple Scarabs
- ✅ Selected Scarabs are visually indicated
- ✅ Simulation uses only selected Scarabs
- ✅ Results reflect chosen Scarabs
- ✅ Invalid selections (less than 3) are prevented

**Acceptance Criteria**: FR-009, FR-011

---

### Scenario 5: Handle Missing Price Data (Edge Case)

**Goal**: Verify graceful handling of missing market data

**Steps**:
1. Open application
2. Locate Scarabs with missing price data (if any)
3. Observe how they are displayed
4. Check threshold calculation (should exclude missing data)

**Expected Results**:
- ✅ Scarabs with missing prices are marked as "unknown"
- ✅ "N/A" or similar indicator shown for missing values
- ✅ Threshold calculation excludes missing data
- ✅ No errors or crashes
- ✅ User can still view other Scarabs normally

**Acceptance Criteria**: FR-013

---

### Scenario 6: Handle Missing Drop Weights (Edge Case)

**Goal**: Verify handling of Scarabs with null/zero drop weights

**Steps**:
1. Open application
2. Locate Scarabs with null or zero dropWeight
3. Observe how they are displayed
4. Verify they are excluded from threshold calculation

**Expected Results**:
- ✅ Scarabs with null/zero weights are marked appropriately
- ✅ Threshold calculation excludes them
- ✅ No calculation errors
- ✅ Other Scarabs unaffected

**Acceptance Criteria**: FR-014

---

### Scenario 7: LocalStorage Persistence

**Goal**: Verify user preferences are saved

**Steps**:
1. Open application
2. Switch to Grid view
3. Change currency preference (if available)
4. Close browser tab
5. Reopen application
6. Verify preferences are restored

**Expected Results**:
- ✅ View preference is saved
- ✅ Currency preference is saved (if implemented)
- ✅ Preferences restored on page reload
- ✅ No data loss between sessions

**Acceptance Criteria**: LocalStorage functionality

---

### Scenario 8: Performance Validation

**Goal**: Verify performance targets are met

**Steps**:
1. Open browser DevTools (Performance tab)
2. Open application
3. Measure initial load time
4. Switch views multiple times
5. Measure view switch latency
6. Run simulation
7. Measure calculation time

**Expected Results**:
- ✅ Initial load <2s
- ✅ View switching <100ms
- ✅ Calculations <50ms
- ✅ Canvas rendering smooth (60fps during interactions)
- ✅ No noticeable lag or jank

**Acceptance Criteria**: Performance requirements from plan

---

## Manual Testing Checklist

- [ ] All Scarabs display correctly
- [ ] Threshold value is accurate
- [ ] Profitability indicators are correct
- [ ] List view shows all required information
- [ ] Grid view renders correctly with highlights
- [ ] View switching works smoothly
- [ ] All three simulation strategies work
- [ ] Missing data is handled gracefully
- [ ] LocalStorage saves/loads preferences
- [ ] Performance targets are met
- [ ] No console errors
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Edge

## Known Limitations

- Price data must be manually updated (no automatic API integration)
- Offline functionality limited to cached data
- No user authentication (all data local)

