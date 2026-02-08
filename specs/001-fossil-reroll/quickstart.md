# Quickstart Guide: Fossil Rerolling

**Date**: 2025-01-27  
**Feature**: Fossil Rerolling  
**Phase**: 1 - Design & Contracts

## Setup

### Prerequisites

- Node.js 18+ installed
- Modern web browser (Chrome, Firefox, Safari, Edge - latest 2 versions)
- Existing Scarab Hub application running

### Installation

```bash
# Clone repository (if not already done)
git clone <repository-url>
cd scarab-hub

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

### Access Application

Open browser to `http://localhost:5173` (or port shown in terminal)

Navigate to Fossil Rerolling page (implementation will add navigation/routing)

## Test Scenarios

### Scenario 1: View Fossil Profitability Analysis (P1 - MVP)

**Goal**: Verify core functionality - displaying Fossils with profitability indicators

**Steps**:
1. Open Fossil Rerolling page in browser
2. Wait for page to load (<2s)
3. Observe all Fossils displayed with visual indicators
4. Locate threshold value display for the reroll group
5. Identify Fossils marked as profitable (below threshold)
6. Identify Fossils marked as not profitable (above threshold)
7. Verify reroll cost (30 Wild Crystallised Lifeforce) is displayed

**Expected Results**:
- ✅ Page loads within 2 seconds
- ✅ All ~23 Fossils are displayed
- ✅ Threshold value is clearly visible for the reroll group
- ✅ Profitable Fossils are visually distinct (e.g., green highlight)
- ✅ Non-profitable Fossils are visually distinct (e.g., red highlight)
- ✅ Reroll cost is prominently displayed
- ✅ No errors in browser console

**Acceptance Criteria**: FR-001, FR-002, FR-003, FR-007

---

### Scenario 2: Verify Single Reroll Group (P1)

**Goal**: Verify all Fossils belong to the same reroll group

**Steps**:
1. Open Fossil Rerolling page
2. Verify all Fossils are in the same reroll group
3. Verify there is only one threshold value displayed
4. Verify all Fossils can reroll into each other

**Expected Results**:
- ✅ All Fossils are in "fossil" reroll group
- ✅ Single threshold value displayed (not multiple like Essence)
- ✅ All Fossils can reroll into each other
- ✅ No Fossils are unclassified

**Acceptance Criteria**: FR-006

---

### Scenario 3: Select Fossils for Rerolling (P2)

**Goal**: Verify selection functionality for marking Fossils to reroll

**Steps**:
1. Open Fossil Rerolling page
2. Click on a Fossil in the list
3. Observe visual change (background color, border, icon)
4. Click again to deselect
5. Select multiple Fossils
6. Verify all selected Fossils are visually distinguished
7. Refresh page and verify selections are persisted

**Expected Results**:
- ✅ Clicking Fossil toggles selection state
- ✅ Selected Fossils are visually distinct
- ✅ Multiple Fossils can be selected
- ✅ Selections persist in LocalStorage
- ✅ Selections restored on page reload
- ✅ Selection toggle is responsive (<50ms)

**Acceptance Criteria**: FR-008, FR-009, FR-010

---

### Scenario 4: Verify Equal Weighting Calculation (P1)

**Goal**: Verify expected value uses equal weighting for all Fossils

**Steps**:
1. Open Fossil Rerolling page
2. Note the expected value displayed
3. Manually calculate: average of all Fossil prices
4. Verify displayed expected value matches manual calculation
5. Verify threshold = expected value - reroll cost

**Expected Results**:
- ✅ Expected value = (sum of prices) / (number of Fossils)
- ✅ Threshold = expected value - (30 × Wild Crystallised Lifeforce price)
- ✅ Calculation is accurate
- ✅ Equal weighting confirmed (no dropWeight used)

**Acceptance Criteria**: FR-005, FR-007

---

### Scenario 5: Handle Missing Price Data (Edge Case)

**Goal**: Verify graceful handling of missing market data

**Steps**:
1. Open Fossil Rerolling page
2. Locate Fossils with missing price data (if any)
3. Observe how they are displayed
4. Check threshold calculation (should exclude missing data)
5. Verify Wild Crystallised Lifeforce price availability

**Expected Results**:
- ✅ Fossils with missing prices are marked as "unknown"
- ✅ "N/A" or similar indicator shown for missing values
- ✅ Threshold calculation excludes missing data
- ✅ If Wild Crystallised Lifeforce price missing, all Fossils marked as "unknown"
- ✅ No errors or crashes
- ✅ User can still view other Fossils normally

**Acceptance Criteria**: FR-012, FR-013

---

### Scenario 6: Verify List View Functionality (P2)

**Goal**: Verify list view displays all required information

**Steps**:
1. Open Fossil Rerolling page
2. Verify list view is displayed (similar to Essences)
3. Check that each Fossil shows:
   - Name
   - Market value (chaos/divine)
   - Profitability status
   - Selection state
4. Test sorting by name
5. Test sorting by value
6. Test sorting by profitability status

**Expected Results**:
- ✅ List view displays all Fossils
- ✅ All required information is visible
- ✅ Sorting works correctly for all columns
- ✅ Visual indicators are consistent
- ✅ List view matches Essence list view styling

**Acceptance Criteria**: FR-004, FR-015

---

### Scenario 7: Verify Reroll Cost Display (P1)

**Goal**: Verify reroll cost is clearly displayed and factored into calculations

**Steps**:
1. Open Fossil Rerolling page
2. Locate reroll cost display
3. Verify it shows: "30 Wild Crystallised Lifeforce = X chaos"
4. Verify cost is factored into threshold calculations
5. Change currency preference (if available)
6. Verify cost updates in selected currency

**Expected Results**:
- ✅ Reroll cost is prominently displayed
- ✅ Cost shows both quantity (30) and currency value
- ✅ Cost is correctly factored into profitability calculations
- ✅ Cost updates when currency preference changes
- ✅ Cost updates when price data refreshes

**Acceptance Criteria**: FR-007

---

### Scenario 8: Performance Validation

**Goal**: Verify performance targets are met

**Steps**:
1. Open browser DevTools (Performance tab)
2. Open Fossil Rerolling page
3. Measure initial load time
4. Toggle Fossil selections multiple times
5. Measure selection toggle latency
6. Sort list by different columns
7. Measure sorting latency

**Expected Results**:
- ✅ Initial load <2s
- ✅ Selection toggle <50ms
- ✅ List sorting <100ms
- ✅ Calculations <50ms
- ✅ No noticeable lag or jank
- ✅ Smooth interactions

**Acceptance Criteria**: Performance requirements from plan

---

## Manual Testing Checklist

- [ ] All Fossils display correctly
- [ ] All Fossils are in single reroll group
- [ ] Threshold value is accurate
- [ ] Profitability indicators are correct
- [ ] List view shows all required information
- [ ] Selection functionality works smoothly
- [ ] Equal weighting calculation is accurate
- [ ] Reroll cost is displayed and factored correctly
- [ ] Missing data is handled gracefully
- [ ] LocalStorage saves/loads selections
- [ ] Performance targets are met
- [ ] No console errors
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Edge
- [ ] List view matches Essence list view styling

## Known Limitations

- Price data must be manually updated (no automatic API integration)
- Offline functionality limited to cached data
- No user authentication (all data local)
- List view only (no grid view for Fossils)
- Selection state is binary (selected/not selected), no partial states
- Single reroll group (simpler than Essence's multiple groups)

## Integration with Existing Features

- Shares data loading infrastructure with Essence feature
- Uses same LocalStorage keys (extends preferences)
- Reuses color utilities and styling
- Follows same calculation service patterns
- Consistent with existing UX patterns
- Simpler implementation than Essence (single group vs multiple groups)

