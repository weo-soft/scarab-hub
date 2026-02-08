/**
 * Essence Grid Adapter
 * Maps Essence data and config to the generic grid view interface.
 * Layout matches poeData stashTabRenderer and in-game stash tab:
 * - Left-expanding: row order = Greed, Contempt, Hatred, Woe, Fear, Anger, Torment, Sorrow, Rage, Suffering, Wrath, Doubt.
 *   Column = 7 - tier (tier 7 at cell 0). Rows have 7, 6 or 5 cells; only the highest N tiers are shown (tier 1 omitted in 6-cell rows, tiers 1–2 in 5-cell rows).
 * - Right-expanding: same row order. First 4 rows (4 cells): tiers 4–7, column = tier - 4. Last 4 rows (3 cells): tiers 5–7, column = tier - 5.
 * - Special: Insanity, Horror, Delirium, Hysteria (by id).
 */

import { showEssenceTooltip } from '../utils/tooltip.js';
import { ESSENCE_GRID_CONFIG, createCellsFromGroupsForCategory } from '../config/gridConfig.js';

// Row order matches in-game stash tab (left block = top to bottom, right block = top to bottom)
const LEFT_EXPANDING_ORDER = ['greed', 'contempt', 'hatred', 'woe', 'fear', 'anger', 'torment', 'sorrow', 'rage', 'suffering', 'wrath', 'doubt'];
const RIGHT_EXPANDING_ORDER = ['loathing', 'zeal', 'anguish', 'spite', 'scorn', 'envy', 'misery', 'dread'];
const LEFT_ROW_SIZES = [7, 7, 7, 7, 6, 6, 6, 6, 5, 5, 5, 5];
const RIGHT_ROW_SIZES = [4, 4, 4, 4, 3, 3, 3, 3];
const SPECIAL_ORDER = ['essence-of-insanity', 'essence-of-horror', 'essence-of-delirium', 'essence-of-hysteria'];

const LEFT_SLOT_COUNT = LEFT_ROW_SIZES.reduce((a, b) => a + b, 0);
const RIGHT_SLOT_COUNT = RIGHT_ROW_SIZES.reduce((a, b) => a + b, 0);

/**
 * Extract essence type (base) from id: "muttering-essence-of-anger" -> "anger", "essence-of-horror" -> "essence-of-horror"
 */
function getBaseFromId(id) {
  if (!id || typeof id !== 'string') return null;
  if (id.startsWith('essence-of-')) return id;
  const match = id.match(/-essence-of-(.+)$/);
  return match ? match[1] : null;
}

/**
 * Compute grid slot index (0..103) for an essence from its base and tier.
 * Matches stashTabRenderer: left-expanding = highest tier at cell 0; right-expanding = lowest tier at cell 0.
 */
function getSlotIndexForItem(item) {
  if (!item || item.tier == null) return null;
  const base = getBaseFromId(item.id);
  if (!base) return null;

  if (item.tier === 8) {
    const idx = SPECIAL_ORDER.indexOf(item.id);
    return idx >= 0 ? LEFT_SLOT_COUNT + RIGHT_SLOT_COUNT + idx : null;
  }

  const typeLower = base.toLowerCase();
  const leftIdx = LEFT_EXPANDING_ORDER.indexOf(typeLower);
  if (leftIdx >= 0) {
    const rowSize = LEFT_ROW_SIZES[leftIdx];
    if (item.tier < 1 || item.tier > 7) return null;
    // Left-expanding: column = 7 - tier (tier 7 at index 0). Only place if that column exists in this row.
    const slotInRow = 7 - item.tier;
    if (slotInRow < 0 || slotInRow >= rowSize) return null;
    let slot = 0;
    for (let i = 0; i < leftIdx; i++) slot += LEFT_ROW_SIZES[i];
    return slot + slotInRow;
  }

  const rightIdx = RIGHT_EXPANDING_ORDER.indexOf(typeLower);
  if (rightIdx >= 0) {
    const rowSize = RIGHT_ROW_SIZES[rightIdx];
    let slotInRow;
    if (rowSize === 4) {
      // First 4 right rows: cells show tiers 4,5,6,7 (column 0 = tier 4)
      if (item.tier < 4 || item.tier > 7) return null;
      slotInRow = item.tier - 4;
    } else {
      // Last 4 right rows (3 cells): show tiers 5,6,7
      if (item.tier < 5 || item.tier > 7) return null;
      slotInRow = item.tier - 5;
    }
    let slot = LEFT_SLOT_COUNT;
    for (let i = 0; i < rightIdx; i++) slot += RIGHT_ROW_SIZES[i];
    return slot + slotInRow;
  }

  return null;
}

/**
 * Map every essence to its grid slot by (base, tier). No slot-order array;
 * every item in the details file is placed in the correct cell.
 */
async function mapEssencesToCells(items, cellDefinitions) {
  const slotIndexToItem = new Map();
  (items || []).forEach((item) => {
    const slotIndex = getSlotIndexForItem(item);
    if (slotIndex != null && slotIndex < cellDefinitions.length) {
      slotIndexToItem.set(slotIndex, item);
    }
  });

  const cellToItem = new Map();
  const itemToCellId = new Map();

  cellDefinitions.forEach((cell, index) => {
    const essence = slotIndexToItem.get(index);
    if (essence) {
      cellToItem.set(cell.id, essence);
      itemToCellId.set(essence.id, cell.id);
    }
  });

  return { cellToItem, itemToCellId };
}

export const essenceGridAdapter = {
  getGridConfig() {
    return {
      tabImagePath: ESSENCE_GRID_CONFIG.tabImagePath,
      imageDimensions: { ...ESSENCE_GRID_CONFIG.imageDimensions },
      createCells: () => createCellsFromGroupsForCategory(ESSENCE_GRID_CONFIG)
    };
  },

  mapItemsToCells(items, cellDefinitions) {
    return mapEssencesToCells(items, cellDefinitions);
  },

  getImagePath(item) {
    if (!item || !item.id) return null;
    return `/assets/images/essences/${item.id}.png`;
  },

  getItemId(item) {
    return item?.id ?? null;
  },

  showItemTooltip(item, x, y) {
    showEssenceTooltip(item, x, y);
  },

  getProfitabilityStatus(item) {
    return item?.profitabilityStatus ?? 'unknown';
  },

  options: {
    supportsYieldCounts: false,
    supportsFilteredIds: false,
    supportsCellBackgrounds: true,
    isSimulationCanvas: () => false
  }
};
