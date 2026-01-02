# Quickstart Guide: Essence Rerolling

**Date**: 2025-01-27  
**Feature**: Essence Rerolling  
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

Navigate to Essence Rerolling page (implementation will add navigation/routing)

## Test Scenarios

### Scenario 1: View Essence Profitability Analysis (P1 - MVP)

**Goal**: Verify core functionality - displaying Essences with profitability indicators

**Steps**:
1. Open Essence Rerolling page in browser
2. Wait for page to load (<2s)
3. Observe all Essences displayed with visual indicators
4. Locate threshold value display for each reroll group
5. Identify Essences marked as profitable (below threshold)
6. Identify Essences marked as not profitable (above threshold)
7. Verify reroll cost (30 Primal Crystallised Lifeforce) is displayed

**Expected Results**:
- ✅ Page loads within 2 seconds
- ✅ All ~400 Essences are displayed
- ✅ Threshold values are clearly visible for each reroll group
- ✅ Profitable Essences are visually distinct (e.g., green highlight)
- ✅ Non-profitable Essences are visually distinct (e.g., red highlight)
- ✅ Reroll cost is prominently displayed
- ✅ No errors in browser console

**Acceptance Criteria**: FR-001, FR-002, FR-003, FR-010

---

### Scenario 2: Verify Reroll Group Classification (P1)

**Goal**: Verify Essences are correctly classified into reroll groups

**Steps**:
1. Open Essence Rerolling page
2. Locate "Deafening Essence of ..." Essences
3. Verify they are grouped together
4. Locate "Shrieking Essence of ..." Essences
5. Verify they are grouped together
6. Locate "Essence of Horror", "Essence of Hysteria", "Essence of Insanity", "Essence of Delirium"
7. Verify they are in special group
8. Verify special group Essences cannot be created from other Essences

**Expected Results**:
- ✅ All Deafening Essences are in "deafening" group
- ✅ All Shrieking Essences are in "shrieking" group
- ✅ Special group contains exactly 4 Essences
- ✅ Special group Essences are visually distinguished
- ✅ No Essences are unclassified (null group)

**Acceptance Criteria**: FR-006, FR-007, FR-008, FR-009

---

### Scenario 3: Select Essences for Rerolling (P2)

**Goal**: Verify selection functionality for marking Essences to reroll

**Steps**:
1. Open Essence Rerolling page
2. Click on an Essence in the list
3. Observe visual change (background color, border, icon)
4. Click again to deselect
5. Select multiple Essences
6. Verify all selected Essences are visually distinguished
7. Refresh page and verify selections are persisted

**Expected Results**:
- ✅ Clicking Essence toggles selection state
- ✅ Selected Essences are visually distinct
- ✅ Multiple Essences can be selected
- ✅ Selections persist in LocalStorage
- ✅ Selections restored on page reload
- ✅ Selection toggle is responsive (<50ms)

**Acceptance Criteria**: FR-011, FR-012, FR-013

---

### Scenario 4: Verify Equal Weighting Calculation (P1)

**Goal**: Verify expected value uses equal weighting within reroll groups

**Steps**:
1. Open Essence Rerolling page
2. Select a reroll group (e.g., Deafening)
3. Note the expected value displayed
4. Manually calculate: average of all Essence prices in group
5. Verify displayed expected value matches manual calculation
6. Verify threshold = expected value - reroll cost

**Expected Results**:
- ✅ Expected value = (sum of prices) / (number of Essences)
- ✅ Threshold = expected value - (30 × Primal Crystallised Lifeforce price)
- ✅ Calculation is accurate for all reroll groups
- ✅ Equal weighting confirmed (no dropWeight used)

**Acceptance Criteria**: FR-005, FR-007

---

### Scenario 5: Handle Missing Price Data (Edge Case)

**Goal**: Verify graceful handling of missing market data

**Steps**:
1. Open Essence Rerolling page
2. Locate Essences with missing price data (if any)
3. Observe how they are displayed
4. Check threshold calculation (should exclude missing data)
5. Verify Primal Crystallised Lifeforce price availability

**Expected Results**:
- ✅ Essences with missing prices are marked as "unknown"
- ✅ "N/A" or similar indicator shown for missing values
- ✅ Threshold calculation excludes missing data
- ✅ If Primal Crystallised Lifeforce price missing, all Essences marked as "unknown"
- ✅ No errors or crashes
- ✅ User can still view other Essences normally

**Acceptance Criteria**: FR-015, FR-016

---

### Scenario 6: Verify List View Functionality (P2)

**Goal**: Verify list view displays all required information

**Steps**:
1. Open Essence Rerolling page
2. Verify list view is displayed (similar to Scarabs)
3. Check that each Essence shows:
   - Name
   - Market value (chaos/divine)
   - Profitability status
   - Reroll group indicator
   - Selection state
4. Test sorting by name
5. Test sorting by value
6. Test sorting by profitability status

**Expected Results**:
- ✅ List view displays all Essences
- ✅ All required information is visible
- ✅ Sorting works correctly for all columns
- ✅ Visual indicators are consistent
- ✅ List view matches Scarab list view styling

**Acceptance Criteria**: FR-004, FR-018

---

### Scenario 7: Verify Reroll Cost Display (P1)

**Goal**: Verify reroll cost is clearly displayed and factored into calculations

**Steps**:
1. Open Essence Rerolling page
2. Locate reroll cost display
3. Verify it shows: "30 Primal Crystallised Lifeforce = X chaos"
4. Verify cost is factored into threshold calculations
5. Change currency preference (if available)
6. Verify cost updates in selected currency

**Expected Results**:
- ✅ Reroll cost is prominently displayed
- ✅ Cost shows both quantity (30) and currency value
- ✅ Cost is correctly factored into profitability calculations
- ✅ Cost updates when currency preference changes
- ✅ Cost updates when price data refreshes

**Acceptance Criteria**: FR-010

---

### Scenario 8: Performance Validation

**Goal**: Verify performance targets are met

**Steps**:
1. Open browser DevTools (Performance tab)
2. Open Essence Rerolling page
3. Measure initial load time
4. Toggle Essence selections multiple times
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

- [ ] All Essences display correctly
- [ ] Reroll groups are correctly classified
- [ ] Threshold values are accurate for each group
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
- [ ] Special group Essences cannot be created from other Essences
- [ ] List view matches Scarab list view styling

## Known Limitations

- Price data must be manually updated (no automatic API integration)
- Offline functionality limited to cached data
- No user authentication (all data local)
- List view only (no grid view for Essences)
- Selection state is binary (selected/not selected), no partial states

## Integration with Existing Features

- Shares data loading infrastructure with Scarab feature
- Uses same LocalStorage keys (extends preferences)
- Reuses color utilities and styling
- Follows same calculation service patterns
- Consistent with existing UX patterns
