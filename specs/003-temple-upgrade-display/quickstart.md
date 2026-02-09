# Quick Start: Temple Upgrade Display

**Feature**: Temple Upgrade Display  
**Date**: 2026-02-09

## Implementation Steps

### Step 1: Create Data Loading Function

**File**: `src/js/services/dataService.js`

Add function to load and process temple upgrade data:

```javascript
/**
 * Load and process temple upgrade combination data
 * @returns {Promise<{combinations: Array, uniques: Array, vials: Array, temple: Object}>}
 */
export async function loadTempleUpgradeData() {
  // Load JSON files
  const [uniquesResponse, vialsResponse] = await Promise.all([
    fetch('/data/items/uniques.json'),
    fetch('/data/items/vials.json')
  ]);
  
  const uniques = await uniquesResponse.json();
  const vialsData = await vialsResponse.json();
  const vials = vialsData.lines || [];
  
  // Extract upgrade combinations
  const combinations = extractUpgradeCombinations(uniques, vials);
  
  // Create temple item
  const temple = {
    name: 'Chronicle of Atzoatl',
    imagePath: '/assets/images/Chronicle_of_Atzoatl.png'
  };
  
  return { combinations, uniques, vials, temple };
}

/**
 * Extract upgrade combinations from unique items
 */
function extractUpgradeCombinations(uniques, vials) {
  const combinations = [];
  const vialMap = new Map(vials.map(v => [v.name, v]));
  
  // Find base uniques (have "Altar of Sacrifice" in flavourText)
  const baseUniques = uniques.filter(u => 
    u.flavourText && u.flavourText.includes('Altar of Sacrifice')
  );
  
  for (const baseUnique of baseUniques) {
    // Extract vial name from flavourText
    const vialMatch = baseUnique.flavourText.match(/Vial of ([^}]+)/);
    if (!vialMatch) continue;
    
    const vialName = `Vial of ${vialMatch[1].trim()}`;
    const vial = vialMap.get(vialName);
    if (!vial) {
      console.warn(`Vial not found: ${vialName}`);
      continue;
    }
    
    // Find upgraded unique (same baseType, related name)
    const upgradedUnique = findUpgradedUnique(baseUnique, uniques);
    if (!upgradedUnique) {
      console.warn(`Upgraded unique not found for: ${baseUnique.name}`);
      continue;
    }
    
    combinations.push({
      id: `${baseUnique.detailsId}-${vial.detailsId}`,
      baseUnique,
      vial,
      upgradedUnique
    });
  }
  
  return combinations;
}

/**
 * Find upgraded unique for a base unique
 */
function findUpgradedUnique(baseUnique, allUniques) {
  // Known mappings
  const mappings = {
    "Apep's Slumber": "Apep's Supremacy",
    "Coward's Chains": "Coward's Legacy",
    "Architect's Hand": "Slavedriver's Hand",
    "Story of the Vaal": "Fate of the Vaal",
    "Mask of the Spirit Drinker": "Mask of the Stitched Demon",
    "Dance of the Offered": "Omeyocan",
    "Tempered Flesh": "Transcendent Flesh",
    "Tempered Spirit": "Transcendent Spirit",
    "Tempered Mind": "Transcendent Mind",
    "Sacrificial Heart": "Zerphi's Heart",
    "Soul Catcher": "Soul Ripper"
  };
  
  const upgradedName = mappings[baseUnique.name];
  if (upgradedName) {
    return allUniques.find(u => u.name === upgradedName);
  }
  
  // Fallback: same baseType, no "Altar of Sacrifice" in flavourText
  return allUniques.find(u => 
    u.baseType === baseUnique.baseType &&
    (!u.flavourText || !u.flavourText.includes('Altar of Sacrifice')) &&
    u.name !== baseUnique.name
  );
}
```

### Step 2: Create List View Component

**File**: `src/js/views/templeUpgradeListView.js`

Create new file for temple upgrade list view:

```javascript
import { showUniqueTooltip, showVialTooltip, showTempleRoomTooltip, hideTooltip } from '../utils/tooltip.js';

/**
 * Render temple upgrade combinations list
 * @param {HTMLElement} container - Container element
 * @param {Array} combinations - Array of upgrade combinations
 * @param {string} currency - Currency preference ('chaos' | 'divine')
 */
export function renderTempleUpgradeList(container, combinations, currency) {
  if (!container) {
    console.error('Temple upgrade list: missing container');
    return;
  }
  
  const temple = {
    name: 'Chronicle of Atzoatl',
    imagePath: '/assets/images/Chronicle_of_Atzoatl.png'
  };
  
  const html = `
    <div class="temple-upgrade-list">
      <div class="temple-upgrade-header">
        <h2>Temple Upgrade Combinations</h2>
        <p>Combine base unique items with vials in the Chronicle of Atzoatl to create upgraded versions.</p>
      </div>
      <div class="temple-upgrade-combinations">
        ${combinations.map(combo => renderCombination(combo, temple)).join('')}
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  
  // Attach tooltip handlers
  attachTooltipHandlers(container, combinations, temple);
}

/**
 * Render a single upgrade combination
 */
function renderCombination(combo, temple) {
  const baseUniqueImage = getUniqueImagePath(combo.baseUnique);
  const vialImage = getVialImagePath(combo.vial);
  const upgradedUniqueImage = getUniqueImagePath(combo.upgradedUnique);
  
  return `
    <div class="temple-upgrade-combination" data-combination-id="${combo.id}">
      <div class="upgrade-component base-unique" 
           data-unique-id="${combo.baseUnique.detailsId}"
           data-component-type="unique">
        <img src="${baseUniqueImage}" 
             alt="${combo.baseUnique.name}" 
             onerror="this.style.display='none'"
             class="component-image" />
        <span class="component-name">${escapeHtml(combo.baseUnique.name)}</span>
      </div>
      <span class="upgrade-operator">+</span>
      <div class="upgrade-component vial" 
           data-vial-id="${combo.vial.detailsId}"
           data-component-type="vial">
        <img src="${vialImage}" 
             alt="${combo.vial.name}" 
             onerror="this.style.display='none'"
             class="component-image" />
        <span class="component-name">${escapeHtml(combo.vial.name)}</span>
      </div>
      <span class="upgrade-operator">+</span>
      <div class="upgrade-component temple" 
           data-component-type="temple">
        <img src="${temple.imagePath}" 
             alt="${temple.name}" 
             onerror="this.style.display='none'"
             class="component-image" />
        <span class="component-name">${escapeHtml(temple.name)}</span>
      </div>
      <span class="upgrade-operator">=</span>
      <div class="upgrade-component upgraded-unique" 
           data-unique-id="${combo.upgradedUnique.detailsId}"
           data-component-type="unique">
        <img src="${upgradedUniqueImage}" 
             alt="${combo.upgradedUnique.name}" 
             onerror="this.style.display='none'"
             class="component-image" />
        <span class="component-name">${escapeHtml(combo.upgradedUnique.name)}</span>
      </div>
    </div>
  `;
}

/**
 * Get image path for unique item
 */
function getUniqueImagePath(unique) {
  // Convert detailsId to image filename
  // e.g., "apeps-slumber-vaal-spirit-shield" -> "apeps-slumber.png"
  const parts = unique.detailsId.split('-');
  const baseName = parts.slice(0, -2).join('-'); // Remove last 2 parts (base type)
  return `/assets/images/uniques/${baseName}.png`;
}

/**
 * Get image path for vial
 */
function getVialImagePath(vial) {
  return `/assets/images/vials/${vial.detailsId}.png`;
}

/**
 * Attach tooltip handlers to components
 */
function attachTooltipHandlers(container, combinations, temple) {
  const components = container.querySelectorAll('.upgrade-component');
  
  components.forEach(component => {
    const type = component.dataset.componentType;
    const uniqueId = component.dataset.uniqueId;
    const vialId = component.dataset.vialId;
    
    component.addEventListener('mouseenter', (e) => {
      const { clientX, clientY } = e;
      
      if (type === 'unique' && uniqueId) {
        const unique = findUniqueById(combinations, uniqueId);
        if (unique) showUniqueTooltip(unique, clientX, clientY);
      } else if (type === 'vial' && vialId) {
        const vial = findVialById(combinations, vialId);
        if (vial) showVialTooltip(vial, clientX, clientY);
      } else if (type === 'temple') {
        showTempleRoomTooltip(temple, clientX, clientY);
      }
    });
    
    component.addEventListener('mouseleave', () => {
      hideTooltip();
    });
  });
}

function findUniqueById(combinations, detailsId) {
  for (const combo of combinations) {
    if (combo.baseUnique.detailsId === detailsId) return combo.baseUnique;
    if (combo.upgradedUnique.detailsId === detailsId) return combo.upgradedUnique;
  }
  return null;
}

function findVialById(combinations, detailsId) {
  for (const combo of combinations) {
    if (combo.vial.detailsId === detailsId) return combo.vial;
  }
  return null;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

### Step 3: Extend Tooltip Functions

**File**: `src/js/utils/tooltip.js`

Add new tooltip functions:

```javascript
/**
 * Show tooltip for a unique item
 */
export function showUniqueTooltip(unique, x, y) {
  if (!unique) {
    hideTooltip();
    return;
  }
  initTooltip();
  tooltipElement.innerHTML = buildUniqueTooltipContent(unique);
  positionTooltip(x, y);
  tooltipElement.style.display = 'block';
  requestAnimationFrame(() => tooltipElement.classList.add('visible'));
}

/**
 * Build tooltip HTML content for unique item
 */
function buildUniqueTooltipContent(unique) {
  const parts = [];
  parts.push(`<div class="tooltip-name">${escapeHtml(unique.name)}</div>`);
  parts.push(`<div class="tooltip-base-type">${escapeHtml(unique.baseType)}</div>`);
  
  if (unique.levelRequired) {
    parts.push(`<div class="tooltip-level">Level ${unique.levelRequired}</div>`);
  }
  
  parts.push('<div class="tooltip-separator"></div>');
  
  if (unique.implicitModifiers && unique.implicitModifiers.length > 0) {
    parts.push('<div class="tooltip-modifiers">');
    unique.implicitModifiers.forEach(mod => {
      parts.push(`<div class="tooltip-modifier implicit">${escapeHtml(mod.text)}</div>`);
    });
    parts.push('</div>');
  }
  
  if (unique.explicitModifiers && unique.explicitModifiers.length > 0) {
    parts.push('<div class="tooltip-modifiers">');
    unique.explicitModifiers.forEach(mod => {
      parts.push(`<div class="tooltip-modifier explicit">${escapeHtml(mod.text)}</div>`);
    });
    parts.push('</div>');
  }
  
  if (unique.flavourText) {
    parts.push('<div class="tooltip-separator"></div>');
    parts.push(`<div class="tooltip-flavour">${escapeHtml(unique.flavourText)}</div>`);
  }
  
  return parts.join('');
}

/**
 * Show tooltip for a vial
 */
export function showVialTooltip(vial, x, y) {
  if (!vial) {
    hideTooltip();
    return;
  }
  initTooltip();
  tooltipElement.innerHTML = buildVialTooltipContent(vial);
  positionTooltip(x, y);
  tooltipElement.style.display = 'block';
  requestAnimationFrame(() => tooltipElement.classList.add('visible'));
}

/**
 * Build tooltip HTML content for vial
 */
function buildVialTooltipContent(vial) {
  const parts = [];
  parts.push(`<div class="tooltip-name">${escapeHtml(vial.name)}</div>`);
  
  if (vial.flavourText) {
    parts.push(`<div class="tooltip-flavour">${escapeHtml(vial.flavourText)}</div>`);
  }
  
  if (vial.stackSize) {
    parts.push('<div class="tooltip-separator"></div>');
    parts.push(`<div class="tooltip-details">Stack Size: ${vial.stackSize}</div>`);
  }
  
  return parts.join('');
}

/**
 * Show tooltip for temple room
 */
export function showTempleRoomTooltip(temple, x, y) {
  if (!temple) {
    hideTooltip();
    return;
  }
  initTooltip();
  tooltipElement.innerHTML = buildTempleRoomTooltipContent(temple);
  positionTooltip(x, y);
  tooltipElement.style.display = 'block';
  requestAnimationFrame(() => tooltipElement.classList.add('visible'));
}

/**
 * Build tooltip HTML content for temple room
 */
function buildTempleRoomTooltipContent(temple) {
  const parts = [];
  parts.push(`<div class="tooltip-name">${escapeHtml(temple.name)}</div>`);
  parts.push('<div class="tooltip-separator"></div>');
  parts.push('<div class="tooltip-description">Required for upgrading unique items at the Altar of Sacrifice</div>');
  return parts.join('');
}
```

### Step 4: Add Render Function to Main

**File**: `src/main.js`

Add import and render function:

```javascript
import { renderTempleUpgradeList } from './js/views/templeUpgradeListView.js';
import { loadTempleUpgradeData } from './js/services/dataService.js';

/**
 * Render Temple Upgrade UI
 */
async function renderTempleUpgradeUI(combinations, currency) {
  const listViewContainer = document.getElementById('list-view');
  if (listViewContainer) {
    renderTempleUpgradeList(listViewContainer, combinations, currency);
  }
  
  // Hide grid view and filter panel
  const gridViewContainer = document.getElementById('grid-view');
  if (gridViewContainer) {
    gridViewContainer.style.display = 'none';
  }
  
  const filterPanelContainer = document.getElementById('filter-panel');
  if (filterPanelContainer) {
    filterPanelContainer.style.display = 'none';
  }
}
```

### Step 5: Add Category Handler

**File**: `src/main.js` - `handleCategoryChange()`

Add temple category handler:

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

### Step 6: Add CSS Styles

**File**: `src/styles/main.css`

Add styles for temple upgrade view:

```css
.temple-upgrade-list {
  padding: 20px;
}

.temple-upgrade-header {
  margin-bottom: 30px;
}

.temple-upgrade-header h2 {
  margin: 0 0 10px 0;
  font-size: 24px;
}

.temple-upgrade-combinations {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.temple-upgrade-combination {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: var(--bg-secondary, #1a1a1a);
  border-radius: 8px;
  border: 1px solid var(--border-color, #333);
}

.upgrade-component {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.upgrade-component:hover {
  transform: scale(1.05);
}

.component-image {
  width: 64px;
  height: 64px;
  object-fit: contain;
}

.component-name {
  font-size: 12px;
  text-align: center;
  max-width: 100px;
  word-wrap: break-word;
}

.upgrade-operator {
  font-size: 24px;
  font-weight: bold;
  color: var(--text-secondary, #999);
}
```

## Testing Checklist

- [ ] Navigate to Temple category
- [ ] Verify all 11 combinations are displayed
- [ ] Verify images load for all components
- [ ] Verify tooltips appear on hover for uniques
- [ ] Verify tooltips appear on hover for vials
- [ ] Verify tooltips appear on hover for temple
- [ ] Verify tooltips disappear on mouse leave
- [ ] Verify missing images are handled gracefully
- [ ] Verify page loads within 2 seconds
- [ ] Verify tooltips appear within 500ms
