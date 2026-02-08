/**
 * Oil Grid Adapter
 * Maps Oil data and config to the generic grid view interface.
 * Uses oils-tab.png and item order from OILS_GRID_CONFIG (tier / itemOrderConfig).
 */

import { showOilTooltip } from '../utils/tooltip.js';
import {
  OILS_GRID_CONFIG,
  createCellsFromGroupsForCategory
} from '../config/gridConfig.js';

/**
 * Map oils to cells: sort cells by position, sort items by itemOrderConfig then tier, assign in order.
 * @param {Array} items - Oil objects (id, name, tier, ...)
 * @param {Array} cellDefinitions - Cell definitions from createCellsFromGroupsForCategory(OILS_GRID_CONFIG)
 * @returns {Promise<{ cellToItem: Map, itemToCellId: Map }>}
 */
async function mapOilsToCells(items, cellDefinitions) {
  const cellToItem = new Map();
  const itemToCellId = new Map();

  const oilCells = cellDefinitions
    .filter((c) => c.groupType === 'oil')
    .sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.x - b.x;
    });

  const orderConfig = OILS_GRID_CONFIG.itemOrderConfig?.oil || [];
  const sortedItems = [...(items || [])].sort((a, b) => {
    if (orderConfig.length > 0) {
      const indexA = orderConfig.indexOf(a.id);
      const indexB = orderConfig.indexOf(b.id);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
    }
    const tierA = a.tier ?? 0;
    const tierB = b.tier ?? 0;
    return tierA - tierB;
  });

  const maxAssignments = Math.min(oilCells.length, sortedItems.length);
  for (let i = 0; i < maxAssignments; i++) {
    const cell = oilCells[i];
    const item = sortedItems[i];
    if (cell && item) {
      cellToItem.set(cell.id, item);
      itemToCellId.set(item.id, cell.id);
    }
  }

  return { cellToItem, itemToCellId };
}

export const oilGridAdapter = {
  getGridConfig() {
    return {
      tabImagePath: OILS_GRID_CONFIG.tabImagePath,
      imageDimensions: { ...OILS_GRID_CONFIG.imageDimensions },
      createCells: () => createCellsFromGroupsForCategory(OILS_GRID_CONFIG)
    };
  },

  mapItemsToCells(items, cellDefinitions) {
    return mapOilsToCells(items, cellDefinitions);
  },

  getImagePath(item) {
    if (!item || !item.id) return null;
    return `/assets/images/oils/${item.id}.png`;
  },

  getItemId(item) {
    return item?.id ?? null;
  },

  showItemTooltip(item, x, y) {
    showOilTooltip(item, x, y);
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
