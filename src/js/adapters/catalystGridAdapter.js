/**
 * Catalyst Grid Adapter
 * Maps Catalyst data and config to the generic grid view interface.
 * Uses catalysts-tab.png and item order from CATALYSTS_GRID_CONFIG (MLE weight order).
 */

import { showCatalystTooltip } from '../utils/tooltip.js';
import {
  CATALYSTS_GRID_CONFIG,
  createCellsFromGroupsForCategory
} from '../config/gridConfig.js';

/**
 * Map catalysts to cells: sort cells by position, sort items by itemOrderConfig then dropWeight, assign in order.
 * @param {Array} items - Catalyst objects (id, name, dropWeight, ...)
 * @param {Array} cellDefinitions - Cell definitions from createCellsFromGroupsForCategory(CATALYSTS_GRID_CONFIG)
 * @returns {Promise<{ cellToItem: Map, itemToCellId: Map }>}
 */
async function mapCatalystsToCells(items, cellDefinitions) {
  const cellToItem = new Map();
  const itemToCellId = new Map();

  const catalystCells = cellDefinitions
    .filter((c) => c.groupType === 'catalyst')
    .sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.x - b.x;
    });

  const orderConfig = CATALYSTS_GRID_CONFIG.itemOrderConfig?.catalyst || [];
  const sortedItems = [...(items || [])].sort((a, b) => {
    if (orderConfig.length > 0) {
      const indexA = orderConfig.indexOf(a.id);
      const indexB = orderConfig.indexOf(b.id);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
    }
    const weightA = a.dropWeight ?? 0;
    const weightB = b.dropWeight ?? 0;
    return weightB - weightA;
  });

  const maxAssignments = Math.min(catalystCells.length, sortedItems.length);
  for (let i = 0; i < maxAssignments; i++) {
    const cell = catalystCells[i];
    const item = sortedItems[i];
    if (cell && item) {
      cellToItem.set(cell.id, item);
      itemToCellId.set(item.id, cell.id);
    }
  }

  return { cellToItem, itemToCellId };
}

export const catalystGridAdapter = {
  getGridConfig() {
    return {
      tabImagePath: CATALYSTS_GRID_CONFIG.tabImagePath,
      imageDimensions: { ...CATALYSTS_GRID_CONFIG.imageDimensions },
      createCells: () => createCellsFromGroupsForCategory(CATALYSTS_GRID_CONFIG)
    };
  },

  mapItemsToCells(items, cellDefinitions) {
    return mapCatalystsToCells(items, cellDefinitions);
  },

  getImagePath(item) {
    if (!item || !item.id) return null;
    return `/assets/images/catalysts/${item.id}.png`;
  },

  getItemId(item) {
    return item?.id ?? null;
  },

  showItemTooltip(item, x, y) {
    showCatalystTooltip(item, x, y);
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
