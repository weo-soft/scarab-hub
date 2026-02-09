# Data Contracts: Temple Upgrade Display

**Feature**: Temple Upgrade Display  
**Date**: 2026-02-09

## Data Loading Functions

### `loadTempleUpgradeData()`

Loads and processes data for temple upgrade combinations.

**Location**: `src/js/services/dataService.js`

**Signature**:
```javascript
async function loadTempleUpgradeData() {
  // Returns: Promise<{
  //   combinations: Array<UpgradeCombination>,
  //   uniques: Array<UniqueItem>,
  //   vials: Array<Vial>,
  //   temple: TempleItem
  // }>
}
```

**Behavior**:
1. Loads `uniques.json`, `vials.json`
2. Parses unique items and identifies base/upgraded pairs
3. Extracts vial requirements from flavourText
4. Creates `UpgradeCombination` instances
5. Returns processed data

**Errors**:
- Throws if JSON files cannot be loaded
- Logs warnings for invalid combinations (missing vial, missing upgraded unique)

**Dependencies**:
- `fetch()` for loading JSON files
- JSON parsing

## View Rendering Functions

### `renderTempleUpgradeUI(combinations, currency)`

Renders the temple upgrade view with list of combinations.

**Location**: `src/main.js`

**Signature**:
```javascript
async function renderTempleUpgradeUI(combinations, currency) {
  // combinations: Array<UpgradeCombination>
  // currency: 'chaos' | 'divine'
  // Returns: Promise<void>
}
```

**Behavior**:
1. Hides filter panel
2. Renders list view with upgrade combinations
3. Each combination shows: base unique, vial, temple, upgraded unique (with images and names)
4. Attaches tooltip handlers to all components

**Dependencies**:
- `renderTempleUpgradeList()` from `templeUpgradeListView.js`
- Tooltip functions from `tooltip.js`

### `renderTempleUpgradeList(container, combinations, currency)`

Renders the list of upgrade combinations.

**Location**: `src/js/views/templeUpgradeListView.js`

**Signature**:
```javascript
function renderTempleUpgradeList(container, combinations, currency) {
  // container: HTMLElement
  // combinations: Array<UpgradeCombination>
  // currency: 'chaos' | 'divine'
  // Returns: void
}
```

**Behavior**:
1. Creates HTML structure for each combination
2. Displays images and names for all components
3. Attaches mouse event handlers for tooltips
4. Handles missing images gracefully

**HTML Structure** (per combination):
```html
<div class="temple-upgrade-combination" data-combination-id="{id}">
  <div class="upgrade-component base-unique">
    <img src="{baseUniqueImagePath}" alt="{baseUniqueName}" />
    <span class="component-name">{baseUniqueName}</span>
  </div>
  <span class="upgrade-operator">+</span>
  <div class="upgrade-component vial">
    <img src="{vialImagePath}" alt="{vialName}" />
    <span class="component-name">{vialName}</span>
  </div>
  <span class="upgrade-operator">+</span>
  <div class="upgrade-component temple">
    <img src="{templeImagePath}" alt="{templeName}" />
    <span class="component-name">{templeName}</span>
  </div>
  <span class="upgrade-operator">=</span>
  <div class="upgrade-component upgraded-unique">
    <img src="{upgradedUniqueImagePath}" alt="{upgradedUniqueName}" />
    <span class="component-name">{upgradedUniqueName}</span>
  </div>
</div>
```

## Tooltip Functions

### `showUniqueTooltip(unique, x, y)`

Shows tooltip for a unique item.

**Location**: `src/js/utils/tooltip.js`

**Signature**:
```javascript
export function showUniqueTooltip(unique, x, y) {
  // unique: UniqueItem
  // x: number - Mouse X position (screen coordinates)
  // y: number - Mouse Y position (screen coordinates)
  // Returns: void
}
```

**Behavior**:
1. Builds HTML content with unique item details
2. Displays name, base type, modifiers, level requirement, flavour text
3. Positions tooltip at mouse coordinates
4. Shows tooltip with fade-in animation

**Tooltip Content**:
- Name (header)
- Base Type
- Level Requirement
- Implicit Modifiers (if any)
- Explicit Modifiers
- Flavour Text (if any)

### `showVialTooltip(vial, x, y)`

Shows tooltip for a vial.

**Location**: `src/js/utils/tooltip.js`

**Signature**:
```javascript
export function showVialTooltip(vial, x, y) {
  // vial: Vial
  // x: number - Mouse X position
  // y: number - Mouse Y position
  // Returns: void
}
```

**Behavior**:
1. Builds HTML content with vial details
2. Displays name, flavour text, description
3. Positions and shows tooltip

**Tooltip Content**:
- Name (header)
- Flavour Text
- Stack Size

### `showTempleRoomTooltip(temple, x, y)`

Shows tooltip for Chronicle of Atzoatl.

**Location**: `src/js/utils/tooltip.js`

**Signature**:
```javascript
export function showTempleRoomTooltip(temple, x, y) {
  // temple: TempleItem
  // x: number - Mouse X position
  // y: number - Mouse Y position
  // Returns: void
}
```

**Behavior**:
1. Builds HTML content with temple details
2. Displays name and description
3. Positions and shows tooltip

**Tooltip Content**:
- Name: "Chronicle of Atzoatl"
- Description: "Required for upgrading unique items at the Altar of Sacrifice"

## Integration Points

### Category Handler

**Location**: `src/main.js` - `handleCategoryChange()`

**Integration**:
```javascript
else if (category === 'temple') {
  try {
    const { combinations } = await loadTempleUpgradeData();
    const preferences = loadPreferences();
    const currency = preferences.currencyPreference || 'chaos';
    await renderTempleUpgradeUI(combinations, currency);
  } catch (error) {
    console.error('Error handling Temple category:', error);
    showErrorToast('Failed to load Temple upgrade data');
  }
}
```

## Error Handling

### Missing Data

- **Missing Image**: Hide image element or show placeholder, log warning
- **Missing Tooltip Data**: Show available information, indicate missing data
- **Invalid Combination**: Skip combination, log warning with details

### Loading Errors

- **JSON Load Failure**: Show error toast, log error details
- **Parse Error**: Show error toast, log parse error details

## Performance Considerations

- **Lazy Loading**: Load JSON files only when temple category is selected
- **Caching**: Cache parsed combinations in memory for subsequent views
- **Image Loading**: Use native browser image loading with error handling
- **Tooltip Debouncing**: Debounce tooltip display to prevent flickering
