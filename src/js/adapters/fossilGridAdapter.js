/**
 * Fossil Grid Adapter
 * Maps Fossil data and config to the generic grid view interface.
 * Uses fossils-tab.png and item order from FOSSILS_GRID_CONFIG (poeData layout / MLE weight).
 */

import { showFossilTooltip } from '../utils/tooltip.js';
import {
  FOSSILS_GRID_CONFIG,
  createCellsFromGroupsForCategory
} from '../config/gridConfig.js';

/**
 * Map fossils to cells: sort cells by position, sort items by itemOrderConfig then dropWeight, assign in order.
 * @param {Array} items - Fossil objects (id, name, dropWeight, ...)
 * @param {Array} cellDefinitions - Cell definitions from createCellsFromGroupsForCategory(FOSSILS_GRID_CONFIG)
 * @returns {Promise<{ cellToItem: Map, itemToCellId: Map }>}
 */
async function mapFossilsToCells(items, cellDefinitions) {
  const cellToItem = new Map();
  const itemToCellId = new Map();

  const fossilCells = cellDefinitions
    .filter((c) => c.groupType === 'fossil')
    .sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.x - b.x;
    });

  const orderConfig = FOSSILS_GRID_CONFIG.itemOrderConfig?.fossil || [];
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

  const maxAssignments = Math.min(fossilCells.length, sortedItems.length);
  for (let i = 0; i < maxAssignments; i++) {
    const cell = fossilCells[i];
    const item = sortedItems[i];
    if (cell && item) {
      cellToItem.set(cell.id, item);
      itemToCellId.set(item.id, cell.id);
    }
  }

  return { cellToItem, itemToCellId };
}

export const fossilGridAdapter = {
  getGridConfig() {
    return {
      tabImagePath: FOSSILS_GRID_CONFIG.tabImagePath,
      imageDimensions: { ...FOSSILS_GRID_CONFIG.imageDimensions },
      createCells: () => createCellsFromGroupsForCategory(FOSSILS_GRID_CONFIG)
    };
  },

  mapItemsToCells(items, cellDefinitions) {
    return mapFossilsToCells(items, cellDefinitions);
  },

  getImagePath(item) {
    if (!item || !item.id) return null;
    return `/assets/images/fossils/${item.id}.png`;
  },

  getItemId(item) {
    return item?.id ?? null;
  },

  showItemTooltip(item, x, y) {
    showFossilTooltip(item, x, y);
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
